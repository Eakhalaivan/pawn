import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import createApp from '../../src/app.js';
import prisma from '../../src/config/database.js';

describe('Auth Integration Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await app.ready();
    await prisma.user.deleteMany();
  });

  it('POST /api/auth/register - should create a new customer', async () => {
    const res = await request(app.server)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        phone: '9876543210'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('test@example.com');
  });

  it('POST /api/auth/login - should return tokens and set cookie', async () => {
    const res = await request(app.server)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('refreshToken');
  });

  it('POST /api/auth/login - should fail with wrong password', async () => {
    const res = await request(app.server)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
