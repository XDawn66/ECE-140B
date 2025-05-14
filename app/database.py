# Necessary imports
import mysql.connector as mysql
import os
import time
import logging
import pandas as pd
from dotenv import load_dotenv
from typing import Optional, List, Dict
from mysql.connector import Error
from datetime import date

# Load environment variables
load_dotenv()

# db_host = os.environ['MYSQL_HOST']
# db_user = os.environ['MYSQL_USER']
# db_pass = os.environ['MYSQL_PASSWORD']
# db_name = os.environ['MYSQL_DATABASE']
# db_port = os.environ["MYSQL_PORT"]
# db_ssl_ca = os.environ["MYSQL_SSL"]

db_host = 'mysql'
db_user = 'user'
db_pass = 'password'
db_name = 'retail_db'
db_port = '3306'
db_ssl_ca = '/path/to/ssl/ca.pem'

 
 # Connect to the database and create a cursor object
def get_db_connection():
     return mysql.connect(host=db_host, database=db_name, user=db_user, passwd=db_pass, port=db_port, ssl_ca=db_ssl_ca)

# Function to create tables
def create_tables():
    db = get_db_connection()
    cursor = db.cursor()

    tables = {
        "temperature": """
        CREATE TABLE IF NOT EXISTS temperature (
            id INT AUTO_INCREMENT PRIMARY KEY,
            value FLOAT NOT NULL,
            unit VARCHAR(10) NOT NULL,
            macaddr VARCHAR(255) NOT NULL,
            timestamp DATETIME NOT NULL
        );
        """,
        "humidity": """
        CREATE TABLE IF NOT EXISTS humidity (
            id INT AUTO_INCREMENT PRIMARY KEY,
            value FLOAT NOT NULL,
            unit VARCHAR(10) NOT NULL,
            timestamp DATETIME NOT NULL
        );
        """,
        "light": """
        CREATE TABLE IF NOT EXISTS light (
            id INT AUTO_INCREMENT PRIMARY KEY,
            value FLOAT NOT NULL,
            unit VARCHAR(10) NOT NULL,
            timestamp DATETIME NOT NULL
        );
        """,
        "users": """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                fname VARCHAR(255) NOT NULL,
                lname VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """,
        "sessions": """
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(36) PRIMARY KEY,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """,
        "devices": """
            CREATE TABLE IF NOT EXISTS devices (
                name VARCHAR(255) NOT NULL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """,
        "wardrobe": """
            CREATE TABLE IF NOT EXISTS wardrobe (
                clothes VARCHAR(255) NOT NULL PRIMARY KEY,
                types VARCHAR(255) NOT NULL,
                user_id VARCHAR(255) NOT NULL,
                category VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """,
         "fridge_items": """
            CREATE TABLE IF NOT EXISTS fridge_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                barcode VARCHAR(64)    NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                entry_date DATE        NOT NULL,
                exp_date DATE          NOT NULL,
                created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """,
    }

    for table, query in tables.items():
        cursor.execute(query)

    db.commit()
    cursor.close()
    db.close()

async def get_user_by_username(username: str) -> Optional[dict]:
    """Retrieve user from database by username."""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        return cursor.fetchone()
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

async def get_user_by_id(user_id: int) -> Optional[dict]:
    """
    Retrieve user from database by ID.

    Args:
        user_id: The ID of the user to retrieve

    Returns:
        Optional[dict]: User data if found, None otherwise
    """
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        return cursor.fetchone()
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

async def create_session(user_id: int, session_id: str) -> bool:
    """Create a new session in the database."""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO sessions (id, user_id) VALUES (%s, %s)", (session_id, user_id)
        )
        connection.commit()
        return True
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


async def get_session(session_id: str) -> Optional[dict]:
    """Retrieve session from database."""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT *
            FROM sessions s
            WHERE s.id = %s
        """,
            (session_id,),
        )
        return cursor.fetchone()
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


async def delete_session(session_id: str) -> bool:
    """Delete a session from the database."""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("DELETE FROM sessions WHERE id = %s", (session_id,))
        connection.commit()
        return True
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

# Function to seed CSV data into the database
def seed_database():
    db = get_db_connection()
    cursor = db.cursor()

    csv_files = {
        "temperature": "./sample/temperature.csv",
        "humidity": "./sample/humidity.csv",
        "light": "./sample/light.csv",
    }

    # Clear tables before inserting data
    for table in csv_files.keys():
        cursor.execute(f"DELETE FROM {table}")

    db.commit()

    for table, file_path in csv_files.items():
        df = pd.read_csv(file_path)

        for _, row in df.iterrows():
            cursor.execute(f"""
                INSERT INTO {table} (value, unit, timestamp)
                VALUES (%s, %s, %s)
            """, (row['value'], row['unit'], row['timestamp']))

    db.commit()
    cursor.close()
    db.close()

def add_fridge_item(
    user_id: int,
    barcode: str,
    product_name: str,
    entry_date: date,
    exp_date: date
) -> None:
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute(
        """
        INSERT INTO fridge_items 
          (user_id, barcode, product_name, entry_date, exp_date)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (user_id, barcode, product_name, entry_date, exp_date),
    )
    conn.commit()
    cur.close()
    conn.close()


def get_fridge_items_for_user(user_id: int) -> List[Dict]:
    conn = get_db_connection()
    cur  = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT barcode, product_name, entry_date, exp_date
          FROM fridge_items
         WHERE user_id = %s
         ORDER BY entry_date DESC
        """,
        (user_id,),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows