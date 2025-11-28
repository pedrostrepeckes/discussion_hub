import os
from dotenv import load_dotenv
import sys

sys.path.append(os.getcwd())
load_dotenv(os.path.join(os.getcwd(), "app", "core", ".env"))

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("No SECRET_KEY set for Flask application")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
