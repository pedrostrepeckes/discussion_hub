from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints
from app.db import models, database

# Create tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="PoliticaFatos API")

# CORS
origins = [
    "http://localhost:5174", # Vite default
    "http://localhost:8000",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to PoliticaFatos API"}
