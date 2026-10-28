import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createStaticServer } from './serwer.mjs';

test('lokalny serwer podaje zasoby i obsługuje nieprawidłowe żądania', async t => {
  const temporary = await mkdtemp(join(tmpdir(), 'uslugiceny-server-'));
  const root = join(temporary, 'dist');
  await mkdir(join(root, 'kalkulator'), { recursive: true });
  await mkdir(join(root, 'assets'));
  await writeFile(join(root, 'index.html'), '<h1>Start</h1>');
  await writeFile(join(root, 'kalkulator', 'index.html'), '<h1>Kalkulator</h1>');
  const assets = [
    ['kalkulator.js', 'text/javascript', 'window.calcLoaded = true;'],
    ['szukaj.json', 'application/json', '{"wyniki":[]}'],
    ['style.css', 'text/css', 'body { color: black; }'],
    ['sitemap.xml', 'application/xml', '<urlset/>'],
    ['logo.svg', 'image/svg+xml', '<svg/>'],
    ['logo.png', 'image/png', Buffer.from([137, 80, 78, 71])],
    ['font.woff2', 'font/woff2', Buffer.from([119, 79, 70, 50])],
  ];
  await Promise.all(assets.map(([name, , body]) => writeFile(join(root, 'assets', name), body)));
  await writeFile(join(temporary, 'secret.txt'), 'poza katalogiem strony');
  await symlink(join(temporary, 'secret.txt'), join(root, 'link.txt'));
  const server = createStaticServer(root);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const send = (path, method = 'GET') => new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port: server.address().port, path, method }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
      response.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
  try {
    await t.test('HTML strony i indeksy katalogów z parametrami', async () => {
      for (const [path, expected] of [['/', 'Start'], ['/kalkulator/?city=krakow', 'Kalkulator']]) {
        const response = await send(path);
        assert.equal(response.status, 200);
        assert.match(response.headers['content-type'], /^text\/html/);
        assert.match(response.body.toString(), new RegExp(expected));
      }
    });
    await t.test('poprawne typy MIME i zawartość zasobów', async () => {
      for (const [name, mime, body] of assets) {
        const response = await send(`/assets/${name}`);
        assert.equal(response.status, 200, name);
        assert.equal(response.headers['content-type'].split(';')[0], mime, name);
        assert.equal(response.headers['x-content-type-options'], 'nosniff');
        assert.deepEqual(response.body, Buffer.from(body));
      }
    });
    await t.test('HEAD zwraca nagłówki bez treści', async () => {
      const response = await send('/assets/kalkulator.js', 'HEAD');
      assert.equal(response.status, 200);
      assert.equal(response.body.length, 0);
      assert.equal(Number(response.headers['content-length']), Buffer.byteLength(assets[0][2]));
    });
    await t.test('brak pliku i niedozwolona metoda', async () => {
      assert.equal((await send('/brak/')).status, 404);
      assert.equal((await send('/assets/kalkulator.js/missing')).status, 404);
      const response = await send('/', 'POST');
      assert.equal(response.status, 405);
      assert.equal(response.headers.allow, 'GET, HEAD');
    });
    await t.test('ścieżki nie wychodzą poza katalog strony', async () => {
      for (const path of ['/../secret.txt', '/..%2fsecret.txt', '/%2e%2e/secret.txt', '/link.txt']) {
        const response = await send(path);
        assert.equal(response.status, 403, path);
        assert.ok(!response.body.includes('poza katalogiem strony'));
      }
    });
    await t.test('błędne kodowanie URL nie przerywa pracy serwera', async () => {
      assert.equal((await send('/%E0%A4%A')).status, 400);
      assert.equal((await send('/%00')).status, 400);
      assert.equal((await send('/')).status, 200);
    });
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await rm(temporary, { recursive: true, force: true });
  }
});
