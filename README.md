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

## Deployment (clean checklist)

Use this for a quick, repeatable deployment setup.

### 1. Prepare services

- Create a MongoDB database (Atlas or self-hosted).
- Choose hosting for backend (for example Render/Railway/VM).
- Choose hosting for frontend (for example Vercel/Netlify/static server).

### 2. Configure backend environment

- Set production-safe values in `backend/.env`.
- Start backend with:

```bash
cd backend
npm install
npm start
```

### 3. Configure frontend environment

- Set `VITE_API_URL` to your backend API base URL (for example `https://api.example.com/api`).
- Build and serve frontend:

```bash
cd frontend
npm install
npm run build
npm run preview
```

### 4. Verify after deploy

- Open `/api/health` on backend and confirm success response.
- Confirm login, add medicine, add staff invite email, and report pages load.
- Confirm CORS allows your production frontend origin.

## Contributor `.env` setup checklist

### Backend (`backend/.env`)

Required keys:

| Key | Required | Example |
|-----|----------|---------|
| `NODE_ENV` | Yes | `development` |
| `PORT` | Yes | `5001` |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/invenzaa` |
| `JWT_ACCESS_SECRET` | Yes | strong random string |
| `JWT_REFRESH_SECRET` | Yes | strong random string |
| `CLIENT_URL` | Yes | `http://localhost:5173` |
| `RATE_LIMIT_MAX` | Recommended | `100` |
| `AUTH_RATE_LIMIT_MAX` | Recommended | `10` |
| `LOG_LEVEL` | Recommended | `debug` |

Mail keys (needed for invite/reset emails):

| Key | Required for Mail | Example |
|-----|-------------------|---------|
| `MAIL_HOST` | Yes | `smtp.gmail.com` |
| `MAIL_PORT` | Yes | `587` |
| `MAIL_USER` | Yes | your mailbox |
| `MAIL_PASS` | Yes | app password |
| `MAIL_FROM` | Yes | `"Invenzaa <your@email.com>"` |
| `MAIL_SECURE` | Yes | `false` (for port 587) |

### Frontend (`frontend/.env`)

Recommended key:

| Key | Required | Example |
|-----|----------|---------|
| `VITE_API_URL` | Yes (production) | `https://your-backend-domain/api` |

### Security checklist before pushing code

- Never commit real `.env` files.
- Rotate credentials immediately if exposed.
- Keep JWT secrets different across dev/staging/prod.
- Use app passwords for SMTP providers instead of account passwords.

## Configuration notes

- **CORS / `CLIENT_URL`:** Must allow your frontend origin in production.
- **Secrets:** Use strong random values for JWT secrets; never commit real `.env` files.
- **Database:** Use a dedicated database name per environment (dev/staging/prod).

## License

Use and license terms are determined by the project owner; add a `LICENSE` file if you need an explicit OSS or proprietary statement.

---

_Invenzaa — inventory and collaboration for pharmacies._
