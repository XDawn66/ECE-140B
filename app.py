# Necessary Imports
from fastapi import FastAPI , Form, Request                  # The main FastAPI import
from fastapi.responses import HTMLResponse, RedirectResponse    # Used for returning HTML responses
from fastapi.staticfiles import StaticFiles   # Used for serving static files
import uvicorn  
from dotenv import load_dotenv
from urllib.request import urlopen
import json
import os
                              # Used for running the app
# Configuration
app = FastAPI()                   # Specify the "app" that will run the routing
 # Mount the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")


if __name__ == "__main__":
    

    uvicorn.run(app, host="0.0.0.0", port=6543)