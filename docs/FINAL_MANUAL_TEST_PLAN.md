# Invenzaa — Final manual test plan

Use this checklist during UAT and release sign-off. Check each box when verified. Note failures, browser, and build/version in the **Notes** column (or a separate log).

**Convention:** `[ ]` not run / failed · `[x]` passed

---

## 0. Prerequisites

| # | Step | Notes |
|---|------|-------|
| 0.1 | Backend and frontend deployed or running locally; MongoDB reachable | |
| 0.2 | At least two organizations (e.g. Org A / Org B) for collaboration tests | |
| 0.3 | Test users: Owner, Admin, Pharmacist, Staff, Viewer (as applicable) | |
| 0.4 | Browser: Chrome (primary); spot-check Safari or Firefox | |

---

## 1. Authentication & session

| # | Step | Notes |
|---|------|-------|
| 1.1 | Register / login with valid credentials | |
| 1.2 | Logout clears session; protected routes redirect | |
| 1.3 | Invalid password shows clear error (no silent failure) | |
| 1.4 | Token expiry: refresh or re-login behaves as designed | |

---

## 2. Dashboard

| # | Step | Notes |
|---|------|-------|
| 2.1 | Dashboard loads without console errors | |
| 2.2 | Key metrics/charts match underlying data (spot-check vs Medicines/Sales) | |
| 2.3 | Navigation sidebar highlights current route | |

---

## 3. Medicines

| # | Step | Notes |
|---|------|-------|
| 3.1 | List medicines; search filters results | |
| 3.2 | Add medicine (name, category, optional generic name, unit) | |
| 3.3 | Edit medicine; changes persist after refresh | |
| 3.4 | View medicine detail | |
| 3.5 | Delete (or soft-disable) behaves as per product rules; confirm if destructive | |

---

## 4. Inventory & batches

| # | Step | Notes |
|---|------|-------|
| 4.1 | Inventory list shows stock status (e.g. good / low / expired) | |
| 4.2 | Add batch: batch no, qty, MFG/expiry; validation rejects invalid dates | |
| 4.3 | Non-expired stock counts match batch totals for a medicine | |
| 4.4 | Pagination/sorting if present works | |

---

## 5. Sales

| # | Step | Notes |
|---|------|-------|
| 5.1 | New sale: select medicine, batch, qty, unit price; totals compute correctly | |
| 5.2 | Sale completes; stock decreases for chosen batch | |
| 5.3 | **Sales list → View (modal): customer, date, total amount correct** | |
| 5.4 | **Same modal: each line shows medicine name, qty, and unit price (no NaN / blank price)** | |
| 5.5 | Full sale detail page (if used): line unit price and line totals match | |
| 5.6 | Sales search / pagination | |
| 5.7 | Download sale PDF (if enabled): line items and totals match screen | |

---

## 6. Purchases

| # | Step | Notes |
|---|------|-------|
| 6.1 | New purchase: supplier, items, dates; saves successfully | |
| 6.2 | Stock increases after purchase (correct batch/medicine) | |
| 6.3 | Purchase list and detail; search including “General Supplier” or blank supplier if applicable | |
| 6.4 | Purchase PDF download matches data | |

---

## 7. Collaboration (multi-org)

| # | Step | Notes |
|---|------|-------|
| 7.1 | Org A creates request to Org B (medicine, qty, message) | |
| 7.2 | Org B sees incoming request | |
| 7.3 | **Org B accepts when same medicine name exists locally even if generic name differs or is empty** | |
| 7.4 | Offered qty ≤ requested; stock validation message is accurate | |
| 7.5 | Decline path works | |
| 7.6 | Cancel (requester) works while pending | |

---

## 8. Reports

| # | Step | Notes |
|---|------|-------|
| 8.1 | Report date ranges apply correctly | |
| 8.2 | Exported or on-screen totals reconcile with Sales/Purchases for sample period | |

---

## 9. Masters (Categories, Brands, Suppliers)

| # | Step | Notes |
|---|------|-------|
| 9.1 | CRUD for each master; used values appear in dropdowns where expected | |
| 9.2 | Validation for duplicates/names | |

---

## 10. Admin & users (Owner/Admin)

| # | Step | Notes |
|---|------|-------|
| 10.1 | List users; invite/create user | |
| 10.2 | Role assignment matches RBAC (e.g. Viewer cannot sell) | |
| 10.3 | Password reset / email flows if implemented | |

---

## 11. RBAC spot-checks

| # | Step | Notes |
|---|------|-------|
| 11.1 | Viewer: read-only where expected; 403 on mutations | |
| 11.2 | Staff/Pharmacist: can operate per role matrix | |
| 11.3 | Collaboration permission: without it, collaboration routes blocked | |

---

## 12. Cross-cutting UX & quality

| # | Step | Notes |
|---|------|-------|
| 12.1 | No unhandled errors in console on main flows | |
| 12.2 | Loading and empty states on long lists | |
| 12.3 | Mobile/tablet: layout usable (sidebar, tables scroll) | |
| 12.4 | Date inputs: locale displays correctly (OS/browser) | |

---

## 13. Sign-off

| Field | Value |
|-------|--------|
| **Product version / commit** | |
| **Environment** (staging / prod) | |
| **Tester** | |
| **Date** | |
| **Approved for release** | ☐ Yes ☐ No |

**Blockers (if any):**

---

_End of checklist._
