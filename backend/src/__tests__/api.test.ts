import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { ServiceCatalog } from '../models/ServiceCatalog.js';
import { convertCurrency } from '../services/currency.js';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

describe('KYS PRD Acceptance Tests', () => {
  let userToken: string;
  let userId: string;
  let otherUserToken: string;
  let adminToken: string;
  let testSubscriptionId: string;

  test('1. User Registration & Authentication (P0)', async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Test Consumer',
      email: 'consumer@example.com',
      password: 'password123',
      preferredCurrency: 'USD',
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.token).toBeDefined();
    expect(regRes.body.user.role).toBe('user');

    userToken = regRes.body.token;
    userId = regRes.body.user.id;

    // Login check
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'consumer@example.com',
      password: 'password123',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    // Register second user for privacy/isolation tests
    const otherRes = await request(app).post('/api/auth/register').send({
      name: 'Other Person',
      email: 'other@example.com',
      password: 'password123',
    });
    otherUserToken = otherRes.body.token;

    // Create an Admin user directly in DB
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      passwordHash: 'hashed',
      role: 'admin',
    });

    adminToken = jwt.sign(
      { id: adminUser._id, email: adminUser.email, role: 'admin' },
      process.env.JWT_SECRET || 'kys_super_secret_jwt_key_2026'
    );
    expect(adminToken).toBeDefined();
  });

  test('2. Service Catalog (P0)', async () => {
    await ServiceCatalog.create({
      name: 'Netflix',
      category: 'Entertainment',
      suggestedPrice: 23,
      currency: 'USD',
      billingFrequency: 'Monthly',
      isActive: true,
    });

    const res = await request(app).get('/api/catalog');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.services.length).toBeGreaterThan(0);
    expect(res.body.disclaimer).toBeDefined();
  });

  test('3. Subscription CRUD & Calculations (P0)', async () => {
    // Create subscription
    const createRes = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        serviceName: 'Netflix',
        category: 'Entertainment',
        amount: 23.0,
        currency: 'USD',
        billingFrequency: 'Monthly',
        startDate: '2026-01-01',
        nextRenewalDate: '2026-11-12',
        status: 'Active',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.subscription.serviceName).toBe('Netflix');
    expect(createRes.body.monthlyEquivalent).toBe(23.0);
    testSubscriptionId = createRes.body.subscription._id;

    // View subscription
    const getRes = await request(app)
      .get(`/api/subscriptions/${testSubscriptionId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.subscription.amount).toBe(23.0);

    // Update subscription
    const putRes = await request(app)
      .put(`/api/subscriptions/${testSubscriptionId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 25.0 });
    expect(putRes.status).toBe(200);
    expect(putRes.body.subscription.amount).toBe(25.0);

    // Pause subscription
    const pauseRes = await request(app)
      .patch(`/api/subscriptions/${testSubscriptionId}/pause`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(pauseRes.status).toBe(200);
    expect(pauseRes.body.subscription.status).toBe('Paused');

    // Resume subscription
    const resumeRes = await request(app)
      .patch(`/api/subscriptions/${testSubscriptionId}/resume`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ nextRenewalDate: '2026-11-15' });
    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.subscription.status).toBe('Active');
  });

  test('4. Privacy & Isolation: Users cannot access another user records (P0/Security)', async () => {
    const unauthorizedGet = await request(app)
      .get(`/api/subscriptions/${testSubscriptionId}`)
      .set('Authorization', `Bearer ${otherUserToken}`);

    expect(unauthorizedGet.status).toBe(404);
  });

  test('5. Analytics Aggregations (P1)', async () => {
    const analyticsRes = await request(app)
      .get('/api/analytics')
      .set('Authorization', `Bearer ${userToken}`);

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.success).toBe(true);
    expect(analyticsRes.body.data.monthlySpending).toBe(25.0);
    expect(analyticsRes.body.data.annualProjection).toBe(300.0);
    expect(analyticsRes.body.data.categoryDistribution.length).toBeGreaterThan(0);
    expect(analyticsRes.body.data.historicalTrends.length).toBe(12);
  });

  test('6. RBAC: Admin Dashboard restricted to Admin accounts (P2)', async () => {
    // Regular user attempt
    const forbiddenRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbiddenRes.status).toBe(403);

    // Authorized admin attempt
    const adminRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.data.totalUsers).toBeDefined();
    expect(adminRes.body.data.activeSubscriptions).toBeDefined();
  });

  test('7. Validation Edge Cases: Rejects invalid inputs (P1/Resilience)', async () => {
    // Negative amount
    const negRes = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        serviceName: 'Invalid Price Service',
        amount: -15,
        startDate: '2026-11-01',
        nextRenewalDate: '2026-12-01',
      });
    expect(negRes.status).toBe(400);
    expect(negRes.body.message).toMatch(/greater than zero/i);

    // Missing service name
    const missingNameRes = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: 20,
        startDate: '2026-11-01',
        nextRenewalDate: '2026-12-01',
      });
    expect(missingNameRes.status).toBe(400);

    // Renewal date prior to start date
    const badDateRes = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        serviceName: 'Time Traveler Service',
        amount: 10,
        startDate: '2026-12-01',
        nextRenewalDate: '2026-11-01',
      });
    expect(badDateRes.status).toBe(400);
    expect(badDateRes.body.message).toMatch(/cannot be before start date/i);
  });

  test('8. Authentication Resilience: Rejects missing and corrupted tokens (P1/Security)', async () => {
    const noTokenRes = await request(app).get('/api/subscriptions');
    expect(noTokenRes.status).toBe(401);

    const badTokenRes = await request(app)
      .get('/api/subscriptions')
      .set('Authorization', 'Bearer invalid.token.payload');
    expect(badTokenRes.status).toBe(401);
  });

  test('9. Multi-Currency Conversion Resilience (P1/Business Logic)', () => {
    // USD to EUR ($100 -> €92)
    expect(convertCurrency(100, 'USD', 'EUR')).toBe(92);

    // EUR to USD (€92 -> ~$100)
    expect(Math.round(convertCurrency(92, 'EUR', 'USD'))).toBe(100);

    // Same currency identity
    expect(convertCurrency(50, 'USD', 'USD')).toBe(50);

    // Unknown currency gracefully defaults without throwing
    expect(convertCurrency(75, 'XYZ', 'USD')).toBe(75);
    expect(convertCurrency(0, 'USD', 'EUR')).toBe(0);
  });

  test('10. Data Export: Generates RFC 4180 CSV export (PRD Section 3.4)', async () => {
    const csvRes = await request(app)
      .get('/api/subscriptions/export/csv')
      .set('Authorization', `Bearer ${userToken}`);

    expect(csvRes.status).toBe(200);
    expect(csvRes.headers['content-type']).toMatch(/text\/csv/);
    expect(csvRes.headers['content-disposition']).toMatch(/kys-subscriptions\.csv/);
    expect(csvRes.text).toContain('Service Name,Category,Amount,Currency,Billing Frequency');
  });

  test('11. Interactive Historical Analytics: Computes past months paid vs pending breakdowns', async () => {
    const res = await request(app)
      .get('/api/analytics')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.monthlyBreakdowns)).toBe(true);
    expect(res.body.data.monthlyBreakdowns.length).toBe(12);

    const latestMonth = res.body.data.monthlyBreakdowns[res.body.data.monthlyBreakdowns.length - 1];
    expect(latestMonth).toHaveProperty('month');
    expect(latestMonth).toHaveProperty('year');
    expect(latestMonth).toHaveProperty('totalPaid');
    expect(latestMonth).toHaveProperty('totalPending');
    expect(latestMonth).toHaveProperty('items');
    expect(Array.isArray(latestMonth.items)).toBe(true);
  });

  test('12. Security Verification: ReDoS search regex escaping & IDOR isolation', async () => {
    // 1. ReDoS attempt in search: regex special characters should be safely escaped without server crash
    const searchRes = await request(app)
      .get('/api/subscriptions?search=(a+)+$')
      .set('Authorization', `Bearer ${userToken}`);
    expect(searchRes.status).toBe(200);
    expect(Array.isArray(searchRes.body.data)).toBe(true);

    // 2. IDOR check: Attempting to access invalid/foreign subscription ID returns 404 or 400
    const foreignIdRes = await request(app)
      .get('/api/subscriptions/000000000000000000000000')
      .set('Authorization', `Bearer ${userToken}`);
    expect(foreignIdRes.status).toBe(404);

    // 3. Admin Lockdown: Normal user token gets 403 on admin dashboard
    const adminRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    expect(adminRes.status).toBe(403);
  });
});
