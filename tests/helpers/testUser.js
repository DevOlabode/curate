const crypto = require('crypto');

function uniqueSuffix() {
  return crypto.randomBytes(4).toString('hex');
}

function userPayload(overrides = {}) {
  const suffix = uniqueSuffix();
  return {
    username: `user_${suffix}`,
    password: 'correct-horse-battery',
    email: `user_${suffix}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  };
}

/** Registers a user through the real API and returns { token, user, payload }. */
async function registerUser(request, app, overrides = {}) {
  const payload = userPayload(overrides);
  const res = await request(app).post('/api/v1/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token, user: res.body.user, payload };
}

module.exports = { userPayload, registerUser };
