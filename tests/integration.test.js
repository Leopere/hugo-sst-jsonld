/**
 * Hugo module integration tests.
 *
 * Copyright © 2026 ColinKnapp.com. All rights reserved.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fixture = path.join(root, 'tests', 'fixture');

function build(extraArguments = []) {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'hugo-sst-jsonld-'));
  const result = spawnSync('hugo', [
    '--source', fixture,
    '--destination', destination,
    '--cleanDestinationDir',
    ...extraArguments,
  ], { cwd: root, encoding: 'utf8' });
  return { destination, result };
}

function read(destination, relative) {
  return fs.readFileSync(path.join(destination, relative), 'utf8');
}

function payload(html) {
  const scripts = [...html.matchAll(/<script\b([^>]*)\btype=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, 'expected exactly one JSON-LD script');
  assert.match(`${scripts[0][1]} ${scripts[0][2]}`, /\bdata-sst-jsonld\b/);
  return JSON.parse(scripts[0][3]);
}

test('renders ordered JSON-LD keyword arrays from localized and native SST shapes', () => {
  const { destination, result } = build();
  assert.equal(result.status, 0, result.stderr);

  const homeHtml = read(destination, 'index.html');
  assert.equal((homeHtml.match(/<script\b/gi) || []).length, 1, 'hostile text must not create another script element');
  const home = payload(homeHtml);
  assert.deepEqual(home.keywords, ['Hugo JSON-LD', "</script><script>alert('fixture')</script>", 'line\u2028separator', 'C:\\fixture']);
  assert.equal(home.url, 'https://example.org/docs/');
  assert.equal(home['@id'], 'https://example.org/docs/#webpage');
  assert.equal(home.description, 'Fixture description');

  const french = payload(read(destination, 'fr-example.html'));
  assert.deepEqual(french.keywords, ['mots-clés Hugo', 'données structurées']);
  assert.equal(french.inLanguage, 'fr-FR');
  assert.equal(french['@type'], 'Article');
  assert.equal(french.url, 'https://canonical.example/fr-example');

  const regional = payload(read(destination, 'regional.html'));
  assert.deepEqual(regional.keywords, ['palavras-chave Hugo', 'dados estruturados']);
  assert.equal(regional.inLanguage, 'pt-BR');

  const native = payload(read(destination, 'native.html'));
  assert.deepEqual(native.keywords, ['native SST keyword', 'English fallback']);

  assert.doesNotMatch(read(destination, 'missing.html'), /application\/ld\+json/i);
  assert.doesNotMatch(read(destination, 'noindex.html'), /application\/ld\+json/i);
});

test('strict mode fails when an indexable route has no SST keywords', () => {
  const { result } = build(['--config', 'hugo.toml,hugo-strict.toml']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /sst-jsonld: no en keyword entry for key \/missing\.html/);
});
