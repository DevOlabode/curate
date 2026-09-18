const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { connectTestDb, clearDatabase, disconnectTestDb } = require('../helpers/setup');
const { userPayload, registerUser } = require('../helpers/testUser');
const app = require('../../app');

test.before(connectTestDb);
test.beforeEach(clearDatabase);
test.after(disconnectTestDb);

test('GET /api/v1/health reports ok without auth', async () => {
  const res = await request(app).get('/api/v1/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('POST /api/v1/auth/register creates an account and returns a token', async () => {
  const payload = userPayload();
  const res = await request(app).post('/api/v1/auth/register').send(payload);

  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.username, payload.username);
  assert.equal(res.body.user.email, payload.email);
  assert.equal(res.body.user.password, undefined);
});

test('POST /api/v1/auth/register rejects a missing required field', async () => {
  const { password, ...incomplete } = userPayload();
  const res = await request(app).post('/api/v1/auth/register').send(incomplete);

  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test('POST /api/v1/auth/register rejects a duplicate username', async () => {
  const payload = userPayload();
  await request(app).post('/api/v1/auth/register').send(payload);

  const res = await request(app)
    .post('/api/v1/auth/register')
    .send(userPayload({ username: payload.username }));

  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test('POST /api/v1/auth/login succeeds with valid credentials', async () => {
  const { payload } = await registerUser(request, app);

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: payload.username, password: payload.password });

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.username, payload.username);
});

test('POST /api/v1/auth/login rejects an invalid password', async () => {
  const { payload } = await registerUser(request, app);

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: payload.username, password: 'wrong-password' });

  assert.equal(res.status, 401);
  assert.ok(res.body.error);
});

test('GET /api/v1/auth/me requires authentication', async () => {
  const res = await request(app).get('/api/v1/auth/me');
  assert.equal(res.status, 401);
});

test('GET /api/v1/auth/me returns the current user for a valid token', async () => {
  const { token, payload } = await registerUser(request, app);

  const res = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.user.username, payload.username);
});

test('GET /api/v1/auth/me rejects a malformed token', async () => {
  const res = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', 'Bearer not-a-real-token');

  assert.equal(res.status, 401);
});

test('DELETE /api/v1/auth/me removes the account', async () => {
  const { token } = await registerUser(request, app);

  const del = await request(app)
    .delete('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(del.status, 200);

  const me = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(me.status, 401);
});
