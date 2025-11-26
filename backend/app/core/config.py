import os
from dotenv import load_dotenv
import sys

sys.path.append(os.getcwd())
load_dotenv(os.path.join(os.getcwd(), "app", "core", ".env"))

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
