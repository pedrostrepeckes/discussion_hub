# PoliticaFatos Backend

## Setup

1.  Create a virtual environment (optional but recommended):
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Running the Server

Run the following command from the `backend` directory:

```bash
uvicorn main:app --reload
```

Or use the `run_backend.bat` script in the root directory.

## Configuration

Create a `.env` file in `backend/app/core/` or set environment variables:
- `DATABASE_URL`: `mysql+pymysql://user:password@host/db_name`
- `SECRET_KEY`: Your secret key
