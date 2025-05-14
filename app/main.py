from fastapi import FastAPI, HTTPException, Query, Request, Response, status, WebSocket
import uvicorn, uuid, asyncio, logging
from typing import Optional
from pydantic import BaseModel, Field
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from typing import Dict
from contextlib import asynccontextmanager
from mysql.connector import Error
import traceback
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import random
import asyncio
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
import requests
import os
 
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()

EMAIL = "example@ucsd.edu"
PID = "cc"
API_KEY = "aaa"

from .database import (
    create_tables,
    seed_database,
    get_db_connection,
    get_user_by_username,
    get_user_by_id,
    create_session,
    get_session,
    delete_session,
)

create_tables()

# Request body model for inserting new data
class SensorData(BaseModel):
    value: float #= Field(..., description="Sensor value")
    unit: str #= Field(..., description="Unit of measurement")
    macaddr: str
    timestamp: Optional[str] = Field(None, description="Timestamp (optional, format: YYYY-MM-DD HH:MM:SS)")

def read_html(file_path: str) -> str:
    with open(file_path, "r") as f:
        return f.read()

def get_error_html(username: str) -> str:
    error_html = read_html("app/public/error.html")
    safe_username = username if isinstance(username, str) else ""
    return error_html.replace("{username}", safe_username)

app = FastAPI()
static_files = StaticFiles(directory='app/public')
app.mount('/public', static_files, name='public')

def check_session_time_out():
     current_time = datetime.now()
     connection = get_db_connection()
     cursor = connection.cursor(dictionary=True)
     cursor.execute("SELECT * FROM sessions")
     sessions = cursor.fetchall()
     for session in sessions:
         print((current_time - session["created_at"]).total_seconds())
         if (current_time - session["created_at"]).total_seconds() > 100:
             cursor.execute("DELETE FROM sessions WHERE id = %s", (session["id"],))
             connection.commit()
     cursor.close()
     connection.close()



@app.get('/API_KEY_PLEASE')
async def API(request: Request):
    check_session_time_out()
    val = request.cookies.get('session_id')
    if val:
        ses = await get_session(val)
        if ses:
            user = await get_user_by_id(ses["user_id"])
            if user:
                return [API_KEY]
    return []

@app.get('/', response_class=HTMLResponse)
async def login_page(request: Request):
    # check_session_time_out()
    # val = request.cookies.get('session_id')
    # if val:
    #     ses = await get_session(val)
    #     if ses:
    #         user = await get_user_by_id(ses["user_id"])
    #         if user:
    #             return HTMLResponse(read_html("app/public/luma.html"))
    return HTMLResponse(read_html("app/public/luma_home.html"))
    
@app.get('/login', response_class=HTMLResponse)
async def login_page(request: Request):
    val = request.cookies.get('session_id')
    if val:
        ses = await get_session(val)
        if ses:
            user = await get_user_by_id(ses["user_id"])
            if user:
                return RedirectResponse(url=f"/")
    return HTMLResponse(read_html("app/public/login.html"))

@app.post('/login', response_class=HTMLResponse)
async def login(request: Request):
    """Validate credentials and create a new session if valid"""
    form = await request.form()
    user = form.get("user", "")
    pw = form.get("pword", "")

    if not user or not pw:
        return HTMLResponse(get_error_html(user), status_code=403)
    
    use = await get_user_by_username(user.lower())

    if not use or use['password'] != pw:
        return HTMLResponse(get_error_html(user), status_code=403)
    
    # id = str(uuid.uuid4())
    # if use:
    #     profile_html = read_html("app/public/luma_home.html")
    #     response = HTMLResponse(profile_html)
    #     response.set_cookie("session_id", id)
    #     usering = await get_user_by_username(user.lower())
    #     dosmth = await create_session(usering["id"], id)
    #     return response

    session_id = str(uuid.uuid4())
    html_body  = read_html("app/public/home.html")
    response   = HTMLResponse(html_body)
    response.set_cookie("session_id", session_id)
    await create_session(use["id"], session_id)
    return response

@app.get('/signup', response_class=HTMLResponse)
async def signup_page(request: Request):
    val = request.cookies.get('session_id')
    if val:
        ses = await get_session(val)
        if ses:
            user = await get_user_by_id(ses["user_id"])
            if user:
                return RedirectResponse(url=f"/")
    return HTMLResponse(read_html("app/public/signup.html"))
    
@app.post('/signup', response_class=HTMLResponse)
async def out(request: Request) -> HTMLResponse:
    form = await request.form()
    fname = form.get("fname")
    lname = form.get("lname")
    email = form.get("email")
    user = form.get("user")
    pword = form.get("pword")
    # location = form.get("location")
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    users = await get_user_by_username(user.lower())
    cursor.execute("SELECT email FROM users WHERE users.email = %s", (email, ))
    this_val = cursor.fetchone()
    if users or this_val:
        return HTMLResponse(get_error_html(user), status_code=403)
    id = str(uuid.uuid4())
    if not users:
        try:
            profile_html = read_html("app/public/home.html")
            response = HTMLResponse(profile_html)
            response.set_cookie("session_id", id)
            insert_query = "INSERT INTO users (username, password, email, fname, lname) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(insert_query, (user.lower(), pword, email, fname, lname))
            connection.commit()
            usering = await get_user_by_username(user.lower())
            dosmth = await create_session(usering["id"], id)
            if cursor:
                cursor.close()
            if connection and connection.is_connected():
                connection.close()
            return response
        except Error as e:
            logger.error(f"Error inserting initial users: {e}")
            raise
    
@app.get("/AI/{city}/{cond}")
async def generate_recommendation(city:str, cond:str, request: Request):
    user = None
    val = request.cookies.get('session_id')
    if val:
        ses = await get_session(val)
        if ses:
            user = await get_user_by_id(ses["user_id"])
    user = user["id"]
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute(f"SELECT * FROM temperature WHERE macaddr IN (SELECT name FROM devices WHERE user_id={user})")
    temperature = cursor.fetchall()[0]["value"]
    cursor.execute(f'SELECT clothes FROM wardrobe WHERE user_id={user}')
    clothes = cursor.fetchall()
    cursor.close()
    connection.close()

    prompt = f"I live in the {city}, the temperature is {temperature} celsius, weather conditions are {cond}, and I have {clothes}, suggest an appropriate outfit based on this temperature."
    
    try:
        response = requests.post(
            "https://ece140-wi25-api.frosty-sky-f43d.workers.dev/api/v1/ai/complete",
            headers={
                "email": EMAIL,
                "pid": PID,
                "Content-Type": "application/json",
            },
            data=json.dumps({"prompt": prompt}),
        )

        if response.status_code != 200:
            return {"error": f"Failed to generate text. Status: {response.status_code}"}

        data = response.json()
        return data
    except Exception as error:
        return {"error": str(error)}
    
@app.get("img/AI/{city}/{cond}")
async def generate_recommendation_img(city:str, cond:str, request: Request):
    user = None
    val = request.cookies.get('session_id')
    if val:
        ses = await get_session(val)
        if ses:
            user = await get_user_by_id(ses["user_id"])
    user = user["id"]
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute(f'SELECT * FROM temperature WHERE macaddr IN (SELECT name FROM devices WHERE user_id={user})')
    temperature = cursor.fetchall()[0]["value"]
    cursor.execute(f'SELECT clothes FROM wardrobe WHERE user_id{user}')
    clothes = cursor.fetchall()
    cursor.close()
    connection.close()

    prompt = f"I live in the {city}, the temperature is {temperature} celsius, weather conditions are {cond}, and I have {clothes}, suggest an appropriate outfit based on this temperature."
    
    try:
        response = requests.post(
            "https://ece140-wi25-api.frosty-sky-f43d.workers.dev/api/v1/ai/image",
            headers={
                "email": EMAIL,
                "pid": PID,
                "Content-Type": "application/json",
            },
            data=json.dumps({"prompt": prompt}),
        )

        if response.status_code != 200:
            return {"error": f"Failed to generate text. Status: {response.status_code}"}

        data = response.json()
    #    TODO print(data)
        return data
    except Exception as error:
        return {"error": str(error)}
    
"""Dashboard Code"""
@app.get('/dashboard', response_class=HTMLResponse)
async def out(request: Request) -> HTMLResponse:
    check_session_time_out()
    val = request.cookies.get('session_id')
    if val:
        ses = await get_session(val)
        if ses:
            user = await get_user_by_id(ses["user_id"])
            if user:
                return HTMLResponse(read_html("app/public/dashboard.html"))
    return RedirectResponse(url=f"/login")

# @app.get('/location')
# async def get_location(request: Request):
#     conn = get_db_connection()
#     cursor = conn.cursor(dictionary=True)
#     val = request.cookies.get('session_id')
#     user_id = None
#     if val:
#         ses = await get_session(val)
#         if ses:
#             user_id = ses["user_id"]
#             cursor.execute(f'SELECT location FROM users WHERE id={user_id}')
#             return cursor.fetchall()
#     return "San Diego"

# Initial stock prices
sensors = {
    "Temperature": 30.0,
    "Pressure": 1.7,
}

# Randomly get new stock prices
async def get_new_sensor_values():
    global sensors
    # Simulate market movements
    # for sensor in sensors:
    #     change = random.uniform(-2, 2)
    #     sensors[sensor] += change
    #     sensors[sensor] = max(10, sensors[sensor])
    
    # get latest sensor value (wip)
    for sensor in sensors:
        sensors[sensor] = await get_latest_value(sensor)
    
    data = {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "sensors": sensors
    }
    return data

async def get_latest_value(request: Request, sensor_type: str):
    sensor_type = sensor_type.lower()
    if sensor_type not in {"temperature", "pressure"}:
        raise HTTPException(status_code=404, detail="Sensor type not found")

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    query = f"SELECT value FROM {sensor_type} ORDER BY id DESC LIMIT 1"

    cursor.execute(query)
    results = cursor.fetchone()
    data = {sensor_type:results}
    cursor.close()
    db.close()

    return data


@app.get('/wardrobe', response_class=HTMLResponse)
async def out(request: Request) -> HTMLResponse:
    check_session_time_out()
    val = request.cookies.get('session_id')
    if val:
        ses = await get_session(val)
        if ses:
            user = await get_user_by_id(ses["user_id"])
            if user:
                return HTMLResponse(read_html("app/public/wardrobe.html"))
    return RedirectResponse(url=f"/login")

@app.get('/wardrobe/look') 
async def out(request: Request):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    val = request.cookies.get('session_id')
    user = None
    if val:
        ses = await get_session(val)
        if ses:
            user = ses["user_id"]
            cursor.execute(f'SELECT * FROM wardrobe WHERE user_id={user}')
            return cursor.fetchall()
    return []

@app.put('/wardrobe/{category}') 
async def out(request: Request, category: str):
    data = await request.json()
    print("data:", data)
    new_clothes = data["clothes"]
    types = data["types"]
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    val = request.cookies.get('session_id')
    user = None
    if val:
        ses = await get_session(val)
        if ses:
            user = ses["user_id"]
            cursor.execute('INSERT INTO wardrobe (clothes, types, user_id, category) VALUES (%s, %s,%s,%s)', (new_clothes, types, user, category))
            connection.commit()
            return
    return

@app.post('/wardrobe/{colthes}/{new_clothes}/{new_type}') 
async def out(request: Request, colthes: str, new_clothes: str, new_type: str):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    val = request.cookies.get('session_id')
    user = None
    if val:
        ses = await get_session(val)
        if ses:
            user = ses["user_id"]
            cursor.execute(f'UPDATE wardrobe SET clothes="{new_clothes}", types="{new_type}" WHERE user_id="{user}" AND clothes="{colthes}"')
            connection.commit()
            return
    return

@app.delete('/wardrobe/{clothes_name}') 
async def out(request: Request, clothes_name: str):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    val = request.cookies.get('session_id')
    user = None
    if val:
        ses = await get_session(val)
        if ses:
            user = ses["user_id"]
            cursor.execute('DELETE FROM wardrobe WHERE user_id = %s AND clothes = %s', (user, clothes_name))
            connection.commit()
            return
    return

@app.get('/devices', response_class=HTMLResponse)
async def out(request: Request) -> HTMLResponse:
    check_session_time_out()
    val = request.cookies.get('session_id')
    if val:
        ses = await get_session(val)
        if ses:
            user = await get_user_by_id(ses["user_id"])
            if user:
                return HTMLResponse(read_html("app/public/Device.html"))
    return RedirectResponse(url=f"/login")

@app.get('/devices/look') 
async def out(request: Request):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    val = request.cookies.get('session_id')
    user = None
    if val:
        ses = await get_session(val)
        if ses:
            user = ses["user_id"]
            cursor.execute(f'SELECT name FROM devices WHERE user_id={user}')
            return cursor.fetchall()
    return []


@app.post('/devices/{device}/{new_device}') 
async def out(request: Request, device: str, new_device: str):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    val = request.cookies.get('session_id')
    user = None
    if val:
        ses = await get_session(val)
        if ses:
            user = ses["user_id"]
            cursor.execute(f'UPDATE devices SET name="{new_device}" WHERE user_id={user} AND name="{device}"')
            connection.commit()
            return
    return

@app.put('/devices/{new_device}') 
async def out(request: Request, new_device: str):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    val = request.cookies.get('session_id')
    user = None
    if val:
        ses = await get_session(val)
        if ses:
            user = ses["user_id"]
            cursor.execute('INSERT INTO devices (name, user_id) VALUES (%s, %s)', (new_device, user))
            connection.commit()
            return
    return

@app.delete('/devices/{device}') 
async def out(request: Request, device: str):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    val = request.cookies.get('session_id')
    user = None
    if val:
        ses = await get_session(val)
        if ses:
            user = ses["user_id"]
            cursor.execute('DELETE FROM devices WHERE user_id = %s AND name = %s', (user, device))
            connection.commit()
            return
    return

@app.post("/logout")
async def logout(request:Request):
    """Clear session and redirect to login page"""
    # TODO: 8. Create redirect response to /login
    val = request.cookies.get('session_id')
    if val:
        await delete_session(val)
    response = RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)
    # TODO: 9. Delete sessionId cookie
    response.delete_cookie("session_id")
    # TODO: 10. Return response
    return response

@app.get("/api/{sensor_type}")
async def get_all_data(
    request: Request,
    sensor_type: str,
    order_by: Optional[str] = Query(None, alias="order-by"),
    start_date: Optional[str] = Query(None, alias="start-date"),
    end_date: Optional[str] = Query(None, alias="end-date")
):
    sensor_type = sensor_type.lower()
    if sensor_type not in {"temperature", "humidity", "light"}:
        raise HTTPException(status_code=404, detail="Sensor type not found")

    valid_order_fields = {"value", "macaddr", "timestamp"}
    if order_by and order_by not in valid_order_fields:
        raise HTTPException(status_code=400, detail="Invalid order_by parameter")

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    user = None
    val = request.cookies.get('session_id')
    user = None
    if val:
        ses = await get_session(val)
        if ses:
            user = ses["user_id"]

    query = f"SELECT * FROM {sensor_type} WHERE macaddr IN (SELECT name FROM devices WHERE user_id={user})"
    conditions = []
    values = []

    if start_date:
        conditions.append("timestamp >= %s")
        values.append(start_date)
    if end_date:
        conditions.append("timestamp <= %s")
        values.append(end_date)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    if order_by:
        query += f" ORDER BY {order_by}"

    cursor.execute(query, tuple(values))
    results = cursor.fetchall()
    for val in results:
        val["timestamp"]=val["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
    cursor.close()
    db.close()

    return results

@app.post("/api/{sensor_type}")
def insert_data(sensor_type: str, data: SensorData):
    sensor_type = str(sensor_type).lower()
    if sensor_type not in ["temperature", "humidity", "light"]:
        raise HTTPException(status_code=404, detail="Sensor type not found")

    db = get_db_connection()
    cursor = db.cursor()

    # If no timestamp is provided, use the current timestamp
    timestamp = data.timestamp if data.timestamp else datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        query = f"""
            INSERT INTO {sensor_type} (value, unit, macaddr, timestamp)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (data.value, data.unit, data.macaddr, timestamp))
        db.commit()

        inserted_id = cursor.lastrowid  # Get the last inserted id
        cursor.close()
        db.close()

        return {"id": inserted_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error inserting data into database")


@app.get("/api/{sensor_type}/count")
async def count_sensor_data(request: Request, sensor_type: str):
    sensor_type = str(sensor_type).lower()
    if sensor_type not in ["temperature", "humidity", "light"]:
        raise HTTPException(status_code=404, detail="Sensor type not found")
    db = get_db_connection()
    cursor = db.cursor()
    user = None
    val = request.cookies.get('session_id')
    user = None
    if val:
        ses = await get_session(val)
        if ses:
            user = ses["user_id"]
    cursor.execute(f"SELECT COUNT(*) FROM {sensor_type} WHERE macaddr IN (SELECT name FROM devices WHERE user_id={user})")
    count = cursor.fetchone()[0]
    cursor.close()
    db.close()

    return count

@app.get("/api/{sensor_type}/{id}")
def get_sensor_data(sensor_type: str, id: int):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    sensor_type = str(sensor_type).lower()
    if sensor_type not in ["temperature", "humidity", "light"]:
        raise HTTPException(status_code=404, detail="Sensor type not found")
    
    cursor.execute(f"SELECT * FROM {sensor_type} WHERE id = %s", (id,))
    result = cursor.fetchone()
    cursor.close()
    db.close()

    if not result:
        raise HTTPException(status_code=404, detail="Data not found")

    return result

@app.put("/api/{sensor_type}/{id}")
def update_sensor_data(sensor_type: str, id: int, data: SensorData):
    db = get_db_connection()
    cursor = db.cursor()
    sensor_type = str(sensor_type).lower()
    if sensor_type not in ["temperature", "humidity", "light"]:
        raise HTTPException(status_code=404, detail="Sensor type not found")

    update_fields = []
    update_values = []

    if data.value is not None:
        update_fields.append("value = %s")
        update_values.append(data.value)
    if data.unit is not None:
        update_fields.append("unit = %s")
        update_values.append(data.unit)
    if data.macaddr is not None:
        update_fields.append("unit = %s")
        update_values.append(data.macaddr)
    if data.timestamp is not None:
        update_fields.append("timestamp = %s")
        update_values.append(data.timestamp)

    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields provided")

    update_values.append(id)
    query = f"UPDATE {sensor_type} SET {', '.join(update_fields)} WHERE id = %s"
    cursor.execute(query, update_values)
    db.commit()
    cursor.close()
    db.close()

    return {"message": "Data updated successfully"}

@app.delete("/api/{sensor_type}/{id}")
def delete_sensor_data(sensor_type: str, id: int):
    db = get_db_connection()
    cursor = db.cursor()
    sensor_type = str(sensor_type).lower()
    if sensor_type not in ["temperature", "humidity", "light"]:
        raise HTTPException(status_code=404, detail="Sensor type not found")

    cursor.execute(f"DELETE FROM {sensor_type} WHERE id = %s", (id,))
    db.commit()
    cursor.close()
    db.close()

    return {"message": "Data deleted successfully"}

if __name__ == "__main__":
    uvicorn.run(app="app.main:app", host="0.0.0.0", port=6543, reload=True)