import { mkdir, writeFile, cp, rm, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import cities from './src/data/cities.json' with { type: 'json' };
import worksFile from './src/data/works.json' with { type: 'json' };
import { SITE } from './src/config.mjs';
import { layout, estimateSheet, calcScript, field, select, check, money, tytul, ustawWersjeStylow } from './src/templates.mjs';
import { servicePage, serviceCityPage, categoryPage, servicesIndex, slugify } from './src/pages-service.mjs';
import { CALCS, calcPage, kalkulatoryIndexPage } from './src/pages-calc.mjs';
import { ikona } from './src/icons.mjs';
import { sprawdzOfertePage, szukajPage, sezonowoscPage, porownajMiastaPage, pelnyCennikPage, strukturaKosztowPage, aktualizacjePage } from './src/pages-tools.mjs';
import { HASLA, slownikPage } from './src/pages-slownik.mjs';
import { METRAZE, metrazPage, POROWNANIA, porownaniePage, porownaniaIndex, setCats } from './src/pages-extra.mjs';
import { PORADNIKI, poradnikPage, poradnikiIndex } from './src/pages-guides.mjs';
import { DOMY, ocieplenieMetrazPage, WYKONCZENIA, wykonczenieMetrazPage, DOMY_REMONT, remontDomuPage, LAZIENKI, lazienkaMetrazPage, KUCHNIE, kuchniaMetrazPage, PODDASZA, poddaszeMetrazPage, BALKONY, balkonMetrazPage, POKOJE, pokojMetrazPage, wyliczeniaIndexPage } from './src/pages-extra.mjs';

const OUT = 'dist';

// Odcisk pliku stylow w adresie. Bez tego .htaccess kaze przegladarkom trzymac
// arkusz przez rok i zmiany w wygladzie nie docieraja do osob, ktore juz byly
// na stronie. Zmiana tresci pliku zmienia adres, wiec cache sam sie unieważnia.
const CSS_HASH = createHash('sha1')
  .update(await readFile('src/assets/style.css'))
  .digest('hex')
  .slice(0, 8);
const R = SITE.root;
const YEAR = new Date().getFullYear();
const { works, categories, units, levels, meta, standardScope } = worksFile;
const byId = Object.fromEntries(works.map((w) => [w.id, w]));
const W_JSON = JSON.stringify({ byId, categories, units, levels });
const CITY_MAP = JSON.stringify(Object.fromEntries(cities.map((c) => [c.slug, [c.coef, c.name]])));
const cityOptions = cities.map((c) => ({ v: c.slug, t: c.name }));

ustawWersjeStylow(CSS_HASH);

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const write = async (path, html) => {
  const file = join(OUT, path, 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
};

/* ---------- ten sam silnik po stronie serwera ---------- */

const unitPrice = (id, coef, k, cm) => {
  const w = byId[id];
  const mult = w.perCm && cm ? cm : 1;
  return {
    labour: w.labour * coef * (1 + (k - 1) * 0.35),
    material: w.material * mult * (1 + (coef - 1) * 0.2) * k,
  };
};

const turnkeyPerM2 = (coef, k) =>
  Object.entries(standardScope.items).reduce((s, [id, q]) => {
    const p = unitPrice(id, coef, k, 5);
    return s + (p.labour + p.material) * q;
  }, 0);

const lvl = Object.fromEntries(levels.map((l) => [l.id, l.k]));

const draftFlag =
  meta.status === 'draft'
    ? `<p class="draft-flag"><strong>Wersja robocza cennika.</strong> Stawki bazowe pochodzą z rynkowego przedziału i nie zostały jeszcze zweryfikowane z cennikami ekip.</p>`
    : `<p class="source-flag">Stawki skalibrowane z publicznymi cennikami z ${meta.checked}; ${works.filter((w) => w.sprawdzone).length} z ${works.length} sprawdzonych punktowo. <a href="${R}jak-liczymy/">Źródła i metoda</a>, <a href="${R}aktualizacje/">historia zmian</a>.</p>`;

/* ================= strona główna ================= */

const perM2 = cities.map((c) => ({ c, v: turnkeyPerM2(c.coef, 1) }));
const maxM2 = perM2.reduce((a, b) => (b.v > a.v ? b : a));
const minM2 = perM2.reduce((a, b) => (b.v < a.v ? b : a));

const boardRows = [...perM2]
  .sort((a, b) => b.v - a.v)
  .map(({ c, v }, i) => `<tr>
<td data-v="${c.name}"><span class="rank">${i + 1}</span><a href="${R}ceny/${c.slug}/">${c.name}</a></td>
<td class="num" data-v="${Math.round(turnkeyPerM2(c.coef, lvl.ekonom))}">${money(Math.round(turnkeyPerM2(c.coef, lvl.ekonom)))}</td>
<td class="num" data-v="${Math.round(v)}">${money(Math.round(v))}</td>
<td class="num" data-v="${Math.round(turnkeyPerM2(c.coef, lvl.premium))}">${money(Math.round(turnkeyPerM2(c.coef, lvl.premium)))}</td>
<td class="num" data-v="${Math.round(v * 50)}">${money(Math.round(v * 50))}</td>
</tr>`)
  .join('');

await write(
  '',
  layout({
    title: `Ile kosztuje remont mieszkania ${YEAR}: ceny za m² w 10 miastach`,
    description:
      'Ceny remontu w Polsce: stawka za m² pod klucz, cennik robót remontowych w 10 największych miastach i kalkulatory wylewki, łazienki oraz remontu mieszkania.',
    path: '/',
    body: `
<section class="hero"><div class="wrap hero-grid">
  <div>
    <p class="eyebrow">Aktualizacja ${meta.updated} · ceny w PLN z VAT</p>
    <h1>Policz remont, zanim zadzwonisz po ekipę</h1>
    <p class="lede">Cennik robót w dziesięciu największych miastach i kalkulatory, które dają kosztorys pozycja po pozycji, a nie jedną kwotę z sufitu.</p>
    <p class="hero-note">Remont pod klucz w wariancie standardowym kosztuje od ${money(Math.round(minM2.v))} zł za m² (${minM2.c.name}) do ${money(Math.round(maxM2.v))} zł za m² (${maxM2.c.name}). Różnica siedzi niemal w całości w robociźnie: worek kleju kosztuje w całym kraju podobnie, godzina fachowca już nie.</p>
    ${draftFlag}
  </div>
  <div>
    <div class="panel">
      <h2>Szybka wycena</h2>
      <p class="panel-note">Podaj metraż, a kalkulator złoży kosztorys z typowego zakresu robót.</p>
      <form id="quick">
        ${field({ name: 'area', label: 'Powierzchnia mieszkania', value: 50, min: 10, max: 300, suffix: 'm²' })}
        <div class="fields-2">
          ${select({ name: 'city', label: 'Miasto', options: cityOptions })}
          ${select({ name: 'level', label: 'Standard', options: levels.map((l) => ({ v: l.id, t: l.name, sel: l.id === 'standard' })) })}
        </div>
      </form>
      <div class="total"><span class="t-label">Remont pod klucz</span><span class="t-val" data-quick>0 <small>PLN</small></span></div>
      <p class="range-note" data-quick-note></p>
      <p class="receipt-foot"><a href="${R}kalkulator/remont-mieszkania/">Rozwiń do pełnego kosztorysu z podziałem na roboty</a></p>
    </div>
  </div>
</div></section>

<section class="sciezki"><div class="wrap">
  <div class="cards">
    <div class="card sciezka">
      <span class="card-ikona">${ikona('tiles')}</span>
      <h3><a href="${R}uslugi/">Sprawdź cenę roboty</a></h3>
      <p>${works.length} pozycji w ${categories.length} kategoriach, każda z rozbiciem na robociznę i materiał oraz stawkami w dziesięciu miastach.</p>
    </div>
    <div class="card sciezka">
      <span class="card-ikona">${ikona('walls')}</span>
      <h3><a href="${R}kalkulator/remont-mieszkania/">Policz swój remont</a></h3>
      <p>Dziesięć kalkulatorów: mieszkanie, łazienka, wylewka, malowanie, płytki, elewacja, dach, kostka, ogrodzenie. Kosztorys można wydrukować albo wysłać linkiem.</p>
    </div>
    <div class="card sciezka">
      <span class="card-ikona">${ikona('demont')}</span>
      <h3><a href="${R}sprawdz-oferte/">Oceń ofertę ekipy</a></h3>
      <p>Masz już wycenę i nie wiesz, czy jest uczciwa? Porównamy ją z widełkami rynkowymi dla Twojego miasta.</p>
    </div>
  </div>
</div></section>

<section><div class="wrap">
  <h2>Remont pod klucz, zł za m²</h2>
  <p class="section-note">Wyliczenie dla typowego mieszkania: demontaże, tynki, gładzie, malowanie, wylewka, panele, płytki w strefach mokrych, instalacja elektryczna, drzwi i sprzątanie. Kliknij nagłówek kolumny, żeby posortować.</p>
  <div class="board-wrap"><table class="board" id="board">
    <thead><tr><th data-sort="off">Miasto</th><th>Ekonomiczny</th><th>Standardowy</th><th>Premium</th><th>Mieszkanie 50 m²</th></tr></thead>
    <tbody>${boardRows}</tbody>
  </table></div>
</div></section>

<section><div class="wrap">
  <h2>Kalkulatory</h2>
  <p class="section-note">Każdy liczy pozycja po pozycji i przelicza wynik na wybrane miasto. Kosztorys można wydrukować albo wysłać linkiem.</p>
  <div class="cards">
    <div class="card"><h3><a href="${R}kalkulator/remont-mieszkania/">Remont mieszkania</a></h3><p>Pełny zakres pod klucz według metrażu, z wyborem standardu i miasta.</p></div>
    <div class="card"><h3><a href="${R}kalkulator/wykonczenie-pod-klucz/">Wykończenie od dewelopera</a></h3><p>Bez demontaży, za to z gładziami na całej powierzchni i łazienką od zera.</p></div>
    <div class="card"><h3><a href="${R}kalkulator/lazienka/">Łazienka</a></h3><p>Płytki, hydroizolacja, biały montaż i punkty wodne sztuka po sztuce.</p></div>
    <div class="card"><h3><a href="${R}kalkulator/kuchnia/">Kuchnia</a></h3><p>Instalacje pod płytę, piekarnik i zmywarkę, fartuch nad blatem i podłoga.</p></div>
    <div class="card"><h3><a href="${R}kalkulator/ocieplenie-elewacji/">Ocieplenie elewacji</a></h3><p>Obwód i wysokość budynku minus okna, styropian albo wełna mineralna.</p></div>
    <div class="card"><h3><a href="${R}kalkulator/dach/">Pokrycie dachu</a></h3><p>Sześć rodzajów pokrycia, membrana, obróbki, rynny i ocieplenie poddasza.</p></div>
  </div>
  <p class="receipt-foot" style="margin-top:1rem"><a href="${R}kalkulatory/">Zobacz wszystkie 15 kalkulatorów</a>, w tym poddasze, kostkę, ogrodzenie, okna i klimatyzację.</p>
</div></section>

<section><div class="wrap">
  <h2>Katalog robót</h2>
  <p class="section-note">Każda pozycja ma własną stronę z rozbiciem stawki na robociznę i materiał, listą czynników cenotwórczych i cenami w dziesięciu miastach.</p>
  <div class="cards">${categories
    .map((c) => {
      const n = works.filter((w) => w.cat === c.id).length;
      return `<div class="card"><span class="card-ikona">${ikona(c.id)}</span><h3><a href="${R}uslugi/${c.slug}/">${c.name}</a></h3><p class="big">${n}</p><p>${c.lead}</p></div>`;
    })
    .join('')}</div>
  <p class="receipt-foot" style="margin-top:1rem"><a href="${R}uslugi/">Zobacz wszystkie ${works.length} pozycji</a></p>
</div></section>

<section><div class="wrap">
  <h2>Gotowe wyliczenia</h2>
  <p class="section-note">Policzone zakresy dla najczęstszych metraży, każdy w trzech standardach i dziesięciu miastach. Jeśli szukasz kwoty na już, zacznij stąd zamiast od kalkulatora.</p>
  <p class="section-note" style="margin-bottom:.4rem"><b>Remont mieszkania o powierzchni:</b></p>
  <div class="city-links">${METRAZE.map((m) => `<a href="${R}koszt-remontu/${m.m}-m2/">${m.m} m²</a>`).join('')}</div>
  <p class="section-note" style="margin-top:1.2rem;margin-bottom:.4rem"><b>Remont łazienki o powierzchni:</b></p>
  <div class="city-links">${LAZIENKI.map((m) => `<a href="${R}koszt-lazienki/${m.m}-m2/">${m.m} m²</a>`).join('')}</div>
  <p class="section-note" style="margin-top:1.2rem;margin-bottom:.4rem"><b>Remont kuchni o powierzchni:</b></p>
  <div class="city-links">${KUCHNIE.map((m) => `<a href="${R}koszt-kuchni/${m.m}-m2/">${m.m} m²</a>`).join('')}</div>
  <p class="receipt-foot" style="margin-top:1.2rem"><a href="${R}koszty/">Zobacz wszystkie gotowe wyliczenia</a>: poddasze, wykończenie od dewelopera, ocieplenie i kompleksowy remont domu.</p>
</div></section>

<section><div class="wrap">
  <h2>Narzędzia i zestawienia</h2>
  <p class="section-note">Cztery widoki na te same dane, każdy odpowiada na inne pytanie.</p>
  <div class="cards">
    <div class="card"><h3><a href="${R}cennik/">Pełny cennik</a></h3><p>Wszystkie ${works.length} pozycji na jednej stronie, z przelicznikiem na miasto i przyciskiem druku. Do zestawienia z ofertą wykonawcy wiersz po wierszu.</p></div>
    <div class="card"><h3><a href="${R}struktura-kosztow/">Robocizna czy materiał</a></h3><p>Udział pracy i towaru w każdej pozycji. Pokazuje, gdzie negocjacja stawki ma sens, a gdzie o cenie decyduje półka materiału.</p></div>
    <div class="card"><h3><a href="${R}porownaj-miasta/">Porównaj dwa miasta</a></h3><p>Zestawienie stawek między konkretnymi miastami, pozycja po pozycji. Przydatne przy ofercie od ekipy spoza okolicy.</p></div>
    <div class="card"><h3><a href="${R}aktualizacje/">Historia zmian</a></h3><p>Co i kiedy zmieniło się w stawkach, razem z poprawkami błędów. ${works.filter((w) => w.sprawdzone).length} z ${works.length} pozycji sprawdzonych punktowo w źródłach.</p></div>
  </div>
</div></section>

<section><div class="wrap">
  <h2>Zanim zadzwonisz po ekipę</h2>
  <p class="section-note">Trzy rzeczy, które najczęściej decydują o kosztach bardziej niż sama stawka za metr.</p>
  <div class="cards">
    <div class="card"><h3><a href="${R}poradnik/">Kolejność prac</a></h3><p>Etap zrobiony nie w porę trzeba powtórzyć. Pięć poradników krok po kroku: mieszkanie, łazienka, dach, elewacja, okna.</p></div>
    <div class="card"><h3><a href="${R}porownanie/">Co wybrać</a></h3><p>Osiem porównań rozstrzygniętych liczbami: wylewka cementowa czy anhydrytowa, panele czy deska, pompa ciepła czy kocioł.</p></div>
    <div class="card"><h3><a href="${R}kiedy-remontowac/">Kiedy zamawiać</a></h3><p>Ta sama robota kosztuje inaczej w maju i w listopadzie. Kalendarz obłożenia ekip miesiąc po miesiącu.</p></div>
  </div>
</div></section>

`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'uslugiceny.pl',
        url: SITE.base + R,
        inLanguage: 'pl',
        about: 'Ceny robót remontowych w Polsce',
        // pole wyszukiwania bezpośrednio w wynikach Google
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE.base}${R}szukaj/?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'uslugiceny.pl',
        url: SITE.base + R,
        logo: `${SITE.base}${R}icon-512.png`,
        description: 'Baza cen robót remontowych i budowlanych w Polsce z kalkulatorami kosztorysu.',
        email: 'kontakt@uslugiceny.pl',
        areaServed: { '@type': 'Country', name: 'Polska' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Ceny robót remontowych w Polsce',
        description: `Stawki ${works.length} robót remontowych i budowlanych w ${cities.length} największych miastach Polski, z podziałem na robociznę i materiał.`,
        inLanguage: 'pl',
        spatialCoverage: 'Polska',
        temporalCoverage: meta.checked || meta.updated,
        creator: { '@type': 'Organization', name: 'uslugiceny.pl' },
      },
    ],
    script: `${calcScript}
const W = ${W_JSON};
const CITIES = ${CITY_MAP};
const SCOPE = ${JSON.stringify(standardScope.items)};
(function(){
  const f = document.getElementById('quick');
  const out = document.querySelector('[data-quick]');
  const note = document.querySelector('[data-quick-note]');
  bindForm(f, () => {
    const v = readForm(f);
    const coef = CITIES[v.city][0], k = W.levels.find(l => l.id === v.level).k;
    const lines = Object.entries(SCOPE).map(([id, q]) => ({ id, qty: q * (v.area || 0), cm: 5 }));
    const est = estimate(W, lines, coef, k);
    out.innerHTML = F(R(est.total)) + ' <small>PLN</small>';
    note.textContent = v.area
      ? F(R(est.total / v.area)) + ' zł za m². Robocizna ' + F(R(est.labour)) + ', materiały ' + F(R(est.material)) + '.'
      : '';
  });
  bindSort(document.getElementById('board'));
})();`,
  })
);

// Powiazania budowane automatycznie z tresci, ktora juz istnieje: kazdy krok
// poradnika, kazde porownanie i kazde haslo slownika wskazuje pozycje cennika,
// wiec wystarczy odwrocic te relacje. Dzieki temu lista nie rozjedzie sie
// z trescia przy kolejnych zmianach.
const powiazania = {};
const dodajPowiazanie = (wid, wpis) => {
  if (!wid || !byId[wid]) return;
  (powiazania[wid] ||= []).push(wpis);
};
for (const p of PORADNIKI) {
  for (const k of p.kroki) {
    dodajPowiazanie(k.w, { typ: 'Poradnik', tytul: p.h1, url: `${R}poradnik/${p.slug}/` });
  }
}
for (const p of POROWNANIA) {
  for (const wid of [p.a, p.b]) {
    dodajPowiazanie(wid, { typ: 'Porównanie', tytul: `${p.h1}?`, url: `${R}porownanie/${p.slug}/` });
  }
}
for (const [t, id, , wid] of HASLA) {
  dodajPowiazanie(wid, { typ: 'Słownik', tytul: t, url: `${R}slownik/#${id}` });
}
// bez powtorzen i najwyzej trzy pozycje na strone
for (const wid of Object.keys(powiazania)) {
  const widziane = new Set();
  powiazania[wid] = powiazania[wid]
    .filter((x) => (widziane.has(x.url) ? false : widziane.add(x.url)))
    .slice(0, 3);
}

/* ================= cenniki miast ================= */

for (const city of cities) {
  const rows = categories
    .map((cat) => {
      const trs = works
        .filter((w) => w.cat === cat.id)
        .map((w) => {
          const p = unitPrice(w.id, city.coef, 1, 1);
          const tot = p.labour + p.material;
          return `<tr><td data-v="${w.name}">${w.name}${w.perCm ? ' <span class="qty">za 1 cm grubości</span>' : ''}</td>
<td class="num" data-v="${units[w.unit].name}">${units[w.unit].name}</td>
<td class="num" data-v="${p.labour}">${money(Math.round(p.labour))}</td>
<td class="num" data-v="${p.material}">${p.material ? money(Math.round(p.material)) : 'własny'}</td>
<td class="num" data-v="${tot}"><b>${money(Math.round(tot))}</b></td></tr>`;
        })
        .join('');
      return `<h3 class="group-title">${cat.name}</h3>
<div class="board-wrap"><table class="board">
<thead><tr><th data-sort="off">Robota</th><th>Jedn.</th><th>Robocizna</th><th>Materiał</th><th>Razem</th></tr></thead>
<tbody>${trs}</tbody></table></div>`;
    })
    .join('');

  const std = turnkeyPerM2(city.coef, 1);
  const med = turnkeyPerM2(1, 1);
  const diff = Math.round((std / med - 1) * 100);

  await write(
    `ceny/${city.slug}`,
    layout({
      title: tytul(`Cennik robót remontowych ${city.loc}`, ` ${YEAR}`, `: stawki za m²`),
      description: `Ile kosztują roboty remontowe ${city.loc}: tynki, gładzie, wylewka, płytki, elektryka, hydraulika. Robocizna i materiał osobno, ceny w zł.`,
      path: `/ceny/${city.slug}/`,
      breadcrumb: `<a href="${R}">Cennik</a> · ${city.name}`,
      body: `
<section><div class="wrap">
  <p class="eyebrow">Województwo ${city.voivodeship} · współczynnik cen ${city.coef.toFixed(2)}</p>
  <h1>Roboty remontowe ${city.loc}</h1>
  <p class="lede">Remont pod klucz wychodzi tu około ${money(Math.round(std))} zł za m², czyli ${diff === 0 ? 'dokładnie tyle, co średnio w kraju' : diff > 0 ? `o ${diff}% powyżej` : `o ${Math.abs(diff)}% poniżej`} średniej krajowej stawki.</p>
  ${draftFlag}
  ${(city.opis || []).map((a, i) => `<p class="${i === 0 ? 'kat-wstep' : 'section-note'}">${a}</p>`).join('')}

  <h2 style="margin-top:2rem">Cennik robót ${city.loc}</h2>
  <p class="section-note">Słowo „własny” w kolumnie Materiał oznacza, że tę pozycję zwykle kupuje inwestor, a ekipa liczy wyłącznie robociznę. Kliknięcie nagłówka sortuje tabelę.</p>
  ${rows}
  <h2 style="margin-top:2rem">Policz swój zakres</h2>
  <div class="city-links">
    <a href="${R}kalkulator/remont-mieszkania/">Mieszkanie pod klucz</a>
    <a href="${R}kalkulator/lazienka/">Łazienka</a>
    <a href="${R}kalkulator/ocieplenie-elewacji/">Ocieplenie elewacji</a>
    <a href="${R}kalkulator/dach/">Pokrycie dachu</a>
    <a href="${R}sprawdz-oferte/">Sprawdź ofertę wykonawcy</a>
  </div>
</div></section>`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: city.name,
        address: { '@type': 'PostalAddress', addressCountry: 'PL', addressLocality: city.name },
      },
      script: `${calcScript}
document.querySelectorAll('table.board').forEach(bindSort);`,
    })
  );
}

/* ================= kalkulator: mieszkanie ================= */

await write(
  'kalkulator/remont-mieszkania',
  layout({
    title: 'Kalkulator remontu mieszkania: kosztorys według metrażu',
    description: 'Policz koszt remontu mieszkania pod klucz: metraż, standard wykończenia, demontaże, elektryka. Kosztorys z podziałem na roboty, ceny w zł.',
    path: '/kalkulator/remont-mieszkania/',
    breadcrumb: `<a href="${R}">Cennik</a> · Kalkulator remontu mieszkania`,
    body: `
<section><div class="wrap">
  <h1>Remont mieszkania pod klucz</h1>
  <p class="lede">Ilości liczone są z metrażu według typowych proporcji: ścian i sufitów jest mniej więcej trzy razy więcej niż podłogi, a strefy mokre zajmują około jednej czwartej powierzchni.</p>
  ${draftFlag}
  <div class="calc-grid" style="margin-top:1.5rem">
    <div class="panel">
      <h2>Parametry</h2>
      <form id="calc">
        ${field({ name: 'area', label: 'Powierzchnia mieszkania', value: 50, min: 10, max: 300, suffix: 'm²' })}
        <div class="fields-2">
          ${select({ name: 'city', label: 'Miasto', options: cityOptions })}
          ${select({ name: 'level', label: 'Standard wykończenia', options: levels.map((l) => ({ v: l.id, t: l.name, sel: l.id === 'standard' })) })}
        </div>
        ${field({ name: 'doors', label: 'Drzwi wewnętrzne', value: 3, min: 0, max: 12, step: 1, suffix: 'szt.' })}
        <p class="group-title">Zakres prac</p>
        ${check({ name: 'demont', label: 'Demontaż starego wykończenia i wywóz gruzu', checked: true })}
        ${check({ name: 'tynk', label: 'Tynkowanie ścian', checked: true })}
        ${check({ name: 'wylewka', label: 'Nowa wylewka podłogowa', checked: true })}
        ${check({ name: 'elektryka', label: 'Wymiana instalacji elektrycznej', checked: true })}
        ${check({ name: 'lazienka', label: 'Płytki i biały montaż w łazience', checked: true })}
        ${check({ name: 'sufit', label: 'Sufity podwieszane i zabudowy', checked: true })}
      </form>
      <p class="panel-note" data-level-note></p>
    </div>
    <div class="sticky-sheet">${estimateSheet({ title: 'Mieszkanie', sub: '' })}</div>
  </div>
</div></section>`,
    script: `${calcScript}
const W = ${W_JSON};
const CITIES = ${CITY_MAP};
const SCOPE = ${JSON.stringify(standardScope)};
(function(){
  const f = document.getElementById('calc');
  const sheet = document.getElementById('sheet');
  bindForm(f, () => {
    const v = readForm(f);
    const a = v.area || 0;
    const [coef, cityName] = CITIES[v.city];
    const level = W.levels.find(l => l.id === v.level);
    const off = new Set();
    for (const [g, ids] of Object.entries(SCOPE.groups)) if (v[g] === false) ids.forEach(i => off.add(i));
    const L = [];
    for (const [id, q] of Object.entries(SCOPE.items)){
      if (off.has(id)) continue;
      const qty = id === SCOPE.doorsItem ? (v.doors || 0) : q * a;
      L.push({ id, qty: Math.round(qty * 100) / 100, cm: 5 });
    }
    const est = estimate(W, L, coef, level.k);
    drawEstimate(sheet, W, est, { perM2: a });
    sheet.querySelector('[data-sheet-title]').textContent = cityName + ', ' + F(a) + ' m²';
    sheet.querySelector('[data-sheet-sub]').textContent = 'standard ' + level.name.toLowerCase();
    document.querySelector('[data-level-note]').textContent = level.note;
  });
  bindSheetActions(sheet);
})();`,
  })
);

/* ================= kalkulator: łazienka ================= */

await write(
  'kalkulator/lazienka',
  layout({
    title: 'Kalkulator remontu łazienki: ile kosztują płytki i biały montaż',
    description: 'Ile kosztuje remont łazienki: płytki, hydroizolacja, montaż wanny, kabiny, WC i umywalki. Kosztorys pozycja po pozycji, ceny w zł.',
    path: '/kalkulator/lazienka/',
    breadcrumb: `<a href="${R}">Cennik</a> · Kalkulator remontu łazienki`,
    body: `
<section><div class="wrap">
  <h1>Remont łazienki</h1>
  <p class="lede">Najdroższe pomieszczenie w mieszkaniu w przeliczeniu na metr: na pięciu metrach spotykają się hydroizolacja, płytki, hydraulika i elektryka.</p>
  ${draftFlag}
  <div class="calc-grid" style="margin-top:1.5rem">
    <div class="panel">
      <h2>Wymiary</h2>
      <form id="calc">
        <div class="fields-2">
          ${field({ name: 'len', label: 'Długość', value: 2.4, min: 1, max: 8, step: 0.1, suffix: 'm' })}
          ${field({ name: 'wid', label: 'Szerokość', value: 1.8, min: 1, max: 8, step: 0.1, suffix: 'm' })}
        </div>
        <div class="fields-2">
          ${field({ name: 'tileH', label: 'Wysokość płytek', value: 2.4, min: 0, max: 3.2, step: 0.1, suffix: 'm' })}
          ${select({ name: 'city', label: 'Miasto', options: cityOptions })}
        </div>
        ${select({ name: 'level', label: 'Klasa materiałów', options: levels.map((l) => ({ v: l.id, t: l.name, sel: l.id === 'standard' })) })}
        ${check({ name: 'big', label: 'Płytki wielkoformatowe zamiast zwykłych' })}
        <p class="group-title">Przygotowanie</p>
        ${check({ name: 'demont', label: 'Skucie starych płytek', checked: true })}
        ${check({ name: 'hydro', label: 'Hydroizolacja podpłytkowa', checked: true })}
        ${check({ name: 'zabudowa', label: 'Zabudowa pionu', checked: true, qty: 3 })}
        ${check({ name: 'podloga', label: 'Ogrzewanie podłogowe' })}
        <p class="group-title">Biały montaż</p>
        ${check({ name: 'wanna', label: 'Wanna', checked: true })}
        ${check({ name: 'kabina', label: 'Kabina prysznicowa' })}
        ${check({ name: 'odplyw', label: 'Odpływ liniowy (prysznic bez brodzika)' })}
        ${check({ name: 'wc', label: 'WC ze stelażem', checked: true })}
        ${check({ name: 'umywalka', label: 'Umywalka', checked: true })}
        ${check({ name: 'pralka', label: 'Podłączenie pralki', checked: true })}
        ${check({ name: 'grzejnik', label: 'Grzejnik drabinkowy', checked: true })}
        ${check({ name: 'punkty', label: 'Punkty elektryczne', checked: true, qty: 4 })}
      </form>
    </div>
    <div class="sticky-sheet">${estimateSheet({ title: 'Łazienka', sub: '' })}</div>
  </div>
</div></section>`,
    script: `${calcScript}
const W = ${W_JSON};
const CITIES = ${CITY_MAP};
(function(){
  const f = document.getElementById('calc');
  const sheet = document.getElementById('sheet');
  bindForm(f, () => {
    const v = readForm(f);
    const floor = (v.len || 0) * (v.wid || 0);
    const perim = 2 * ((v.len || 0) + (v.wid || 0));
    const wall = perim * (v.tileH || 0);
    const [coef, cityName] = CITIES[v.city];
    const level = W.levels.find(l => l.id === v.level);
    const L = [];
    const add = (id, qty) => L.push({ id, qty: Math.round(qty * 100) / 100 });
    if (v.demont){ add('skuwanie_plytek', wall + floor); add('wywoz_gruzu', (wall + floor) * 0.03); }
    if (v.hydro) add('hydroizolacja', floor + perim * 0.6);
    if (v.podloga) add('ogrzewanie_podlogowe', floor * 0.85);
    add(v.big ? 'plytki_wielkoformat' : 'plytki_podloga', floor);
    add(v.big ? 'plytki_wielkoformat' : 'plytki_sciana', wall);
    add('silikonowanie', perim + 4);
    if (v.zabudowa) add('zabudowa_rury', v.zabudowa_qty || 0);
    if (v.wanna){ add('montaz_wanny', 1); add('montaz_baterii', 1); add('punkt_wod_kan', 1); }
    if (v.kabina){ add('montaz_kabiny', 1); add('montaz_baterii', 1); add('punkt_wod_kan', 1); }
    if (v.odplyw) add('odplyw_liniowy', 1);
    if (v.wc){ add('montaz_wc', 1); add('punkt_wod_kan', 1); }
    if (v.umywalka){ add('montaz_umywalki', 1); add('montaz_baterii', 1); add('punkt_wod_kan', 1); }
    if (v.pralka){ add('podlaczenie_pralki', 1); add('punkt_wod_kan', 1); }
    if (v.grzejnik) add('grzejnik', 1);
    if (v.punkty) add('punkt_elektryczny', v.punkty_qty || 0);
    const est = estimate(W, L, coef, level.k);
    drawEstimate(sheet, W, est, { perM2: floor });
    sheet.querySelector('[data-sheet-title]').textContent = cityName + ', ' + F(Math.round(floor * 10) / 10) + ' m²';
    sheet.querySelector('[data-sheet-sub]').textContent = F(Math.round(wall)) + ' m² płytek na ścianach';
  });
  bindSheetActions(sheet);
})();`,
  })
);

/* ================= kalkulator: wylewka ================= */

await write(
  'kalkulator/wylewka',
  layout({
    title: 'Kalkulator wylewki: cena za m² i ilość materiału',
    description: 'Policz wylewkę podłogową: objętość zaprawy, liczba worków, cena robocizny i materiału za m² w polskich miastach. Cementowa, anhydrytowa, samopoziomująca.',
    path: '/kalkulator/wylewka/',
    breadcrumb: `<a href="${R}">Cennik</a> · Kalkulator wylewki`,
    body: `
<section><div class="wrap">
  <h1>Wylewka podłogowa</h1>
  <p class="lede">Cena wylewki zależy nie tyle od powierzchni, ile od grubości warstwy: materiał liczy się w metrach sześciennych, robocizna w kwadratowych.</p>
  ${draftFlag}
  <div class="calc-grid" style="margin-top:1.5rem">
    <div class="panel">
      <h2>Parametry</h2>
      <form id="calc">
        ${field({ name: 'area', label: 'Powierzchnia', value: 40, min: 1, max: 500, suffix: 'm²' })}
        ${field({ name: 'cm', label: 'Grubość warstwy', value: 5, min: 2, max: 20, step: 0.5, suffix: 'cm', hint: 'Minimum dla wylewki cementowej na stropie to 4 cm, na warstwie izolacji 5 cm.' })}
        ${select({
          name: 'type',
          label: 'Rodzaj wylewki',
          options: [
            { v: 'wylewka_cem', t: 'Cementowa', sel: true },
            { v: 'wylewka_anhydryt', t: 'Anhydrytowa (mixokret)' },
          ],
        })}
        ${select({ name: 'city', label: 'Miasto', options: cityOptions })}
        ${check({ name: 'styropian', label: 'Izolacja ze styropianu pod wylewką' })}
        ${check({ name: 'samopoziom', label: 'Masa samopoziomująca na wierzchu' })}
        ${check({ name: 'demont', label: 'Demontaż starej podłogi i wywóz', checked: true })}
      </form>
      <p class="panel-note" data-volume></p>
    </div>
    <div class="sticky-sheet">${estimateSheet({ title: 'Wylewka', sub: '' })}</div>
  </div>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'Jak policzyć koszt wylewki podłogowej',
      inLanguage: 'pl',
      step: [
        { '@type': 'HowToStep', text: 'Zmierz powierzchnię pomieszczenia w metrach kwadratowych.' },
        { '@type': 'HowToStep', text: 'Ustal grubość warstwy: minimum 4 cm na stropie, 5 cm na izolacji.' },
        { '@type': 'HowToStep', text: 'Pomnóż powierzchnię przez grubość, aby otrzymać objętość zaprawy w metrach sześciennych.' },
        { '@type': 'HowToStep', text: 'Dodaj koszt robocizny za metr kwadratowy i materiału za metr sześcienny.' },
      ],
    },
    script: `${calcScript}
const W = ${W_JSON};
const CITIES = ${CITY_MAP};
(function(){
  const f = document.getElementById('calc');
  const sheet = document.getElementById('sheet');
  bindForm(f, () => {
    const v = readForm(f);
    const a = v.area || 0, cm = v.cm || 0;
    const [coef, cityName] = CITIES[v.city];
    const L = [{ id: v.type, qty: a, cm }];
    if (v.styropian) L.push({ id: 'izolacja_styropian', qty: a });
    if (v.samopoziom) L.push({ id: 'samopoziomujaca', qty: a });
    if (v.demont){ L.push({ id: 'demontaz_podlogi', qty: a }); L.push({ id: 'wywoz_gruzu', qty: a * 0.05 }); }
    const est = estimate(W, L, coef, 1);
    drawEstimate(sheet, W, est, { perM2: a });
    sheet.querySelector('[data-sheet-title]').textContent = cityName + ', ' + F(a) + ' m²';
    sheet.querySelector('[data-sheet-sub]').textContent = 'warstwa ' + F(cm) + ' cm';
    const vol = a * cm / 100;
    document.querySelector('[data-volume]').textContent =
      'Objętość zaprawy ' + F(Math.round(vol * 100) / 100) + ' m³, czyli około ' + Math.ceil(vol * 2000 / 25) +
      ' worków suchej mieszanki po 25 kg albo ' + F(Math.round(vol * 1.6 * 10) / 10) + ' t piasku z cementem przy mieszaniu na miejscu.';
  });
  bindSheetActions(sheet);
})();`,
  })
);

/* ================= kalkulatory pojedynczych robót ================= */

for (const c of CALCS) {
  await write(
    `kalkulator/${c.slug}`,
    calcPage({ c, cityOptions, W_JSON, CITY_MAP, sourceFlag: draftFlag })
  );
}

/* ================= metodologia ================= */

await write(
  'jak-liczymy',
  layout({
    title: 'Jak liczymy ceny remontu',
    description: 'Metodyka: stawki bazowe dla Polski, współczynniki miast, standardy wykończenia, co wchodzi w kosztorys i czego w nim nie ma.',
    path: '/jak-liczymy/',
    breadcrumb: `<a href="${R}">Cennik</a> · Jak liczymy`,
    body: `
<section><div class="wrap">
  <h1>Jak liczymy</h1>
  ${draftFlag}
  <h2>Stawka bazowa razy współczynnik miasta</h2>
  <p class="section-note">Każda robota ma jedną stawkę bazową, czyli medianę dla Polski. Cena w konkretnym mieście to stawka bazowa pomnożona przez współczynnik. Współczynnik obciąża przede wszystkim robociznę: worek kleju kosztuje tyle samo w Warszawie i Białymstoku, godzina fachowca już nie. Dzięki temu kilkaset pozycji da się trzymać w jednym pliku i aktualizować naraz, zamiast budować osobny cennik dla każdego miasta.</p>
  <div class="board-wrap"><table class="board">
    <thead><tr><th data-sort="off">Miasto</th><th>Współczynnik</th><th>Pod klucz, zł/m²</th></tr></thead>
    <tbody>${[...cities]
      .sort((a, b) => b.coef - a.coef)
      .map((c) => `<tr><td>${c.name}</td><td class="num" data-v="${c.coef}">${c.coef.toFixed(2)}</td><td class="num" data-v="${Math.round(turnkeyPerM2(c.coef, 1))}">${money(Math.round(turnkeyPerM2(c.coef, 1)))}</td></tr>`)
      .join('')}</tbody>
  </table></div>

  <h2 style="margin-top:2rem">Standardy wykończenia</h2>
  <div class="cards">${levels
    .map((l) => `<div class="card"><h3>${l.name}</h3><p class="big">×${l.k}</p><p>${l.note}</p></div>`)
    .join('')}</div>
  <p class="section-note" style="margin-top:1rem">Współczynnik standardu w całości przekłada się na materiały, a na robociznę tylko w jednej trzeciej: ułożenie drogiej płytki jest nieco trudniejsze niż taniej, ale nie półtora raza.</p>

  <h2 style="margin-top:2rem">Co wchodzi w cenę za metr</h2>
  <p class="section-note">${standardScope.note} Dlatego nasza kwota jest niższa od tych 2500 zł za metr, które padają w reklamach: tam w środku siedzi już płytka z górnej półki, meble i sprzęt AGD.</p>

  <h2 style="margin-top:2rem">Czego w kosztorysie nie ma</h2>
  <p class="section-note">Armatura, baterie, drzwi, oprawy oświetleniowe i meble liczone są wyłącznie jako montaż, bo zwykle kupuje je inwestor. Nie ma tu również projektu, pozwoleń, wynajmu mieszkania na czas remontu ani prac nieprzewidzianych, na które warto doliczyć od 10 do 15 procent.</p>

  <h2 style="margin-top:2rem">Źródła stawek</h2>
  <p class="section-note">Stawka bazowa każdej pozycji to mediana widełek, które podają publiczne zestawienia cen robót. Poniżej lista opracowań wykorzystanych przy ostatniej kalibracji z ${meta.checked}. Widełki bywają szerokie, bo obejmują różny stan podłoża i różny standard wykonania, dlatego bierzemy środek przedziału, a nie jego dolny kraniec.</p>
  <div class="board-wrap"><table class="board">
    <thead><tr><th data-sort="off">Opracowanie</th><th>Data</th></tr></thead>
    <tbody>${(meta.sources || [])
      .map((s) => `<tr><td>${s.name}</td><td class="num">${s.date}</td></tr>`)
      .join('')}</tbody>
  </table></div>
  <p class="section-note" style="margin-top:1rem">Ceny materiałów przeliczamy na jednostkę roboty z uwzględnieniem zużycia i docinki. Statystykę cen w budownictwie GUS traktujemy jako kontrolę dynamiki, a nie źródło wartości bezwzględnych.</p>

  <h2 style="margin-top:2rem">Dwa stopnie pewności stawki</h2>
  <p class="section-note">Przy ${works.filter((w) => w.sprawdzone).length} pozycjach źródło podaje liczbę dla tej konkretnej roboty i tak są oznaczone na swoich stronach. Pozostałe ${works.filter((w) => !w.sprawdzone).length} wyprowadziliśmy z przedziału dla całej grupy robót: rząd wielkości jest właściwy, ale konkretna kwota może odbiegać mocniej. Rozróżnienie widać pod tabelą składników ceny na każdej stronie pozycji, bo udawanie precyzji, której nie ma, byłoby gorsze niż jej brak.</p>

  <h2 style="margin-top:2rem">Które opracowanie stoi za którą kategorią</h2>
  <p class="section-note">Ta sama informacja widoczna jest przy każdej pozycji cennika, pod tabelą składników ceny.</p>
  <div class="board-wrap"><table class="board">
    <thead><tr><th data-sort="off">Kategoria</th><th data-sort="off">Opracowania</th></tr></thead>
    <tbody>${categories
      .map((c) => `<tr><td>${c.name}</td><td style="text-align:left;white-space:normal">${(c.zrodla || [])
        .map((i) => (meta.sources || [])[i])
        .filter(Boolean)
        .map((z) => `${z.name} <span class="qty">${z.date}</span>`)
        .join('<br>')}</td></tr>`)
      .join('')}</tbody>
  </table></div>

  <h2 style="margin-top:2rem">Czego ta metoda nie obejmuje</h2>
  <p class="section-note">Mediana widełek to punkt odniesienia, nie wycena. Ekipa z pełnym kalendarzem podaje więcej, ekipa szukająca zlecenia mniej, a przy małym metrażu dochodzi dojazd i rozruch sprzętu, które przy jednym pomieszczeniu potrafią podnieść stawkę za metr o kilkadziesiąt procent.</p>
</div></section>`,
    script: `${calcScript}
document.querySelectorAll('table.board').forEach(bindSort);`,
  })
);

/* ================= strony usług: /kategoria/usluga/ i /kategoria/usluga/miasto/ ================= */

const serviceUrls = [];
const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

await write('uslugi', servicesIndex({ categories, works, units, unitPrice }));
serviceUrls.push('/uslugi/');

for (const cat of categories) {
  const list = works.filter((w) => w.cat === cat.id);
  await write(`uslugi/${cat.slug}`, categoryPage({ cat, works: list, units, unitPrice }));
  serviceUrls.push(`/uslugi/${cat.slug}/`);

  for (const w of list) {
    const wSlug = slugify(w.name);
    const related = list.filter((r) => r.id !== w.id).slice(0, 3);
    await write(
      `${cat.slug}/${wSlug}`,
      servicePage({ w, cat, units, cities, unitPrice, related, cityOptions, powiazane: powiazania[w.id] || [], meta })
    );
    serviceUrls.push(`/${cat.slug}/${wSlug}/`);

    for (const city of cities) {
      await write(
        `${cat.slug}/${wSlug}/${city.slug}`,
        serviceCityPage({ w, cat, city, units, cities, unitPrice, cityOptions, powiazane: powiazania[w.id] || [], meta })
      );
      serviceUrls.push(`/${cat.slug}/${wSlug}/${city.slug}/`);
    }
  }
}

/* ================= 404 ================= */

await writeFile(
  join(OUT, '404.html'),
  layout({
    title: 'Nie znaleziono strony',
    description: 'Ta strona nie istnieje. Sprawdź cennik robót remontowych albo skorzystaj z kalkulatora.',
    path: '/404.html',
    body: `
<section><div class="wrap">
  <p class="eyebrow">Błąd 404</p>
  <h1>Tej strony tu nie ma</h1>
  <p class="lede">Adres jest nieaktualny albo zawiera literówkę. Poniżej skróty do tego, czego zwykle szukają odwiedzający.</p>
  <div class="panel" style="margin-top:1.4rem;max-width:34rem">
    <label class="field">
      <span class="f-label">Poszukaj tego, po co przyszedłeś</span>
      <span class="f-input"><input type="search" id="q404" name="q" placeholder="np. wylewka, płytki, dach"></span>
    </label>
    <p class="range-note">Wpisz nazwę roboty i naciśnij Enter.</p>
  </div>

  <h2 style="margin-top:2rem">Albo zacznij stąd</h2>
  <div class="cards">
    <div class="card"><h3><a href="${R}uslugi/">Katalog robót</a></h3><p>Wszystkie pozycje ze stawkami za jednostkę.</p></div>
    <div class="card"><h3><a href="${R}kalkulator/remont-mieszkania/">Kalkulator remontu</a></h3><p>Kosztorys mieszkania według metrażu.</p></div>
    <div class="card"><h3><a href="${R}">Ceny w miastach</a></h3><p>Stawki w dziesięciu największych miastach.</p></div>
  </div>
</div></section>`,
    script: `
(function(){
  const p = document.getElementById('q404');
  p.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const q = p.value.trim();
    if (q) location.href = '${R}szukaj/?q=' + encodeURIComponent(q);
  });
})();`,
  })
);

/* ================= metraże i porównania ================= */

setCats(categories);
const SCOPE_JSON = JSON.stringify(standardScope);
const extraUrls = [];

for (const mm of METRAZE) {
  await write(
    `koszt-remontu/${mm.m}-m2`,
    metrazPage({ mm, cities, turnkeyPerM2, levels, cityOptions, W_JSON, CITY_MAP, SCOPE_JSON, sourceFlag: draftFlag })
  );
  extraUrls.push(`/koszt-remontu/${mm.m}-m2/`);
}

await write('kalkulatory', kalkulatoryIndexPage());
await write('koszty', wyliczeniaIndexPage({ METRAZE, POKOJE, LAZIENKI, KUCHNIE, PODDASZA, BALKONY, DOMY, DOMY_REMONT, WYKONCZENIA }));
extraUrls.push('/kalkulatory/', '/koszty/');
await write('porownanie', porownaniaIndex(POROWNANIA));
extraUrls.push('/porownanie/');
for (const p of POROWNANIA) {
  await write(`porownanie/${p.slug}`, porownaniePage({ p, byId, units, unitPrice, sourceFlag: draftFlag }));
  extraUrls.push(`/porownanie/${p.slug}/`);
}

for (const dm of DOMY) {
  await write(
    `koszt-ocieplenia/${dm.m}-m2`,
    ocieplenieMetrazPage({ dm, cities, unitPrice, cityOptions, W_JSON, CITY_MAP, sourceFlag: draftFlag })
  );
  extraUrls.push(`/koszt-ocieplenia/${dm.m}-m2/`);
}

for (const wm of WYKONCZENIA) {
  await write(
    `koszt-wykonczenia/${wm.m}-m2`,
    wykonczenieMetrazPage({ wm, cities, unitPrice, levels, sourceFlag: draftFlag })
  );
  extraUrls.push(`/koszt-wykonczenia/${wm.m}-m2/`);
}

for (const dm of DOMY_REMONT) {
  await write(
    `koszt-remontu-domu/${dm.m}-m2`,
    remontDomuPage({ dm, cities, unitPrice, standardScope, sourceFlag: draftFlag })
  );
  extraUrls.push(`/koszt-remontu-domu/${dm.m}-m2/`);
}

for (const lz of LAZIENKI) {
  await write(
    `koszt-lazienki/${lz.m}-m2`,
    lazienkaMetrazPage({ lz, cities, unitPrice, levels, sourceFlag: draftFlag })
  );
  extraUrls.push(`/koszt-lazienki/${lz.m}-m2/`);
}

for (const kh of KUCHNIE) {
  await write(
    `koszt-kuchni/${kh.m}-m2`,
    kuchniaMetrazPage({ kh, cities, unitPrice, levels, sourceFlag: draftFlag })
  );
  extraUrls.push(`/koszt-kuchni/${kh.m}-m2/`);
}

for (const pd of PODDASZA) {
  await write(
    `koszt-poddasza/${pd.m}-m2`,
    poddaszeMetrazPage({ pd, cities, unitPrice, levels, sourceFlag: draftFlag })
  );
  extraUrls.push(`/koszt-poddasza/${pd.m}-m2/`);
}

for (const bl of BALKONY) {
  await write(
    `koszt-balkonu/${bl.m}-m2`,
    balkonMetrazPage({ bl, cities, unitPrice, levels, sourceFlag: draftFlag })
  );
  extraUrls.push(`/koszt-balkonu/${bl.m}-m2/`);
}

for (const pk of POKOJE) {
  await write(
    `koszt-pokoju/${pk.m}-m2`,
    pokojMetrazPage({ pk, cities, unitPrice, levels, sourceFlag: draftFlag })
  );
  extraUrls.push(`/koszt-pokoju/${pk.m}-m2/`);
}

/* ================= poradniki ================= */

const catSlug = (id) => categories.find((c) => c.id === id).slug;
await write('poradnik', poradnikiIndex(PORADNIKI));
extraUrls.push('/poradnik/');
for (const p of PORADNIKI) {
  await write(`poradnik/${p.slug}`, poradnikPage({ p, byId, units, unitPrice, catSlug, slugify }));
  extraUrls.push(`/poradnik/${p.slug}/`);
}

/* ================= strony zaufania ================= */

const staticPages = [
  {
    slug: 'o-nas',
    title: 'O serwisie uslugiceny.pl',
    desc: 'Kto prowadzi serwis, skąd biorą się stawki i dlaczego publikujemy metodę wyliczeń zamiast samych liczb.',
    h1: 'O serwisie',
    body: `
  <p class="lede">uslugiceny.pl to baza cen robót remontowych i budowlanych w Polsce. Publikujemy stawki rozbite na robociznę i materiał oraz kalkulatory, które składają z nich kosztorys.</p>
  <h2 style="margin-top:1.8rem">Po co to powstało</h2>
  <p class="section-note">Pytanie „ile to kosztuje” zwykle dostaje jedną liczbę bez wyjaśnienia, co się w niej mieści. Tymczasem różnica między ofertami dwóch ekip najczęściej nie bierze się z chciwości, tylko z innego zakresu: jedna wlicza materiał, druga nie, jedna liczy demontaż, druga zakłada gotowe podłoże. Rozbijamy stawkę na części, żeby dało się porównać oferty, które na pierwszy rzut oka są nieporównywalne.</p>
  <h2 style="margin-top:1.8rem">Czego tu nie znajdziesz</h2>
  <p class="section-note">Nie pośredniczymy w zleceniach i nie sprzedajemy kontaktów do wykonawców, więc żadna ekipa nie płaci nam za wyższą pozycję ani za korzystniejszą stawkę. Nie podajemy też wycen wiążących: ostateczną cenę ustala wykonawca po obejrzeniu obiektu.</p>
  <h2 style="margin-top:1.8rem">Jak powstają liczby</h2>
  <p class="section-note">Każda stawka bazowa to mediana widełek z publicznych zestawień cen, przeliczana przez współczynnik miasta. Pełny opis metody wraz z listą źródeł i datami znajduje się na stronie <a href="${R}jak-liczymy/">Jak liczymy</a>. Dane aktualizujemy okresowo, a datę ostatniej kalibracji widać pod każdą tabelą.</p>`,
  },
  {
    slug: 'kontakt',
    title: 'Kontakt',
    desc: 'Napisz, jeśli masz uwagi do stawek, chcesz zgłosić błąd albo udostępnić własny cennik do kalibracji.',
    h1: 'Kontakt',
    body: `
  <p class="lede">Najbardziej przydatne wiadomości to te, które poprawiają dane.</p>
  <h2 style="margin-top:1.8rem">Zgłoszenie błędnej stawki</h2>
  <p class="section-note">Jeśli prowadzisz ekipę i widzisz, że któraś pozycja odbiega od realiów Twojego rynku, napisz jaka to pozycja, jakie miasto i jaka stawka jest Twoim zdaniem właściwa. Takie zgłoszenia trafiają do kolejnej kalibracji.</p>
  <h2 style="margin-top:1.8rem">Adres</h2>
  <p class="section-note">kontakt@uslugiceny.pl</p>
  <h2 style="margin-top:1.8rem">Współpraca</h2>
  <p class="section-note">Nie sprzedajemy miejsc w rankingach ani leadów. Jeśli chcesz udostępnić swój cennik jako źródło, podamy go na stronie metody razem z datą.</p>`,
  },
  {
    slug: 'polityka-prywatnosci',
    title: 'Polityka prywatności',
    desc: 'Jakie dane zbiera serwis uslugiceny.pl i w jaki sposób są wykorzystywane.',
    h1: 'Polityka prywatności',
    body: `
  <p class="lede">Serwis jest stroną statyczną. Nie prowadzimy kont użytkowników i nie zbieramy danych osobowych przez formularze.</p>

  <h2 style="margin-top:1.8rem">Administrator danych</h2>
  <p class="section-note">Administratorem danych zbieranych za pośrednictwem serwisu jest właściciel domeny uslugiceny.pl. Kontakt w każdej sprawie dotyczącej danych: kontakt@uslugiceny.pl.</p>

  <h2 style="margin-top:1.8rem">Kalkulatory</h2>
  <p class="section-note">Wszystkie wyliczenia wykonuje przeglądarka na Twoim urządzeniu. Wymiary i zakres prac, które wpisujesz w kalkulatorach, nie trafiają na nasz serwer. Zapisują się natomiast w adresie strony, żeby dało się wrócić do wyliczenia albo wysłać je wykonawcy. Jeśli udostępnisz taki link, odbiorca zobaczy wpisane przez Ciebie parametry.</p>

  <h2 style="margin-top:1.8rem">Zgoda na pliki cookies</h2>
  <p class="section-note">Przy pierwszej wizycie zobaczysz pytanie o zgodę na pliki cookies. Do momentu, w którym jej udzielisz, narzędzia analityczne działają w trybie ograniczonym i nie zapisują żadnych plików na Twoim urządzeniu. Odpowiada za to mechanizm Google Consent Mode, w którym stan domyślny ustawiony jest na odmowę jeszcze przed uruchomieniem kontenera.</p>
  <p class="section-note">Zgodę możesz w każdej chwili wycofać albo zmienić: służy do tego odnośnik „Zmień zgodę na cookies” w stopce każdej strony. Wycofanie zgody nie wpływa na zgodność z prawem przetwarzania, które nastąpiło wcześniej.</p>
  <p class="section-note">Nie korzystamy z cookies reklamowych ani profilujących. Zgoda dotyczy wyłącznie statystyki odwiedzin.</p>

  <h2 style="margin-top:1.8rem">Jakie dane zbiera statystyka</h2>
  <p class="section-note">Po wyrażeniu zgody Google Tag Manager uruchamia narzędzia analityczne Google, które przetwarzają dane o sposobie korzystania ze strony: odwiedzone adresy, źródło wejścia, przybliżoną lokalizację, typ urządzenia i przeglądarki. Dane służą wyłącznie do zrozumienia, które cenniki i kalkulatory są przydatne, i nie są łączone z Twoimi danymi osobowymi.</p>
  <p class="section-note">Podstawą przetwarzania jest Twoja zgoda. Dostawcą narzędzi jest Google Ireland Limited, a dane mogą być przekazywane poza Europejski Obszar Gospodarczy na zasadach opisanych w polityce prywatności Google.</p>
  <p class="section-note">Niezależnie od zgody możesz zablokować pliki cookies w ustawieniach przeglądarki. Strona działa wtedy bez żadnych ograniczeń: kalkulatory liczą, cenniki się otwierają, a link do wyceny nadal działa.</p>

  <h2 style="margin-top:1.8rem">Kroje pisma</h2>
  <p class="section-note">Kroje pisma pobierane są z serwerów Google, które mogą odnotować adres IP przy pobraniu pliku.</p>

  <h2 style="margin-top:1.8rem">Logi serwera</h2>
  <p class="section-note">Serwer zapisuje standardowe logi dostępu: adres IP, datę zapytania, adres strony i typ przeglądarki. Służą wyłącznie diagnostyce i bezpieczeństwu.</p>

  <h2 style="margin-top:1.8rem">Twoje prawa</h2>
  <p class="section-note">Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania oraz wniesienia sprzeciwu wobec przetwarzania opartego na uzasadnionym interesie. Przysługuje Ci również skarga do Prezesa Urzędu Ochrony Danych Osobowych.</p>

  <h2 style="margin-top:1.8rem">Kontakt w sprawie danych</h2>
  <p class="section-note">kontakt@uslugiceny.pl</p>`,
  },
];

for (const s of staticPages) {
  await write(
    s.slug,
    layout({
      title: s.title,
      description: s.desc,
      path: `/${s.slug}/`,
      breadcrumb: `<a href="${R}">Cennik</a> · ${s.h1}`,
      body: `<section><div class="wrap"><h1>${s.h1}</h1>${s.body}</div></section>`,
    })
  );
}

/* ================= narzędzia ================= */

await write('sprawdz-oferte', sprawdzOfertePage({ works, categories, units, cities, cityOptions, unitPrice }));
await write('szukaj', szukajPage());
await write('kiedy-remontowac', sezonowoscPage());
await write('slownik', slownikPage({ byId, categories, units, unitPrice, slugify }));
await write('porownaj-miasta', porownajMiastaPage({ works, categories, units, cities, unitPrice }));
await write('cennik', pelnyCennikPage({ works, categories, units, cities, cityOptions, unitPrice, sourceFlag: draftFlag }));
await write('struktura-kosztow', strukturaKosztowPage({ works, categories, units, unitPrice }));
await write('aktualizacje', aktualizacjePage({ works, meta }));
extraUrls.push('/sprawdz-oferte/', '/szukaj/', '/kiedy-remontowac/', '/slownik/', '/porownaj-miasta/', '/cennik/', '/struktura-kosztow/', '/aktualizacje/');

// Indeks wyszukiwarki: same strony docelowe, bez wariantów miejskich,
// bo lista 900 pozycji nie pomaga, tylko zasypuje wyniki powtórzeniami.
const indeks = [
  ...works.map((w) => {
    const cat = categories.find((c) => c.id === w.cat);
    const p = unitPrice(w.id, 1, 1, w.perCm ? 5 : 1);
    return {
      t: w.name,
      u: `${R}${cat.slug}/${slugify(w.name)}/`,
      k: cat.name,
      o: `${cat.name} · średnio ${money(Math.round(p.labour + p.material))} zł za ${units[w.unit].name}`,
    };
  }),
  ...categories.map((c) => ({ t: c.name, u: `${R}uslugi/${c.slug}/`, k: 'kategoria', o: c.lead })),
  ...CALCS.map((c) => ({ t: `Kalkulator: ${c.h1}`, u: `${R}kalkulator/${c.slug}/`, k: 'kalkulator', o: c.desc })),
  { t: 'Gotowe wyliczenia dla metraży', u: `${R}koszty/`, k: 'spis', o: 'Policzone zakresy dla typowych metraży w jednym miejscu.' },
  { t: 'Wszystkie kalkulatory', u: `${R}kalkulatory/`, k: 'spis', o: 'Piętnaście kalkulatorów kosztorysu w jednym miejscu.' },
  { t: 'Kalkulator remontu mieszkania', u: `${R}kalkulator/remont-mieszkania/`, k: 'kalkulator', o: 'Kosztorys mieszkania pod klucz według metrażu.' },
  { t: 'Kalkulator remontu łazienki', u: `${R}kalkulator/lazienka/`, k: 'kalkulator', o: 'Płytki, hydroizolacja i biały montaż sztuka po sztuce.' },
  { t: 'Kalkulator remontu pokoju', u: `${R}kalkulator/pokoj/`, k: 'kalkulator', o: 'Gładzie, malowanie, podłoga i listwy dla jednego pomieszczenia.' },
  { t: 'Kalkulator remontu kuchni', u: `${R}kalkulator/kuchnia/`, k: 'kalkulator', o: 'Instalacje pod sprzęt, fartuch nad blatem, gładzie i podłoga.' },
  { t: 'Kalkulator wykończenia poddasza', u: `${R}kalkulator/poddasze/`, k: 'kalkulator', o: 'Ocieplenie, zabudowa skosów, ścianki kolankowe i podłoga.' },
  { t: 'Kalkulator wylewki', u: `${R}kalkulator/wylewka/`, k: 'kalkulator', o: 'Objętość zaprawy, liczba worków i cena za m².' },
  ...PORADNIKI.map((p) => ({ t: p.h1, u: `${R}poradnik/${p.slug}/`, k: 'poradnik', o: p.desc })),
  ...POROWNANIA.map((p) => ({ t: `${p.h1}?`, u: `${R}porownanie/${p.slug}/`, k: 'porównanie', o: p.lede })),
  ...METRAZE.map((m) => ({ t: `Remont mieszkania ${m.m} m²`, u: `${R}koszt-remontu/${m.m}-m2/`, k: 'metraż', o: m.opis })),
  ...DOMY.map((m) => ({ t: `Ocieplenie domu ${m.m} m²`, u: `${R}koszt-ocieplenia/${m.m}-m2/`, k: 'metraż', o: m.opis })),
  ...WYKONCZENIA.map((m) => ({ t: `Wykończenie mieszkania ${m.m} m²`, u: `${R}koszt-wykonczenia/${m.m}-m2/`, k: 'metraż', o: m.opis })),
  ...DOMY_REMONT.map((m) => ({ t: `Remont domu ${m.m} m²`, u: `${R}koszt-remontu-domu/${m.m}-m2/`, k: 'metraż', o: m.opis })),
  ...LAZIENKI.map((m) => ({ t: `Remont łazienki ${m.m} m²`, u: `${R}koszt-lazienki/${m.m}-m2/`, k: 'metraż', o: m.opis })),
  ...KUCHNIE.map((m) => ({ t: `Remont kuchni ${m.m} m²`, u: `${R}koszt-kuchni/${m.m}-m2/`, k: 'metraż', o: m.opis })),
  ...PODDASZA.map((m) => ({ t: `Wykończenie poddasza ${m.m} m²`, u: `${R}koszt-poddasza/${m.m}-m2/`, k: 'metraż', o: m.opis })),
  ...BALKONY.map((m) => ({ t: `Remont balkonu ${m.m} m²`, u: `${R}koszt-balkonu/${m.m}-m2/`, k: 'metraż', o: m.opis })),
  ...POKOJE.map((m) => ({ t: `Remont pokoju ${m.m} m²`, u: `${R}koszt-pokoju/${m.m}-m2/`, k: 'metraż', o: m.opis })),
  ...cities.map((c) => ({ t: `Cennik robót: ${c.name}`, u: `${R}ceny/${c.slug}/`, k: 'miasto', o: `Pełny cennik robót remontowych ${c.loc}.` })),
  { t: 'Sprawdź ofertę wykonawcy', u: `${R}sprawdz-oferte/`, k: 'narzędzie', o: 'Porównaj kwotę z oferty z widełkami rynkowymi.' },
  { t: 'Porównaj dwa miasta', u: `${R}porownaj-miasta/`, k: 'narzędzie', o: 'Zestaw dwa miasta i zobacz różnicę w stawkach pozycja po pozycji.' },
  { t: 'Historia zmian w cenniku', u: `${R}aktualizacje/`, k: 'cennik', o: 'Co i kiedy zmienilo sie w stawkach, wraz z uzasadnieniem.' },
  { t: 'Robocizna czy materiał', u: `${R}struktura-kosztow/`, k: 'analiza', o: 'Udział pracy i materiału w każdej pozycji cennika.' },
  { t: 'Pełny cennik na jednej stronie', u: `${R}cennik/`, k: 'cennik', o: 'Wszystkie pozycje w jednym zestawieniu, do wydruku.' },
  { t: 'Kiedy remont wychodzi taniej', u: `${R}kiedy-remontowac/`, k: 'poradnik', o: 'Kalendarz obłożenia ekip i różnice stawek w ciągu roku.' },
  ...HASLA.map(([t, id, o]) => ({ t: `Co to jest: ${t}`, u: `${R}slownik/#${id}`, k: 'słownik', o: o.slice(0, 120) + '…' })),
];
await writeFile(join(OUT, 'search-index.json'), JSON.stringify(indeks));

/* ================= sitemap ================= */

const urls = [
  '/',
  '/jak-liczymy/',
  '/kalkulator/remont-mieszkania/',
  '/kalkulator/lazienka/',
  '/kalkulator/wylewka/',
  ...CALCS.map((c) => `/kalkulator/${c.slug}/`),
  ...cities.map((c) => `/ceny/${c.slug}/`),
  ...serviceUrls,
  ...staticPages.map((s) => `/${s.slug}/`),
  ...extraUrls,
];
// Data zmiany musi odpowiadac prawdzie, inaczej wyszukiwarka przestaje jej ufac.
// Tresc stron zalezy od stawek, wiec datujemy je ostatnia kalibracja cennika,
// a nie dniem, w ktorym akurat uruchomiono budowanie.
const dataKalibracji = `${meta.checked || meta.updated}-01`;
// Czestotliwosc zmian zalezy od rodzaju strony: cenniki i kalkulatory zmieniaja
// sie z kazda kalibracja stawek, poradniki i slownik znacznie rzadziej.
const czestotliwosc = (u) => {
  if (u === '/' || u.startsWith('/ceny/') || u.startsWith('/cennik')) return 'weekly';
  if (u.startsWith('/kalkulator/') || u.startsWith('/koszt-')) return 'weekly';
  if (u.startsWith('/poradnik/') || u.startsWith('/slownik') || u.startsWith('/porownanie/')) return 'monthly';
  return 'monthly';
};
await writeFile(
  join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map((u) => `  <url><loc>${SITE.base}${u}</loc><lastmod>${dataKalibracji}</lastmod><changefreq>${czestotliwosc(u)}</changefreq></url>`)
    .join('\n')}
</urlset>`
);
await writeFile(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE.base}/sitemap.xml\n`);
await writeFile(join(OUT, '.nojekyll'), '');
await cp('src/assets', join(OUT, 'assets'), { recursive: true });

// Pliki, ktore przegladarki i systemy pobieraja z katalogu glownego, a nie z assets:
// .htaccess czyta serwer, ikony i manifest sa szukane pod stalymi adresami.
const doKorzenia = [
  '.htaccess', 'favicon.ico', 'favicon.svg', 'favicon-32.png', 'favicon-96.png',
  'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest', 'og-image.png',
];
for (const f of doKorzenia) {
  await cp(join('src/assets', f), join(OUT, f));
  await rm(join(OUT, 'assets', f), { force: true });
}

console.log(`Gotowe: ${urls.length} stron w ${OUT}/`);
