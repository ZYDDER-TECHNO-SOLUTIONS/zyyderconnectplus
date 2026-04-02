# Sparklex Connect+ 🚀

AI-Powered Job Portal — Full-Stack Microservices

## Stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS      |
| Auth        | FastAPI, JWT, bcrypt, PostgreSQL              |
| Jobs        | FastAPI, PostgreSQL, Redis cache              |
| Resumes     | FastAPI, MinIO, PDF/DOCX parsing, Claude AI  |
| Notifs      | FastAPI, RabbitMQ consumer, SMTP             |
| AI          | Anthropic Claude (resume analysis + matching)|
| Infra       | Docker Compose, Nginx, MailHog (dev)         |

## Quick Start

```bash
# 1. Clone and enter
cd sparklex

# 2. Configure environment
cp .env.example .env
# Edit .env → add your ANTHROPIC_API_KEY

# 3. Launch everything
docker compose up --build

# 4. Open the app
open http://localhost:3001

# API docs (per service)
open http://localhost:8081/docs  # Auth
open http://localhost:8082/docs  # Jobs
open http://localhost:8083/docs  # Resumes
open http://localhost:8084/docs  # Notifications

# MailHog (dev email)
open http://localhost:8026

# RabbitMQ management
open http://localhost:15672   # sparklex / sparklex_rabbit_secret

# MinIO console
open http://localhost:9001    # sparklex_minio / sparklex_minio_secret
```

## User Roles

| Role         | Capabilities                                               |
|--------------|-----------------------------------------------------------|
| `employee`   | Browse jobs, apply, upload resumes, AI match scoring      |
| `employer`   | Post jobs, AI description generator, review applications  |
| `superadmin` | Full platform access, user management, stats              |

## Creating a Superadmin

After first launch, register normally then update via psql:

```sql
-- Connect to auth DB
docker exec -it sparklex-postgres psql -U sparklex sparklex_auth

UPDATE users SET role = 'superadmin', status = 'active' WHERE email = 'your@email.com';
```

## Architecture

```
Browser
  └── Nginx (port 80)
        ├── /         → React Frontend (port 3001)
        ├── /api/auth → Auth Service (port 8081)
        ├── /api/jobs → Job Service  (port 8082)
        ├── /api/resumes → Resume Service (port 8083)
        └── /api/notifications → Notif Service (port 8084)

Shared Infrastructure:
  PostgreSQL (4 databases)
  Redis (4 DBs, one per service)
  RabbitMQ (event bus)
  MinIO (resume file storage)
```

## Services

### Auth Service (port 8081)
- JWT access + refresh tokens
- Role-based: superadmin / employer / employee
- `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/verify`
- `/users/me` — profile management
- `/admin/users` — user management (superadmin only)

### Job Service (port 8082)
- Full CRUD for job listings
- Search & filter (keyword, location, type, salary, experience)
- Application pipeline with ATS status tracking
- Claude AI job description generator

### Resume Service (port 8083)
- PDF / DOCX / TXT upload → MinIO storage
- Claude AI: auto-extract skills, experience, summary
- Per-job AI match scoring (0–100%)
- Presigned download URLs

### Notification Service (port 8084)
- In-app notification store
- Unread count, mark read, mark all read
- RabbitMQ consumer ready for event-driven notifications

## AI Features

All AI features use `claude-sonnet-4-20250514`:

1. **Resume Analysis** — On upload, Claude extracts: skills, experience years, education, work history, professional summary
2. **Job Match Scoring** — Score a resume against any job (0–100), with strengths, gaps, matched/missing skills
3. **Job Description Generator** — Generate full description + requirements + responsibilities from just a title + skills

## Development

```bash
# Run a single service locally
cd backend/auth-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8081

# Frontend hot reload
cd frontend
npm install
npm run dev
```

## Environment Variables

See `.env.example` for all variables. Key ones:

| Variable            | Description                     |
|--------------------|---------------------------------|
| `ANTHROPIC_API_KEY` | Required for AI features        |
| `SMTP_HOST`         | Leave blank to use MailHog      |

## Production Notes

- Change all passwords in `.env` before deploying
- Set `SECRET_KEY` to a cryptographically random 64-char string
- Enable HTTPS via Nginx + Certbot
- Set `ENVIRONMENT=production` to disable reload mode
- Use managed PostgreSQL / Redis in production
