// Startup checks that stop a misconfigured deploy before it can touch the wrong data.

const APP_ENVS = ['production', 'staging', 'development', 'test'];
const REQUIRED_IN_PRODUCTION = ['APP_ENV', 'MONGO_URI', 'JWT_SECRET'];

// Databases each deployed environment may use.
// ponytail: 'test' is production's current database (Mongo's default); remove it once production moves to curate_prod.
const ALLOWED_DATABASES = {
  production: ['curate_prod', 'test'],
  staging: ['curate_staging'],
};
const DEPLOYED_DATABASES = ['curate_prod', 'curate_staging', 'test'];

function dbNameFromUri(uri) {
  const match = /^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/.exec(uri || '');
  return (match && match[1]) || 'test'; // MongoDB uses "test" when the URI names no database
}

function appEnv(env = process.env) {
  return env.APP_ENV || 'development';
}

/** Throws one error listing every problem, so a broken deploy shows all of them at once. */
function checkEnv(env = process.env) {
  const problems = [];
  const name = appEnv(env);

  if (env.NODE_ENV === 'production') {
    const missing = REQUIRED_IN_PRODUCTION.filter((key) => !env[key]);
    if (missing.length) problems.push(`Missing environment variables: ${missing.join(', ')}`);
  }

  if (!APP_ENVS.includes(name)) {
    problems.push(`APP_ENV must be one of ${APP_ENVS.join(', ')} (got "${name}")`);
  } else if (name !== 'test' && env.MONGO_URI) {
    const db = dbNameFromUri(env.MONGO_URI);
    const allowed = ALLOWED_DATABASES[name];
    if (allowed ? !allowed.includes(db) : DEPLOYED_DATABASES.includes(db)) {
      problems.push(
        allowed
          ? `APP_ENV=${name} must use database ${allowed.join(' or ')} (MONGO_URI points at "${db}")`
          : `APP_ENV=${name} must not use a deployed database (MONGO_URI points at "${db}"). Name a local database, e.g. curate_dev.`
      );
    }
  }

  if (problems.length) {
    throw new Error(`Refusing to start:\n- ${problems.join('\n- ')}`);
  }
  return name;
}

module.exports = { checkEnv, appEnv, dbNameFromUri };
