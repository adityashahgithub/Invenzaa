import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const accessSecret = 'test-access-secret';

function signAccessToken(userId) {
  return jwt.sign({ id: userId }, accessSecret, { expiresIn: '1h' });
}

describe('Collaboration accept (responder medicine match)', () => {
  let app;
  let mongodUri;
  let orgBUserId;
  let collabRequestId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_ACCESS_SECRET = accessSecret;
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    ({ default: app } = await import('../src/app.js'));

    mongodUri = `mongodb://127.0.0.1:27017/invenzaa_collab_${Date.now()}`;
    process.env.MONGODB_URI = mongodUri;
    await mongoose.connect(mongodUri);

    const { Organization } = await import('../src/models/Organization.js');
    const { User } = await import('../src/models/User.js');
    const { Medicine } = await import('../src/models/Medicine.js');
    const { Batch } = await import('../src/models/Batch.js');
    const { CollaborationRequest } = await import('../src/models/CollaborationRequest.js');

    const orgAId = (await Organization.create({ name: 'Org A Collab' }))._id;
    const orgBId = (await Organization.create({ name: 'Org B Collab' }))._id;

    const ownerAId = (
      await User.create({
        email: `owner-a-${Date.now()}@test.com`,
        password: 'TestPass123',
        firstName: 'Owner',
        lastName: 'A',
        role: 'Owner',
        organization: orgAId,
        status: 'active',
      })
    )._id;

    orgBUserId = (
      await User.create({
        email: `owner-b-${Date.now()}@test.com`,
        password: 'TestPass123',
        firstName: 'Owner',
        lastName: 'B',
        role: 'Owner',
        organization: orgBId,
        status: 'active',
      })
    )._id;

    const medA = await Medicine.create({
      organization: orgAId,
      name: 'Cough Syrup',
      genericName: 'Dextromethorphan + Chlorpheniramine',
      category: 'Cough',
      unit: 'bottles',
      minStockLevel: 10,
      prescriptionRequired: false,
      manufacturer: '',
    });

    const medB = await Medicine.create({
      organization: orgBId,
      name: 'Cough Syrup',
      genericName: '',
      category: 'Cough',
      unit: 'bottles',
      minStockLevel: 10,
      prescriptionRequired: false,
      manufacturer: '',
    });

    const manufacturingDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
    const futureExpiry = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000);

    await Batch.create({
      organization: orgBId,
      medicine: medB._id,
      batchNo: 'B-CS-1',
      quantity: 20,
      manufactureDate: manufacturingDate,
      expiryDate: futureExpiry,
    });

    const cr = await CollaborationRequest.create({
      fromOrganization: orgAId,
      toOrganization: orgBId,
      medicine: medA._id,
      quantity: 12,
      message: 'Need Urgent Support',
      status: 'pending',
      createdBy: ownerAId,
    });
    collabRequestId = cr._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('accepts when requester has genericName but responder catalog has empty genericName', async () => {
    const token = signAccessToken(orgBUserId);
    const res = await request(app)
      .post('/api/collaboration/responses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        requestId: collabRequestId,
        status: 'accepted',
        quantityOffered: 10,
        message: '',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
