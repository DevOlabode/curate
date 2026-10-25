#!/usr/bin/env node
// End-to-end check against a running deployment. Creates a throwaway account,
// exercises the main flows, then deletes the account so nothing is left behind.
//
//   node scripts/smoke.js https://<deployment-url>

const base = String(process.argv[2] || process.env.SMOKE_URL || '').replace(/\/$/, '');
if (!/^https?:\/\//.test(base)) {
  console.error('Usage: node scripts/smoke.js https://<deployment-url>');
  process.exit(1);
}

async function call(method, path, { token, body, expect = 200 } = {}) {
  const res = await fetch(`${base}/api/v1${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status !== expect) {
    throw new Error(`${method} ${path}: expected ${expect}, got ${res.status} ${JSON.stringify(data)}`);
  }
  console.log(`✓ ${method} ${path} → ${res.status}`);
  return data;
}

async function main() {
  await call('GET', '/health');

  const suffix = Math.random().toString(36).slice(2, 10);
  const { token } = await call('POST', '/auth/register', {
    expect: 201,
    body: {
      username: `smoke_${suffix}`,
      password: `smoke-${suffix}-password`,
      email: `smoke_${suffix}@example.com`,
      firstName: 'Smoke',
      lastName: 'Test',
    },
  });

  try {
    const { collection } = await call('POST', '/collections', { token, expect: 201, body: { name: 'Smoke' } });
    const { bookmark } = await call('POST', '/bookmarks', {
      token,
      expect: 201,
      body: { title: 'MDN', url: 'developer.mozilla.org', tags: 'docs', collectionId: collection._id },
    });
    const { bookmarks } = await call('GET', '/bookmarks', { token });
    if (!bookmarks.some((b) => b._id === bookmark._id)) throw new Error('Saved bookmark missing from list');
    await call('DELETE', `/bookmarks/${bookmark._id}`, { token });
  } finally {
    await call('DELETE', '/auth/me', { token });
  }
  await call('GET', '/auth/me', { token, expect: 401 });
  console.log(`Smoke test passed: ${base}`);
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
