/**
 * Test environment + database helpers.
 *
 * Tests run against a real, throwaway MongoDB started in-process by
 * mongodb-memory-server, so contributors don't need MongoDB installed
 * or running to test the API, and nothing ever touches dev/production data.
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

async function connectTestDb() {
  if (mongoose.connection.readyState !== 0) return;
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

async function clearDatabase() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

async function disconnectTestDb() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

module.exports = { connectTestDb, clearDatabase, disconnectTestDb };
