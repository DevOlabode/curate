const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PRODUCTION = 'https://curate-h0ga.onrender.com';
const DEVELOPMENT = 'http://localhost:3000';
const LEGACY = 'https://developer-bookmark-vault-5.onrender.com';

let apiUrl;

test.before(async () => {
  apiUrl = await import('../../src/shared/apiUrl.js');
});

test('sanitizeApiBaseUrl rejects an empty value', () => {
  const result = apiUrl.sanitizeApiBaseUrl('   ');
  assert.equal(result.ok, false);
  assert.match(result.error, /https:\/\/ or http:\/\//);
});

test('sanitizeApiBaseUrl rejects a URL without a scheme', () => {
  const result = apiUrl.sanitizeApiBaseUrl('curate.example.com');
  assert.equal(result.ok, false);
  assert.match(result.error, /full URL with a scheme/);
});

test('sanitizeApiBaseUrl rejects javascript: and other schemes', () => {
  assert.equal(apiUrl.sanitizeApiBaseUrl('javascript:alert(1)').ok, false);
  assert.equal(apiUrl.sanitizeApiBaseUrl('data:text/plain,hi').ok, false);
  assert.equal(apiUrl.sanitizeApiBaseUrl('file:///etc/passwd').ok, false);
});

test('sanitizeApiBaseUrl rejects credentials, fragments, queries, and wildcards', () => {
  assert.equal(apiUrl.sanitizeApiBaseUrl('https://user:pass@example.com').ok, false);
  assert.equal(apiUrl.sanitizeApiBaseUrl('https://example.com/#frag').ok, false);
  assert.equal(apiUrl.sanitizeApiBaseUrl('https://example.com/?q=1').ok, false);
  assert.equal(apiUrl.sanitizeApiBaseUrl('https://*.example.com').ok, false);
  assert.equal(apiUrl.sanitizeApiBaseUrl('https://example.com/*').ok, false);
});

test('sanitizeApiBaseUrl rejects http:// for non-loopback hosts', () => {
  const result = apiUrl.sanitizeApiBaseUrl('http://curate.example.com');
  assert.equal(result.ok, false);
  assert.match(result.error, /https:\/\//);
});

test('sanitizeApiBaseUrl accepts loopback http and any https host', () => {
  assert.deepEqual(apiUrl.sanitizeApiBaseUrl('http://localhost:4000'), {
    ok: true,
    url: 'http://localhost:4000',
    origin: 'http://localhost:4000',
  });
  assert.equal(apiUrl.sanitizeApiBaseUrl('http://127.0.0.1:3000').ok, true);
  assert.equal(apiUrl.sanitizeApiBaseUrl('http://[::1]:3000').ok, true);
  assert.deepEqual(apiUrl.sanitizeApiBaseUrl('https://curate.example.com/'), {
    ok: true,
    url: 'https://curate.example.com',
    origin: 'https://curate.example.com',
  });
});

test('sanitizeApiBaseUrl keeps a path prefix and strips a trailing slash', () => {
  const result = apiUrl.sanitizeApiBaseUrl('https://example.com/curate/');
  assert.deepEqual(result, {
    ok: true,
    url: 'https://example.com/curate',
    origin: 'https://example.com',
  });
});

test('sanitizeApiBaseUrl locks production to the hosted default', () => {
  const result = apiUrl.sanitizeApiBaseUrl('https://curate.example.com', {
    environment: 'production',
  });
  assert.equal(result.ok, true);
  assert.equal(result.url, PRODUCTION);
});

test('sanitizeApiBaseUrl rejects a remote host in development', () => {
  const result = apiUrl.sanitizeApiBaseUrl('https://curate.example.com', {
    environment: 'development',
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /localhost/);
});

test('toHostPermissionPattern is origin-scoped', () => {
  assert.equal(
    apiUrl.toHostPermissionPattern('https://curate.example.com/curate'),
    'https://curate.example.com/*'
  );
  assert.equal(
    apiUrl.toHostPermissionPattern('http://127.0.0.1:4000'),
    'http://127.0.0.1:4000/*'
  );
});

test('needsOptionalHostPermission is false only for builtin origins', () => {
  assert.equal(apiUrl.needsOptionalHostPermission(PRODUCTION), false);
  assert.equal(apiUrl.needsOptionalHostPermission(DEVELOPMENT), false);
  assert.equal(apiUrl.needsOptionalHostPermission('http://localhost:4000'), true);
  assert.equal(apiUrl.needsOptionalHostPermission('https://curate.example.com'), true);
});

test('resolveStoredApiConfig defaults an empty store to production and persists the migration flag', () => {
  const resolved = apiUrl.resolveStoredApiConfig({});
  assert.equal(resolved.environment, 'production');
  assert.equal(resolved.apiBaseUrl, PRODUCTION);
  assert.equal(resolved.shouldPersist, true);
  assert.equal(resolved.persist.apiHostMigratedToRender, true);
  assert.equal(resolved.persist.apiBaseUrl, PRODUCTION);
});

test('resolveStoredApiConfig migrates a legacy host to production', () => {
  const resolved = apiUrl.resolveStoredApiConfig({
    apiHostMigratedToRender: false,
    environment: 'production',
    apiBaseUrl: LEGACY,
  });
  assert.equal(resolved.environment, 'production');
  assert.equal(resolved.apiBaseUrl, PRODUCTION);
});

test('resolveStoredApiConfig promotes a custom production URL to selfhosted', () => {
  const resolved = apiUrl.resolveStoredApiConfig({
    apiHostMigratedToRender: true,
    environment: 'production',
    apiBaseUrl: 'https://curate.example.com/',
  });
  assert.equal(resolved.environment, 'selfhosted');
  assert.equal(resolved.apiBaseUrl, 'https://curate.example.com');
  assert.equal(resolved.persist.environment, 'selfhosted');
});

test('resolveStoredApiConfig promotes a localhost production URL to development', () => {
  const resolved = apiUrl.resolveStoredApiConfig({
    apiHostMigratedToRender: true,
    environment: 'production',
    apiBaseUrl: 'http://127.0.0.1:3000',
  });
  assert.equal(resolved.environment, 'development');
  assert.equal(resolved.apiBaseUrl, 'http://127.0.0.1:3000');
});

test('resolveStoredApiConfig keeps a valid self-hosted URL', () => {
  const resolved = apiUrl.resolveStoredApiConfig({
    apiHostMigratedToRender: true,
    environment: 'selfhosted',
    apiBaseUrl: 'https://curate.example.com',
  });
  assert.equal(resolved.shouldPersist, false);
  assert.equal(resolved.environment, 'selfhosted');
  assert.equal(resolved.apiBaseUrl, 'https://curate.example.com');
});

test('resolveStoredApiConfig falls back when a self-hosted URL is invalid', () => {
  const resolved = apiUrl.resolveStoredApiConfig({
    apiHostMigratedToRender: true,
    environment: 'selfhosted',
    apiBaseUrl: 'http://192.168.1.10:3000',
  });
  assert.equal(resolved.environment, 'production');
  assert.equal(resolved.apiBaseUrl, PRODUCTION);
});

test('resolveStoredApiConfig does not rewrite a settled production install', () => {
  const resolved = apiUrl.resolveStoredApiConfig({
    apiHostMigratedToRender: true,
    environment: 'production',
    apiBaseUrl: PRODUCTION,
  });
  assert.equal(resolved.shouldPersist, false);
  assert.deepEqual(resolved.persist, {});
});

test('resolveStoredApiConfig resets a remote URL stored as development', () => {
  const resolved = apiUrl.resolveStoredApiConfig({
    apiHostMigratedToRender: true,
    environment: 'development',
    apiBaseUrl: 'https://curate.example.com',
  });
  assert.equal(resolved.environment, 'development');
  assert.equal(resolved.apiBaseUrl, DEVELOPMENT);
});

test('manifest keeps default host access narrow and lists optional hosts', () => {
  const manifestPath = path.join(__dirname, '../../extension/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const broad = ['<all_urls>', '*://*/*', 'http://*/*', 'https://*/*'];

  assert.ok(Array.isArray(manifest.host_permissions));
  assert.ok(manifest.host_permissions.every((pattern) => !broad.includes(pattern)));
  assert.ok(manifest.host_permissions.includes('https://curate-h0ga.onrender.com/*'));
  assert.ok(manifest.host_permissions.includes('http://localhost:3000/*'));

  assert.ok(Array.isArray(manifest.optional_host_permissions));
  assert.ok(manifest.optional_host_permissions.includes('https://*/*'));
  assert.ok(manifest.optional_host_permissions.includes('http://localhost:*/*'));

  const csp = manifest.content_security_policy.extension_pages;
  assert.match(csp, /script-src 'self'/);
  assert.match(csp, /connect-src[^;]*https:/);
  assert.doesNotMatch(csp, /connect-src \*/);
});
