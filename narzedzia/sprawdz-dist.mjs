// Powstrzymuje wdrożenie niepełnego katalogu po wygenerowaniu dist/.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import works from '../src/data/works.json' with { type: 'json' };
import cities from '../src/data/cities.json' with { type: 'json' };
import { PORADNIKI } from '../src/pages-guides.mjs';
import { slugify } from '../src/pages-service.mjs';
import { guideImage } from '../src/photo-guides.mjs';

const root = 'dist';
const errors = [];
let checkedPages = 0;
const exists = (relative) => {
  if (!existsSync(join(root, relative))) errors.push('Brak pliku: ' + relative);
};
const html = (relative, predicates = []) => {
  exists(relative);
  if (!existsSync(join(root, relative))) return;
  const text = readFileSync(join(root, relative), 'utf8');
  for (const [value, name] of predicates) {
    if (!text.includes(value)) errors.push(relative + ': brak ' + name);
  }
  checkedPages++;
};

html('index.html', [
  ['class="home-media-guides"', 'ilustrowanej galerii poradników'],
  ['class="home-media-categories"', 'ilustrowanej galerii usług'],
]);
html('uslugi/index.html');
html('poradnik/index.html');

for (const category of works.categories) {
  html('uslugi/' + category.slug + '/index.html');
  exists('assets/category/' + category.id + '.svg');
}
for (const guide of PORADNIKI) {
  html('poradnik/' + guide.slug + '/index.html', [
    ['/assets/media/' + guide.slug + '.svg', 'technicznej ilustracji'],
  ]);
  exists('assets/media/' + guide.slug + '.svg');
  exists(guideImage(guide.slug));
}

for (const item of works.works) {
  const category = works.categories.find((c) => c.id === item.cat);
  if (!category) {
    errors.push('Brak kategorii: ' + item.id);
    continue;
  }
  const path = category.slug + '/' + slugify(item.name) + '/';
  exists(path + 'index.html');
  for (const city of cities) exists(path + city.slug + '/index.html');
}
html('podlogi/wylewka-cementowa/index.html', [
  ['class="service-cost-chart"', 'podziału robocizny i materiałów'],
]);
html('podlogi/wylewka-cementowa/warszawa/index.html', [
  ['class="service-cost-chart"', 'miejskiego podziału ceny'],
]);

exists('sitemap.xml');
exists('robots.txt');
exists('stan-wdrozenia.json');
if (existsSync(join(root, 'sitemap.xml'))) {
  const xml = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  if (!xml.includes('xmlns:image=') || !xml.includes('<image:image>')) {
    errors.push('Sitemap bez ilustracji');
  }
}
if (existsSync(join(root, 'stan-wdrozenia.json'))) {
  const release = JSON.parse(readFileSync(join(root, 'stan-wdrozenia.json'), 'utf8'));
  if (!/^[a-f0-9]{16}$/.test(release.build_id)) errors.push('Niepoprawny identyfikator wydania');
  if (release.total_services !== works.works.length || release.guide_count !== PORADNIKI.length) {
    errors.push('Niezgodne liczniki pliku stanu wdrożenia');
  }
}
if (errors.length) {
  for (const err of errors) console.error('BŁĄD BUILD: ' + err);
  process.exitCode = 1;
} else {
  console.log('Wynik dist OK: ' + (3 + works.categories.length + PORADNIKI.length + works.works.length * (cities.length + 1))
    + ' stron głównych/katalogowych/cenowych, ' + checkedPages + ' stron sprawdzonych treścią.');
}
