const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const { connectTestDb, disconnectTestDb } = require('../helpers/setup');
const indexes = require('../../migrations/001-indexes');

test.before(connectTestDb);
test.after(disconnectTestDb);

test('001-indexes creates the indexes and can run twice', async () => {
  const { db } = mongoose.connection;
  await indexes.up(db);
  await indexes.up(db);

  const names = async (name) => (await db.collection(name).indexes()).map((i) => JSON.stringify(i.key));
  assert.ok((await names('bookmarks')).includes('{"user":1,"createdAt":-1}'));
  assert.ok((await names('collections')).includes('{"owner":1}'));
  assert.ok((await names('ratelimithits')).includes('{"expiresAt":1}'));
});
