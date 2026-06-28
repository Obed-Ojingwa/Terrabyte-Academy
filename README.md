# Terrabyte Academy — LMS

Nigeria's premier Learning Management System built with FastAPI + Next.js.

## Quick Start (Development)

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16
- Redis 7

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env      # Edit with your credentials
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # Edit with your credentials
npm run dev
```

### 3. Celery (background jobs)
```bash
cd backend
celery -A app.tasks.celery_app worker --loglevel=info --pool=solo
```

## Docker (Production)
```bash
docker-compose up --build -d
```


## Tech Stack
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Redis, Celery
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Auth**: JWT (access + refresh tokens), bcrypt
- **Payments**: Paystack
- **Storage**: Amazon S3
- **Certificates**: ReportLab PDF generation

## API Docs
http://localhost:8000/api/docs (dev mode only)
