import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

let app;
let mongodUri;

const accessSecret = 'test-access-secret';
const refreshSecret = 'test-refresh-secret';

let orgAId;
let viewerUserId;
let noSalesUserId;
let salesUserId;

let inventoryMedicineIds = {};
let inventoryBatchIds = {};

function signAccessToken(userId) {
  return jwt.sign({ id: userId }, accessSecret, { expiresIn: '1h' });
}

describe('Backend unit/integration tests', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_ACCESS_SECRET = accessSecret;
    process.env.JWT_REFRESH_SECRET = refreshSecret;

    // Import app after setting env so `env.js` picks up test values.
    ({ default: app } = await import('../src/app.js'));

    // Use the already-running local mongod (isolated per test run).
    mongodUri = `mongodb://127.0.0.1:27017/invenzaa_test_${Date.now()}`;
    process.env.MONGODB_URI = mongodUri;
    await mongoose.connect(mongodUri);

    const { Organization } = await import('../src/models/Organization.js');
    const { Role } = await import('../src/models/Role.js');
    const { User } = await import('../src/models/User.js');
    const { Medicine } = await import('../src/models/Medicine.js');
    const { Batch } = await import('../src/models/Batch.js');
    const { Sale } = await import('../src/models/Sale.js');
    const { Purchase } = await import('../src/models/Purchase.js');

    orgAId = (await Organization.create({ name: 'Org A' }))._id;

    // Seed roles (only what is required by the tests).
    await Role.create({
      name: 'Viewer',
      organization: orgAId,
      permissions: ['medicines', 'inventory', 'reports'],
      description: 'Read-only',
    });
    await Role.create({
      name: 'NoSales',
      organization: orgAId,
      permissions: ['medicines', 'inventory'],
      description: 'No sales access',
    });
    await Role.create({
      name: 'SalesAndPurchases',
      organization: orgAId,
      permissions: ['sales', 'purchases', 'inventory', 'medicines'],
      description: 'Sales + purchases',
    });

    const manufacturingDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
    const expiredDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const expiringSoonDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const lowStockDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const okDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    // Medicnes for inventory status calculations.
    const expiredMed = await Medicine.create({
      organization: orgAId,
      name: 'A-Expired',
      genericName: '',
      category: '',
      unit: 'pcs',
      minStockLevel: 10,
      prescriptionRequired: false,
      manufacturer: '',
    });
    const expiringSoonMed = await Medicine.create({
      organization: orgAId,
      name: 'B-Soon',
      genericName: '',
      category: '',
      unit: 'pcs',
      minStockLevel: 10,
      prescriptionRequired: false,
      manufacturer: '',
    });
    const lowStockMed = await Medicine.create({
      organization: orgAId,
      name: 'C-Low',
      genericName: '',
      category: '',
      unit: 'pcs',
      minStockLevel: 10,
      prescriptionRequired: false,
      manufacturer: '',
    });
    const okMed = await Medicine.create({
      organization: orgAId,
      name: 'D-Ok',
      genericName: '',
      category: '',
      unit: 'pcs',
      minStockLevel: 10,
      prescriptionRequired: false,
      manufacturer: '',
    });

    inventoryMedicineIds = {
      expiredMed: expiredMed._id,
      expiringSoonMed: expiringSoonMed._id,
      lowStockMed: lowStockMed._id,
      okMed: okMed._id,
    };

    // Batches: status is derived from expiry and non-expired total stock.
    const expiredBatch = await Batch.create({
      organization: orgAId,
      medicine: expiredMed._id,
      batchNo: 'EXP-1',
      quantity: 20,
      manufactureDate: manufacturingDate,
      expiryDate: expiredDate,
    });
    const soonBatch = await Batch.create({
      organization: orgAId,
      medicine: expiringSoonMed._id,
      batchNo: 'SOON-1',
      quantity: 20,
      manufactureDate: manufacturingDate,
      expiryDate: expiringSoonDate,
    });
    const lowBatch = await Batch.create({
      organization: orgAId,
      medicine: lowStockMed._id,
      batchNo: 'LOW-1',
      quantity: 5,
      manufactureDate: manufacturingDate,
      expiryDate: lowStockDate,
    });
    const okBatch = await Batch.create({
      organization: orgAId,
      medicine: okMed._id,
      batchNo: 'OK-1',
      quantity: 20,
      manufactureDate: manufacturingDate,
      expiryDate: okDate,
    });

    inventoryBatchIds = {
      expiredBatch: expiredBatch._id,
      soonBatch: soonBatch._id,
      lowBatch: lowBatch._id,
      okBatch: okBatch._id,
    };

    // Users for RBAC checks.
    viewerUserId = (
      await User.create({
        email: 'viewer@orga.com',
        password: 'TestPass123',
        firstName: 'Viewer',
        lastName: 'User',
        role: 'Viewer',
        organization: orgAId,
        status: 'active',
      })
    )._id;

    noSalesUserId = (
      await User.create({
        email: 'nosales@orga.com',
        password: 'TestPass123',
        firstName: 'No',
        lastName: 'Sales',
        role: 'NoSales',
        organization: orgAId,
        status: 'active',
      })
    )._id;

    salesUserId = (
      await User.create({
        email: 'sales@orga.com',
        password: 'TestPass123',
        firstName: 'Sales',
        lastName: 'User',
        role: 'SalesAndPurchases',
        organization: orgAId,
        status: 'active',
      })
    )._id;

    // Seed sales and purchases for search tests.
    await Sale.create({
      organization: orgAId,
      customerName: 'Parth Patel',
      totalAmount: 100,
      saleDate: new Date(),
      items: [
        {
          medicine: okMed._id,
          batch: okBatch._id,
          quantity: 1,
          unitPrice: 100,
          total: 100,
        },
      ],
    });
    await Sale.create({
      organization: orgAId,
      customerName: 'John Smith',
      totalAmount: 50,
      saleDate: new Date(),
      items: [
        {
          medicine: okMed._id,
          batch: okBatch._id,
          quantity: 1,
          unitPrice: 50,
          total: 50,
        },
      ],
    });

    await Purchase.create({
      organization: orgAId,
      supplierName: 'ACME Pharma',
      totalCost: 200,
      purchaseDate: new Date(),
      items: [
        {
          medicine: okMed._id,
          batch: okBatch._id,
          quantity: 2,
          unitCost: 100,
        },
      ],
    });
    await Purchase.create({
      organization: orgAId,
      supplierName: 'Global Supplies',
      totalCost: 80,
      purchaseDate: new Date(),
      items: [
        {
          medicine: okMed._id,
          batch: okBatch._id,
          quantity: 1,
          unitCost: 80,
        },
      ],
    });
    await Purchase.create({
      organization: orgAId,
      supplierName: '',
      totalCost: 30,
      purchaseDate: new Date(),
      items: [
        {
          medicine: okMed._id,
          batch: okBatch._id,
          quantity: 1,
          unitCost: 30,
        },
      ],
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('rejects requests when permission is missing', async () => {
    const token = signAccessToken(noSalesUserId);
    const res = await request(app)
      .get('/api/sales')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('enforces inventory pagination + summary counts', async () => {
    const token = signAccessToken(viewerUserId);

    const res = await request(app)
      .get('/api/inventory/status')
      .query({ page: 1, limit: 2, sort: 'name', order: 'asc' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.pagination.total).toBe(4);

    // Summary counts:
    // - expiredCount = expired batches with quantity > 0 => 1
    // - expiringSoonCount = within 30 days window => 1
    // - lowStockCount includes expired medicines because stockMap uses 0 for missing non-expired stock.
    expect(res.body.data.summary.expiredCount).toBe(1);
    expect(res.body.data.summary.expiringSoonCount).toBe(1);
    expect(res.body.data.summary.lowStockCount).toBe(2);
  });

  it('filters inventory status server-side', async () => {
    const token = signAccessToken(viewerUserId);

    const expiredRes = await request(app)
      .get('/api/inventory/status')
      .query({ filter: 'expired', page: 1, limit: 10 })
      .set('Authorization', `Bearer ${token}`);
    expect(expiredRes.status).toBe(200);
    expect(expiredRes.body.data.items).toHaveLength(1);
    expect(expiredRes.body.data.items[0].status).toBe('expired');

    const lowRes = await request(app)
      .get('/api/inventory/status')
      .query({ filter: 'low_stock', page: 1, limit: 10 })
      .set('Authorization', `Bearer ${token}`);
    expect(lowRes.status).toBe(200);
    expect(lowRes.body.data.items).toHaveLength(1);
    expect(lowRes.body.data.items[0].status).toBe('low_stock');
  });

  it('supports sales search + pagination', async () => {
    const token = signAccessToken(salesUserId);
    const res = await request(app)
      .get('/api/sales')
      .query({ q: 'parth', page: 1, limit: 10 })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sales).toHaveLength(1);
    expect(res.body.data.sales[0].customerName).toMatch(/Parth/i);
    expect(res.body.data.pagination.total).toBe(1);
  });

  it('supports purchases search + pagination', async () => {
    const token = signAccessToken(salesUserId);
    const res = await request(app)
      .get('/api/purchases')
      .query({ q: 'acme', page: 1, limit: 10 })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.purchases).toHaveLength(1);
    expect(res.body.data.purchases[0].supplierName).toMatch(/ACME/i);
    expect(res.body.data.pagination.total).toBe(1);
  });

  it('finds blank supplier purchases when searching General Supplier', async () => {
    const token = signAccessToken(salesUserId);
    const res = await request(app)
      .get('/api/purchases')
      .query({ q: 'General Supplier', page: 1, limit: 20 })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const blank = res.body.data.purchases.find((p) => !p.supplierName);
    expect(blank).toBeTruthy();
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('blocks admin-only endpoints for non-admin roles', async () => {
    const token = signAccessToken(viewerUserId);
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

