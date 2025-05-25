from fastapi import FastAPI, HTTPException, Query, Request, Response, status, WebSocket
import uvicorn, uuid, asyncio, logging
from typing import Optional
from pydantic import BaseModel, Field
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from typing import Dict, List
from contextlib import asynccontextmanager
from mysql.connector import Error
import traceback
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import random
import asyncio
import json
from datetime import datetime, timedelta,date
from dotenv import load_dotenv
import requests
import os
from .database import add_fridge_item, get_fridge_items_for_user

 
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()


EMAIL = "example@ucsd.edu"
PID = "cc"
apiKey = "oyiimv1msh9f66dtomkhcqnhceanzg";

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
                return []
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
    return HTMLResponse(read_html("app/public/luma_starter.html"))
    
@app.get('/login', response_class=HTMLResponse)
async def login_page(request: Request):
    val = request.cookies.get('session_id')
    if val:
        ses = await get_session(val)
        if ses:
            user = await get_user_by_id(ses["user_id"])
            if user:
                return HTMLResponse(read_html("app/public/fridge.html"))
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
    html_body  = read_html("app/public/fridge.html")
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
                print(user)  
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
                return HTMLResponse(read_html("app/public/fridge.html"))
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

###################################
 
class FridgeItem(BaseModel):
    barcode: str
    product_name: str
    entry_date: date
    exp_date: Optional[date] = None
    img_url: Optional[str] = None

class ScanPayload(BaseModel):
    barcode: str

@app.get("/fridge", response_model=List[FridgeItem])
async def read_fridge(request: Request):
    sid = request.cookies.get("session_id")
    ses = await get_session(sid) if sid else None
    if not ses:
        raise HTTPException(401, "Not authenticated")
    if ses:
        user = await get_user_by_id(ses["user_id"])
        if user:
            return HTMLResponse(read_html("app/public/fridge.html"))
    items = get_fridge_items_for_user(ses["user_id"])
    
    return items

@app.get("/api/fridge-items", response_model=List[FridgeItem])
async def read_fridge_items(request: Request):
    sid = request.cookies.get("session_id")
    if not sid:
        raise HTTPException(status_code=401, detail="Not authenticated")
    ses = await get_session(sid)
    if not ses:
        raise HTTPException(status_code=401, detail="Session expired")

    rows = get_fridge_items_for_user(ses["user_id"])
    # rows should be a list of dicts or ORM objects matching schema
    return rows

@app.post("/api/fridge-items")
async def add_fridge_item_endpoint(
    request: Request,
    item: FridgeItem
):
    sid = request.cookies.get("session_id")
    if not sid:
        raise HTTPException(status_code=401, detail="Not authenticated")
    ses = await get_session(sid)
    if not ses:
        raise HTTPException(status_code=401, detail="Session expired")

    try:
        print(f"Adding item: {item}")
        add_fridge_item(
        user_id     = ses["user_id"],
        barcode     = item.barcode,
        product_name= item.product_name,
        entry_date  = item.entry_date,
        exp_date    = item.exp_date if item.exp_date else None,
        img_url     = item.img_url
    )
    except Exception as e:
        print(f"Error adding fridge item: {e}")
        logger.error(f"Error adding fridge item: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Could not save item")
    return {"ok": True}

    

@app.get("/low-on", response_model=List[FridgeItem])
async def low_on_page(request: Request):
    check_session_time_out()
    val = request.cookies.get('session_id')
    if val:
        ses = await get_session(val)
        if ses:
            user = await get_user_by_id(ses["user_id"])
            if user:
                return HTMLResponse(read_html("app/public/low_on.html"))
    return RedirectResponse(url="/login")

@app.get("/grocery", response_class=HTMLResponse)
async def grocery_page(request: Request):
    sid = request.cookies.get("session_id")
    ses = await get_session(sid) if sid else None
    if not ses:
        return RedirectResponse(url="/login")
    return HTMLResponse(read_html("app/public/grocery.html"))

@app.get("/lookup")
def lookup(barcode: str):
    url = f"https://api.barcodelookup.com/v3/products?barcode={barcode}&key={apiKey}"
    try:
        response = requests.get(url)
        print(f"Barcode API response: {response.status_code} - {response.text}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error during barcode lookup: {e}")
        raise HTTPException(status_code=500, detail="Barcode lookup failed")
    

@app.post("/update-fridge-items/{item_name}/{new_date}/{entry_date}")
async def update_fridge_item(request: Request,
    item_name:str,
    new_date: str,
    entry_date:str):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    val = request.cookies.get('session_id')
    user = None
    if val:
        ses = await get_session(val)
        if ses:
            user = ses["user_id"]
            cursor.execute('UPDATE fridge_items SET exp_date = %s WHERE user_id = %s AND product_name = %s  AND entry_date = %s ', (new_date, user, item_name, entry_date))
            connection.commit()
        return
    return


@app.delete("/remove-fridge-items/{item_name}/{entry_date}")
async def remove_item(request: Request,
    item_name: str, entry_date:str):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    val = request.cookies.get('session_id')
    user = None
    if val:
        ses = await get_session(val)
        if ses:
            user = ses["user_id"]
            cursor.execute('DELETE FROM fridge_items WHERE user_id = %s AND product_name = %s  AND entry_date = %s ', (user, item_name, entry_date))
            connection.commit()
        return
    return

if __name__ == "__main__":
    uvicorn.run(app="app.main:app", host="0.0.0.0", port=6543, reload=True)