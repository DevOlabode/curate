const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeUrl, isValidHttpUrl } = require('../../utils/normalizeUrl');
const { parseTags } = require('../../utils/parseTags');
const { bookmarkSchema, collectionSchema } = require('../../joiSchema');

test('normalizeUrl adds https:// when no scheme is present', () => {
  assert.equal(normalizeUrl('example.com'), 'https://example.com');
});

test('normalizeUrl leaves an existing scheme alone', () => {
  assert.equal(normalizeUrl('http://example.com'), 'http://example.com');
});

test('normalizeUrl passes through non-strings unchanged', () => {
  assert.equal(normalizeUrl(undefined), undefined);
});

test('isValidHttpUrl accepts a bare host', () => {
  assert.equal(isValidHttpUrl('example.com'), true);
});

test('isValidHttpUrl rejects a non-http(s) scheme', () => {
  assert.equal(isValidHttpUrl('ftp://example.com'), false);
});

test('isValidHttpUrl rejects a host with no dot and not localhost', () => {
  assert.equal(isValidHttpUrl('notadomain'), false);
});

test('parseTags splits a comma-separated string and trims entries', () => {
  assert.deepEqual(parseTags('node, express,  api'), ['node', 'express', 'api']);
});

test('parseTags drops empty entries from an array', () => {
  assert.deepEqual(parseTags(['node', '', '  ', 'api']), ['node', 'api']);
});

test('parseTags returns an empty array for anything else', () => {
  assert.deepEqual(parseTags(undefined), []);
});

test('bookmarkSchema requires a title and url', () => {
  const { error } = bookmarkSchema.validate({});
  assert.ok(error);
});

test('bookmarkSchema normalizes a bare-host url', () => {
  const { error, value } = bookmarkSchema.validate({ title: 'Docs', url: 'example.com' });
  assert.equal(error, undefined);
  assert.equal(value.url, 'https://example.com');
});

test('bookmarkSchema rejects a url that cannot resolve to http(s)', () => {
  const { error } = bookmarkSchema.validate({ title: 'Docs', url: 'not a url' });
  assert.ok(error);
});

test('collectionSchema requires a name', () => {
  const { error } = collectionSchema.validate({ description: 'no name here' });
  assert.ok(error);
});

test('collectionSchema accepts a name with no description', () => {
  const { error } = collectionSchema.validate({ name: 'Reading list' });
  assert.equal(error, undefined);
});
