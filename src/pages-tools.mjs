// Dwa narzędzia, które nie liczą kosztorysu, tylko pomagają go ocenić i znaleźć.
import { layout, calcScript, field, select, money } from './templates.mjs';
import { SITE } from './config.mjs';

const R = SITE.root;
const YEAR = new Date().getFullYear();

/* ---------- sprawdzenie oferty wykonawcy ---------- */

export function sprawdzOfertePage({ works, categories, units, cities, cityOptions, unitPrice }) {
  const opcje = categories.flatMap((c) =>
    works.filter((w) => w.cat === c.id).map((w) => ({ v: w.id, t: `${c.name}: ${w.name}` }))
  );
  const dane = Object.fromEntries(
    works.map((w) => [w.id, { name: w.name, unit: units[w.unit].name, labour: w.labour, material: w.material, perCm: !!w.perCm, spread: w.spread ?? 0.18 }])
  );

  return layout({
    title: `Sprawdź ofertę wykonawcy: czy cena nie jest zawyżona`,
    description: 'Wpisz kwotę z oferty ekipy remontowej i zobacz, czy mieści się w widełkach rynkowych dla Twojego miasta. Porównanie z medianą stawek.',
    path: '/sprawdz-oferte/',
    breadcrumb: `<a href="${R}">Cennik</a> · Sprawdź ofertę`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Narzędzie</p>
  <h1>Sprawdź ofertę wykonawcy</h1>
  <p class="lede">Dostałeś wycenę i nie wiesz, czy to uczciwa cena, czy naciąganie. Wpisz kwotę, a porównamy ją z widełkami rynkowymi dla wybranego miasta.</p>
  <p class="section-note">Wynik jest punktem odniesienia do rozmowy, a nie oceną wykonawcy. Cena powyżej mediany bywa w pełni uzasadniona: trudnym dostępem, złym stanem podłoża, krótkim terminem albo po prostu tym, że dobra ekipa ma zapełniony kalendarz i nie musi schodzić z ceny.</p>

  <div class="calc-grid" style="margin-top:1.6rem">
    <div class="panel">
      <h2>Oferta</h2>
      <form id="calc">
        ${select({ name: 'praca', label: 'Rodzaj roboty', options: opcje })}
        <div class="fields-2">
          ${field({ name: 'ilosc', label: 'Ilość', value: 20, min: 0.1, step: .5 })}
          ${select({ name: 'city', label: 'Miasto', options: cityOptions })}
        </div>
        ${field({ name: 'kwota', label: 'Kwota z oferty, całość', value: 3000, min: 0, step: 10, suffix: 'zł' })}
        ${select({ name: 'zakres', label: 'Co obejmuje oferta', options: [
          { v: 'razem', t: 'Robocizna i materiał', sel: true },
          { v: 'robocizna', t: 'Sama robocizna' },
        ] })}
      </form>
      <p class="panel-note" data-jednostka></p>
    </div>

    <div class="sticky-sheet">
      <div class="receipt" id="wynik">
        <div class="receipt-head">Ocena oferty<strong data-werdykt>—</strong><span data-podsumowanie></span></div>
        <div class="skala-oferty">
          <div class="so-tor">
            <span class="so-widelki" data-widelki></span>
            <span class="so-znacznik" data-znacznik></span>
          </div>
          <div class="so-opisy"><span data-min>—</span><span data-mediana>—</span><span data-max>—</span></div>
        </div>
        <ul class="rows" data-rows></ul>
        <div class="total"><span class="t-label">Różnica wobec mediany</span><span class="t-val" data-roznica>—</span></div>
        <p class="receipt-foot" data-rada></p>
      </div>
    </div>
  </div>

  <h2 style="margin-top:2.5rem">Jak czytać wynik</h2>
  <h3 style="margin:1.2rem 0 .3rem">Poniżej widełek</h3>
  <p class="section-note">Bardzo niska cena rzadko oznacza okazję. Najczęściej z zakresu wypadł jakiś etap: gruntowanie, wywóz gruzu albo przygotowanie podłoża. Zanim się ucieszysz, poproś o rozpisanie oferty pozycja po pozycji i sprawdź, czego w niej nie ma.</p>
  <h3 style="margin:1.2rem 0 .3rem">W widełkach</h3>
  <p class="section-note">Cena typowa dla rynku. Na tym etapie warto rozmawiać nie o kwocie, tylko o terminie, zakresie i tym, kto kupuje materiał.</p>
  <h3 style="margin:1.2rem 0 .3rem">Powyżej widełek</h3>
  <p class="section-note">Zapytaj wprost, co podnosi cenę. Uzasadnieniem bywa trudny dostęp, praca w lokalu zamieszkanym, wąskie okno terminowe albo wyższy standard wykończenia. Jeśli wykonawca nie potrafi tego nazwać, to sygnał do zebrania kolejnych ofert.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [
        { '@type': 'Question', name: 'Skąd wiadomo, czy oferta remontowa jest zawyżona?', acceptedAnswer: { '@type': 'Answer', text: 'Kwotę z oferty trzeba przeliczyć na jednostkę roboty i porównać z medianą stawek dla danego miasta. Odchylenie do kilkunastu procent w górę mieści się w normalnym rozrzucie rynkowym, większe warto omówić z wykonawcą.' } },
        { '@type': 'Question', name: 'Czy najtańsza oferta jest najlepsza?', acceptedAnswer: { '@type': 'Answer', text: 'Zwykle nie. Cena wyraźnie poniżej widełek najczęściej oznacza węższy zakres prac, a nie większą hojność wykonawcy. Warto porównać oferty pozycja po pozycji, a nie tylko sumy końcowe.' } },
      ],
    },
    script: `${calcScript}
const DANE = ${JSON.stringify(dane)};
const CITIES = ${JSON.stringify(Object.fromEntries(cities.map((c) => [c.slug, [c.coef, c.name]])))};
(function(){
  const f = document.getElementById('calc');
  const box = document.getElementById('wynik');
  bindForm(f, () => {
    const v = readForm(f);
    const w = DANE[v.praca];
    const [coef, cityName] = CITIES[v.city];
    const cm = w.perCm ? 5 : 1;
    const lab = w.labour * coef;
    const mat = w.material * cm * (1 + (coef - 1) * 0.2);
    const jedn = v.zakres === 'robocizna' ? lab : lab + mat;
    const ilosc = v.ilosc || 0;
    const mediana = jedn * ilosc;
    const min = mediana * (1 - w.spread);
    const max = mediana * (1 + w.spread);
    const oferta = v.kwota || 0;
    const odchylenie = mediana ? Math.round((oferta / mediana - 1) * 100) : 0;

    let werdykt, klasa, rada;
    if (oferta < min) {
      werdykt = 'Poniżej widełek'; klasa = 'nisko';
      rada = 'Poproś o rozpisanie oferty pozycja po pozycji. Przy tej kwocie najczęściej z zakresu wypadł któryś etap przygotowawczy albo materiał liczony jest po stronie inwestora.';
    } else if (oferta > max) {
      werdykt = 'Powyżej widełek'; klasa = 'wysoko';
      rada = 'Zapytaj wprost, co podnosi cenę. Trudny dostęp, zły stan podłoża albo krótki termin to uzasadnienia realne. Brak konkretnej odpowiedzi to sygnał, żeby zebrać kolejne oferty.';
    } else {
      werdykt = 'W widełkach rynkowych'; klasa = 'ok';
      rada = 'Kwota mieści się w typowym rozrzucie. Rozmawiaj teraz o terminie, zakresie i o tym, kto kupuje materiał, bo tam kryją się prawdziwe różnice między ofertami.';
    }

    box.querySelector('[data-werdykt]').textContent = werdykt;
    box.querySelector('[data-werdykt]').className = 'werdykt-' + klasa;
    box.querySelector('[data-podsumowanie]').textContent =
      w.name + ', ' + F(ilosc) + ' ' + w.unit + ', ' + cityName;
    box.querySelector('[data-rows]').innerHTML =
      '<li><span class="label"><span>Oferta wykonawcy</span></span><span class="val">' + F(R(oferta)) + '</span></li>' +
      '<li><span class="label"><span>Mediana rynkowa</span></span><span class="val">' + F(R(mediana)) + '</span></li>' +
      '<li><span class="label"><span>Za jednostkę wg oferty</span></span><span class="val">' + F(Math.round(ilosc ? oferta / ilosc : 0)) + '</span></li>' +
      '<li><span class="label"><span>Za jednostkę wg mediany</span></span><span class="val">' + F(R(jedn)) + '</span></li>';
    const rozn = box.querySelector('[data-roznica]');
    rozn.textContent = (odchylenie > 0 ? '+' : '') + odchylenie + '%';
    rozn.className = 't-val werdykt-' + klasa;
    box.querySelector('[data-rada]').textContent = rada;
    box.querySelector('[data-min]').textContent = F(R(min)) + ' zł';
    box.querySelector('[data-mediana]').textContent = F(R(mediana)) + ' zł';
    box.querySelector('[data-max]').textContent = F(R(max)) + ' zł';
    box.querySelector('[data-widelki]').style.cssText = 'left:33%;right:33%';
    // znacznik: mediana w srodku skali, kraniec skali to podwojenie odchylenia
    const poz = Math.max(2, Math.min(98, 50 + (oferta / (mediana || 1) - 1) * 100 * 1.6));
    box.querySelector('[data-znacznik]').style.left = poz + '%';
    f.parentElement.querySelector('[data-jednostka]').textContent =
      'Mediana dla tej roboty ' + (v.zakres === 'robocizna' ? '(sama robocizna)' : '(z materiałem)') +
      ': ' + F(R(jedn)) + ' zł za ' + w.unit + '.';
  });
})();`,
  });
}

/* ---------- wyszukiwarka ---------- */

export function szukajPage() {
  return layout({
    title: 'Szukaj w cenniku',
    description: 'Wyszukiwarka robót remontowych, kalkulatorów i poradników w serwisie uslugiceny.pl.',
    path: '/szukaj/',
    breadcrumb: `<a href="${R}">Cennik</a> · Szukaj`,
    body: `
<section><div class="wrap">
  <h1>Szukaj</h1>
  <p class="lede">Wpisz nazwę roboty, materiału albo pomieszczenia. Wyszukiwarka działa w przeglądarce, bez wysyłania zapytań na serwer.</p>
  <div class="panel" style="margin-top:1.2rem">
    <label class="field">
      <span class="f-label">Czego szukasz</span>
      <span class="f-input"><input type="search" id="q" name="q" placeholder="np. wylewka, płytki, dach, łazienka" autocomplete="off" autofocus></span>
    </label>
  </div>
  <h2 style="margin-top:1.8rem">Wyniki</h2>
  <p class="section-note" id="ile"></p>
  <div id="wyniki" class="cards"></div>
</div></section>`,
    script: `
const norm = (s) => s.toLowerCase()
  .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e').replace(/ł/g,'l')
  .replace(/ń/g,'n').replace(/ó/g,'o').replace(/ś/g,'s').replace(/[źż]/g,'z');
let INDEKS = [];
const wej = document.getElementById('q');
const wyn = document.getElementById('wyniki');
const ile = document.getElementById('ile');

fetch('${R}search-index.json').then(r => r.json()).then(d => {
  INDEKS = d.map(x => ({ ...x, szukaj: norm(x.t + ' ' + (x.k || '')) }));
  const p = new URLSearchParams(location.search).get('q');
  if (p) { wej.value = p; szukaj(); }
});

function szukaj(){
  const q = norm(wej.value.trim());
  if (q.length < 2) { wyn.innerHTML = ''; ile.textContent = ''; return; }
  const slowa = q.split(/\\s+/);
  const trafienia = INDEKS
    .filter(x => slowa.every(s => x.szukaj.includes(s)))
    .slice(0, 40);
  ile.textContent = trafienia.length
    ? 'Znaleziono ' + trafienia.length + (trafienia.length === 40 ? ' i więcej' : '') + ' pozycji.'
    : 'Nic nie znaleziono. Spróbuj krótszego słowa, na przykład „płytki” zamiast „układanie płytek w łazience”.';
  wyn.innerHTML = trafienia.map(x =>
    '<div class="card"><h3><a href="' + x.u + '">' + x.t + '</a></h3><p>' + (x.o || '') + '</p></div>'
  ).join('');
  history.replaceState(null, '', location.pathname + (q ? '?q=' + encodeURIComponent(wej.value.trim()) : ''));
}
wej.addEventListener('input', szukaj);`,
  });
}


/* ---------- sezonowość cen ---------- */

const MIESIACE = [
  { m: 'Styczeń',    w: 'niski',  in: 'Najlepszy moment na remont wnętrza. Ekipy mają puste kalendarze, część godzi się na niższą stawkę albo krótszy termin.', zew: 'Prace zewnętrzne stoją. Systemy elewacyjne wymagają powyżej pięciu stopni, papa nie chce się zgrzewać.' },
  { m: 'Luty',       w: 'niski',  in: 'Nadal spokojnie. Dobry moment, żeby zaklepać ekipę na wiosnę i wynegocjować warunki.', zew: 'Bez zmian: sezon zewnętrzny zamknięty poza awaryjnymi naprawami dachu.' },
  { m: 'Marzec',     w: 'rosnie', in: 'Kalendarze zaczynają się zapełniać, bo ludzie planują remont przed latem.', zew: 'Pierwsze zlecenia dekarskie i brukarskie, jeszcze bez kolejki.' },
  { m: 'Kwiecień',   w: 'wysoki', in: 'Szczyt zapytań o remonty mieszkań. Terminy przesuwają się o kilka tygodni.', zew: 'Start sezonu elewacyjnego. To moment, w którym warto już mieć podpisaną umowę.' },
  { m: 'Maj',        w: 'wysoki', in: 'Bardzo trudno o dobrą ekipę z krótkim terminem.', zew: 'Pełnia sezonu, stawki najwyższe w roku.' },
  { m: 'Czerwiec',   w: 'wysoki', in: 'Utrzymuje się szczyt, dochodzą wykończenia mieszkań odbieranych od deweloperów.', zew: 'Pełnia sezonu. Ekipy dekarskie i elewacyjne pracują z wyprzedzeniem kilkumiesięcznym.' },
  { m: 'Lipiec',     w: 'wysoki', in: 'Urlopy przerzedzają ekipy, przez co terminy wydłużają się jeszcze bardziej.', zew: 'Upały spowalniają tynkowanie: powyżej dwudziestu pięciu stopni tynk schnie za szybko.' },
  { m: 'Sierpień',   w: 'sredni', in: 'Powrót z urlopów, sytuacja zaczyna się rozluźniać.', zew: 'Dobry moment na dach i elewację: stabilna pogoda, kolejka krótsza niż wiosną.' },
  { m: 'Wrzesień',   w: 'sredni', in: 'Ostatni spokojny miesiąc przed jesiennym ruchem.', zew: 'Bardzo dobry czas na prace zewnętrzne. Ekipy zaczynają szukać zleceń na koniec sezonu.' },
  { m: 'Październik',w: 'sredni', in: 'Rośnie liczba zapytań o remonty przed zimą.', zew: 'Końcówka sezonu. Stawki bywają o dziesięć do piętnastu procent niższe niż w maju, bo kalendarze pustoszeją.' },
  { m: 'Listopad',   w: 'niski',  in: 'Zapytania spadają, można negocjować.', zew: 'Sezon praktycznie zamknięty, prace tylko przy sprzyjającej pogodzie.' },
  { m: 'Grudzień',   w: 'niski',  in: 'Najspokojniejszy miesiąc. Wiele ekip przyjmuje zlecenia od ręki.', zew: 'Prace zewnętrzne wstrzymane.' },
];

export function sezonowoscPage() {
  const klasa = { niski: 'down', sredni: '', rosnie: '', wysoki: 'up' };
  const etykieta = { niski: 'niskie obłożenie', sredni: 'średnie', rosnie: 'rośnie', wysoki: 'szczyt sezonu' };
  return layout({
    title: `Kiedy remont jest tańszy: sezonowość cen ${YEAR}`,
    description: 'W którym miesiącu zamówić remont, elewację albo dach, żeby zapłacić mniej. Kalendarz obłożenia ekip i różnice stawek w ciągu roku.',
    path: '/kiedy-remontowac/',
    breadcrumb: `<a href="${R}">Cennik</a> · Kiedy remontować`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Poradnik</p>
  <h1>Kiedy remont wychodzi taniej</h1>
  <p class="lede">Ta sama robota kosztuje inaczej w maju i w listopadzie. Nie dlatego, że zmieniają się ceny materiałów, tylko dlatego, że zmienia się kolejka do ekipy.</p>
  <p class="section-note">Materiały budowlane drożeją i tanieją w rytmie rocznym w niewielkim stopniu. To robocizna reaguje na sezon, i to mocno: wykonawca z pustym kalendarzem negocjuje inaczej niż ten, który ma zlecenia na trzy miesiące do przodu. Poniżej kalendarz obłożenia w podziale na prace wewnętrzne i zewnętrzne.</p>

  <div class="board-wrap" style="margin-top:1.4rem"><table class="board">
    <thead><tr><th data-sort="off">Miesiąc</th><th data-sort="off">Wnętrza</th><th data-sort="off">Prace zewnętrzne</th></tr></thead>
    <tbody>${MIESIACE.map((x) => `<tr>
      <td><b>${x.m}</b><br><span class="delta ${klasa[x.w]}">${etykieta[x.w]}</span></td>
      <td style="text-align:left;white-space:normal">${x.in}</td>
      <td style="text-align:left;white-space:normal">${x.zew}</td>
    </tr>`).join('')}</tbody>
  </table></div>

  <h2 style="margin-top:2.5rem">Trzy zasady, które realnie obniżają koszt</h2>
  <ul class="factors">
    <li>Remont wnętrza zamawiaj zimą, prace zewnętrzne na przełomie września i października. W obu przypadkach trafiasz na moment, w którym ekipa szuka zlecenia, a nie odwrotnie.</li>
    <li>Umawiaj się z wyprzedzeniem, ale realizuj poza szczytem. Dobra ekipa zaklepana w lutym na wrzesień da lepsze warunki niż ta sama ekipa proszona o termin na już w maju.</li>
    <li>Nie łącz pośpiechu z negocjacją. Krótki termin to jedyna rzecz, za którą wykonawca zawsze policzy więcej, bo musi komuś innemu przesunąć zlecenie.</li>
  </ul>

  <h2 style="margin-top:2rem">Czego nie da się przyspieszyć</h2>
  <p class="section-note">Sezon nie wpływa na czas schnięcia. Wylewka cementowa potrzebuje mniej więcej tygodnia na każdy centymetr grubości niezależnie od tego, czy jest luty, czy lipiec. Podobnie systemy elewacyjne: poniżej pięciu stopni po prostu nie wiążą, a powyżej dwudziestu pięciu tynk schnie tak szybko, że zostawia ślady łączeń. To granice technologii, a nie kwestia dobrej woli wykonawcy.</p>

  <p class="receipt-foot" style="margin-top:1.4rem">Masz już wycenę? Sprawdź ją w <a href="${R}sprawdz-oferte/">narzędziu do oceny oferty</a>. Planujesz zakres? Zajrzyj do <a href="${R}poradnik/">poradników o kolejności prac</a>.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [
        { '@type': 'Question', name: 'W którym miesiącu remont jest najtańszy?', acceptedAnswer: { '@type': 'Answer', text: 'Prace wewnętrzne najtaniej wychodzą od listopada do lutego, kiedy ekipy mają puste kalendarze. Prace zewnętrzne na przełomie września i października, gdy sezon się kończy, a stawki bywają o dziesięć do piętnastu procent niższe niż w maju.' } },
        { '@type': 'Question', name: 'Czy zimą można ocieplać dom?', acceptedAnswer: { '@type': 'Answer', text: 'Systemy elewacyjne wymagają temperatury powyżej pięciu stopni. Istnieją materiały zimowe pozwalające pracować niżej, ale kosztują więcej i mają węższe okno bezpieczeństwa, więc przy planowanej termomodernizacji lepiej poczekać do wiosny.' } },
      ],
    },
  });
}

/* ---------- porownanie dwoch miast ---------- */

export function porownajMiastaPage({ works, categories, units, cities, unitPrice }) {
  const dane = Object.fromEntries(
    works.map((w) => [w.id, { name: w.name, cat: w.cat, unit: units[w.unit].name, labour: w.labour, material: w.material, perCm: !!w.perCm }])
  );
  const opcje = cities.map((c) => ({ v: c.slug, t: c.name }));
  return layout({
    title: `Porównanie cen remontu w dwóch miastach ${YEAR}`,
    description: 'Zestaw dwa miasta obok siebie i zobacz, o ile różnią się stawki robót remontowych, pozycja po pozycji.',
    path: '/porownaj-miasta/',
    breadcrumb: `<a href="${R}">Cennik</a> · Porównaj miasta`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Narzędzie</p>
  <h1>Porównaj dwa miasta</h1>
  <p class="lede">Przeprowadzka, dom w innym mieście albo oferta od ekipy spoza okolicy: wtedy przydaje się wiedzieć, o ile stawki różnią się między konkretnymi miastami.</p>
  <p class="section-note">Różnica dotyczy przede wszystkim robocizny. Materiały budowlane kosztują w całym kraju podobnie, dlatego pozycje, w których materiał kupuje inwestor, różnią się mocniej niż te z materiałem wykonawcy.</p>

  <div class="panel" style="margin-top:1.4rem">
    <form id="calc">
      <div class="fields-2">
        ${select({ name: 'a', label: 'Pierwsze miasto', options: opcje.map((o, i) => ({ ...o, sel: i === 0 })) })}
        ${select({ name: 'b', label: 'Drugie miasto', options: opcje.map((o) => ({ ...o, sel: o.v === 'lodz' })) })}
      </div>
    </form>
    <div class="total"><span class="t-label">Różnica dla remontu 50 m²</span><span class="t-val" data-roznica>—</span></div>
    <p class="range-note" data-podsumowanie></p>
  </div>

  <div id="tabela" style="margin-top:1.6rem"></div>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [{
        '@type': 'Question',
        name: 'Dlaczego ceny remontu różnią się między miastami?',
        acceptedAnswer: { '@type': 'Answer', text: 'Różnica siedzi niemal w całości w robociźnie: dostępności ekip, poziomie płac i kosztach prowadzenia działalności. Materiały budowlane kosztują w całym kraju podobnie, bo pochodzą z tych samych sieci dystrybucji.' },
      }],
    },
    script: `${calcScript}
const D = ${JSON.stringify(dane)};
const KAT = ${JSON.stringify(categories.map((c) => ({ id: c.id, name: c.name })))};
const CITIES = ${JSON.stringify(Object.fromEntries(cities.map((c) => [c.slug, [c.coef, c.name]])))};
(function(){
  const f = document.getElementById('calc');
  const tab = document.getElementById('tabela');
  const cena = (w, coef) => {
    const cm = w.perCm ? 5 : 1;
    return w.labour * coef + w.material * cm * (1 + (coef - 1) * 0.2);
  };
  bindForm(f, () => {
    const v = readForm(f);
    const [ca, na] = CITIES[v.a], [cb, nb] = CITIES[v.b];
    let html = '';
    for (const k of KAT){
      const poz = Object.values(D).filter(w => w.cat === k.id);
      if (!poz.length) continue;
      html += '<h2 style="margin-top:1.6rem">' + k.name + '</h2><div class="board-wrap"><table class="board"><thead><tr>' +
        '<th data-sort="off">Robota</th><th>' + na + '</th><th>' + nb + '</th><th>Różnica</th></tr></thead><tbody>';
      for (const w of poz){
        const a = cena(w, ca), b = cena(w, cb);
        const d = Math.round((b / a - 1) * 100);
        const kl = d > 0 ? 'up' : d < 0 ? 'down' : '';
        html += '<tr><td>' + w.name + ' <span class="qty">' + w.unit + '</span></td>' +
          '<td class="num">' + F(R(a)) + '</td><td class="num">' + F(R(b)) + '</td>' +
          '<td class="num delta ' + kl + '">' + (d > 0 ? '+' : '') + d + '%</td></tr>';
      }
      html += '</tbody></table></div>';
    }
    tab.innerHTML = html;
    const roznica = Math.round((cb / ca - 1) * 100);
    document.querySelector('[data-roznica]').textContent = (roznica > 0 ? '+' : '') + roznica + '%';
    document.querySelector('[data-roznica]').className = 't-val ' + (roznica > 0 ? 'werdykt-wysoko' : roznica < 0 ? 'werdykt-ok' : '');
    document.querySelector('[data-podsumowanie]').textContent =
      roznica === 0 ? 'Oba miasta mają ten sam współczynnik stawek.'
      : roznica > 0 ? nb + ' jest droższe od miasta ' + na + ' o ' + roznica + '% w robociźnie.'
      : nb + ' jest tańsze od miasta ' + na + ' o ' + Math.abs(roznica) + '% w robociźnie.';
  });
})();`,
  });
}

/* ---------- pelny cennik na jednej stronie ---------- */

export function pelnyCennikPage({ works, categories, units, cities, cityOptions, unitPrice, sourceFlag }) {
  const wiersze = categories
    .map((c) => {
      const poz = works.filter((w) => w.cat === c.id);
      return `<h2 style="margin-top:1.8rem">${c.name}</h2>
<div class="board-wrap"><table class="board">
<thead><tr><th data-sort="off">Robota</th><th>Jedn.</th><th>Robocizna</th><th>Materiał</th><th>Razem</th></tr></thead>
<tbody>${poz
        .map((w) => {
          const p = unitPrice(w.id, 1, 1, w.perCm ? 5 : 1);
          return `<tr><td>${w.name}</td><td class="num">${units[w.unit].name}</td>
<td class="num" data-l="${w.labour}">${money(Math.round(p.labour))}</td>
<td class="num" data-m="${w.material}" data-cm="${w.perCm ? 5 : 1}">${w.material ? money(Math.round(p.material)) : 'własny'}</td>
<td class="num"><b>${money(Math.round(p.labour + p.material))}</b></td></tr>`;
        })
        .join('')}</tbody></table></div>`;
    })
    .join('');

  return layout({
    title: `Pełny cennik robót remontowych ${YEAR}`,
    description: `Wszystkie ${works.length} pozycji cennika na jednej stronie, z podziałem na robociznę i materiał. Do wydruku i do porównania z ofertą wykonawcy.`,
    path: '/cennik/',
    breadcrumb: `<a href="${R}">Cennik</a> · Pełne zestawienie`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">${works.length} pozycji · aktualizacja ${SITE.updated}</p>
  <h1>Pełny cennik na jednej stronie</h1>
  <p class="lede">Całe zestawienie bez klikania: wszystkie roboty, robocizna i materiał osobno. Wygodne do wydruku i do zestawienia z ofertą od ekipy.</p>
  ${sourceFlag}

  <div class="panel" style="margin-top:1.4rem">
    <form id="calc">
      ${select({ name: 'city', label: 'Przelicz na miasto', options: [{ v: '', t: 'Średnia dla Polski', sel: true }, ...cityOptions] })}
    </form>
    <p class="range-note" data-info>Pokazane stawki to mediana krajowa. Wybierz miasto, żeby przeliczyć całą tabelę.</p>
    <div class="sheet-actions"><button type="button" data-print>Drukuj cennik</button></div>
  </div>

  ${wiersze}
</div></section>`,
    script: `${calcScript}
const CITIES = ${JSON.stringify(Object.fromEntries(cities.map((c) => [c.slug, [c.coef, c.name]])))};
(function(){
  const f = document.getElementById('calc');
  const info = document.querySelector('[data-info]');
  bindForm(f, () => {
    const v = readForm(f);
    const [coef, nazwa] = v.city ? CITIES[v.city] : [1, null];
    document.querySelectorAll('table.board tbody tr').forEach(tr => {
      const kl = tr.cells[2], km = tr.cells[3], kr = tr.cells[4];
      const l = parseFloat(kl.dataset.l), m = parseFloat(km.dataset.m), cm = parseFloat(km.dataset.cm || 1);
      if (isNaN(l)) return;
      const lab = l * coef, mat = m * cm * (1 + (coef - 1) * 0.2);
      kl.textContent = F(R(lab));
      if (m) km.textContent = F(R(mat));
      kr.innerHTML = '<b>' + F(R(lab + mat)) + '</b>';
    });
    info.textContent = nazwa
      ? 'Stawki przeliczone na miasto ' + nazwa + '. Materiały zmieniają się słabiej niż robocizna.'
      : 'Pokazane stawki to mediana krajowa. Wybierz miasto, żeby przeliczyć całą tabelę.';
  });
  bindSheetActions(document.querySelector('.panel'));
  document.querySelectorAll('table.board').forEach(bindSort);
})();`,
  });
}

/* ---------- gdzie ida pieniadze: robocizna kontra material ---------- */

export function strukturaKosztowPage({ works, categories, units, unitPrice }) {
  const poz = works
    .map((w) => {
      const p = unitPrice(w.id, 1, 1, w.perCm ? 5 : 1);
      const suma = p.labour + p.material;
      return {
        name: w.name,
        cat: w.cat,
        unit: units[w.unit].name,
        udzial: Math.round((p.labour / suma) * 100),
        suma: Math.round(suma),
        labour: Math.round(p.labour),
        material: Math.round(p.material),
      };
    })
    .sort((a, b) => b.udzial - a.udzial);

  const sameRobocizna = poz.filter((x) => x.udzial === 100).length;
  const przewagaMaterialu = poz.filter((x) => x.udzial < 50);

  const wiersz = (x) => `<tr>
<td data-v="${x.name}">${x.name} <span class="qty">${x.unit}</span></td>
<td class="num" data-v="${x.labour}">${money(x.labour)}</td>
<td class="num" data-v="${x.material}">${x.material ? money(x.material) : 'własny'}</td>
<td data-v="${x.udzial}" style="min-width:9rem">
  <div class="podzial-pasek" title="Robocizna ${x.udzial}%">
    <span class="pr-robocizna" style="width:${x.udzial}%"></span>
    <span class="pr-material" style="width:${100 - x.udzial}%"></span>
  </div>
</td>
<td class="num" data-v="${x.udzial}">${x.udzial}%</td>
</tr>`;

  return layout({
    title: `Za co się płaci w remoncie: robocizna czy materiał`,
    description: 'Udział robocizny i materiału w każdej pozycji cennika. Pokazuje, gdzie negocjacja stawki ma sens, a gdzie taniej wychodzi zakup materiału na własną rękę.',
    path: '/struktura-kosztow/',
    breadcrumb: `<a href="${R}">Cennik</a> · Struktura kosztów`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Analiza cennika</p>
  <h1>Robocizna czy materiał</h1>
  <p class="lede">Dwie pozycje po sto złotych za metr to nie to samo. W jednej płacisz prawie wyłącznie za pracę, w drugiej połowa kwoty to towar, który możesz kupić sam.</p>
  <p class="section-note">To rozróżnienie decyduje o tym, gdzie negocjacja ma sens. Przy pracach rozbiórkowych cała kwota to robocizna, więc jedyne pole do rozmowy to stawka ekipy. Przy okładzinach i stolarce znaczną część kosztu stanowi materiał, a tam wpływ na cenę masz przede wszystkim przez wybór produktu, nie przez targowanie się z wykonawcą.</p>

  <h2 style="margin-top:1.8rem">Cennik w liczbach</h2>
  <div class="cards">
    <div class="card"><h3>Sama robocizna</h3><p class="big">${sameRobocizna}</p><p>pozycji, w których nie ma żadnego materiału po stronie wykonawcy: demontaże, montaże urządzeń kupowanych przez inwestora, sprzątanie.</p></div>
    <div class="card"><h3>Przewaga materiału</h3><p class="big">${przewagaMaterialu.length}</p><p>pozycji, w których materiał kosztuje więcej niż praca. Tu o cenie decyduje półka cenowa produktu.</p></div>
    <div class="card"><h3>Najwięcej materiału</h3><p class="big">${100 - poz[poz.length - 1].udzial}%</p><p>taki udział ma materiał w pozycji „${poz[poz.length - 1].name}”, największy w całym cenniku.</p></div>
  </div>

  <h2 style="margin-top:2rem">Wszystkie pozycje według udziału robocizny</h2>
  <p class="section-note">Ciemna część paska to praca, jasna to materiał. Kliknij nagłówek, żeby posortować inaczej.</p>
  <div class="podzial-legenda" style="margin-bottom:.6rem">
    <span><i class="kropka kropka-r"></i>Robocizna</span>
    <span><i class="kropka kropka-m"></i>Materiał</span>
  </div>
  <div class="board-wrap"><table class="board" id="tab">
    <thead><tr><th data-sort="off">Robota</th><th>Robocizna</th><th>Materiał</th><th data-sort="off">Podział</th><th>Udział pracy</th></tr></thead>
    <tbody>${poz.map(wiersz).join('')}</tbody>
  </table></div>

  <h2 style="margin-top:2rem">Jak to wykorzystać</h2>
  <ul class="factors">
    <li>Przy pozycjach ze słowem „własny” w kolumnie Materiał zapytaj wykonawcę, czy kupno przez Ciebie obniży kwotę. Zwykle tak, ale przechodzi wtedy na Ciebie odpowiedzialność za braki i dowóz.</li>
    <li>Przy pozycjach z przewagą materiału różnicę robi półka cenowa produktu, a nie targowanie. Zejście o klasę niżej daje więcej niż kilka procent rabatu na robociznę.</li>
    <li>Przy pozycjach będących w całości robocizną porównuj oferty ostrożnie: niska stawka najczęściej oznacza węższy zakres, na przykład brak wywozu gruzu.</li>
  </ul>

  <p class="receipt-foot" style="margin-top:1.4rem">Masz konkretną wycenę? Sprawdź ją w <a href="${R}sprawdz-oferte/">narzędziu do oceny oferty</a>. Całe zestawienie stawek jest w <a href="${R}cennik/">pełnym cenniku</a>.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [
        { '@type': 'Question', name: 'Czy opłaca się kupować materiał samemu?', acceptedAnswer: { '@type': 'Answer', text: 'Przy pozycjach, w których materiał i tak kupuje inwestor, nie ma wyboru. W pozostałych zakup na własną rękę bywa tańszy, ale przenosi na inwestora odpowiedzialność za ilości, dowóz i braki w trakcie prac.' } },
        { '@type': 'Question', name: 'Gdzie negocjacja ceny remontu ma największy sens?', acceptedAnswer: { '@type': 'Answer', text: 'Tam, gdzie kwota to niemal wyłącznie robocizna, czyli przy demontażach, montażach i pracach przygotowawczych. Przy okładzinach o cenie decyduje głównie wybrana półka materiału.' } },
      ],
    },
    script: `${calcScript}
bindSort(document.getElementById('tab'));`,
  });
}

/* ---------- historia zmian w cenniku ---------- */

export const AKTUALIZACJE = [
  {
    data: '2026-08',
    tytul: 'Weryfikacja punktowa całego cennika',
    opis: 'Przejście pozycja po pozycji przez wszystkie kategorie i porównanie stawek z publicznymi cennikami wykonawców. Udział stawek mających w źródle liczbę dla konkretnej roboty wzrósł z 44 do 86 na 94 pozycje.',
    zmiany: [
      ['Instalacje grzewcze', 'Punkt CO obniżony z 880 do 260 zł, montaż pompy ciepła z 6800 do 4400 zł, grzejnik z 280 do 170 zł. Stawki wyprowadzone wcześniej z analogii okazały się nawet trzykrotnie zawyżone.'],
      ['Dekarstwo', 'Więźba 95 → 72 zł/m², obróbki blacharskie 48 → 36 zł/mb. Rąbek stojący podniesiony ze 135 do 165 zł/m², bo był poniżej realiów rynkowych.'],
      ['Brukarstwo', 'Odwodnienie liniowe 220 → 400 zł/mb, obrzeża 33 → 60, krawężniki 56 → 85, trawnik z rolki 37 → 65 zł/m². Kostka betonowa obniżona ze 187 do 150 zł/m².'],
      ['Biały montaż', 'Wanna 420 → 590 zł, kabina 460 → 680 zł, WC ze stelażem 360 → 540 zł. Wszystkie pozycje były zaniżone wobec rynku.'],
      ['Elektryka i stolarka', 'Rozdzielnica 1140 → 1770 zł, drzwi zewnętrzne 680 → 420 zł, drzwi wewnętrzne 340 → 280 zł.'],
    ],
  },
  {
    data: '2026-08',
    tytul: 'Kalibracja stawek bazowych',
    opis: 'Pierwsza kalibracja całego cennika wobec zestawień rynkowych. Zdjęty status wersji roboczej, dopisane źródła z datami.',
    zmiany: [
      ['Płytki', 'Robocizna na ścianie obniżona ze 148 do 58 zł/m². Poprzednia stawka była ponad dwukrotnie wyższa od rynkowej.'],
      ['Wylewki', 'Przeliczone od nowa: 60 zł/m² przy warstwie 5 cm wobec rynkowych 40-65.'],
      ['Gładzie i elektryka', 'Gładź podniesiona z 34 do 42 zł/m², punkt elektryczny z 88 do 120 zł, oba były poniżej rynku.'],
      ['Ocieplenia', 'Poprawiony podwójny naliczanie: klejenie płyt i warstwa zbrojona liczyły część tego samego zakresu dwa razy.'],
    ],
  },
];

export function aktualizacjePage({ works, meta }) {
  const sprawdzone = works.filter((w) => w.sprawdzone).length;
  return layout({
    title: `Historia zmian w cenniku`,
    description: 'Co i kiedy zmieniło się w stawkach: kalibracje, weryfikacje wobec cenników wykonawców i poprawki błędów. Pełna lista zmian z uzasadnieniem.',
    path: '/aktualizacje/',
    breadcrumb: `<a href="${R}">Cennik</a> · Historia zmian`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Dziennik zmian</p>
  <h1>Co zmieniło się w cenniku</h1>
  <p class="lede">Cennik, który nigdy się nie zmienia, jest albo idealny, albo martwy. Ten się zmienia i pokazujemy, co dokładnie i dlaczego.</p>
  <p class="section-note">Publikujemy również zmiany, które oznaczają przyznanie się do błędu. Stawka zawyżona trzykrotnie to nie drobiazg: ktoś mógł na jej podstawie odrzucić uczciwą ofertę. Ukrywanie takich poprawek byłoby wygodniejsze, ale wtedy cała reszta cennika nie byłaby warta zaufania.</p>

  <h2 style="margin-top:1.8rem">Stan weryfikacji</h2>
  <div class="cards">
    <div class="card"><h3>Sprawdzone punktowo</h3><p class="big">${sprawdzone}</p><p>pozycji, dla których źródło podaje liczbę dla tej konkretnej roboty.</p></div>
    <div class="card"><h3>Z przedziału grupy</h3><p class="big">${works.length - sprawdzone}</p><p>pozycji wyprowadzonych z widełek dla całej grupy robót, oznaczonych na swoich stronach jako orientacyjne.</p></div>
    <div class="card"><h3>Źródła</h3><p class="big">${(meta.sources || []).length}</p><p>opracowań i cenników, na których opiera się cennik. Lista z datami jest na stronie <a href="${R}jak-liczymy/">Jak liczymy</a>.</p></div>
  </div>

  ${AKTUALIZACJE.map((a) => `
  <h2 style="margin-top:2.2rem">${a.tytul}</h2>
  <p class="eyebrow" style="margin-bottom:.6rem">${a.data}</p>
  <p class="section-note">${a.opis}</p>
  <div class="board-wrap"><table class="board">
    <thead><tr><th data-sort="off">Obszar</th><th data-sort="off">Co się zmieniło</th></tr></thead>
    <tbody>${a.zmiany.map(([obszar, tekst]) => `<tr><td><b>${obszar}</b></td><td style="text-align:left;white-space:normal">${tekst}</td></tr>`).join('')}</tbody>
  </table></div>`).join('')}

  <h2 style="margin-top:2.2rem">Jak często aktualizujemy</h2>
  <p class="section-note">Stawki przeglądamy okresowo, a datę ostatniej kalibracji widać pod każdą pozycją cennika. Jeśli prowadzisz ekipę i widzisz, że któraś pozycja odbiega od realiów Twojego rynku, napisz: takie zgłoszenia trafiają do kolejnego przeglądu. Adres jest na stronie <a href="${R}kontakt/">Kontakt</a>.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [{
        '@type': 'Question',
        name: 'Jak często aktualizowane są stawki?',
        acceptedAnswer: { '@type': 'Answer', text: 'Cennik przeglądamy okresowo, a datę ostatniej kalibracji widać pod każdą pozycją. Historia zmian wraz z uzasadnieniem jest publikowana na osobnej stronie.' },
      }],
    },
  });
}