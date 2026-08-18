function normalizeUrl(raw) {
  if (typeof raw !== 'string') return raw;
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed}`;
}

function isValidHttpUrl(raw) {
  try {
    const parsed = new URL(normalizeUrl(raw));
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    const host = parsed.hostname;
    return host === 'localhost' || host.includes('.');
  } catch {
    return false;
  }
}

module.exports = { normalizeUrl, isValidHttpUrl };
