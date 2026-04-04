# Invenzaa

Pharmacy-oriented **inventory management** for medicines: catalog, batches, sales, purchases, reporting, and **collaboration** between organizations.

## Features

- **Medicines** — Catalog with categories, generics, units, and stock signals.
- **Inventory** — Batches with expiry; low-stock and expiry awareness.
- **Sales & purchases** — Invoicing-style flows with PDF export where enabled.
- **Collaboration** — Request/approve medicine support across partner organizations.
- **Reports & masters** — Reporting plus categories, brands, suppliers.
- **RBAC** — Role-based access (Owner, Admin, Pharmacist, Staff, Viewer, etc.).

## Tech stack

| Layer | Stack |
|--------|--------|
| Frontend | React (Vite), React Router, Tailwind, Radix UI |
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Auth | JWT (access/refresh patterns as implemented in repo) |

## Repository layout

```
├── backend/          # API server (Express, Mongoose models, routes)
├── frontend/         # SPA (Vite + React)
└── docs/             # Deployment notes, manual test plan, etc.
```

## Quick start (local)

### Requirements

- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
cp .env.example .env   # if present; else configure .env manually
# Set MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CLIENT_URL, etc.
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# Set VITE_API_URL (or equivalent) to your API base URL
npm run dev
```

### Automated tests (backend)

```bash
cd backend
npm test
```

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Hosting, env vars, Atlas, Render/Railway-style notes |
| [docs/FINAL_MANUAL_TEST_PLAN.md](docs/FINAL_MANUAL_TEST_PLAN.md) | **UAT / sign-off checklist** (line-by-line) |

## Configuration notes

- **CORS / `CLIENT_URL`:** Must allow your frontend origin in production.
- **Secrets:** Use strong random values for JWT secrets; never commit real `.env` files.
- **Database:** Use a dedicated database name per environment (dev/staging/prod).

## License

Use and license terms are determined by the project owner; add a `LICENSE` file if you need an explicit OSS or proprietary statement.

---

_Invenzaa — inventory and collaboration for pharmacies._
