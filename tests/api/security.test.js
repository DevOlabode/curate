const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const request = require('supertest');
const mongoose = require('mongoose');

const { connectTestDb, clearDatabase, disconnectTestDb } = require('../helpers/setup');
const { registerUser, userPayload } = require('../helpers/testUser');
const User = require('../../models/user');
const { createResetToken } = require('../../utils/passwordReset');
const app = require('../../app');

test.before(connectTestDb);
test.beforeEach(clearDatabase);
test.after(disconnectTestDb);

const me = (token) => request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);

test('login is rate limited after 10 attempts', async () => {
  const attempt = () =>
    request(app).post('/api/v1/auth/login').send({ username: 'nobody', password: 'wrong-password' });

  for (let i = 0; i < 10; i += 1) {
    assert.equal((await attempt()).status, 401);
  }
  const blocked = await attempt();
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers['retry-after']) > 0);
  assert.ok(blocked.body.error);
});

test('registration is rate limited after 5 accounts per IP', async () => {
  for (let i = 0; i < 5; i += 1) {
    await registerUser(request, app);
  }
  const res = await request(app).post('/api/v1/auth/register').send(userPayload());
  assert.equal(res.status, 429);
});

test('forgot-password is rate limited after 3 requests for one email', async () => {
  const attempt = () =>
    request(app).post('/api/v1/auth/forgot-password').send({ email: 'Nobody@Example.com' });

  for (let i = 0; i < 3; i += 1) {
    assert.equal((await attempt()).status, 200);
  }
  assert.equal((await attempt()).status, 429);
});

test('changing the password revokes old tokens and returns a working new one', async () => {
  const { token, payload } = await registerUser(request, app);

  const res = await request(app)
    .put('/api/v1/auth/password')
    .set('Authorization', `Bearer ${token}`)
    .send({
      currentPassword: payload.password,
      newPassword: 'a-brand-new-password',
      confirmPassword: 'a-brand-new-password',
    });

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal((await me(token)).status, 401);
  assert.equal((await me(res.body.token)).status, 200);
});

test('resetting the password revokes old tokens', async () => {
  const { token, user } = await registerUser(request, app);
  const { token: resetToken, hashed } = createResetToken();
  await User.updateOne(
    { _id: user.id },
    { resetPasswordToken: hashed, resetPasswordExpires: new Date(Date.now() + 60_000) }
  );

  const res = await request(app).post('/api/v1/auth/reset-password').send({
    token: resetToken,
    password: 'a-brand-new-password',
    confirmPassword: 'a-brand-new-password',
  });

  assert.equal(res.status, 200);
  assert.equal((await me(token)).status, 401);
});

test('health reports ok when the database answers', async () => {
  const res = await request(app).get('/api/v1/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('health returns 503 when the database does not answer', async (t) => {
  t.mock.method(mongoose.connection.db, 'admin', () => ({
    ping: () => Promise.reject(new Error('down')),
  }));
  const res = await request(app).get('/api/v1/health');
  assert.equal(res.status, 503);
  assert.equal(res.body.ok, false);
});

test('the old web library routes are gone', async () => {
  for (const route of ['/bookmark', '/collections', '/login', '/signup', '/user/info']) {
    const res = await request(app).get(route);
    assert.equal(res.status, 302, route);
    assert.equal(res.headers.location, '/', route);
  }
});

test('the password reset pages still render', async () => {
  const res = await request(app).get('/forgot-password');
  assert.equal(res.status, 200);
  assert.match(res.text, /Forgot password/);
});

test('the app refuses to start in production without secrets', () => {
  const result = spawnSync(process.execPath, ['-e', "require('./app')"], {
    cwd: path.join(__dirname, '../..'),
    env: { PATH: process.env.PATH, NODE_ENV: 'production' },
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SESSION_SECRET must be set in production/);
});
