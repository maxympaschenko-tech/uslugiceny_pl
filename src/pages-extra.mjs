// Dwie rodziny stron pod konkretne zapytania:
// 1) metraże ("ile kosztuje remont mieszkania 50 m2") — najczęstsza forma pytania o remont,
// 2) porównania ("wylewka cementowa czy anhydrytowa") — pytanie zadawane tuż przed decyzją.
// Obie korzystają z tych samych danych co reszta serwisu, więc nie rozjadą się z cennikiem.
import { layout, estimateSheet, calcScript, field, select, money } from './templates.mjs';
import { SITE } from './config.mjs';

const R = SITE.root;
const YEAR = new Date().getFullYear();

/* ---------- metraże ---------- */

export const METRAZE = [
  { m: 30, typ: 'kawalerka', opis: 'Kawalerka albo małe mieszkanie dwupokojowe. Jedna strefa mokra, zwykle jedne drzwi wewnętrzne i aneks kuchenny zamiast osobnej kuchni.', uwaga: 'Przy tak małym metrażu stawka za metr wychodzi wyżej niż w dużym mieszkaniu: dojazd, wniesienie materiału i rozstawienie sprzętu kosztują tyle samo, a rozkładają się na mniejszą powierzchnię.' },
  { m: 40, typ: 'dwa pokoje', opis: 'Typowe mieszkanie dwupokojowe z osobną kuchnią i jedną łazienką.', uwaga: 'To metraż, przy którym opłaca się już zamawiać wylewkę maszynowo, bo koszt podstawienia sprzętu rozkłada się na sensowną powierzchnię.' },
  { m: 50, typ: 'dwa lub trzy pokoje', opis: 'Najczęstszy metraż w polskich blokach: dwa duże albo trzy mniejsze pokoje, kuchnia i łazienka.', uwaga: 'Przy pięćdziesięciu metrach różnica między standardem ekonomicznym a premium sięga kilkudziesięciu tysięcy złotych, głównie przez okładziny i stolarkę.' },
  { m: 60, typ: 'trzy pokoje', opis: 'Mieszkanie trzypokojowe, zwykle z osobną łazienką i wydzieloną toaletą albo z miejscem na pralkę poza łazienką.', uwaga: 'Druga strefa mokra to nie tylko więcej płytek: dochodzi kolejny punkt wodno-kanalizacyjny, hydroizolacja i osobny biały montaż.' },
  { m: 70, typ: 'trzy lub cztery pokoje', opis: 'Duże mieszkanie rodzinne, często z aneksem i garderobą.', uwaga: 'Przy tym metrażu warto rozbić remont na etapy pomieszczeniami, bo zamieszkanie w trakcie prac bywa tańsze niż wynajem lokalu zastępczego na dwa miesiące.' },
  { m: 80, typ: 'cztery pokoje', opis: 'Mieszkanie czteropokojowe albo mniejszy dom w zabudowie szeregowej.', uwaga: 'Powyżej osiemdziesięciu metrów ekipy częściej godzą się na stawkę ryczałtową za całość zamiast rozliczenia pozycja po pozycji.' },
];

export function metrazPage({ mm, cities, turnkeyPerM2, levels, cityOptions, W_JSON, CITY_MAP, SCOPE_JSON, sourceFlag }) {
  const lvl = Object.fromEntries(levels.map((l) => [l.id, l.k]));
  const rows = [...cities]
    .sort((a, b) => turnkeyPerM2(b.coef, 1) - turnkeyPerM2(a.coef, 1))
    .map((c) => `<tr>
<td data-v="${c.name}"><a href="${R}ceny/${c.slug}/">${c.name}</a></td>
<td class="num" data-v="${Math.round(turnkeyPerM2(c.coef, lvl.ekonom) * mm.m)}">${money(Math.round(turnkeyPerM2(c.coef, lvl.ekonom) * mm.m))}</td>
<td class="num" data-v="${Math.round(turnkeyPerM2(c.coef, 1) * mm.m)}"><b>${money(Math.round(turnkeyPerM2(c.coef, 1) * mm.m))}</b></td>
<td class="num" data-v="${Math.round(turnkeyPerM2(c.coef, lvl.premium) * mm.m)}">${money(Math.round(turnkeyPerM2(c.coef, lvl.premium) * mm.m))}</td>
</tr>`).join('');

  const war = cities.find((c) => c.slug === 'warszawa');
  const tanie = cities.reduce((a, b) => (a.coef < b.coef ? a : b));

  return layout({
    title: `Ile kosztuje remont mieszkania ${mm.m} m² w ${YEAR} roku`,
    description: `Koszt remontu mieszkania ${mm.m} m² pod klucz: od ${money(Math.round(turnkeyPerM2(tanie.coef, lvl.ekonom) * mm.m))} do ${money(Math.round(turnkeyPerM2(war.coef, lvl.premium) * mm.m))} zł zależnie od miasta i standardu. Pełne wyliczenie pozycja po pozycji.`,
    path: `/koszt-remontu/${mm.m}-m2/`,
    breadcrumb: `<a href="${R}">Cennik</a> · <a href="${R}kalkulator/remont-mieszkania/">Kalkulatory</a> · Remont ${mm.m} m²`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">${mm.typ} · aktualizacja ${SITE.updated}</p>
  <h1>Remont mieszkania ${mm.m} m²</h1>
  <p class="lede">W standardzie podstawowym remont ${mm.m} metrów pod klucz kosztuje około ${money(Math.round(turnkeyPerM2(war.coef, 1) * mm.m))} zł w Warszawie i ${money(Math.round(turnkeyPerM2(tanie.coef, 1) * mm.m))} zł ${tanie.loc}.</p>
  <p class="section-note">${mm.opis}</p>
  ${sourceFlag}

  <h2 style="margin-top:2rem">Koszt w dziesięciu miastach</h2>
  <p class="section-note">Wyliczenie dla pełnego zakresu: demontaże, tynki, gładzie, malowanie, wylewka, panele, płytki w strefach mokrych, instalacja elektryczna, biały montaż, drzwi i sprzątanie. Bez mebli, armatury i sprzętu.</p>
  <div class="board-wrap"><table class="board" id="board">
    <thead><tr><th data-sort="off">Miasto</th><th>Ekonomiczny</th><th>Standardowy</th><th>Premium</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>

  <h2 style="margin-top:2rem">O czym warto pamiętać przy tym metrażu</h2>
  <p class="section-note">${mm.uwaga}</p>

  <div class="calc-grid" style="margin-top:1.6rem">
    <div class="panel">
      <h2>Policz swój wariant</h2>
      <p class="panel-note">Metraż jest już ustawiony, zmień miasto albo standard.</p>
      <form id="calc">
        ${field({ name: 'area', label: 'Powierzchnia', value: mm.m, min: 10, max: 300, suffix: 'm²' })}
        <div class="fields-2">
          ${select({ name: 'city', label: 'Miasto', options: cityOptions })}
          ${select({ name: 'level', label: 'Standard', options: levels.map((l) => ({ v: l.id, t: l.name, sel: l.id === 'standard' })) })}
        </div>
      </form>
    </div>
    <div class="sticky-sheet">${estimateSheet({ title: `Mieszkanie ${mm.m} m²`, sub: '' })}</div>
  </div>

  <p class="receipt-foot" style="margin-top:1.4rem">Chcesz zmienić zakres prac? Przejdź do <a href="${R}kalkulator/remont-mieszkania/">pełnego kalkulatora</a> z wyborem demontaży, elektryki i łazienki.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [
        {
          '@type': 'Question',
          name: `Ile kosztuje remont mieszkania ${mm.m} m² pod klucz?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `W standardzie podstawowym od ${money(Math.round(turnkeyPerM2(tanie.coef, 1) * mm.m))} zł ${tanie.loc} do ${money(Math.round(turnkeyPerM2(war.coef, 1) * mm.m))} zł w Warszawie. Kwota obejmuje robociznę i materiały budowlane, bez mebli, armatury i sprzętu.`,
          },
        },
        {
          '@type': 'Question',
          name: `Ile trwa remont mieszkania ${mm.m} m²?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Przy pracy jednej ekipy i pełnym zakresie liczy się zwykle od ${Math.round(mm.m / 12)} do ${Math.round(mm.m / 7)} tygodni. Najdłużej trwa schnięcie wylewki, które przy pięciu centymetrach zajmuje kilka tygodni i nie da się go przyspieszyć.`,
          },
        },
      ],
    },
    script: `${calcScript}
const W = ${W_JSON};
const CITIES = ${CITY_MAP};
const SCOPE = ${SCOPE_JSON};
(function(){
  const f = document.getElementById('calc');
  const sheet = document.getElementById('sheet');
  bindForm(f, () => {
    const v = readForm(f);
    const a = v.area || 0;
    const [coef, cityName] = CITIES[v.city];
    const level = W.levels.find(l => l.id === v.level);
    const L = Object.entries(SCOPE.items).map(([id, q]) => ({
      id, qty: Math.round((id === SCOPE.doorsItem ? Math.max(2, Math.round(a / 18)) : q * a) * 100) / 100, cm: 5
    }));
    const est = estimate(W, L, coef, level.k);
    drawEstimate(sheet, W, est, { perM2: a });
    sheet.querySelector('[data-sheet-title]').textContent = cityName + ', ' + F(a) + ' m²';
    sheet.querySelector('[data-sheet-sub]').textContent = 'standard ' + level.name.toLowerCase();
  });
  bindSort(document.getElementById('board'));
})();`,
  });
}

/* ---------- porównania ---------- */

export const POROWNANIA = [
  {
    slug: 'wylewka-cementowa-czy-anhydrytowa',
    h1: 'Wylewka cementowa czy anhydrytowa',
    a: 'wylewka_cem', b: 'wylewka_anhydryt', cm: 5,
    lede: 'Różnica w cenie za metr jest niewielka, różnica w technologii ogromna. Wybór przesądza o tym, ile tygodni podłoga będzie schnąć i czy zniesie wilgoć.',
    za: ['Znosi wilgoć, więc nadaje się do łazienki, kuchni i garażu.', 'Można ją wykonać ręcznie na małej powierzchni, bez podstawiania sprzętu.', 'Tańsza w materiale i powszechnie dostępna.'],
    przeciw: ['Schnie bardzo długo: przyjmuje się tydzień na centymetr grubości.', 'Kurczy się przy wiązaniu, więc wymaga dylatacji i zbrojenia.', 'Trudniej uzyskać idealną równość, często potrzebna masa samopoziomująca.'],
    zaB: ['Schnie znacznie szybciej i mniej pracuje przy wiązaniu.', 'Rozlewa się sama, więc powierzchnia wychodzi równiejsza.', 'Świetnie przewodzi ciepło, najlepszy wybór pod ogrzewanie podłogowe.'],
    przeciwB: ['Nie znosi trwałej wilgoci, odpada w łazience bez pełnej izolacji.', 'Wymaga podania mieszanki wężem, czyli dojazdu miksokreta pod budynek.', 'Przed układaniem okładziny trzeba zeszlifować warstwę mleczka.'],
    werdykt: 'Do łazienki i pomieszczeń narażonych na wodę bierz cementową. Pod ogrzewanie podłogowe i tam, gdzie liczy się czas, wybierz anhydrytową, o ile miksokret ma jak podjechać.',
  },
  {
    slug: 'panele-czy-deska-podlogowa',
    h1: 'Panele czy deska podłogowa',
    a: 'panele', b: 'parkiet',
    lede: 'Deska kosztuje mniej więcej trzy razy tyle co panele, ale przeżywa dwa albo trzy remonty. Rachunek zależy od tego, jak długo planujesz tu mieszkać.',
    za: ['Wyraźnie niższa cena materiału i montażu.', 'Montaż na klik, bez klejenia i bez czekania.', 'Twarda powierzchnia dobrze znosi psie pazury i krzesła na kółkach.'],
    przeciw: ['Zarysowań nie da się usunąć, uszkodzoną deskę trzeba wymienić.', 'Przy zalaniu pęcznieją i nadają się do wyrzucenia.', 'Odgłos kroków jest twardszy, potrzebna dobra mata pod spodem.'],
    zaB: ['Można ją cyklinować, czyli odnowić powierzchnię kilka razy w ciągu życia.', 'Naturalne drewno jest cieplejsze w dotyku i cichsze.', 'Podnosi wartość mieszkania przy sprzedaży.'],
    przeciwB: ['Kilkukrotnie wyższy koszt materiału i robocizny.', 'Wymaga stabilnej wilgotności, inaczej pracuje i tworzą się szczeliny.', 'Miękkie gatunki łatwo wgnieść obcasem albo nogą mebla.'],
    werdykt: 'Mieszkanie na wynajem albo na kilka lat: panele. Mieszkanie na dwadzieścia lat albo dom: deska, bo koszt rozkłada się na kolejne cyklinowania.',
  },
  {
    slug: 'wanna-czy-kabina-prysznicowa',
    h1: 'Wanna czy kabina prysznicowa',
    a: 'montaz_wanny', b: 'montaz_kabiny',
    lede: 'Koszt montażu obu rozwiązań jest zbliżony. Prawdziwa różnica zaczyna się przy posadzce, odpływie i tym, ile miejsca zostaje w łazience.',
    za: ['Konieczna, jeśli w domu są małe dzieci.', 'Prostszy montaż, bez ingerencji w spadki posadzki.', 'Tańsza w naprawie, bo nie ma uszczelek szklanych drzwi.'],
    przeciw: ['Zajmuje najwięcej miejsca w małej łazience.', 'Zużywa dużo wody przy każdym napełnieniu.', 'Wejście przez wysoką krawędź bywa problemem dla starszych osób.'],
    zaB: ['Zajmuje mniej miejsca i optycznie powiększa łazienkę.', 'Prysznic bez brodzika z odpływem liniowym jest wygodny w każdym wieku.', 'Krótszy czas kąpieli to realnie niższe rachunki za wodę i ogrzewanie.'],
    przeciwB: ['Wersja bez brodzika wymaga spadków w posadzce i pełnej hydroizolacji.', 'Szkło trzeba czyścić po każdej kąpieli, inaczej zostaje kamień.', 'Odpływ liniowy to osobna, niemała pozycja w kosztorysie.'],
    werdykt: 'Łazienka poniżej pięciu metrów i dorosli domownicy: kabina, najlepiej bez brodzika. Rodzina z małym dzieckiem albo jedyna łazienka w domu: wanna.',
  },
  {
    slug: 'styropian-czy-welna-mineralna',
    h1: 'Styropian czy wełna mineralna na elewację',
    a: 'ocieplenie_styropian', b: 'ocieplenie_welna',
    lede: 'Styropian to trzy czwarte polskiego rynku i wyraźnie niższy koszt. Wełna wygrywa tam, gdzie liczy się ogień, dźwięk i oddychanie ściany.',
    za: ['Niższa cena materiału i szybszy montaż.', 'Lekki, więc jedna osoba obsłuży płytę na rusztowaniu.', 'W wersji grafitowej daje ten sam opór cieplny przy cieńszej warstwie.'],
    przeciw: ['Jest palny, co przy wyższych budynkach bywa wykluczeniem.', 'Słabo przepuszcza parę, więc mokra ściana wolniej wysycha.', 'Gryzą go gryzonie, jeśli cokół nie jest właściwie zabezpieczony.'],
    zaB: ['Niepalna, wymagana przy budynkach powyżej określonej wysokości.', 'Przepuszcza parę wodną, dobra na stare mury i ściany oddychające.', 'Wyraźnie lepiej tłumi dźwięki z zewnątrz.'],
    przeciwB: ['Znacznie droższa w materiale i w robociźnie.', 'Ciężka, wymaga gęstszego kołkowania i pracy we dwóch.', 'Traci właściwości po zamoknięciu, więc montaż zależy od pogody.'],
    werdykt: 'Dom jednorodzinny w suchej technologii: styropian grafitowy. Stary mur, wymagania przeciwpożarowe albo hałaśliwa ulica pod oknami: wełna.',
  },
  {
    slug: 'kostka-betonowa-czy-granitowa',
    h1: 'Kostka betonowa czy granitowa',
    a: 'kostka_brukowa', b: 'kostka_granitowa',
    lede: 'Granit kosztuje mniej więcej dwa razy tyle, ale nie ma daty ważności. Beton po dwudziestu latach blaknie i kruszy się przy krawędziach.',
    za: ['Znacznie tańsza, dostępna w każdym kolorze i kształcie.', 'Równe wymiary, więc układa się szybciej i taniej.', 'Łatwa do uzupełnienia, bo wzory są produkowane latami.'],
    przeciw: ['Blaknie pod słońcem i chłonie plamy z oleju.', 'Kruszy się na krawędziach pod naciskiem kół.', 'Wymaga okresowego czyszczenia i impregnacji.'],
    zaB: ['Praktycznie niezniszczalna, znosi mróz, sól i ciężkie pojazdy.', 'Nie zmienia koloru przez dziesięciolecia.', 'Wygląd, którego beton nie podrabia przekonująco.'],
    przeciwB: ['Wysoka cena materiału i wolniejsze układanie.', 'Kostka łupana ma nierówne wymiary, trzeba ją dobierać sztuka po sztuce.', 'Bywa śliska po deszczu, jeśli powierzchnia jest płomieniowana zbyt gładko.'],
    werdykt: 'Podjazd użytkowy i ograniczony budżet: beton w grubości co najmniej ośmiu centymetrów. Reprezentacyjne wejście albo nawierzchnia na dekady: granit.',
  },
];

export function porownaniePage({ p, byId, units, unitPrice, sourceFlag }) {
  const pa = unitPrice(p.a, 1, 1, p.cm || 1);
  const pb = unitPrice(p.b, 1, 1, p.cm || 1);
  const wa = byId[p.a], wb = byId[p.b];
  const ta = pa.labour + pa.material, tb = pb.labour + pb.material;
  const razy = (tb / ta).toFixed(1).replace('.', ',');

  const kol = (w, pr, tot) => `
<td class="num" data-v="${Math.round(pr.labour)}">${money(Math.round(pr.labour))} zł</td>
<td class="num" data-v="${Math.round(pr.material)}">${pr.material ? money(Math.round(pr.material)) + ' zł' : 'własny'}</td>
<td class="num" data-v="${Math.round(tot)}"><b>${money(Math.round(tot))} zł</b></td>`;

  return layout({
    title: `${p.h1}? Porównanie kosztów ${YEAR}`,
    description: `${p.h1}: różnica w cenie za jednostkę, wady i zalety obu rozwiązań oraz wskazówka, kiedy które się opłaca.`,
    path: `/porownanie/${p.slug}/`,
    breadcrumb: `<a href="${R}">Cennik</a> · <a href="${R}porownanie/">Porównania</a> · ${p.h1}`,
    body: `
<section><div class="wrap">
  <h1>${p.h1}?</h1>
  <p class="lede">${p.lede}</p>
  ${sourceFlag}

  <h2 style="margin-top:2rem">Różnica w cenie</h2>
  <p class="section-note">Stawki średnie dla Polski${p.cm ? `, przy warstwie ${p.cm} cm` : ''}. Drugie rozwiązanie jest ${tb > ta ? `około ${razy} raza droższe` : 'tańsze'} za jednostkę.</p>
  <div class="board-wrap"><table class="board">
    <thead><tr><th data-sort="off">Rozwiązanie</th><th>Robocizna</th><th>Materiał</th><th>Razem za ${units[wa.unit].name}</th></tr></thead>
    <tbody>
      <tr><td>${wa.name}</td>${kol(wa, pa, ta)}</tr>
      <tr><td>${wb.name}</td>${kol(wb, pb, tb)}</tr>
    </tbody>
  </table></div>

  <div class="cards" style="margin-top:1.6rem">
    <div class="card"><h3>${wa.name}: za</h3><ul class="factors">${p.za.map((x) => `<li>${x}</li>`).join('')}</ul></div>
    <div class="card"><h3>${wa.name}: przeciw</h3><ul class="factors">${p.przeciw.map((x) => `<li>${x}</li>`).join('')}</ul></div>
  </div>
  <div class="cards" style="margin-top:.9rem">
    <div class="card"><h3>${wb.name}: za</h3><ul class="factors">${p.zaB.map((x) => `<li>${x}</li>`).join('')}</ul></div>
    <div class="card"><h3>${wb.name}: przeciw</h3><ul class="factors">${p.przeciwB.map((x) => `<li>${x}</li>`).join('')}</ul></div>
  </div>

  <h2 style="margin-top:2rem">Co wybrać</h2>
  <p class="section-note">${p.werdykt}</p>
  <p class="receipt-foot">Ceny w miastach: <a href="${R}${byIdCat(byId, p.a)}/${slug(wa.name)}/">${wa.name}</a> i <a href="${R}${byIdCat(byId, p.b)}/${slug(wb.name)}/">${wb.name}</a>.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [{
        '@type': 'Question',
        name: `${p.h1}?`,
        acceptedAnswer: { '@type': 'Answer', text: p.werdykt },
      }],
    },
  });
}

// pomocnicze: adres strony usługi liczony tak samo jak w pages-service
let CATS = {};
export const setCats = (categories) => { CATS = Object.fromEntries(categories.map((c) => [c.id, c.slug])); };
const byIdCat = (byId, id) => CATS[byId[id].cat];
const slug = (s) =>
  s.toLowerCase().replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
   .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/[źż]/g, 'z')
   .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---------- spis porównań ---------- */

export function porownaniaIndex(list) {
  return layout({
    title: `Porównania rozwiązań remontowych ${YEAR}`,
    description: 'Co wybrać przy remoncie: wylewka cementowa czy anhydrytowa, panele czy deska, styropian czy wełna. Różnice w cenie i w praktyce.',
    path: '/porownanie/',
    breadcrumb: `<a href="${R}">Cennik</a> · Porównania`,
    body: `
<section><div class="wrap">
  <h1>Porównania</h1>
  <p class="lede">Pytania, które padają tuż przed decyzją, rozstrzygnięte liczbami z naszego cennika i praktyką wykonawczą.</p>
  <div class="cards" style="margin-top:1.4rem">
    ${list.map((p) => `<div class="card"><h3><a href="${R}porownanie/${p.slug}/">${p.h1}?</a></h3><p>${p.lede}</p></div>`).join('')}
  </div>
</div></section>`,
  });
}
