// Uruchomienie silnika kalkulatorów na prawdziwych danych.
//
// Dotąd sprawdzaliśmy tylko składnię skryptów: czy dają się sparsować. To za
// mało, bo zepsuta logika też się parsuje. Kalkulator, który po zmianie stawek
// zwraca zero albo liczbę ujemną, przeszedłby taką kontrolę bez zająknięcia,
// a to najczęściej używana część serwisu.
//
// Uruchomienie:  node narzedzia/kalkulatory.mjs

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'dist';
if (!existsSync(OUT)) {
  console.error('BLAD: brak katalogu dist/. Uruchom najpierw node build.mjs.');
  process.exit(1);
}

const silnik = readFileSync(join(OUT, 'assets', 'kalkulator.js'), 'utf8');
const locationProby = { search: '' };
const api = new Function('location', `${silnik}\nreturn { estimate, F, R, validNumber, readForm, restoreForm };`)(locationProby);

const bledy = [];
const sprawdz = (warunek, opis) => {
  if (!warunek) bledy.push(opis);
};

// Kilka typowych zakresów, po jednym z każdej rodziny pozycji
const PRZYPADKI = [
  { nazwa: 'łazienka 6 m²', linie: [
      ['skuwanie_plytek', 24], ['hydroizolacja', 6], ['plytki_sciana', 24],
      ['plytki_podloga', 6], ['montaz_wanny', 1], ['montaz_wc', 1],
    ], min: 6000, max: 22000 },
  { nazwa: 'pokój 20 m²', linie: [
      ['gladz', 63], ['malowanie', 63], ['panele', 20], ['listwy', 18],
    ], min: 3000, max: 14000 },
  { nazwa: 'dach 150 m²', linie: [
      ['blachodachowka', 150], ['membrana_laty', 150], ['rynny', 24],
    ], min: 15000, max: 70000 },
];

const strony = readdirSync(join(OUT, 'kalkulator'));
const W = JSON.parse(
  readFileSync(join(OUT, 'kalkulator', 'lazienka', 'index.html'), 'utf8')
    .match(/const W = (\{.*?\});\n/s)[1]
);

for (const p of PRZYPADKI) {
  const linie = p.linie
    .filter(([id]) => W.byId[id])
    .map(([id, qty]) => ({ id, qty, cm: 1 }));
  sprawdz(linie.length === p.linie.length,
    `${p.nazwa}: brak pozycji w danych (${p.linie.filter(([id]) => !W.byId[id]).map(([id]) => id)})`);
  if (!linie.length) continue;

  const w = api.estimate(W, linie, 1, 1);
  sprawdz(w.total > 0, `${p.nazwa}: kosztorys wyszedł zerowy`);
  sprawdz(w.labour >= 0 && w.material >= 0, `${p.nazwa}: ujemna robocizna albo materiał`);
  sprawdz(Math.abs(w.total - (w.labour + w.material)) < 1,
    `${p.nazwa}: suma nie zgadza się ze składnikami`);
  sprawdz(w.total >= p.min && w.total <= p.max,
    `${p.nazwa}: ${Math.round(w.total)} zł poza rozsądnym przedziałem ${p.min}–${p.max}`);
  sprawdz(w.lines.every((l) => l.url && l.url.startsWith('/')),
    `${p.nazwa}: pozycja bez odnośnika do swojej strony`);
}

// Współczynnik miejski musi podnosić kwotę, ale nie liniowo: działa na
// robociznę w pełni, a na materiał tylko częściowo.
const proba = [{ id: 'plytki_sciana', qty: 20, cm: 1 }];
const kraj = api.estimate(W, proba, 1, 1).total;
const wawa = api.estimate(W, proba, 1.25, 1).total;
sprawdz(wawa > kraj, 'współczynnik miejski nie podnosi kwoty');
sprawdz(wawa < kraj * 1.25, 'współczynnik miejski mnoży całą stawkę zamiast samej robocizny');

// Standardy muszą układać się rosnąco i wpływać na obie części kwoty:
// na materiał w pełni, na robociznę słabiej, bo droższy standard to przede
// wszystkim droższy produkt, a nie inna ekipa.
const ekonom = api.estimate(W, proba, 1, 0.82);
const srednia = api.estimate(W, proba, 1, 1);
const premium = api.estimate(W, proba, 1, 1.45);
sprawdz(ekonom.total < srednia.total && srednia.total < premium.total,
  'standardy nie układają się rosnąco');
sprawdz(premium.material > srednia.material,
  'standard nie wpływa na koszt materiału');
sprawdz(premium.labour > srednia.labour,
  'standard nie wpływa na robociznę');
sprawdz(premium.material / srednia.material > premium.labour / srednia.labour,
  'standard wpływa na robociznę mocniej niż na materiał, odwrotnie niż zakłada metoda');

// Zapisany link nie może podmienić miasta na nieistniejące ani przemycić
// ujemnej ilości. Mały adapter pól pozwala sprawdzić publiczne zachowanie
// restoreForm/readForm bez uruchamiania przeglądarki.
const pole = (name, value, extra = {}) => ({
  name, value, defaultValue: value, type: 'number', tagName: 'INPUT',
  min: '0', max: '', step: 'any', validity: { badInput: false }, ...extra,
});
const area = pole('area', '50', { min: '10', max: '300', step: '1' });
const len = pole('len', '3.2', { min: '1.5', max: '10', step: '0.1' });
const zero = pole('extra', '1');
const city = pole('city', 'warszawa', {
  type: 'select-one', tagName: 'SELECT',
  options: [{ value: 'warszawa' }, { value: 'bialystok' }, { value: 'disabled', disabled: true }],
});
const demont = pole('demont', 'on', { type: 'checkbox', checked: true });
const radioA = pole('wariant', 'a', { type: 'radio', checked: true });
const radioB = pole('wariant', 'b', { type: 'radio', checked: false });
const fields = [area, len, zero, city, demont, radioA, radioB];
const form = { querySelectorAll: () => fields };
for (const raw of ['-50', '301', '50.5', '1e309', 'NaN', '20abc', '0x20']) {
  locationProby.search = '?area=' + encodeURIComponent(raw) + '&city=unknown&demont=unknown&wariant=unknown';
  api.restoreForm(form);
  sprawdz(area.value === '50' && city.value === 'warszawa' && demont.checked && radioA.checked,
    `niepoprawny parametr ${raw} nadpisał domyślne wartości formularza`);
}
locationProby.search = '?area=80&len=3.7&extra=0&city=bialystok&demont=0&wariant=b';
api.restoreForm(form);
const restored = api.readForm(form);
sprawdz(restored.area === 80 && restored.len === 3.7 && restored.extra === 0,
  'poprawny link z liczbą dziesiętną lub zerem nie został odtworzony');
sprawdz(restored.city === 'bialystok' && restored.demont === false && restored.wariant === 'b',
  'poprawny link nie odtwarza wyboru miasta, checkboxa lub radia');
locationProby.search = '?area=&city=disabled';
api.restoreForm(form);
sprawdz(area.value === '' && api.readForm(form).area === 0 && city.value === 'bialystok',
  'puste pole powinno pozostać puste, a wyłączona opcja nie może zostać wybrana');
zero.value = 'NaN';
sprawdz(api.readForm(form).extra === 0, 'niepoprawna liczba przedostała się do obliczeń');
sprawdz(api.validNumber(len, '3.75') === false && api.validNumber(len, '3.7') === true,
  'walidacja nie respektuje kroku dziesiętnego pola');

let sprawdzonePola = 0;
const formularze = ['dist/index.html', 'dist/sprawdz-oferte/index.html',
  ...strony.map(slug => join(OUT, 'kalkulator', slug, 'index.html'))];
for (const file of formularze) {
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<input\b[^>]*type="number"[^>]*>/g)) {
    const attrs = Object.fromEntries([...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    const input = pole(attrs.name, attrs.value || '', { ...attrs, step: attrs.step || '1' });
    sprawdz(api.validNumber(input, input.value), `${file}: domyślne pole ${input.name} nie spełnia własnych ograniczeń`);
    sprawdzonePola++;
  }
}

if (bledy.length) {
  console.error('KALKULATORY: znaleziono błędy');
  for (const b of bledy) console.error('  -', b);
  process.exit(1);
}
console.log(
  `Kalkulatory liczą poprawnie: ${strony.length} stron, ${PRZYPADKI.length} przypadków, ` +
  `współczynnik miejski i standardy zachowują się zgodnie z metodą. Linki i ${sprawdzonePola} pól formularzy zweryfikowane.`
);
