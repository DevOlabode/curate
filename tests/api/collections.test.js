const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { connectTestDb, clearDatabase, disconnectTestDb } = require('../helpers/setup');
const { registerUser } = require('../helpers/testUser');
const app = require('../../app');

test.before(connectTestDb);
test.beforeEach(clearDatabase);
test.after(disconnectTestDb);

function authed(token) {
  return (req) => req.set('Authorization', `Bearer ${token}`);
}

test('POST /api/v1/collections requires authentication', async () => {
  const res = await request(app).post('/api/v1/collections').send({ name: 'Reading list' });
  assert.equal(res.status, 401);
});

test('an authenticated user can create a collection', async () => {
  const { token } = await registerUser(request, app);

  const res = await authed(token)(request(app).post('/api/v1/collections')).send({ name: 'Reading list' });

  assert.equal(res.status, 201);
  assert.equal(res.body.collection.name, 'Reading list');
});

test('creating a collection without a name is rejected', async () => {
  const { token } = await registerUser(request, app);

  const res = await authed(token)(request(app).post('/api/v1/collections')).send({ description: 'no name' });

  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test('a user only sees their own collections', async () => {
  const owner = await registerUser(request, app);
  const other = await registerUser(request, app);

  await authed(owner.token)(request(app).post('/api/v1/collections')).send({ name: 'Owner list' });

  const ownerList = await authed(owner.token)(request(app).get('/api/v1/collections'));
  assert.equal(ownerList.body.collections.length, 1);

  const otherList = await authed(other.token)(request(app).get('/api/v1/collections'));
  assert.equal(otherList.body.collections.length, 0);
});

test('a user cannot read another user\'s collection by id', async () => {
  const owner = await registerUser(request, app);
  const other = await registerUser(request, app);

  const created = await authed(owner.token)(request(app).post('/api/v1/collections')).send({ name: 'Private' });

  const res = await authed(other.token)(request(app).get(`/api/v1/collections/${created.body.collection._id}`));
  assert.equal(res.status, 404);
});

test('an owner can update their collection', async () => {
  const { token } = await registerUser(request, app);

  const created = await authed(token)(request(app).post('/api/v1/collections')).send({ name: 'Old name' });

  const updated = await authed(token)(request(app).put(`/api/v1/collections/${created.body.collection._id}`)).send({
    name: 'New name',
  });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.collection.name, 'New name');
});

test('a user cannot update another user\'s collection', async () => {
  const owner = await registerUser(request, app);
  const other = await registerUser(request, app);

  const created = await authed(owner.token)(request(app).post('/api/v1/collections')).send({ name: 'Owner list' });

  const res = await authed(other.token)(request(app).put(`/api/v1/collections/${created.body.collection._id}`)).send({
    name: 'Hijacked',
  });

  assert.equal(res.status, 404);
});

test('an owner can delete their collection', async () => {
  const { token } = await registerUser(request, app);

  const created = await authed(token)(request(app).post('/api/v1/collections')).send({ name: 'To delete' });

  const del = await authed(token)(request(app).delete(`/api/v1/collections/${created.body.collection._id}`));
  assert.equal(del.status, 200);

  const getAfter = await authed(token)(request(app).get(`/api/v1/collections/${created.body.collection._id}`));
  assert.equal(getAfter.status, 404);
});

test('a user cannot delete another user\'s collection', async () => {
  const owner = await registerUser(request, app);
  const other = await registerUser(request, app);

  const created = await authed(owner.token)(request(app).post('/api/v1/collections')).send({ name: 'Owner list' });

  const res = await authed(other.token)(request(app).delete(`/api/v1/collections/${created.body.collection._id}`));
  assert.equal(res.status, 404);
});

test('adding a bookmark to a collection links it back to the collection', async () => {
  const { token } = await registerUser(request, app);

  const collection = await authed(token)(request(app).post('/api/v1/collections')).send({ name: 'Reading list' });

  const res = await authed(token)(
    request(app).post(`/api/v1/collections/${collection.body.collection._id}/bookmarks`)
  ).send({ title: 'Article', url: 'example.com' });

  assert.equal(res.status, 201);
  assert.equal(res.body.bookmark.collection, collection.body.collection._id);
});

test('a user cannot add a bookmark to another user\'s collection', async () => {
  const owner = await registerUser(request, app);
  const other = await registerUser(request, app);

  const collection = await authed(owner.token)(request(app).post('/api/v1/collections')).send({ name: 'Owner list' });

  const res = await authed(other.token)(
    request(app).post(`/api/v1/collections/${collection.body.collection._id}/bookmarks`)
  ).send({ title: 'Article', url: 'example.com' });

  assert.equal(res.status, 404);
});
