from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from urllib.parse import quote_plus

from dotenv import load_dotenv
import sys

sys.path.append(os.getcwd())
load_dotenv(os.path.join(os.getcwd(), "app", "core", ".env"))

password = os.getenv("DATABASE_PASSWORD", "password")
SQLALCHEMY_DATABASE_PASSWORD = quote_plus(password)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://developer:%s@127.0.0.1/politicafatos" % SQLALCHEMY_DATABASE_PASSWORD)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
