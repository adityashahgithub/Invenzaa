# Invenzaa API Testing Examples

Base URL: `http://localhost:5000/api`

---

## 1. Register

**POST** `/auth/register`

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@pharmacy.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe",
    "organizationName": "City Pharmacy"
  }'
```

**Success (201):**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "_id": "...",
      "email": "owner@pharmacy.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Owner",
      "organization": { "name": "City Pharmacy" },
      "status": "active"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

---

## 2. Login

**POST** `/auth/login`

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@pharmacy.com",
    "password": "SecurePass123"
  }'
```

**Success (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Error (401):**

```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

---

## 3. Logout

**POST** `/auth/logout`

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

**Success (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 4. Refresh Token

**POST** `/auth/refresh`

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

**Success (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

---

## 5. Forgot Password

**POST** `/auth/forgot-password`

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "owner@pharmacy.com"}'
```

**Success (200):**

```json
{
  "success": true,
  "message": "If the email exists, a reset link will be sent."
}
```

---

## 6. Get Current User (Protected)

**GET** `/users/me`

```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "owner@pharmacy.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Owner",
      "organization": {
        "name": "City Pharmacy",
        "address": "",
        "licenseNumber": "",
        "phone": ""
      },
      "status": "active"
    }
  }
}
```

**Error (401):**

```json
{
  "success": false,
  "message": "Not authorized. Please login."
}
```

---

## 7. Change Password (Protected)

**PUT** `/users/change-password`

```bash
curl -X PUT http://localhost:5000/api/users/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123",
    "newPassword": "NewSecurePass456"
  }'
```

**Success (200):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error (400):**

```json
{
  "success": false,
  "message": "Current password is incorrect."
}
```

---

## 8. Get All Users (Admin/Owner only)

**GET** `/users`

```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success (200):**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "...",
        "email": "owner@pharmacy.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "Owner",
        "organization": { "name": "City Pharmacy" },
        "status": "active"
      }
    ],
    "count": 1
  }
}
```

**Error (403):**

```json
{
  "success": false,
  "message": "Insufficient permissions."
}
```

---

## 9. Update User Status (Admin/Owner only)

**PATCH** `/users/:id/status`

```bash
curl -X PATCH http://localhost:5000/api/users/USER_ID/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'
```

Valid `status` values: `active`, `inactive`, `suspended`

**Success (200):**

```json
{
  "success": true,
  "message": "User status updated",
  "data": {
    "user": { ... }
  }
}
```

---

## Validation Error Example (400)

```json
{
  "success": false,
  "message": "email: Valid email is required. password: Password must be at least 8 characters"
}
```

---

## Quick Test Flow

1. Register a new user → save `accessToken`
2. Login with same credentials → verify tokens
3. Call `GET /users/me` with token → verify user data
4. Call `PUT /users/change-password` → change password
5. Login again with new password
6. Call `GET /users` (as Owner) → list users
7. Call `PATCH /users/:id/status` on another user (if any)
