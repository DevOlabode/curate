const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const manifestPath = path.join(__dirname, '../../extension/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

test('manifest declares the add-bookmark command with a non-reserved default', () => {
  const command = manifest.commands && manifest.commands['add-bookmark'];
  assert.ok(command, 'commands.add-bookmark must exist');
  assert.match(command.description, /bookmark/i);
  assert.equal(command.suggested_key.default, 'Alt+Shift+S');
  assert.equal(command.suggested_key.mac, 'Alt+Shift+S');
});

test('manifest uses activeTab instead of tabs or history for current-page prefill', () => {
  assert.ok(manifest.permissions.includes('storage'));
  assert.ok(manifest.permissions.includes('activeTab'));
  assert.ok(!manifest.permissions.includes('tabs'));
  assert.ok(!manifest.permissions.includes('history'));
});
