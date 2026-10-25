#!/usr/bin/env node
// Applies migrations/NNN-*.js in order and records each in the `migrations` collection.
// Expand/contract only: a migration adds fields or indexes the current code can live with.
//
//   APP_ENV=staging MONGO_URI=... node scripts/migrate.js [--dry-run]

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { checkEnv } = require('../config/env');

const DIR = path.join(__dirname, '../migrations');

async function main() {
  const env = checkEnv();
  const dryRun = process.argv.includes('--dry-run');
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  const { db } = mongoose.connection;
  console.log(`[migrate] ${env} → database "${db.databaseName}"${dryRun ? ' (dry run)' : ''}`);

  const applied = new Set((await db.collection('migrations').find().toArray()).map((m) => m._id));
  const pending = fs.readdirSync(DIR).filter((f) => f.endsWith('.js') && !applied.has(f)).sort();

  for (const file of pending) {
    console.log(`[migrate] ${dryRun ? 'would apply' : 'applying'} ${file}`);
    if (dryRun) continue;
    await require(path.join(DIR, file)).up(db);
    await db.collection('migrations').insertOne({ _id: file, appliedAt: new Date() });
  }
  console.log(`[migrate] done: ${pending.length} pending, ${applied.size} already applied`);
}

main()
  .catch((err) => {
    console.error('[migrate] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
