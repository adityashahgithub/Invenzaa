# Invenzaa – Deployment Guide

## Prerequisites

- Node.js 18+
- MongoDB (Atlas or self-hosted)
- Git

---

## MongoDB Atlas Setup

1. **Create account** at [mongodb.com/atlas](https://www.mongodb.com/atlas)

2. **Create cluster** (free tier M0 available)

3. **Database Access** → Add Database User:
   - Username: `invenzaa`
   - Password: (generate secure password)
   - Role: Atlas Admin or Read/Write to any database

4. **Network Access** → Add IP Address:
   - For development: `0.0.0.0/0` (allow from anywhere)
   - For production: Add your deployment platform IP ranges

5. **Connect** → Drivers → Copy connection string:


6. **Set database name** in the URI:

   ```
   mongodb+srv://user:pass@cluster.mongodb.net/invenzaa?retryWrites=true&w=majority
   ```

7. **Use as env var**:
   ```

   ```

---

## Deploy Backend on Render

1. **Create account** at [render.com](https://render.com)

2. **New → Web Service**

3. **Connect repository** (GitHub/GitLab)

4. **Settings**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. **Environment Variables**:

   | Variable             | Value                                                    |
   | -------------------- | -------------------------------------------------------- |
   | `NODE_ENV`           | `production`                                             |
   | `MONGODB_URI`        | Your Atlas connection string                             |
   | `JWT_ACCESS_SECRET`  | Generate: `openssl rand -hex 32`                         |
   | `JWT_REFRESH_SECRET` | Generate: `openssl rand -hex 32`                         |
   | `CLIENT_URL`         | Your frontend URL (e.g. `https://your-app.onrender.com`) |
   | `PORT`               | `5000` (Render sets this automatically)                  |

6. **Deploy** – Render will build and deploy.

7. **Copy backend URL** (e.g. `https://invenzaa-api.onrender.com`)

---

## Deploy Backend on Railway

1. **Create account** at [railway.app](https://railway.app)

2. **New Project** → Deploy from GitHub

3. **Select repo** and set root directory to `backend` (if monorepo)

4. **Environment Variables** (Railway → Variables):

   | Variable             | Value                            |
   | -------------------- | -------------------------------- |
   | `NODE_ENV`           | `production`                     |
   | `MONGODB_URI`        | Your Atlas connection string     |
   | `JWT_ACCESS_SECRET`  | Generate: `openssl rand -hex 32` |
   | `JWT_REFRESH_SECRET` | Generate: `openssl rand -hex 32` |
   | `CLIENT_URL`         | Your frontend URL                |

5. **Settings** → Build:
   - Build Command: `npm install`
   - Start Command: `npm start`

6. **Deploy** – Railway auto-deploys on push.

7. **Generate domain** from Settings → Networking.

---

## Deploy Frontend on Render

1. **New → Static Site** (or Web Service for SSR)

2. **Connect repository**

3. **Settings**:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

4. **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend-domain.onrender.com/api`

5. **Deploy**

---

## Deploy Frontend on Vercel

1. **Import project** from [vercel.com](https://vercel.com)

2. **Root Directory**: `frontend`

3. **Framework Preset**: Vite

4. **Environment Variables**:
   - `VITE_API_URL`: Your backend API URL

5. **Deploy**

---

## Post-Deploy: Seed Admin Account

1. Set env vars for the seeder:

   ```
   SEEDER_ADMIN_EMAIL=admin@yourdomain.com
   SEEDER_ADMIN_PASSWORD=SecurePassword123!
   SEEDER_ORG_NAME=Your Pharmacy
   ```

2. Run locally (with backend `.env` pointing to production DB):

   ```bash
   cd backend
   npm run seed
   ```

3. Or run via Render/Railway shell (if available):
   ```bash
   node scripts/seed.js
   ```

---

## Environment Variables Reference

| Variable              | Required   | Default                 | Description                                |
| --------------------- | ---------- | ----------------------- | ------------------------------------------ |
| `NODE_ENV`            | No         | `development`           | `production`                               |
| `PORT`                | No         | `5000`                  | Server port                                |
| `MONGODB_URI`         | Yes        | -                       | MongoDB connection string                  |
| `JWT_ACCESS_SECRET`   | Yes (prod) | -                       | JWT access token secret                    |
| `JWT_REFRESH_SECRET`  | Yes (prod) | -                       | JWT refresh token secret                   |
| `CLIENT_URL`          | No         | `http://localhost:5173` | CORS origin (comma-separated for multiple) |
| `RATE_LIMIT_MAX`      | No         | `100`                   | API requests per 15 min                    |
| `AUTH_RATE_LIMIT_MAX` | No         | `10`                    | Auth requests per 15 min                   |
| `LOG_LEVEL`           | No         | `info` (prod)           | `debug`, `info`, `warn`, `error`           |

---

## CORS

For multiple frontend origins:

```
CLIENT_URL=https://app1.com,https://app2.com
```

---

## Security Checklist

- [ ] Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Use HTTPS in production
- [ ] Restrict MongoDB Atlas IP access in production
- [ ] Restrict CORS to specific origins
- [ ] Change default admin password after first login
