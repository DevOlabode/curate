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

test('POST /api/v1/bookmarks requires authentication', async () => {
  const res = await request(app).post('/api/v1/bookmarks').send({ title: 'Docs', url: 'example.com' });
  assert.equal(res.status, 401);
});

test('an authenticated user can create a bookmark', async () => {
  const { token } = await registerUser(request, app);

  const res = await authed(token)(request(app).post('/api/v1/bookmarks')).send({
    title: 'Node docs',
    url: 'nodejs.org',
    tags: 'node, js',
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.bookmark.title, 'Node docs');
  assert.equal(res.body.bookmark.url, 'https://nodejs.org');
  assert.deepEqual(res.body.bookmark.tags, ['node', 'js']);
});

test('creating a bookmark without a title is rejected', async () => {
  const { token } = await registerUser(request, app);

  const res = await authed(token)(request(app).post('/api/v1/bookmarks')).send({ url: 'example.com' });

  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test('creating a bookmark without a url is rejected', async () => {
  const { token } = await registerUser(request, app);

  const res = await authed(token)(request(app).post('/api/v1/bookmarks')).send({ title: 'No URL' });

  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test('a user only sees their own bookmarks', async () => {
  const owner = await registerUser(request, app);
  const other = await registerUser(request, app);

  await authed(owner.token)(request(app).post('/api/v1/bookmarks')).send({
    title: 'Owner bookmark',
    url: 'example.com',
  });

  const ownerList = await authed(owner.token)(request(app).get('/api/v1/bookmarks'));
  assert.equal(ownerList.status, 200);
  assert.equal(ownerList.body.bookmarks.length, 1);

  const otherList = await authed(other.token)(request(app).get('/api/v1/bookmarks'));
  assert.equal(otherList.status, 200);
  assert.equal(otherList.body.bookmarks.length, 0);
});

test('a user cannot read another user\'s bookmark by id', async () => {
  const owner = await registerUser(request, app);
  const other = await registerUser(request, app);

  const created = await authed(owner.token)(request(app).post('/api/v1/bookmarks')).send({
    title: 'Private',
    url: 'example.com',
  });

  const res = await authed(other.token)(request(app).get(`/api/v1/bookmarks/${created.body.bookmark._id}`));
  assert.equal(res.status, 404);
});

test('an owner can update their bookmark', async () => {
  const { token } = await registerUser(request, app);

  const created = await authed(token)(request(app).post('/api/v1/bookmarks')).send({
    title: 'Old title',
    url: 'example.com',
  });

  const updated = await authed(token)(request(app).put(`/api/v1/bookmarks/${created.body.bookmark._id}`)).send({
    title: 'New title',
    url: 'example.com',
  });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.bookmark.title, 'New title');
});

test('updating a bookmark with invalid data is rejected', async () => {
  const { token } = await registerUser(request, app);

  const created = await authed(token)(request(app).post('/api/v1/bookmarks')).send({
    title: 'Title',
    url: 'example.com',
  });

  const updated = await authed(token)(request(app).put(`/api/v1/bookmarks/${created.body.bookmark._id}`)).send({
    title: '',
    url: 'example.com',
  });

  assert.equal(updated.status, 400);
});

test('a user cannot update another user\'s bookmark', async () => {
  const owner = await registerUser(request, app);
  const other = await registerUser(request, app);

  const created = await authed(owner.token)(request(app).post('/api/v1/bookmarks')).send({
    title: 'Owner bookmark',
    url: 'example.com',
  });

  const res = await authed(other.token)(request(app).put(`/api/v1/bookmarks/${created.body.bookmark._id}`)).send({
    title: 'Hijacked',
    url: 'example.com',
  });

  assert.equal(res.status, 404);
});

test('an owner can delete their bookmark', async () => {
  const { token } = await registerUser(request, app);

  const created = await authed(token)(request(app).post('/api/v1/bookmarks')).send({
    title: 'To delete',
    url: 'example.com',
  });

  const del = await authed(token)(request(app).delete(`/api/v1/bookmarks/${created.body.bookmark._id}`));
  assert.equal(del.status, 200);

  const getAfter = await authed(token)(request(app).get(`/api/v1/bookmarks/${created.body.bookmark._id}`));
  assert.equal(getAfter.status, 404);
});

test('a user cannot delete another user\'s bookmark', async () => {
  const owner = await registerUser(request, app);
  const other = await registerUser(request, app);

  const created = await authed(owner.token)(request(app).post('/api/v1/bookmarks')).send({
    title: 'Owner bookmark',
    url: 'example.com',
  });

  const res = await authed(other.token)(request(app).delete(`/api/v1/bookmarks/${created.body.bookmark._id}`));
  assert.equal(res.status, 404);
});

test('a malformed bookmark id is rejected without a 500', async () => {
  const { token } = await registerUser(request, app);

  const res = await authed(token)(request(app).get('/api/v1/bookmarks/not-an-id'));
  assert.equal(res.status, 404);
});
