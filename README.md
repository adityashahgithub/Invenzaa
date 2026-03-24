# Invenzaa – Medicine Inventory Management System

MERN stack application for pharmacy inventory management with role-based access, sales, purchases, collaboration, and reports.

## Features

- **Auth & RBAC**: JWT auth, refresh tokens, roles (Owner, Admin, Pharmacist, Staff, Viewer)
- **Medicines**: CRUD, search, batches, expiry tracking
- **Inventory**: Status, low-stock alerts, expiry alerts, logs
- **Sales & Purchases**: Transaction-based flow with invoices
- **Collaboration**: Inter-organization stock requests
- **Reports**: Sales, purchases, inventory, low-stock, expiry
- **Team Management**: Add staff, assign roles, activate/deactivate users

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MONGODB_URI, JWT secrets
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Seed Admin Account

```bash
cd backend
# Set SEEDER_ADMIN_EMAIL, SEEDER_ADMIN_PASSWORD, SEEDER_ORG_NAME in .env
npm run seed
```

Default sample admin (if using defaults):

- Email: `admin@invenzaa.com`
- Password: `Admin123!`

## Production Hardening

- **Input validation**: express-validator on all routes
- **Security**: Helmet, rate limiting (API + auth), CORS
- **Error handling**: Centralized handler, proper HTTP status codes
- **MongoDB**: Indexes on all models, duplicate prevention
- **Logging**: Winston with configurable levels
- **Expiry/Stock**: Edge cases handled (expired batches, insufficient stock)

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for:

- MongoDB Atlas setup
- Render / Railway backend deployment
- Frontend deployment (Render, Vercel)

## API Collection

Import [docs/Invenzaa-Postman-Collection.json](docs/Invenzaa-Postman-Collection.json) into Postman.

## Folder Structure

See [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md).
