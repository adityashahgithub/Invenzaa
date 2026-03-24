# Invenzaa – Final Folder Structure

```
Inventory Management System/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # MongoDB connection
│   │   │   └── env.js             # Environment config
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── rolesController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── medicineController.js
│   │   │   ├── inventoryController.js
│   │   │   ├── salesController.js
│   │   │   ├── purchasesController.js
│   │   │   ├── reportsController.js
│   │   │   └── collaborationController.js
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT protect
│   │   │   ├── rbac.js            # Role-based access
│   │   │   ├── errorHandler.js    # Centralized error handling
│   │   │   └── validate.js        # express-validator
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Role.js
│   │   │   ├── Organization.js
│   │   │   ├── Medicine.js
│   │   │   ├── Batch.js
│   │   │   ├── Sale.js
│   │   │   ├── Purchase.js
│   │   │   ├── Invoice.js
│   │   │   ├── PurchaseInvoice.js
│   │   │   ├── InventoryLog.js
│   │   │   ├── CollaborationRequest.js
│   │   │   └── CollaborationResponse.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── rolesRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── medicineRoutes.js
│   │   │   ├── inventoryRoutes.js
│   │   │   ├── salesRoutes.js
│   │   │   ├── purchasesRoutes.js
│   │   │   ├── reportsRoutes.js
│   │   │   └── collaborationRoutes.js
│   │   ├── services/
│   │   │   ├── saleService.js
│   │   │   ├── purchaseService.js
│   │   │   ├── invoiceService.js
│   │   │   ├── purchaseInvoiceService.js
│   │   │   └── inventoryLogService.js
│   │   └── utils/
│   │       ├── logger.js
│   │       ├── validators.js
│   │       ├── medicineValidators.js
│   │       ├── inventoryValidators.js
│   │       ├── roleValidators.js
│   │       ├── reportValidators.js
│   │       └── collaborationValidators.js
│   ├── scripts/
│   │   └── seed.js                # Database seeder
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosConfig.js
│   │   │   ├── authApi.js
│   │   │   ├── userApi.js
│   │   │   ├── rolesApi.js
│   │   │   ├── medicineApi.js
│   │   │   ├── batchApi.js
│   │   │   ├── salesApi.js
│   │   │   ├── purchasesApi.js
│   │   │   ├── inventoryApi.js
│   │   │   ├── collaborationApi.js
│   │   │   └── reportsApi.js
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── AppLayout.jsx
│   │   │       ├── AppLayout.module.css
│   │   │       ├── ProtectedRoute.jsx
│   │   │       └── ...
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── medicines/
│   │   │   ├── inventory/
│   │   │   ├── sales/
│   │   │   ├── purchases/
│   │   │   ├── collaboration/
│   │   │   ├── reports/
│   │   │   └── roles/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── DEPLOYMENT.md              # Deploy guide (Render, Railway, Atlas)
│   ├── FOLDER_STRUCTURE.md        # This file
│   └── Invenzaa-Postman-Collection.json
│
└── README.md
```
