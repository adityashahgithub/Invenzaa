# Invenzaa — Role & Access Matrix (RBAC)

This document describes **default** access for the five seeded roles in each organization. Roles and permissions are **scoped per organization** (same role name in Org A does not share documents with Org B). The API enforces permissions server-side; the UI mirrors visibility where routes and components are gated.

**Permission strings** checked by the backend (and exposed on `/users/me` as `rolePermissions`):  
`medicines`, `inventory`, `sales`, `purchases`, `reports`, `collaboration`, or `*` (full module set for that role document).

**Admin-only APIs** (not permission strings): `GET/POST /users`, `PATCH /users/:id/status`, and all `/roles/*` routes require an authenticated user whose **role name** is `Owner` or `Admin` (`requireAdmin`).

---

## Default role definitions

| Role       | Default permissions |
|-----------|----------------------|
| Owner     | `*`                  |
| Admin     | `*`                  |
| Pharmacist| `medicines`, `inventory`, `sales`, `purchases`, `reports`, `collaboration` |
| Staff     | `medicines`, `inventory`, `sales`, `collaboration` |
| Viewer    | `medicines`, `inventory`, `reports` |

Custom roles may be added per organization with any subset of the module keys above (or other keys if you extend the product — the middleware only checks membership in `role.permissions`).

---

## Module access by role (summary)

Legend: **R** = read/list/detail allowed, **W** = create/update where applicable, **—** = forbidden by default role permissions or role-gated operations.

| Module / area | Owner | Admin | Pharmacist | Staff | Viewer |
|---------------|-------|-------|------------|-------|--------|
| **Medicines** (list/search/detail) | R | R | R | R | R |
| **Medicines** (create / update) | W | W | W | — | — |
| **Medicines** (delete) | W | W | — | — | — |
| **Inventory** (all current routes) | R | R | R | R | R |
| **Sales** (read + create) | RW | RW | RW | RW | — |
| **Purchases** (read + create) | RW | RW | RW | — | — |
| **Reports** | R | R | R | — | R |
| **Collaboration** (partners, list, get) | R | R | R | R | — |
| **Collaboration** (create request) | W | W | W | W | — |
| **Collaboration** (update request status) | W | W | — | — | — |
| **Collaboration** (create response) | W | W | — | — | — |
| **Users & team** (API + `/users` UI) | RW | RW | — | — | — |
| **Roles & permissions** (API + `/roles` UI) | RW | RW | — | — | — |
| **Masters** (categories, brands, suppliers) | RW | RW | — | — | — |

Notes:

- **Medicines**: Read paths use `requirePermission('medicines')`. Create/update use `requireRole('Owner', 'Admin', 'Pharmacist')`. Delete uses `requireRole('Owner', 'Admin')`.
- **Sales / Purchases**: All mutating list operations use the same permission as read (`sales` / `purchases`); there is no separate “write permission” key today.
- **Collaboration**: All routes require `collaboration` **except** some sub-operations further restrict by role (see table).
- **Masters**: `backend/src/routes/masterRoutes.js` — `Owner` and `Admin` only.

---

## Frontend route guards

| Route pattern | Guard |
|---------------|--------|
| `/dashboard`, `/profile` | Authenticated |
| `/medicines`, `/inventory`, `/sales/*`, `/purchases/*`, `/collaboration/*`, `/reports` | `requiredPermissions` matching the module (`medicines`, `inventory`, etc.) |
| `/users`, `/roles`, `/masters/*` | `allowedRoles`: `Admin`, `Owner` |

**Sidebar**: Module links use `hasPermission(...)` from `AuthContext`. **Masters**, **Team & Users**, and **Roles & Permissions** sections use role checks (`Admin` / `Owner`), consistent with backend `requireAdmin` for users/roles and master routes.

**Medicines UI** (`MedicineList.jsx`): Add/Edit allowed for `Owner`, `Admin`, `Pharmacist`; Delete controls for `Owner`, `Admin` only — aligned with API rules above.

---

## Backend reference (quick map)

| Area | File | Enforcement pattern |
|------|------|---------------------|
| Medicines | `medicineRoutes.js` | `requirePermission('medicines')` (read); `requireRole` for writes/delete |
| Inventory | `inventoryRoutes.js` | `requirePermission('inventory')` on router |
| Sales | `salesRoutes.js` | `requirePermission('sales')` |
| Purchases | `purchasesRoutes.js` | `requirePermission('purchases')` |
| Reports | `reportsRoutes.js` | `requirePermission('reports')` |
| Collaboration | `collaborationRoutes.js` | `requirePermission('collaboration')` + `requireRole` on mutating sub-routes |
| Users | `userRoutes.js` | `requireAdmin` for admin endpoints |
| Roles | `rolesRoutes.js` | `requireAdmin` on router |
| Masters | `masterRoutes.js` | `requireRole('Owner', 'Admin')` |

---

## Operational notes for QA / deployment

1. After login, `GET /users/me` should return `rolePermissions` derived from the user’s **organization-scoped** role document. If a non–Owner/Admin user lacks a matching role row, the permission middleware returns **403** (`Role configuration not found`).
2. **Owner** and **Admin** receive a **fallback** in `requirePermission` if the role document is missing (legacy safety); prefer keeping role documents in sync via **Roles & Permissions** or `ensureDefaultRolesForOrg`.
3. Changing a role’s permissions in the UI updates future checks immediately for users with that role name in the same organization (on next request, `Role.findOne({ organization, name: roleName })` is used).

---

*Generated for the Invenzaa codebase. Update this file if you add modules, split read/write permissions, or change default role seeds in `backend/src/controllers/rolesController.js`.*
