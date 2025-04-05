const request = require('supertest');
const app = require('../server/index');

describe('Events API', () => {
  let token;
  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    token = res.body.token;
  });

  it('should create an event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Test Event')
      .field('date_time', '2025-05-01T12:00:00')
      .field('location', 'Online')
      .field('category', 'Gaming');
    expect(res.statusCode).toBe(201);
  });

  it('should prevent duplicate event titles', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Test Event')
      .field('date_time', '2025-05-02T12:00:00')
      .field('location', 'Online')
      .field('category', 'Gaming');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Event title already exists');
  });
});