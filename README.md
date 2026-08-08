# WorkPulse v2.0

AI-powered team workload intelligence — Hybrid Fuzzy Logic + Neural Network ensemble with full persistence.

---

## Deploy with Docker (recommended)

```bash
# 1. Copy and fill env vars
cp .env.example .env

# 2. Start all services (Postgres + Redis + backend + frontend)
docker-compose up -d

# 3. Open
open http://localhost:3000
```

That's it. Migrations run automatically on first boot.

---

## Local dev (no Docker)

**Prerequisites:** Node 20, PostgreSQL 16, Redis 7 (optional — falls back to memory)

```bash
# Backend
cd backend
cp .env.example .env        # edit DATABASE_URL and REDIS_URL
npm install && npm run dev  # port 4000

# Frontend (new terminal)
cd frontend
npm install && npm run dev  # port 3000
```

---

## Demo accounts

| Email | Password | Role | Dashboard |
|-------|----------|------|-----------|
| sarah@workpulse.io | any | Manager | /dashboard |
| david@workpulse.io | any | Admin | /dashboard (+ RBAC) |
| alex@workpulse.io | any | Member | /member |
| maya@workpulse.io | any | Team Lead | /member |

---

## Rate limits

| Tier | Limit | Window | Notes |
|------|-------|--------|-------|
| Global | 1000 | 15 min | Hard cap on all routes |
| Public | 100 | 15 min | Unauthenticated read routes |
| Authenticated | 500 | 15 min | All data routes |
| AI Predictions | 20 | 15 min | /predict/* — expensive engine calls |

Backed by Redis when available, falls back to in-memory automatically.

---

## Infrastructure

```
postgres:5432   — primary data store (team, predictions, forecasts, audit, checkpoints)
redis:6379      — rate limiting + prediction cache (5 min TTL)
backend:4000    — Express + TypeScript engine
frontend:3000   — Next.js 14 App Router
```

---

## Architecture

### Backend
- **Mamdani engine** — 55 rules, MIN aggregation, centroid defuzz (200pt)
- **Sugeno engine** — 6 Gaussian-antecedent rules, linear consequents, weighted average
- **Hybrid fusion** — 4 strategies: weighted_average (0.45/0.30/0.25), contextual_switch, ensemble, adaptive
- **Neural network** — 4-layer DNN: ReLU → tanh → sigmoid, confidence from entropy
- **Kernel SHAP** — 17 features, deviation-weighted, generates recommendations
- **LSTM + ARIMA** — 7-day forecast ensemble, MAE/RMSE reporting
- **Brook's Law** — coordination overhead, synergy factors, knowledge silo detection
- **10 escalation rules** — burnout, bus factor, knowledge silos, sprint overcommit, trend alerts
- **6 RBAC roles** — member → team_lead → manager → admin, hr, executive (permission inheritance)
- **Checkpoints** — 50 manual / 10 auto rotation, full state snapshot to Postgres
- **SOC2 audit log** — immutable append-only event stream

### Frontend
- Next.js 14 App Router, Zustand, TypeScript
- Light theme — Inter font, #f5f6f8 background, clean cards
- No Tailwind — pure custom CSS design system
- Routes: `/login`, `/signup`, `/dashboard`, `/member`, `/collab`
