const test = require('node:test');
const assert = require('node:assert/strict');

const { checkEnv, dbNameFromUri } = require('../../config/env');
const { canDeliver } = require('../../utils/mailer');

const prod = {
  NODE_ENV: 'production',
  APP_ENV: 'production',
  JWT_SECRET: 'j',
  MONGO_URI: 'mongodb+srv://u:p@cluster.example.net/curate_prod?retryWrites=true',
};

test('dbNameFromUri reads the database name, defaulting to "test"', () => {
  assert.equal(dbNameFromUri('mongodb+srv://u:p@h.net/curate_prod?x=1'), 'curate_prod');
  assert.equal(dbNameFromUri('mongodb://localhost:27017/curate_dev?directConnection=true'), 'curate_dev');
  assert.equal(dbNameFromUri('mongodb+srv://u:p@h.net/'), 'test');
  assert.equal(dbNameFromUri('mongodb+srv://u:p@h.net'), 'test');
});

test('a correct production config passes', () => {
  assert.equal(checkEnv(prod), 'production');
});

test('every missing production variable is reported at once', () => {
  assert.throws(
    () => checkEnv({ NODE_ENV: 'production' }),
    /Missing environment variables: APP_ENV, MONGO_URI, JWT_SECRET/
  );
});

test('staging refuses the production database', () => {
  assert.throws(
    () => checkEnv({ ...prod, APP_ENV: 'staging' }),
    /APP_ENV=staging must use database curate_staging/
  );
});

test('production refuses the staging database', () => {
  assert.throws(
    () => checkEnv({ ...prod, MONGO_URI: 'mongodb+srv://u:p@h.net/curate_staging' }),
    /APP_ENV=production must use database/
  );
});

test('local development refuses deployed databases, including an unnamed one', () => {
  for (const uri of ['mongodb+srv://u:p@h.net/curate_prod', 'mongodb+srv://u:p@h.net/']) {
    assert.throws(() => checkEnv({ MONGO_URI: uri }), /must not use a deployed database/);
  }
  assert.equal(checkEnv({ MONGO_URI: 'mongodb://localhost:27017/curate_dev' }), 'development');
});

test('an unknown APP_ENV is rejected', () => {
  assert.throws(() => checkEnv({ APP_ENV: 'prod' }), /APP_ENV must be one of/);
});

test('outside production, email only goes to the allowlist', () => {
  const env = { APP_ENV: 'staging', STAGING_EMAIL_ALLOWLIST: '@curate.dev, me@example.com' };
  assert.equal(canDeliver('qa@curate.dev', env), true);
  assert.equal(canDeliver('Me@Example.com', env), true);
  assert.equal(canDeliver('real.user@gmail.com', env), false);
  assert.equal(canDeliver('real.user@gmail.com', { APP_ENV: 'staging' }), false);
  assert.equal(canDeliver('real.user@gmail.com', { APP_ENV: 'production' }), true);
});
