// Regresje adresów kanonicznych: oddzielny proces dla każdej konfiguracji,
// żeby import modułu nie zachował zmiennych poprzedniego przypadku.
// Uruchomienie: node narzedzia/adresy.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const configUrl = new URL('../src/config.mjs', import.meta.url).href;
const inspect = (settings = {}, routes = ['/']) => {
  const environment = { ...process.env };
  delete environment.SITE_URL;
  delete environment.BASE_PATH;
  Object.assign(environment, settings);
  const source = `
    const { SITE } = await import(${JSON.stringify(configUrl)});
    const routes = JSON.parse(process.argv[1]);
    console.log(JSON.stringify({
      base: SITE.base, root: SITE.root, cityLinks: SITE.cityLinks,
      urls: routes.map(route => {
        try { return { url: SITE.url(route) }; }
        catch (error) { return { error: error.message }; }
      })
    }));
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', source, JSON.stringify(routes)], {
    env: environment, encoding: 'utf8',
  });
  return { status: result.status, stderr: result.stderr, data: result.status === 0 ? JSON.parse(result.stdout) : null };
};

const valid = (settings, routes) => {
  const result = inspect(settings, routes);
  assert.equal(result.status, 0, result.stderr);
  return result.data;
};

test('domyślna domena, lokalne ścieżki i odnośniki do miast', () => {
  const result = valid({}, ['/', '', 'ceny/warszawa/', '/szukaj/?q=dach#oferta']);
  assert.equal(result.base, 'https://uslugiceny.pl');
  assert.equal(result.root, '/');
  assert.deepEqual(result.urls.map(x => x.url), [
    'https://uslugiceny.pl/', 'https://uslugiceny.pl/',
    'https://uslugiceny.pl/ceny/warszawa/', 'https://uslugiceny.pl/szukaj/?q=dach#oferta',
  ]);
  assert.match(result.cityLinks, /href="\/ceny\/warszawa\/"/);
});

test('końcowy ukośnik domeny i nadmiarowe ukośniki BASE_PATH', () => {
  const result = valid({ SITE_URL: 'https://example.com/', BASE_PATH: '///podglad//serwis///' }, ['/', '/uslugi/']);
  assert.equal(result.base, 'https://example.com');
  assert.equal(result.root, '/podglad/serwis/');
  assert.deepEqual(result.urls.map(x => x.url), ['https://example.com/podglad/serwis/', 'https://example.com/podglad/serwis/uslugi/']);
  assert.match(result.cityLinks, /href="\/podglad\/serwis\/ceny\/warszawa\/"/);
});

test('podkatalog SITE_URL oraz jawne pierwszeństwo BASE_PATH', () => {
  const implicit = valid({ SITE_URL: 'https://example.com/projekt///' }, ['/kontakt/']);
  assert.equal(implicit.root, '/projekt/');
  assert.equal(implicit.urls[0].url, 'https://example.com/projekt/kontakt/');
  const explicit = valid({ SITE_URL: 'https://example.com/stary/', BASE_PATH: 'nowy' }, ['/kontakt/']);
  assert.equal(explicit.root, '/nowy/');
  assert.equal(explicit.urls[0].url, 'https://example.com/nowy/kontakt/');
  assert.equal(valid({ SITE_URL: 'https://example.com/projekt/', BASE_PATH: '/' }).root, '/');
});

test('prefiks i logiczna ścieżka o tej samej nazwie nie zlewają się', () => {
  const result = valid({ BASE_PATH: '/uslugi/' }, ['/', '/uslugi/', '/uslugi/malowanie/', 'uslugi/malowanie/', '/uslugi-inne/']);
  assert.deepEqual(result.urls.map(x => x.url), [
    'https://uslugiceny.pl/uslugi/', 'https://uslugiceny.pl/uslugi/uslugi/',
    'https://uslugiceny.pl/uslugi/uslugi/malowanie/', 'https://uslugiceny.pl/uslugi/uslugi/malowanie/',
    'https://uslugiceny.pl/uslugi/uslugi-inne/',
  ]);
  const calculator = valid({ BASE_PATH: '/kalkulator/' }, ['/kalkulator/lazienka/']);
  assert.equal(calculator.urls[0].url, 'https://uslugiceny.pl/kalkulator/kalkulator/lazienka/');
});

test('polskie znaki, spacje, zakodowany prefiks, zapytania i fragmenty', () => {
  const result = valid({ SITE_URL: 'https://example.com/projekt%20a/' }, [
    '/usługi/Łódź i okolice/?q=łazienka 6 m²#koszt całkowity',
    '/kontakt/', '?q=dach&miasto=Łódź', '#ceny',
  ]);
  assert.equal(result.root, '/projekt%20a/');
  assert.deepEqual(result.urls.map(x => x.url), [
    'https://example.com/projekt%20a/us%C5%82ugi/%C5%81%C3%B3d%C5%BA%20i%20okolice/?q=%C5%82azienka%206%20m%C2%B2#koszt%20ca%C5%82kowity',
    'https://example.com/projekt%20a/kontakt/',
    'https://example.com/projekt%20a/?q=dach&miasto=%C5%81%C3%B3d%C5%BA',
    'https://example.com/projekt%20a/#ceny',
  ]);
});

test('SITE_URL odrzuca błędne adresy, dane logowania, zapytania i fragmenty', () => {
  for (const SITE_URL of [
    'nie-adres', 'ftp://example.com/', 'https://user:password@example.com/',
    'https://example.com/?q=dach', 'https://example.com/#ceny',
    'https://example.com/?', 'https://example.com/#',
    'https://example.com/a/../b/', 'https://example.com/%2e%2e/b/',
  ]) {
    const result = inspect({ SITE_URL });
    assert.notEqual(result.status, 0, `Odrzuć SITE_URL: ${SITE_URL}`);
    assert.match(result.stderr, /Error:/);
  }
});

test('BASE_PATH odrzuca przejścia katalogów, schematy i niepoprawne kodowanie', () => {
  for (const BASE_PATH of ['../', '/dobry/../zly/', 'javascript:alert(1)', '/foo?bar', '/foo#bar', '/%2e%2e/', '/bad%2Froot/', '/bad\\root/', '/%zz/']) {
    assert.notEqual(inspect({ BASE_PATH }).status, 0, `Odrzuć BASE_PATH: ${BASE_PATH}`);
  }
});

test('adresy stron nie mogą zmieniać domeny ani wychodzić z katalogu', () => {
  const routes = [
    'https://evil.example/', 'HTTP://evil.example/', '//evil.example/', '\\\\evil.example\\x',
    '/foo/../bar/', '../bar/', '/foo/%2e%2e/bar/', '/foo/%2F../bar/',
    'data:text/html,hello', '/%FF/', '/%00/', '/\nfoo/', '/foo%ZZ/', null, 123,
  ];
  const result = valid({ BASE_PATH: '/projekt/' }, routes);
  assert.ok(result.urls.every(x => x.error && !x.url));
});
