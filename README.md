# PoliticaFatos - Discussion Hub

PoliticaFatos is a data-driven political discussion community. This repository contains both the backend API and the frontend application.

## Backend (Python/FastAPI)

### Setup
1. Navigate to `backend` directory.
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Run migrations: `alembic upgrade head`
6. Start server: `uvicorn app.main:app --reload`

## Frontend (React/TypeScript)

### Setup
1. Navigate to `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

The frontend will run at `http://localhost:5173` by default.

### Features
- **Authentication**: Login and Register.
- **Dashboard**: View active and finished discussions.
- **Discussion Detail**: View discussion content and responses split by "Agree" vs "Disagree".
- **Moderation**: Admin/Moderators can approve or reject responses.
