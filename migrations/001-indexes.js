// Indexes added in Phase 0. createIndex is a no-op when the index already exists.
module.exports.up = async (db) => {
  await db.collection('bookmarks').createIndex({ user: 1, createdAt: -1 });
  await db.collection('collections').createIndex({ owner: 1 });
  await db.collection('ratelimithits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
};
