// Proste kalkulatory jednego zakresu robót: malowanie, płytki, gładzie.
// Każdy dostaje własny adres, bo każdy odpowiada na inne zapytanie w wyszukiwarce.
// Silnik wyceny jest wspólny, różni się tylko formularz i sposób liczenia ilości.
import { layout, estimateSheet, calcScript, field, select, check } from './templates.mjs';
import { SITE } from './config.mjs';

const R = SITE.root;
const YEAR = new Date().getFullYear();

export const CALCS = [
  {
    slug: 'malowanie',
    h1: 'Malowanie ścian i sufitów',
    title: `Kalkulator malowania ${YEAR}: ile kosztuje pomalowanie mieszkania`,
    desc: 'Policz koszt malowania: powierzchnia ścian i sufitów, gruntowanie, gładzie, zdzieranie tapet. Robocizna i materiał osobno, ceny w zł.',
    lede: 'Malarz liczy metry powierzchni, a nie metraż mieszkania. Podaj wymiary pokoju, a kalkulator sam przeliczy ściany i sufit razem z zapasem na ościeża.',
    faq: [
      ['Czy w cenie malowania jest farba?', 'W naszym wyliczeniu materiał jest podany osobno, dzięki czemu widzisz, ile kosztuje sama robocizna. Wiele ekip podaje stawkę wyłącznie za pracę, a farbę kupuje inwestor.'],
      ['Ile warstw farby trzeba położyć?', 'Standardem są dwie warstwy na przygotowanym podłożu. Przy zmianie koloru na jaśniejszy albo przy intensywnych barwach potrzebna bywa trzecia, co podnosi koszt o mniej więcej połowę stawki za warstwę.'],
      ['Czy trzeba gruntować przed malowaniem?', 'Na świeżej gładzi i po naprawach tak, bo grunt wyrównuje chłonność podłoża i zmniejsza zużycie farby. Na starej, mocnej powłoce w dobrym stanie można ten etap pominąć.'],
    ],
    fields: (opts) => `
      <div class="fields-2">
        ${field({ name: 'len', label: 'Długość pokoju', value: 4.5, min: 1, max: 20, step: .1, suffix: 'm' })}
        ${field({ name: 'wid', label: 'Szerokość pokoju', value: 3.6, min: 1, max: 20, step: .1, suffix: 'm' })}
      </div>
      <div class="fields-2">
        ${field({ name: 'h', label: 'Wysokość', value: 2.6, min: 2, max: 4.5, step: .05, suffix: 'm' })}
        ${select({ name: 'city', label: 'Miasto', options: opts })}
      </div>
      <p class="group-title">Zakres</p>
      ${check({ name: 'sufit', label: 'Malowanie sufitu', checked: true })}
      ${check({ name: 'grunt', label: 'Gruntowanie podłoża', checked: true })}
      ${check({ name: 'gladz', label: 'Gładź przed malowaniem' })}
      ${check({ name: 'tapety', label: 'Zdzieranie starych tapet' })}`,
    logic: `
      const walls = 2 * ((v.len || 0) + (v.wid || 0)) * (v.h || 0) * 0.92;
      const ceil = (v.len || 0) * (v.wid || 0);
      const area = walls + (v.sufit ? ceil : 0);
      if (v.tapety) add('skucie_tynkow', walls * 0.35);
      if (v.gladz) add('gladz', area);
      if (v.grunt) add('gruntowanie', area);
      add('malowanie', area);
      window.__area = area;
      window.__sub = F(Math.round(walls)) + ' m² ścian' + (v.sufit ? ' i ' + F(Math.round(ceil)) + ' m² sufitu' : '');`,
  },
  {
    slug: 'plytki',
    h1: 'Układanie płytek',
    title: `Kalkulator układania płytek ${YEAR}: cena za m² z materiałem`,
    desc: 'Ile kosztuje ułożenie płytek: podłoga, ściany, format wielkoformatowy, hydroizolacja, fugowanie. Kosztorys pozycja po pozycji w zł.',
    lede: 'Cena za metr rośnie razem z formatem płytki i maleje razem z powierzchnią zlecenia. Kalkulator pokazuje jedno i drugie osobno.',
    faq: [
      ['Ile płytek dokupić na zapas?', 'Przy prostym układzie liczy się około pięciu procent zapasu, przy ukosie i jodle nawet piętnaście. Warto kupić wszystko z jednej partii produkcyjnej, bo odcienie między partiami potrafią się różnić.'],
      ['Czy fugowanie jest wliczone?', 'Tak, w naszej stawce za układanie fuga jest już uwzględniona. Osobno liczy się silikonowanie narożników i styków, bo to inna technologia i inny materiał.'],
      ['Dlaczego mała łazienka wychodzi drożej za metr?', 'Bo koszt dojazdu, przygotowania i docinek rozkłada się na mniejszą powierzchnię. Na czterech metrach docinków jest niemal tyle samo co na dwudziestu.'],
    ],
    fields: (opts) => `
      ${field({ name: 'floor', label: 'Powierzchnia podłogi', value: 6, min: 0, max: 200, step: .5, suffix: 'm²' })}
      ${field({ name: 'wall', label: 'Powierzchnia ścian', value: 20, min: 0, max: 300, step: .5, suffix: 'm²' })}
      <div class="fields-2">
        ${select({ name: 'city', label: 'Miasto', options: opts })}
        ${select({ name: 'level', label: 'Klasa płytek', options: [{ v: 'ekonom', t: 'Ekonomiczna' }, { v: 'standard', t: 'Standardowa', sel: true }, { v: 'premium', t: 'Premium' }] })}
      </div>
      <p class="group-title">Zakres</p>
      ${check({ name: 'big', label: 'Format wielkoformatowy' })}
      ${check({ name: 'hydro', label: 'Hydroizolacja pod płytki', checked: true })}
      ${check({ name: 'poziom', label: 'Wyrównanie podłogi masą samopoziomującą', checked: true })}
      ${check({ name: 'demont', label: 'Skucie starych płytek' })}`,
    logic: `
      const floor = v.floor || 0, wall = v.wall || 0;
      if (v.demont) { add('skuwanie_plytek', floor + wall); add('wywoz_gruzu', (floor + wall) * 0.03); }
      if (v.poziom) add('samopoziomujaca', floor);
      if (v.hydro) add('hydroizolacja', floor);
      add(v.big ? 'plytki_wielkoformat' : 'plytki_podloga', floor);
      add(v.big ? 'plytki_wielkoformat' : 'plytki_sciana', wall);
      add('silikonowanie', Math.sqrt(Math.max(floor, 1)) * 4);
      window.__area = floor + wall;
      window.__sub = F(floor) + ' m² podłogi, ' + F(wall) + ' m² ścian';`,
  },
  {
    slug: 'gladzie-i-tynki',
    h1: 'Gładzie i tynki',
    title: `Kalkulator gładzi i tynków ${YEAR}: cena za m²`,
    desc: 'Policz koszt tynkowania i gładzi: tynk maszynowy, gładź dwuwarstwowa, gruntowanie, zabudowa z płyt gipsowo-kartonowych. Ceny w zł za m².',
    lede: 'Gładź to etap, na którym widać każdą oszczędność. Kalkulator rozdziela tynk, gładź i grunt, żeby było widać, ile kosztuje każdy z nich osobno.',
    faq: [
      ['Czym różni się tynk od gładzi?', 'Tynk to warstwa wyrównująca o grubości kilkunastu milimetrów, kładziona zwykle maszynowo na surową ścianę. Gładź to cienka warstwa wykończeniowa, która nadaje powierzchni gładkość pod malowanie.'],
      ['Ile warstw gładzi jest potrzebnych?', 'Standardem są dwie warstwy z szlifowaniem. Pod farby o wysokim połysku i przy bocznym świetle stosuje się trzecią warstwę, bo takie oświetlenie ujawnia każdą nierówność.'],
      ['Jak długo schnie gładź?', 'Przy normalnej wilgotności powietrza warstwa wysycha w kilkanaście godzin, ale przed malowaniem warto odczekać dobę na warstwę. Wymuszanie schnięcia nagrzewnicą powoduje pęknięcia.'],
    ],
    fields: (opts) => `
      ${field({ name: 'area', label: 'Powierzchnia do wykończenia', value: 60, min: 1, max: 600, step: 1, suffix: 'm²', hint: 'Ściany i sufity razem. Dla pokoju 20 m² to zwykle około 65 m².' })}
      ${select({ name: 'city', label: 'Miasto', options: opts })}
      <p class="group-title">Zakres</p>
      ${check({ name: 'tynk', label: 'Tynk gipsowy maszynowy' })}
      ${check({ name: 'gladz', label: 'Gładź dwuwarstwowa', checked: true })}
      ${check({ name: 'grunt', label: 'Gruntowanie', checked: true })}
      ${check({ name: 'malowanie', label: 'Malowanie po gładzi', checked: true })}
      ${check({ name: 'sufitgk', label: 'Sufit podwieszany z płyt GK', qty: 12 })}`,
    logic: `
      const a = v.area || 0;
      if (v.tynk) add('tynk_gipsowy', a);
      if (v.gladz) add('gladz', a);
      if (v.grunt) add('gruntowanie', a);
      if (v.malowanie) add('malowanie', a);
      if (v.sufitgk) add('gk_sufit', v.sufitgk_qty || 0);
      window.__area = a;
      window.__sub = F(a) + ' m² powierzchni';`,
  },
];

export function calcPage({ c, cityOptions, W_JSON, CITY_MAP, sourceFlag }) {
  return layout({
    title: c.title,
    description: c.desc,
    path: `/kalkulator/${c.slug}/`,
    breadcrumb: `<a href="${R}">Cennik</a> · <a href="${R}kalkulator/remont-mieszkania/">Kalkulatory</a> · ${c.h1}`,
    body: `
<section><div class="wrap">
  <h1>${c.h1}</h1>
  <p class="lede">${c.lede}</p>
  ${sourceFlag}
  <div class="calc-grid" style="margin-top:1.5rem">
    <div class="panel">
      <h2>Parametry</h2>
      <form id="calc">${c.fields(cityOptions)}</form>
    </div>
    <div class="sticky-sheet">${estimateSheet({ title: c.h1, sub: '' })}</div>
  </div>

  <h2 style="margin-top:2.5rem">Częste pytania</h2>
  ${c.faq.map(([q, a]) => `<h3 style="margin:1.2rem 0 .3rem">${q}</h3><p class="section-note">${a}</p>`).join('')}
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: c.faq.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
    script: `${calcScript}
const W = ${W_JSON};
const CITIES = ${CITY_MAP};
(function(){
  const f = document.getElementById('calc');
  const sheet = document.getElementById('sheet');
  bindForm(f, () => {
    const v = readForm(f);
    const [coef, cityName] = CITIES[v.city];
    const level = W.levels.find(l => l.id === (v.level || 'standard'));
    const L = [];
    const add = (id, qty) => L.push({ id, qty: Math.round(qty * 100) / 100, cm: 5 });
    ${c.logic}
    const est = estimate(W, L, coef, level.k);
    drawEstimate(sheet, W, est, { perM2: window.__area });
    sheet.querySelector('[data-sheet-title]').textContent = cityName;
    sheet.querySelector('[data-sheet-sub]').textContent = window.__sub;
  });
  bindSheetActions(sheet);
})();`,
  });
}
