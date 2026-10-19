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

### 4. Local demo logins

To create one local login per dashboard role and a small sample course workflow, start from the `backend` directory with a local SQLite development database:

```powershell
$env:DATABASE_URL = "sqlite+aiosqlite:///./terrabyte.db"
$env:APP_ENV = "development"
python -m app.seed_demo_accounts
Remove-Item Env:APP_ENV
Remove-Item Env:DATABASE_URL
```

The command refuses non-SQLite databases and only creates demo users when their demo email is unused. It prints a randomly generated password once for each new account; copy the output to a secure location. Rerunning it does not reset existing passwords. Demo emails are `superadmin.demo@example.com`, `admin.demo@example.com`, `tutor.demo@example.com`, and `student.demo@example.com`. The seeded `DEMO: Introduction to Geospatial Analysis` course gives the tutor an assigned course and the student an active enrollment, lesson progress, an assignment, and an exam. The printed dashboard links are `/dashboard/superadmin`, `/dashboard/admin`, `/dashboard/tutor`, and `/dashboard/student`. The application does not create a fixed-password administrator during normal startup.

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
