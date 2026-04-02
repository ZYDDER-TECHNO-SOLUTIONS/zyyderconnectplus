# Sparklex Connect+

AI-powered job portal that connects talent with the right companies — faster, smarter, fairer.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand |
| **Backend** | Python, FastAPI, SQLAlchemy (async), Uvicorn |
| **Databases** | PostgreSQL 16, MongoDB 7, Redis 7 |
| **Messaging** | RabbitMQ 3.13 |
| **Gateway** | Nginx |
| **Infra** | Docker Compose, Kubernetes |

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────────┐
│   Frontend   │────▶│                Nginx Gateway                 │
│  React/Vite  │     │         (port 80 — reverse proxy)            │
└─────────────┘     └────┬─────────┬──────────┬──────────┬─────────┘
                         │         │          │          │
                    ┌────▼───┐ ┌───▼────┐ ┌───▼────┐ ┌──▼──────────┐
                    │  Auth  │ │  Jobs  │ │ Resume │ │ Notification │
                    │Service │ │Service │ │Service │ │   Service    │
                    └───┬────┘ └───┬────┘ └───┬────┘ └──────┬───────┘
                        │         │          │              │
              ┌─────────▼─────────▼──────────▼──────────────▼───────┐
              │  PostgreSQL  │   MongoDB   │   Redis   │  RabbitMQ  │
              └─────────────────────────────────────────────────────┘
```

## Microservices

| Service | Description | Port |
|---------|-------------|------|
| **auth-service** | Authentication, users, companies, connections, follows | 8081 |
| **job-service** | Job listings, applications, AI job description generation | 8082 |
| **resume-service** | Resume upload, resume builder, AI enhancement & scoring | 8083 |
| **notification-service** | In-app and email notifications via RabbitMQ | 8084 |
| **frontend** | React SPA | 3001 |
| **nginx** | API gateway & reverse proxy | 80 |

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/ZYDDER-TECHNO-SOLUTIONS/SparklexConnectPlus.git
cd SparklexConnectPlus
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your API keys and SMTP settings
```

### 3. Start the application

```bash
docker compose up --build -d
```

### 4. Access the app

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| App (via Nginx) | http://localhost |
| RabbitMQ Dashboard | http://localhost:15673 |
| MailHog (dev email) | http://localhost:8126 |

### Default Admin Credentials

| Field | Value |
|-------|-------|
| Email | `admin@sparklex.com` |
| Password | `SparkleX@2026` |

## Project Structure

```
├── backend/
│   ├── auth-service/          # Authentication & user management
│   ├── job-service/           # Job listings & applications
│   ├── notification-service/  # Notifications
│   └── resume-service/        # Resume management & AI features
├── frontend/                  # React SPA
├── infrastructure/
│   ├── nginx/                 # Nginx reverse proxy config
│   └── postgres/              # DB initialization scripts
├── k8s/                       # Kubernetes manifests
├── docker-compose.yml
└── .env.example
```

## Key Features

- User registration & login with email/password and Google OAuth
- Role-based access (Employee, Employer, Superadmin)
- Job posting & application management
- AI-powered job description generation
- Resume upload, builder & AI-powered enhancement
- Resume scoring against job requirements
- Connection requests & follow system
- Company profiles
- Real-time notifications
- Admin dashboard with user management

## Kubernetes Deployment

Kubernetes manifests are in the `k8s/` directory. Deploy with:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

## License

Proprietary - ZYDDER TECHNO SOLUTIONS
