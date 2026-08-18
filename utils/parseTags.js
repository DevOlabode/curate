module.exports.parseTags = function parseTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof tags === 'string' && tags.trim()) {
    return tags.split(',').map((t) => t.trim()).filter(Boolean);
  }
  return [];
};
