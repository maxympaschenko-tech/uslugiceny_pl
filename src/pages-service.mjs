// Strony usług: /kategoria/usluga/ oraz /kategoria/usluga/miasto/
// To ta część, która daje skalę: 42 roboty × (1 + 10 miast) = 462 strony.
import { layout, estimateSheet, calcScript, field, select, money, tytul } from './templates.mjs';
import { SITE } from './config.mjs';
import { ikona, pasekPodzialu, slupkiMiast } from './icons.mjs';

const R = SITE.root;
const YEAR = new Date().getFullYear();

export const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
    .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/[źż]/g, 'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const unitPl = (units, w) => units[w.unit].name;

// Strona usługi bez wyjścia do kalkulatora jest ślepym zaułkiem: czytelnik pozna
// stawkę za jednostkę, ale nie dowie się, ile wyjdzie u niego. Ta mapa łączy
// kategorię z kalkulatorem, który liczy jej zakres.
const KALKULATORY = {
  demont:   [['remont-mieszkania', 'kalkulatorze remontu mieszkania']],
  walls:    [['gladzie-i-tynki', 'kalkulatorze gładzi i tynków'], ['malowanie', 'kalkulatorze malowania']],
  floor:    [['wylewka', 'kalkulatorze wylewki'], ['remont-mieszkania', 'kalkulatorze remontu mieszkania']],
  tiles:    [['plytki', 'kalkulatorze płytek'], ['lazienka', 'kalkulatorze łazienki']],
  plumbing: [['lazienka', 'kalkulatorze łazienki']],
  electric: [['remont-mieszkania', 'kalkulatorze remontu mieszkania']],
  finish:   [['remont-mieszkania', 'kalkulatorze remontu mieszkania']],
  elewacja: [['ocieplenie-elewacji', 'kalkulatorze ocieplenia elewacji']],
  teren:    [['kostka-brukowa', 'kalkulatorze kostki brukowej'], ['ogrodzenie', 'kalkulatorze ogrodzenia']],
  dach:     [['dach', 'kalkulatorze dachu']],
  balkon:   [['balkon', 'kalkulatorze remontu balkonu']],
  okna:     [['wymiana-okien', 'kalkulatorze wymiany okien']],
  instalacje: [['klimatyzacja', 'kalkulatorze klimatyzacji i wentylacji']],
};
const doKalkulatora = (catId) => {
  const l = KALKULATORY[catId] || [];
  if (!l.length) return '';
  return `<p class="krok-cena" style="margin-top:1.2rem">Policz swój zakres w ${l
    .map(([slug, nazwa]) => `<a href="${R}kalkulator/${slug}/">${nazwa}</a>`)
    .join(' albo w ')}.</p>`;
};


const crumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: SITE.base + it.path,
  })),
});


/* ---------- wspólne bloki ---------- */

const priceCard = (w, units, avg, min, max) => `
<div class="price-card">
  <div class="pc-item"><span class="pc-label">Od</span><span class="pc-v">${money(Math.round(min))} zł</span></div>
  <div class="pc-item pc-main"><span class="pc-label">Średnio</span><span class="pc-v">${money(Math.round(avg))} zł</span><span class="pc-unit">za ${unitPl(units, w)}</span></div>
  <div class="pc-item"><span class="pc-label">Do</span><span class="pc-v">${money(Math.round(max))} zł</span></div>
</div>`;

const splitTable = (w, units, lab, mat) => `
<div class="board-wrap"><table class="board">
<thead><tr><th data-sort="off">Składnik ceny</th><th>Za ${unitPl(units, w)}</th><th>Udział</th></tr></thead>
<tbody>
<tr><td>Robocizna</td><td class="num">${money(Math.round(lab))} zł</td><td class="num">${Math.round((lab / (lab + mat)) * 100)}%</td></tr>
<tr><td>${w.materialLabel ? w.materialLabel[0].toUpperCase() + w.materialLabel.slice(1) : 'Materiał'}${w.material ? '' : ' (kupuje inwestor)'}</td><td class="num">${w.material ? money(Math.round(mat)) + ' zł' : 'własny'}</td><td class="num">${w.material ? Math.round((mat / (lab + mat)) * 100) + '%' : '0%'}</td></tr>
<tr><td><b>Razem</b></td><td class="num"><b>${money(Math.round(lab + mat))} zł</b></td><td class="num">100%</td></tr>
</tbody></table></div>
${pasekPodzialu(lab, mat)}`;

const calcBox = (w, units, cities, cityOptions, preset = null) => `
<div class="panel">
  <h2>Policz swój zakres</h2>
  <p class="panel-note">Podaj ilość, a zobaczysz koszt robocizny i materiału osobno.</p>
  <form id="calc">
    ${field({ name: 'qty', label: 'Ilość', value: w.unit === 'szt' || w.unit === 'pkt' ? 1 : 20, min: 0, step: 0.5, suffix: unitPl(units, w) })}
    ${w.perCm ? field({ name: 'cm', label: 'Grubość warstwy', value: 5, min: 1, max: 20, step: 0.5, suffix: 'cm' }) : ''}
    ${preset ? '' : select({ name: 'city', label: 'Miasto', options: cityOptions })}
  </form>
  <div class="total"><span class="t-label">Szacunkowy koszt</span><span class="t-val" data-out>0 <small>PLN</small></span></div>
  <p class="range-note" data-out-note></p>
</div>`;

// Podstawa stawki widoczna przy konkretnej pozycji, a nie tylko na stronie metody.
const podstawaBlock = (cat, meta, w) => {
  const lista = (cat.zrodla || []).map((i) => (meta.sources || [])[i]).filter(Boolean);
  if (!lista.length) return '';
  // Rozroznienie jest istotne: przy czesci pozycji zrodlo podaje konkretna liczbe,
  // przy reszcie tylko przedzial dla calej grupy robot. Udawanie precyzji szkodzi.
  const stopien = w.sprawdzone
    ? `<strong>Stawka sprawdzona punktowo</strong> (${w.sprawdzone}): źródło podaje wartość dla tej konkretnej roboty.`
    : `<strong>Stawka orientacyjna:</strong> wyprowadzona z przedziału dla całej grupy robót, bez osobnej pozycji w źródle. Rząd wielkości jest właściwy, konkretna kwota może się różnić mocniej niż przy pozycjach sprawdzonych punktowo.`;
  return `<p class="podstawa">${stopien}<br>
<strong>Opracowania:</strong> ${lista.map((z) => `${z.name} (${z.date})`).join('; ')}.
Ostatnia kalibracja: ${meta.checked || meta.updated}. <a href="${R}jak-liczymy/">Metoda wyliczeń</a>.</p>`;
};

// Pytania budowane z danych pozycji: kwota, zakres ceny i pierwszy czynnik
// cenotworczy. Dzieki temu odpowiedzi sa zawsze zgodne z cennikiem, a nie
// przepisane recznie i rozjezdzajace sie po kolejnej kalibracji.
const pytania = ({ w, units, kwota, jednostka, gdzie, min, max }) => {
  const lista = [
    [
      // nazwy robot trzymamy w mianowniku, wiec pytanie nie moze wymagac odmiany czasownika
      `${w.name}${gdzie ? ' ' + gdzie : ''}: jaka jest cena?`,
      `Średnio ${money(Math.round(kwota))} zł za ${jednostka}${w.material ? ' razem z materiałem' : ', przy czym materiał kupuje inwestor'}. W praktyce spotyka się przedział od ${money(Math.round(min))} do ${money(Math.round(max))} zł, zależnie od zakresu i warunków na miejscu.`,
    ],
    [
      'Czy w tej cenie jest materiał?',
      w.material
        ? 'Tak, podana kwota obejmuje robociznę i materiał w standardzie średnim. Wykonawcy dzielą tę sumę różnie, dlatego przy porównywaniu ofert warto pytać wprost, co obejmuje stawka za jednostkę.'
        : 'Nie. Tę pozycję rozlicza się wyłącznie za robociznę, bo materiał albo urządzenie kupuje zwykle inwestor. Przy porównywaniu ofert sprawdź, czy druga strona nie wliczyła materiału w stawkę.',
    ],
  ];
  if (w.factors && w.factors[0]) {
    lista.push(['Od czego zależy ostateczna cena?', w.factors.slice(0, 2).join(' ')]);
  }
  return lista;
};

const pytaniaBlock = (lista) => `
<h2 style="margin-top:2rem">Częste pytania</h2>
${lista.map(([q, a]) => `<h3 style="margin:1.1rem 0 .3rem">${q}</h3><p class="section-note">${a}</p>`).join('')}`;

const faqLd = (lista) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'pl',
  mainEntity: lista.map(([q, a]) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
});

const powiazaneBlock = (lista) =>
  lista && lista.length
    ? `<h2 style="margin-top:2rem">Warto przeczytać</h2>
<div class="cards">${lista
        .map((x) => `<div class="card"><p class="etykieta">${x.typ}</p><h3><a href="${x.url}">${x.tytul}</a></h3></div>`)
        .join('')}</div>`
    : '';

const factorsBlock = (w) =>
  w.factors
    ? `<h2>Co wpływa na ostateczną cenę</h2><ul class="factors">${w.factors.map((f) => `<li>${f}</li>`).join('')}</ul>`
    : '';

/* ---------- strona usługi (cała Polska) ---------- */

export function servicePage({ w, cat, units, cities, unitPrice, related, cityOptions, powiazane = [], meta = {} }) {
  const base = unitPrice(w.id, 1, 1, w.perCm ? 5 : 1);
  const avg = base.labour + base.material;
  const spread = w.spread ?? 0.18;
  const cheapest = cities.reduce((a, b) => (a.coef < b.coef ? a : b));
  const dearest = cities.reduce((a, b) => (a.coef > b.coef ? a : b));
  const pMin = unitPrice(w.id, cheapest.coef, 1, w.perCm ? 5 : 1);
  const pMax = unitPrice(w.id, dearest.coef, 1, w.perCm ? 5 : 1);
  const min = (pMin.labour + pMin.material) * (1 - spread);
  const max = (pMax.labour + pMax.material) * (1 + spread);
  const u = unitPl(units, w);
  const path = `/${cat.slug}/${slugify(w.name)}/`;

  const cityRows = [...cities]
    .sort((a, b) => a.coef - b.coef)
    .map((c) => {
      const p = unitPrice(w.id, c.coef, 1, w.perCm ? 5 : 1);
      const t = p.labour + p.material;
      return `<tr><td data-v="${c.name}"><a href="${R}${cat.slug}/${slugify(w.name)}/${c.slug}/">${c.name}</a></td>
<td class="num" data-v="${p.labour}">${money(Math.round(p.labour))} zł</td>
<td class="num" data-v="${p.material}">${w.material ? money(Math.round(p.material)) + ' zł' : 'własny'}</td>
<td class="num" data-v="${t}"><b>${money(Math.round(t))} zł</b></td></tr>`;
    })
    .join('');

  // nazwy robót trzymamy w mianowniku, więc zdania budujemy tak, żeby nie wymagały odmiany
  const matWord = w.materialLabel || 'materiałem';
  const faq = pytania({ w, units, kwota: avg, jednostka: u, gdzie: '', min, max });
  const lead = w.material
    ? `${w.name} kosztuje średnio ${money(Math.round(avg))} zł za ${u} razem z ${matWord === 'materiałem' ? 'materiałem' : 'kosztem kontenera'}. Sama robocizna to ${money(Math.round(base.labour))} zł, ${w.materialLabel || 'materiał'} dokłada ${money(Math.round(base.material))} zł.`
    : `${w.name} kosztuje średnio ${money(Math.round(avg))} zł za ${u}. To wyłącznie robocizna: ${w.name.toLowerCase().includes('wywóz') ? 'kontener i utylizację liczy się osobno' : 'materiał lub urządzenie kupuje inwestor'}.`;

  return layout({
    title: tytul(`${w.name} - cena ${YEAR}`, `: ile kosztuje za ${u}`),
    description: `${w.name}: średnio ${money(Math.round(avg))} zł za ${u}, w przedziale od ${money(Math.round(min))} do ${money(Math.round(max))} zł. Robocizna i materiał osobno, stawki w 10 miastach.`,
    path,
    breadcrumb: `<a href="${R}">Cennik</a> · <a href="${R}uslugi/${cat.slug}/">${cat.name}</a> · ${w.name}`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">${cat.name} · aktualizacja ${SITE.updated}</p>
  <h1>${w.name}: cena wykonania</h1>
  <p class="lede">${lead}</p>
  ${priceCard(w, units, avg, min, max)}
  <p class="section-note">Przedział wynika z różnicy między miastami i z rozrzutu stawek w obrębie jednego miasta. Najtaniej wychodzi ${cheapest.loc}, najdrożej ${dearest.loc}.</p>

  <div class="calc-grid" style="margin-top:1.6rem">
    <div>
      <h2>Z czego składa się stawka</h2>
      ${splitTable(w, units, base.labour, base.material)}
      ${podstawaBlock(cat, meta, w)}
      ${doKalkulatora(cat.id)}
      ${factorsBlock(w)}
    </div>
    <div class="sticky-sheet">${calcBox(w, units, cities, cityOptions)}</div>
  </div>

  <h2 style="margin-top:2rem">Ceny w miastach</h2>
  <p class="section-note">Stawki dla standardowego zakresu, posortowane od najtańszego miasta. Kliknij nazwę, żeby zobaczyć stronę miasta.</p>
  ${slupkiMiast(
    [...cities]
      .map((c) => {
        const q = unitPrice(w.id, c.coef, 1, w.perCm ? 5 : 1);
        return { name: c.name, v: q.labour + q.material, label: money(Math.round(q.labour + q.material)) + ' zł' };
      })
      .sort((a, b) => a.v - b.v),
    u
  )}
  <details class="tabela-szczegoly">
    <summary>Pokaż tabelę z podziałem na robociznę i materiał</summary>
    <div class="board-wrap" style="margin-top:.8rem"><table class="board" id="cities">
      <thead><tr><th data-sort="off">Miasto</th><th>Robocizna</th><th>Materiał</th><th>Razem za ${u}</th></tr></thead>
      <tbody>${cityRows}</tbody>
    </table></div>
  </details>

  ${pytaniaBlock(faq)}

  ${powiazaneBlock(powiazane)}

  ${
    related.length
      ? `<h2 style="margin-top:2rem">Podobne roboty</h2>
  <div class="cards">${related
    .map((r) => {
      const p = unitPrice(r.id, 1, 1, r.perCm ? 5 : 1);
      return `<div class="card"><h3><a href="${R}${cat.slug}/${slugify(r.name)}/">${r.name}</a></h3><p class="big">${money(Math.round(p.labour + p.material))} zł</p><p>za ${unitPl(units, r)}</p></div>`;
    })
    .join('')}</div>`
      : ''
  }
</div></section>`,
    jsonLd: [
      faqLd(faq),
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: w.name,
        serviceType: cat.name,
        areaServed: { '@type': 'Country', name: 'Polska' },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'PLN',
          lowPrice: Math.round(min),
          highPrice: Math.round(max),
          offerCount: cities.length,
        },
      },
      crumbLd([
        { name: 'Cennik', path: '/' },
        { name: cat.name, path: `/uslugi/${cat.slug}/` },
        { name: w.name, path },
      ]),
    ],
    script: `const W = ${JSON.stringify({ id: w.id, labour: w.labour, material: w.material, perCm: !!w.perCm, unit: u })};
const CITIES = ${JSON.stringify(Object.fromEntries(cities.map((c) => [c.slug, [c.coef, c.name]])))};
(function(){
  const f = document.getElementById('calc');
  const out = document.querySelector('[data-out]');
  const note = document.querySelector('[data-out-note]');
  bindForm(f, () => {
    const v = readForm(f);
    const coef = CITIES[v.city][0];
    const cm = W.perCm ? (v.cm || 1) : 1;
    const lab = W.labour * coef * (v.qty || 0);
    const mat = W.material * cm * (1 + (coef - 1) * 0.2) * (v.qty || 0);
    out.innerHTML = F(R(lab + mat)) + ' <small>PLN</small>';
    note.textContent = W.material
      ? 'Robocizna ' + F(R(lab)) + ' zł, materiał ' + F(R(mat)) + ' zł.'
      : 'Sama robocizna, bez kosztu materiału.';
  });
  bindSort(document.getElementById('cities'));
})();`,
  });
}

/* ---------- strona usługi w mieście ---------- */

export function serviceCityPage({ w, cat, city, units, cities, unitPrice, cityOptions, powiazane = [], meta = {}, sasiednie = [] }) {
  const p = unitPrice(w.id, city.coef, 1, w.perCm ? 5 : 1);
  const t = p.labour + p.material;
  const base = unitPrice(w.id, 1, 1, w.perCm ? 5 : 1);
  const nat = base.labour + base.material;
  const diff = Math.round((t / nat - 1) * 100);
  const spread = w.spread ?? 0.18;
  const u = unitPl(units, w);
  const others = cities.filter((c) => c.slug !== city.slug).slice(0, 9);
  const faq = pytania({
    w, units, kwota: t, jednostka: u, gdzie: city.loc,
    min: t * (1 - spread), max: t * (1 + spread),
  });

  return layout({
    title: tytul(`${w.name} ${city.loc}`, ` - cennik ${YEAR}`, ''),
    description: `${w.name} ${city.loc}: średnio ${money(Math.round(t))} zł za ${u}, w przedziale od ${money(Math.round(t * (1 - spread)))} do ${money(Math.round(t * (1 + spread)))} zł.`,
    path: `/${cat.slug}/${slugify(w.name)}/${city.slug}/`,
    breadcrumb: `<a href="${R}">Cennik</a> · <a href="${R}uslugi/${cat.slug}/">${cat.name}</a> · <a href="${R}${cat.slug}/${slugify(w.name)}/">${w.name}</a> · ${city.name}`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">${city.name} · województwo ${city.voivodeship}</p>
  <h1>${w.name} ${city.loc}</h1>
  <p class="lede">Stawka ${city.loc} to około ${money(Math.round(t))} zł za ${u}, czyli ${diff === 0 ? 'tyle, ile średnio w kraju' : diff > 0 ? `o ${diff}% powyżej średniej krajowej` : `o ${Math.abs(diff)}% poniżej średniej krajowej`}.</p>
  ${priceCard(w, units, t, t * (1 - spread), t * (1 + spread))}

  <div class="calc-grid" style="margin-top:1.6rem">
    <div>
      <h2>Robocizna i materiał ${city.loc}</h2>
      ${splitTable(w, units, p.labour, p.material)}
      ${podstawaBlock(cat, meta, w)}
      ${doKalkulatora(cat.id)}
      ${factorsBlock(w)}
      <p class="section-note">Pełny cennik robót ${city.loc}: <a href="${R}ceny/${city.slug}/">zobacz wszystkie pozycje</a>.</p>
    </div>
    <div class="sticky-sheet">${calcBox(w, units, cities, cityOptions, city.slug)}</div>
  </div>

  ${pytaniaBlock(faq)}

  ${
    sasiednie.length
      ? `<h2 style="margin-top:2rem">Inne roboty ${city.loc}</h2>
<p class="section-note">Ceny z tej samej kategorii, przeliczone na ${city.name}.</p>
<div class="board-wrap"><table class="board">
<thead><tr><th data-sort="off">Robota</th><th>Jedn.</th><th>Cena ${city.loc}</th></tr></thead>
<tbody>${sasiednie
          .map(
            (s) => `<tr><td data-v="${s.name}"><a href="${s.url}">${s.name}</a></td>
<td class="num">${s.unit}</td><td class="num"><b>${money(s.cena)} zł</b></td></tr>`
          )
          .join('')}</tbody></table></div>
<p class="receipt-foot">Pełne zestawienie: <a href="${R}ceny/${city.slug}/">cennik wszystkich robót ${city.loc}</a>.</p>`
      : ''
  }

  ${powiazaneBlock(powiazane)}

  <h2 style="margin-top:2rem">Ta sama robota w innych miastach</h2>
  <div class="city-links">${others
    .map((c) => {
      const q = unitPrice(w.id, c.coef, 1, w.perCm ? 5 : 1);
      return `<a href="${R}${cat.slug}/${slugify(w.name)}/${c.slug}/">${c.name} ${money(Math.round(q.labour + q.material))} zł</a>`;
    })
    .join('')}</div>
</div></section>`,
    jsonLd: [
      faqLd(faq),
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `${w.name} ${city.loc}`,
        serviceType: cat.name,
        areaServed: { '@type': 'City', name: city.name },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'PLN',
          lowPrice: Math.round(t * (1 - spread)),
          highPrice: Math.round(t * (1 + spread)),
        },
      },
      crumbLd([
        { name: 'Cennik', path: '/' },
        { name: cat.name, path: `/uslugi/${cat.slug}/` },
        { name: w.name, path: `/${cat.slug}/${slugify(w.name)}/` },
        { name: city.name, path: `/${cat.slug}/${slugify(w.name)}/${city.slug}/` },
      ]),
    ],
    script: `const W = ${JSON.stringify({ labour: w.labour, material: w.material, perCm: !!w.perCm })};
const COEF = ${city.coef};
(function(){
  const f = document.getElementById('calc');
  const out = document.querySelector('[data-out]');
  const note = document.querySelector('[data-out-note]');
  bindForm(f, () => {
    const v = readForm(f);
    const cm = W.perCm ? (v.cm || 1) : 1;
    const lab = W.labour * COEF * (v.qty || 0);
    const mat = W.material * cm * (1 + (COEF - 1) * 0.2) * (v.qty || 0);
    out.innerHTML = F(R(lab + mat)) + ' <small>PLN</small>';
    note.textContent = W.material
      ? 'Robocizna ' + F(R(lab)) + ' zł, materiał ' + F(R(mat)) + ' zł.'
      : 'Sama robocizna, bez kosztu materiału.';
  });
})();`,
  });
}

/* ---------- strona kategorii ---------- */

export function categoryPage({ cat, works, units, unitPrice }) {
  const rows = works
    .map((w) => {
      const p = unitPrice(w.id, 1, 1, w.perCm ? 5 : 1);
      return `<tr><td data-v="${w.name}"><a href="${R}${cat.slug}/${slugify(w.name)}/">${w.name}</a></td>
<td class="num" data-v="${units[w.unit].name}">${units[w.unit].name}</td>
<td class="num" data-v="${p.labour + p.material}"><b>${money(Math.round(p.labour + p.material))} zł</b></td></tr>`;
    })
    .join('');
  return layout({
    title: tytul(`${cat.name} - cennik robót ${YEAR}`),
    // opis kategorii bywa dlugi, wiec ogon doklejamy tylko wtedy, gdy calosc miesci sie w snippecie
    description: (() => {
      const baza = cat.lead;
      const ogon = ' Stawki w Polsce, robocizna i materiał osobno.';
      return (baza + ogon).length <= 160 ? baza + ogon : baza;
    })(),
    path: `/uslugi/${cat.slug}/`,
    breadcrumb: `<a href="${R}">Cennik</a> · <a href="${R}uslugi/">Usługi</a> · ${cat.name}`,
    body: `
<section><div class="wrap">
  <h1>${ikona(cat.id)} ${cat.name}</h1>
  <p class="lede">${cat.lead}</p>
  ${(cat.opis || []).map((a, i) => `<p class="${i === 0 ? 'kat-wstep' : 'section-note'}">${a}</p>`).join('')}

  <h2 style="margin-top:2rem">Stawki w tej kategorii</h2>
  <p class="section-note">Średnie dla Polski razem z materiałem tam, gdzie kupuje go wykonawca. Kliknij pozycję, żeby zobaczyć rozbicie ceny i stawki w miastach.</p>
  <div class="board-wrap"><table class="board" id="list">
    <thead><tr><th data-sort="off">Robota</th><th>Jedn.</th><th>Średnio</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>
</div></section>`,
    script: `bindSort(document.getElementById('list'));`,
  });
}

/* ---------- spis wszystkich usług ---------- */

export function servicesIndex({ categories, works, units, unitPrice }) {
  return layout({
    title: `Cennik robót remontowych ${YEAR}: wszystkie usługi`,
    description: 'Pełna lista robót remontowych ze średnimi stawkami: demontaże, tynki, wylewki, płytki, hydraulika, elektryka i wykończenia.',
    path: '/uslugi/',
    breadcrumb: `<a href="${R}">Cennik</a> · Usługi`,
    body: `
<section><div class="wrap">
  <h1>Wszystkie roboty</h1>
  <p class="lede">${works.length} pozycji w ${categories.length} kategoriach, każda ze stawką rozbitą na robociznę i materiał oraz cenami w dziesięciu miastach.</p>
  <p class="section-note">Wolisz wszystko na jednej stronie, bez klikania? Zobacz <a href="${R}cennik/">pełne zestawienie</a> z przelicznikiem na miasto albo <a href="${R}struktura-kosztow/">udział robocizny i materiału</a> w każdej pozycji.</p>
  ${categories
    .map((cat) => {
      const list = works.filter((w) => w.cat === cat.id);
      return `<h2 style="margin-top:1.8rem">${ikona(cat.id)}<a href="${R}uslugi/${cat.slug}/">${cat.name}</a></h2>
<p class="section-note">${cat.lead}</p>
<div class="city-links">${list
        .map((w) => {
          const p = unitPrice(w.id, 1, 1, w.perCm ? 5 : 1);
          return `<a href="${R}${cat.slug}/${slugify(w.name)}/">${w.name} <b>${money(Math.round(p.labour + p.material))} zł/${units[w.unit].name}</b></a>`;
        })
        .join('')}</div>`;
    })
    .join('')}
</div></section>`,
  });
}
