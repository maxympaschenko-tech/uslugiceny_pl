// Dwa narzędzia, które nie liczą kosztorysu, tylko pomagają go ocenić i znaleźć.
import { layout, odmien, calcScript, field, select, money } from './templates.mjs';
import { SITE } from './config.mjs';

const R = SITE.root;
const YEAR = new Date().getFullYear();

/* ---------- sprawdzenie oferty wykonawcy ---------- */

export function sprawdzOfertePage({ works, categories, units, cities, cityOptions, unitPrice, slugify, turnkeyPerM2, levels }) {
  const opcje = categories.flatMap((c) =>
    works.filter((w) => w.cat === c.id).map((w) => ({ v: w.id, t: `${c.name}: ${w.name}` }))
  );
  const catSlug = (id) => categories.find((c) => c.id === id).slug;
  const dane = Object.fromEntries(
    works.map((w) => [
      w.id,
      {
        name: w.name,
        unit: units[w.unit].name,
        labour: w.labour,
        material: w.material,
        perCm: !!w.perCm,
        spread: w.spread ?? 0.18,
        url: `${R}${catSlug(w.cat)}/${slugify(w.name)}/`,
      },
    ])
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
        ${select({
          name: 'praca',
          label: 'Rodzaj roboty',
          options: opcje.map((o) => ({ ...o, sel: o.v === 'plytki_sciana' })),
        })}
        <div class="fields-2">
          ${field({ name: 'ilosc', label: 'Ilość', value: 20, min: 0.1, step: .5 })}
          ${select({ name: 'city', label: 'Miasto', options: cityOptions })}
        </div>
        ${field({ name: 'kwota', label: 'Kwota z oferty, całość', value: 3200, min: 0, step: 10, suffix: 'zł', hint: 'Wpisz sumę z wyceny za tę pozycję, razem z materiałem, jeśli kupuje go wykonawca.' })}
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
        <p class="receipt-foot" data-gdziedalej></p>
      </div>
    </div>
  </div>

  <h2 style="margin-top:2.5rem">Albo sprawdź całą wycenę</h2>
  <p class="section-note">Jeśli ekipa podała jedną kwotę za cały remont mieszkania, porównaj ją z naszym wyliczeniem dla tego metrażu. Zakres standardowy obejmuje demontaże i wywóz gruzu, tynki i gładzie, wylewkę, podłogi, płytki w strefach mokrych, instalację elektryczną, biały montaż i drzwi.</p>

  <div class="panel" style="margin-top:1.2rem">
    <form id="calosc">
      <div class="fields-2">
        ${field({ name: 'metraz', label: 'Powierzchnia mieszkania', value: 50, min: 10, max: 300, suffix: 'm²' })}
        ${field({ name: 'suma', label: 'Kwota z wyceny, całość', value: 60000, min: 0, step: 500, suffix: 'zł' })}
      </div>
      <div class="fields-2">
        ${select({ name: 'miasto2', label: 'Miasto', options: cityOptions })}
        ${select({ name: 'poziom', label: 'Standard', options: (levels || []).map((l) => ({ v: l.id, t: l.name, sel: l.id === 'standard' })) })}
      </div>
    </form>
    <div class="total"><span class="t-label">Ocena całej wyceny</span><span class="t-val" data-werdykt2>—</span></div>
    <ul class="rows" data-rows2></ul>
    <p class="receipt-foot" data-rada2></p>
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
    script: `const DANE = ${JSON.stringify(dane)};
const POD_KLUCZ = ${JSON.stringify(
  Object.fromEntries(
    cities.map((c) => [
      c.slug,
      Object.fromEntries((levels || []).map((l) => [l.id, Math.round(turnkeyPerM2(c.coef, l.k))])),
    ])
  )
)};
const CITIES = ${JSON.stringify(Object.fromEntries(cities.map((c) => [c.slug, [c.coef, c.name, c.loc]])))};
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
    box.querySelector('[data-gdziedalej]').innerHTML =
      'Szczegóły tej roboty: <a href="' + w.url + '">' + w.name.toLowerCase() + '</a>. ' +
      'Wszystkie stawki w wybranym mieście: <a href="' + '${R}ceny/' + v.city + '/">cennik ' + cityName + '</a>.';
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
})();

(function(){
  const f = document.getElementById('calosc');
  if (!f) return;
  const werdykt = document.querySelector('[data-werdykt2]');
  const rows = document.querySelector('[data-rows2]');
  const rada = document.querySelector('[data-rada2]');
  bindForm(f, () => {
    const v = readForm(f);
    const [, , gdzie] = CITIES[v.miasto2];
    const zaM2 = (POD_KLUCZ[v.miasto2] || {})[v.poziom] || 0;
    const mediana = zaM2 * (v.metraz || 0);
    const dolna = mediana * 0.85, gorna = mediana * 1.15;
    const oferta = v.suma || 0;
    const odchylenie = mediana ? Math.round((oferta / mediana - 1) * 100) : 0;

    rows.innerHTML =
      '<li><span class="label"><span>Wycena od ekipy</span></span><span class="val">' + F(R(oferta)) + '</span></li>' +
      '<li><span class="label"><span>Nasze wyliczenie</span><span class="qty">' + F(R(zaM2)) + ' zł/m² ' + gdzie + '</span></span><span class="val">' + F(R(mediana)) + '</span></li>' +
      '<li><span class="label"><span>Widełki rynkowe</span></span><span class="val">' + F(R(dolna)) + ' – ' + F(R(gorna)) + '</span></li>';

    werdykt.textContent = (odchylenie > 0 ? '+' : '') + odchylenie + '%';
    werdykt.className = 't-val ' + (oferta < dolna ? 'werdykt-nisko' : oferta > gorna ? 'werdykt-wysoko' : 'werdykt-ok');
    rada.textContent =
      oferta < dolna
        ? 'Kwota poniżej widełek. Zapytaj wprost, czego nie obejmuje: najczęściej brakuje wywozu gruzu, przygotowania podłoża albo materiału po stronie wykonawcy.'
        : oferta > gorna
        ? 'Kwota powyżej widełek. To bywa uzasadnione zakresem szerszym niż standardowy albo terminem na już, ale warto poprosić o rozpisanie na pozycje.'
        : 'Kwota mieści się w widełkach dla tego metrażu i miasta. Przy porównywaniu ofert liczy się teraz zakres, a nie sama suma.';
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

// Slowa, ktore ludzie dopisuja do zapytania, a ktore nie wystepuja w nazwach
// pozycji. Bez ich pominiecia "ile kosztuje remont" nie znajduje niczego.
const POMIJANE = new Set(['ile','kosztuje','koszt','koszty','cena','ceny','cennik',
  'za','w','we','na','do','i','z','jak','czy','jest','sie','moj','moja',
  'm2','m²','mb','szt','zl','zł','pln','robocizna','2026','cennik']);

// Polska odmiana: "wanna" ma znalezc "wanny", "plytka" ma znalezc "plytki".
// Dla dluzszych slow porownujemy rdzen, czyli slowo bez dwoch ostatnich liter.
const rdzen = (s) => (s.length >= 6 ? s.slice(0, -2) : s.length >= 4 ? s.slice(0, -1) : s);

function szukaj(){
  const q = norm(wej.value.trim());
  if (q.length < 2) { wyn.innerHTML = ''; ile.textContent = ''; return; }
  const slowa = q.split(/\\s+/).filter(s => s && !POMIJANE.has(s));
  if (!slowa.length) { wyn.innerHTML = ''; ile.textContent = 'Wpisz nazwę roboty, na przykład „płytki” albo „wylewka”.'; return; }
  const trafienia = INDEKS
    .filter(x => slowa.every(s => x.szukaj.includes(rdzen(s))))
    .slice(0, 40);
  // Polska liczba mnoga: 1 pozycja, 2-4 pozycje, 5+ pozycji, ale 12-14 pozycji.
  const odmiana = (n) => {
    if (n === 1) return 'pozycję';
    const ost = n % 10, dwie = n % 100;
    return ost >= 2 && ost <= 4 && !(dwie >= 12 && dwie <= 14) ? 'pozycje' : 'pozycji';
  };
  ile.textContent = trafienia.length
    ? 'Znaleziono ' + trafienia.length + (trafienia.length === 40 ? ' i więcej' : '') + ' ' + odmiana(trafienia.length) + '.'
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
    script: `const D = ${JSON.stringify(dane)};
const KAT = ${JSON.stringify(categories.map((c) => ({ id: c.id, name: c.name })))};
const CITIES = ${JSON.stringify(Object.fromEntries(cities.map((c) => [c.slug, [c.coef, c.name, c.loc]])))};
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
})();

(function(){
  const f = document.getElementById('calosc');
  if (!f) return;
  const werdykt = document.querySelector('[data-werdykt2]');
  const rows = document.querySelector('[data-rows2]');
  const rada = document.querySelector('[data-rada2]');
  bindForm(f, () => {
    const v = readForm(f);
    const [, , gdzie] = CITIES[v.miasto2];
    const zaM2 = (POD_KLUCZ[v.miasto2] || {})[v.poziom] || 0;
    const mediana = zaM2 * (v.metraz || 0);
    const dolna = mediana * 0.85, gorna = mediana * 1.15;
    const oferta = v.suma || 0;
    const odchylenie = mediana ? Math.round((oferta / mediana - 1) * 100) : 0;

    rows.innerHTML =
      '<li><span class="label"><span>Wycena od ekipy</span></span><span class="val">' + F(R(oferta)) + '</span></li>' +
      '<li><span class="label"><span>Nasze wyliczenie</span><span class="qty">' + F(R(zaM2)) + ' zł/m² ' + gdzie + '</span></span><span class="val">' + F(R(mediana)) + '</span></li>' +
      '<li><span class="label"><span>Widełki rynkowe</span></span><span class="val">' + F(R(dolna)) + ' – ' + F(R(gorna)) + '</span></li>';

    werdykt.textContent = (odchylenie > 0 ? '+' : '') + odchylenie + '%';
    werdykt.className = 't-val ' + (oferta < dolna ? 'werdykt-nisko' : oferta > gorna ? 'werdykt-wysoko' : 'werdykt-ok');
    rada.textContent =
      oferta < dolna
        ? 'Kwota poniżej widełek. Zapytaj wprost, czego nie obejmuje: najczęściej brakuje wywozu gruzu, przygotowania podłoża albo materiału po stronie wykonawcy.'
        : oferta > gorna
        ? 'Kwota powyżej widełek. To bywa uzasadnione zakresem szerszym niż standardowy albo terminem na już, ale warto poprosić o rozpisanie na pozycje.'
        : 'Kwota mieści się w widełkach dla tego metrażu i miasta. Przy porównywaniu ofert liczy się teraz zakres, a nie sama suma.';
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
    script: `const CITIES = ${JSON.stringify(Object.fromEntries(cities.map((c) => [c.slug, [c.coef, c.name, c.loc]])))};
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
})();

(function(){
  const f = document.getElementById('calosc');
  if (!f) return;
  const werdykt = document.querySelector('[data-werdykt2]');
  const rows = document.querySelector('[data-rows2]');
  const rada = document.querySelector('[data-rada2]');
  bindForm(f, () => {
    const v = readForm(f);
    const [, , gdzie] = CITIES[v.miasto2];
    const zaM2 = (POD_KLUCZ[v.miasto2] || {})[v.poziom] || 0;
    const mediana = zaM2 * (v.metraz || 0);
    const dolna = mediana * 0.85, gorna = mediana * 1.15;
    const oferta = v.suma || 0;
    const odchylenie = mediana ? Math.round((oferta / mediana - 1) * 100) : 0;

    rows.innerHTML =
      '<li><span class="label"><span>Wycena od ekipy</span></span><span class="val">' + F(R(oferta)) + '</span></li>' +
      '<li><span class="label"><span>Nasze wyliczenie</span><span class="qty">' + F(R(zaM2)) + ' zł/m² ' + gdzie + '</span></span><span class="val">' + F(R(mediana)) + '</span></li>' +
      '<li><span class="label"><span>Widełki rynkowe</span></span><span class="val">' + F(R(dolna)) + ' – ' + F(R(gorna)) + '</span></li>';

    werdykt.textContent = (odchylenie > 0 ? '+' : '') + odchylenie + '%';
    werdykt.className = 't-val ' + (oferta < dolna ? 'werdykt-nisko' : oferta > gorna ? 'werdykt-wysoko' : 'werdykt-ok');
    rada.textContent =
      oferta < dolna
        ? 'Kwota poniżej widełek. Zapytaj wprost, czego nie obejmuje: najczęściej brakuje wywozu gruzu, przygotowania podłoża albo materiału po stronie wykonawcy.'
        : oferta > gorna
        ? 'Kwota powyżej widełek. To bywa uzasadnione zakresem szerszym niż standardowy albo terminem na już, ale warto poprosić o rozpisanie na pozycje.'
        : 'Kwota mieści się w widełkach dla tego metrażu i miasta. Przy porównywaniu ofert liczy się teraz zakres, a nie sama suma.';
  });
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
    <div class="card"><h3>Sama robocizna</h3><p class="big">${sameRobocizna}</p><p>${odmien(sameRobocizna, 'pozycja, w której', 'pozycje, w których', 'pozycji, w których')} nie ma żadnego materiału po stronie wykonawcy: demontaże, montaże urządzeń kupowanych przez inwestora, sprzątanie.</p></div>
    <div class="card"><h3>Przewaga materiału</h3><p class="big">${przewagaMaterialu.length}</p><p>${odmien(przewagaMaterialu.length, 'pozycja, w której', 'pozycje, w których', 'pozycji, w których')} materiał kosztuje więcej niż praca. Tu o cenie decyduje półka cenowa produktu.</p></div>
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
    script: `bindSort(document.getElementById('tab'));`,
  });
}

/* ---------- historia zmian w cenniku ---------- */

export const AKTUALIZACJE = [
  {
    data: '2026-08',
    tytul: 'Weryfikacja punktowa doprowadzona do końca',
    opis: 'Przejście przez pozostałe kategorie i porównanie każdej stawki z osobna z publicznymi cennikami. Udział pozycji, dla których źródło podaje liczbę dla tej konkretnej roboty, wzrósł z 44 do 97 na 102.',
    zmiany: [
      ['Dekarstwo', 'Więźba 95 → 72 zł/m², obróbki blacharskie 48 → 36 zł/mb. Rąbek stojący podniesiony ze 135 do 165 zł/m², bo był poniżej realiów.'],
      ['Brukarstwo', 'Odwodnienie liniowe 220 → 400 zł/mb, obrzeża 33 → 60, krawężniki 56 → 85. Kostka betonowa obniżona ze 187 do 150 zł/m².'],
      ['Biały montaż', 'Wanna 420 → 590 zł, kabina 460 → 680 zł, WC ze stelażem 360 → 540 zł. Wszystkie pozycje były zaniżone wobec rynku.'],
      ['Elektryka i stolarka', 'Rozdzielnica 1140 → 1770 zł, drzwi zewnętrzne 680 → 420 zł, drzwi wewnętrzne 340 → 280 zł.'],
      ['Rozbiórki', 'Wyburzenie ścianki 65 → 85 zł/m², wywóz gruzu 280 → 240 zł/m³ po rozbiciu na wynoszenie i utylizację, demontaż podłogi 22 → 30 zł/m².'],
      ['Pozostałe', 'Pięć pozycji zostaje oznaczonych jako orientacyjne, bo źródła podają dla nich wyłącznie szerokie widełki dla całej grupy robót. Udawanie precyzji, której nie ma, byłoby gorsze niż jej brak.'],
    ],
  },
  {
    data: '2026-08',
    tytul: 'Weryfikacja punktowa całego cennika',
    opis: 'Przejście pozycja po pozycji przez wszystkie kategorie i porównanie stawek z publicznymi cennikami wykonawców. Pierwsze przejście przez cennik pozycja po pozycji, obejmujące instalacje grzewcze, dekarstwo, brukarstwo i hydraulikę.',
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
    <div class="card"><h3>Sprawdzone punktowo</h3><p class="big">${sprawdzone}</p><p>${odmien(sprawdzone, 'pozycja, dla której', 'pozycje, dla których', 'pozycji, dla których')} źródło podaje liczbę dla tej konkretnej roboty.</p></div>
    <div class="card"><h3>Z przedziału grupy</h3><p class="big">${works.length - sprawdzone}</p><p>${odmien(works.length - sprawdzone, 'pozycja wyprowadzona', 'pozycje wyprowadzone', 'pozycji wyprowadzonych')} z widełek dla całej grupy robót, oznaczonych na swoich stronach jako orientacyjne.</p></div>
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

/* ---------- jak czytać kosztorys ---------- */

export function jakCzytacPage({ works, units }) {
  const przyklady = [
    ['Robota bez jednostki', 'Pozycja „łazienka” za 15 000 zł nie mówi nic. Ta sama kwota może obejmować wszystko albo samo płytkowanie. Każda pozycja powinna mieć jednostkę: metr kwadratowy, metr bieżący, punkt albo sztukę.'],
    ['Brak ilości', 'Stawka bez ilości jest niepełna. „Gładzie 42 zł/m²” brzmi konkretnie, ale dopiero „gładzie 42 zł/m² × 148 m² = 6 216 zł” pozwala sprawdzić, czy ktoś nie policzył ścian dwa razy albo o połowę za mało.'],
    ['Materiał wliczony czy nie', 'Najczęstsze źródło różnic między ofertami. Jedna ekipa podaje 150 zł/m² z materiałem, druga 60 zł/m² bez, i wygląda to jak dwie i pół raza taniej. Przy każdej pozycji musi być jasne, kto kupuje materiał.'],
    ['Pozycje warunkowe', 'Rzeczy widoczne dopiero po demontażu: odparzony tynk, skorodowane zbrojenie, nierówna wylewka. Dobry kosztorys wymienia je jako warunkowe ze stawką jednostkową, zamiast milczeć i dopisywać w trakcie.'],
    ['Wywóz i utylizacja', 'Gruz to osobna pozycja z opłatą za przyjęcie odpadów. Jeśli jej nie ma, warto zapytać, czy jest w cenie demontażu, czy dojdzie później.'],
    ['Termin i harmonogram', 'Kosztorys bez terminu to tylko cena. Przy pracach z przerwami technologicznymi, jak wylewka czy hydroizolacja, harmonogram jest równie ważny jak kwota.'],
  ];

  const jedn = Object.entries(units).map(([k, v]) => [v.name, {
    m2: 'Powierzchnie: tynki, gładzie, malowanie, płytki, podłogi, ocieplenia.',
    mb: 'Długości: listwy, obróbki, krawężniki, rynny, ogrodzenia, obwód ramy okna.',
    szt: 'Pojedyncze montaże: ceramika, drzwi, okna, oprawy, urządzenia.',
    pkt: 'Punkty instalacyjne: gniazdo, włącznik, podejście wodne, grzejnik.',
    m3: 'Objętości: wywóz gruzu, prace ziemne.',
    kwp: 'Moc instalacji fotowoltaicznej, w kilowatopikach.',
  }[k] || '']);

  return layout({
    title: 'Jak czytać kosztorys od ekipy remontowej',
    description: 'Co musi być w kosztorysie, żeby dało się go sprawdzić i porównać z inną ofertą: jednostki, ilości, materiał, pozycje warunkowe i harmonogram.',
    path: '/jak-czytac-kosztorys/',
    breadcrumb: `<a href="${R}">Cennik</a> · Jak czytać kosztorys`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Poradnik</p>
  <h1>Jak czytać kosztorys</h1>
  <p class="lede">Dwie oferty na ten sam remont potrafią różnić się dwukrotnie i obie być uczciwe. Różnica siedzi nie w stawkach, tylko w tym, co każda z nich obejmuje.</p>
  <p class="section-note">Najczęstszy błąd przy wyborze wykonawcy to porównywanie sum końcowych. Sumę da się zestawić z sumą tylko wtedy, gdy oba kosztorysy mają ten sam zakres, a to zdarza się rzadko. Poniżej sześć rzeczy, które decydują o tym, czy dokument w ogóle nadaje się do porównania.</p>

  <h2 style="margin-top:2rem">Czego szukać w kosztorysie</h2>
  ${przyklady.map(([t, o]) => `<h3 style="margin:1.2rem 0 .3rem">${t}</h3><p class="section-note">${o}</p>`).join('')}

  <h2 style="margin-top:2.2rem">Jednostki, w których rozlicza się roboty</h2>
  <p class="section-note">Jeśli pozycja ma inną jednostkę niż poniżej, warto dopytać dlaczego. Nietypowe rozliczenie samo w sobie nie jest błędem, ale utrudnia porównanie z rynkiem.</p>
  <div class="board-wrap"><table class="board">
    <thead><tr><th data-sort="off">Jednostka</th><th data-sort="off">Co się w niej rozlicza</th></tr></thead>
    <tbody>${jedn.filter((j) => j[1]).map(([n, o]) => `<tr><td><b>${n}</b></td><td style="text-align:left;white-space:normal">${o}</td></tr>`).join('')}</tbody>
  </table></div>

  <h2 style="margin-top:2.2rem">Kosztorys ślepy, czyli jak porównywać uczciwie</h2>
  <p class="section-note">Najlepszy sposób na porównanie ofert to rozesłanie wszystkim tego samego zestawienia zakresu i ilości, bez cen. Wykonawcy wpisują tylko stawki, a Ty dostajesz dokumenty, które da się zestawić wiersz po wierszu. Taki dokument nazywa się kosztorysem ślepym i można go złożyć z <a href="${R}cennik/">pełnego cennika</a>, wypisując pozycje, które Cię dotyczą.</p>
  <p class="section-note">Przy okazji odpada najczęstszy problem: różne rozumienie zakresu. Jeśli w Twoim zestawieniu jest „wywóz gruzu, 3 m³”, żadna oferta nie pominie tej pozycji po cichu.</p>

  <h2 style="margin-top:2.2rem">Co zrobić z gotową wyceną</h2>
  <p class="section-note">Przelicz kwotę na jednostkę i porównaj z medianą rynkową w <a href="${R}sprawdz-oferte/">narzędziu do oceny oferty</a>. Odchylenie kilkunastu procent w górę mieści się w normalnym rozrzucie: dobra ekipa z zapełnionym kalendarzem ma prawo kosztować więcej. Większa różnica to sygnał do rozmowy, a nie do zerwania kontaktu.</p>
  <p class="section-note">Gdy kosztorys jest już uzgodniony, kolejne kroki opisują poradniki o <a href="${R}umowa-z-ekipa/">umowie z ekipą</a> i o <a href="${R}odbior-prac/">odbiorze prac</a>.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [
        { '@type': 'Question', name: 'Dlaczego dwie oferty na ten sam remont tak się różnią?', acceptedAnswer: { '@type': 'Answer', text: 'Najczęściej dlatego, że obejmują różny zakres. Jedna wlicza materiał, druga nie, jedna liczy demontaż i wywóz gruzu, druga zakłada gotowe podłoże. Porównywać można dopiero po zestawieniu pozycja po pozycji.' } },
        { '@type': 'Question', name: 'Co to jest kosztorys ślepy?', acceptedAnswer: { '@type': 'Answer', text: 'Zestawienie zakresu i ilości robót bez cen, rozsyłane wykonawcom do wyceny. Dzięki temu każda oferta ma ten sam zakres i da się je porównać wiersz po wierszu, zamiast zestawiać same sumy końcowe.' } },
        { '@type': 'Question', name: 'Co powinna zawierać każda pozycja kosztorysu?', acceptedAnswer: { '@type': 'Answer', text: 'Nazwę roboty, jednostkę, ilość, stawkę jednostkową i informację, czy materiał jest po stronie wykonawcy. Bez tego pozycji nie da się sprawdzić ani porównać.' } },
      ],
    },
  });
}

/* ---------- umowa z wykonawcą ---------- */

export function umowaPage() {
  const punkty = [
    ['Zakres i kosztorys jako załącznik', 'Umowa powinna odsyłać do kosztorysu i traktować go jako część dokumentu. Bez tego spór o to, czy gruntowanie było w cenie, sprowadza się do słowa przeciwko słowu. Załącznik z pozycjami, ilościami i stawkami rozstrzyga takie kwestie w minutę.'],
    ['Wynagrodzenie: ryczałt czy kosztorys', 'Ryczałt to jedna kwota za cały zakres: bezpieczniejszy dla inwestora, ale wykonawca dolicza do niego zapas na niespodzianki. Rozliczenie kosztorysowe płaci się za faktycznie wykonane ilości: uczciwsze, gdy zakres może się zmienić, ale wymaga kontrolowania obmiaru.'],
    ['Harmonogram i przerwy technologiczne', 'Termin zakończenia bez rozpisania etapów niewiele znaczy przy pracach, w których schnięcie trwa dłużej niż robota. Warto zapisać kamienie milowe: koniec instalacji, koniec prac mokrych, gotowość do układania podłóg.'],
    ['Zaliczki i płatności etapami', 'Zaliczka na materiał jest normalna, zapłata z góry za całość nie. Bezpieczny układ to płatności po zakończonych etapach, z ostatnią transzą po odbiorze. Wysokość pierwszej zaliczki zwykle odpowiada kosztowi materiałów potrzebnych na start.'],
    ['Kto kupuje materiał', 'Zapis, który usuwa największe źródło sporów. Jeśli materiał kupuje inwestor, umowa powinna określać, kto odpowiada za braki i przestoje wynikające z dostaw. Jeśli wykonawca, warto ustalić standard, a nie tylko rodzaj.'],
    ['Kary za zwłokę i odstąpienie', 'Kara umowna działa w obie strony i sama w sobie nie jest oznaką braku zaufania. Warto określić, kiedy nie obowiązuje: opóźnienie z winy inwestora, brak decyzji o materiale, przerwa pogodowa przy pracach zewnętrznych.'],
    ['Odbiór i usterki', 'Protokół odbioru z listą usterek i terminem ich usunięcia. Bez protokołu trudno później dowieść, co było zgłoszone. Część wynagrodzenia zatrzymana do czasu usunięcia usterek jest standardem, a nie złośliwością.'],
    ['Gwarancja i rękojmia', 'Rękojmia za wady wynika z przepisów i obejmuje roboty budowlane przez określony czas niezależnie od tego, czy jest w umowie. Gwarancja to dobrowolna deklaracja wykonawcy i warto ją zapisać, razem z tym, co obejmuje.'],
  ];

  return layout({
    title: 'Umowa z ekipą remontową: co powinna zawierać',
    description: 'Na co zwrócić uwagę w umowie z wykonawcą: zakres, ryczałt czy kosztorys, harmonogram, zaliczki, kary, odbiór i gwarancja. Praktyczna lista punktów.',
    path: '/umowa-z-ekipa/',
    breadcrumb: `<a href="${R}">Cennik</a> · Umowa z ekipą`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Poradnik</p>
  <h1>Umowa z ekipą remontową</h1>
  <p class="lede">Umowa nie służy do tego, żeby kogoś złapać. Służy do tego, żeby obie strony rozumiały zakres tak samo, zanim zacznie się praca.</p>
  <p class="section-note">Większość sporów przy remoncie nie bierze się ze złej woli, tylko z różnego rozumienia tego samego ustalenia. Poniżej punkty, których brak najczęściej kończy się kłótnią, uszeregowane od najważniejszych.</p>

  <h2 style="margin-top:2rem">Co powinno znaleźć się w umowie</h2>
  ${punkty.map(([t, o]) => `<h3 style="margin:1.2rem 0 .3rem">${t}</h3><p class="section-note">${o}</p>`).join('')}

  <h2 style="margin-top:2.2rem">Czego nie da się załatwić umową</h2>
  <p class="section-note">Umowa nie zastąpi wyboru wykonawcy. Nie sprawi, że ekipa bez doświadczenia zrobi hydroizolację poprawnie, ani że dach będzie szczelny, jeśli obróbki wykonano niedbale. Reguluje, co się dzieje, gdy coś pójdzie nie tak, a nie to, czy pójdzie dobrze.</p>
  <p class="section-note">Nie zastąpi też obecności na budowie. Najtańszy sposób uniknięcia poprawek to obejrzenie każdego etapu, zanim zakryje go następny: instalacji przed tynkiem, hydroizolacji przed płytkami, więźby przed zabudową skosów.</p>

  <h2 style="margin-top:2.2rem">Zanim podpiszesz</h2>
  <p class="section-note">Po podpisaniu przyda się jeszcze <a href="${R}odbior-prac/">lista kontrolna do odbioru</a>, najlepiej uzgodniona z wykonawcą już na starcie. Sprawdź też, czy kwota mieści się w rynkowych widełkach: przelicz ją na jednostkę w <a href="${R}sprawdz-oferte/">narzędziu do oceny oferty</a>. Upewnij się, że kosztorys da się w ogóle porównać z innymi, według listy w poradniku <a href="${R}jak-czytac-kosztorys/">jak czytać kosztorys</a>. I zajrzyj do <a href="${R}poradnik/">kolejności prac</a>, żeby harmonogram w umowie miał sens technologiczny, a nie tylko kalendarzowy.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [
        { '@type': 'Question', name: 'Ryczałt czy rozliczenie kosztorysowe?', acceptedAnswer: { '@type': 'Answer', text: 'Ryczałt to jedna kwota za cały zakres, bezpieczniejsza dla inwestora, ale wykonawca dolicza do niej zapas na niespodzianki. Rozliczenie kosztorysowe płaci się za faktycznie wykonane ilości, co bywa uczciwsze przy zmiennym zakresie, ale wymaga kontrolowania obmiaru.' } },
        { '@type': 'Question', name: 'Jaka zaliczka dla ekipy remontowej jest normalna?', acceptedAnswer: { '@type': 'Answer', text: 'Zaliczka na materiał potrzebny na start jest standardem. Zapłata z góry za całość nie. Bezpieczny układ to płatności po zakończonych etapach, z ostatnią transzą po odbiorze i usunięciu usterek.' } },
        { '@type': 'Question', name: 'Czy wykonawca musi dać gwarancję?', acceptedAnswer: { '@type': 'Answer', text: 'Rękojmia za wady wynika z przepisów i obejmuje roboty budowlane niezależnie od zapisów umowy. Gwarancja jest dobrowolną deklaracją wykonawcy, dlatego warto zapisać w umowie jej długość i zakres.' } },
      ],
    },
  });
}

/* ---------- odbiór prac ---------- */

export function odbiorPage() {
  const listy = [
    ['Ściany i sufity', [
      'Płaszczyzna sprawdzona łatą dwumetrową: odchyłka nie powinna przekraczać kilku milimetrów.',
      'Światło z boku, najlepiej latarką wzdłuż ściany: tak ujawniają się fale i ślady po szpachlowaniu.',
      'Narożniki pionowe i kąty proste w miejscach, gdzie staną meble na wymiar.',
      'Kolor jednolity, bez prześwitów i śladów wałka na łączeniach warstw.',
    ]],
    ['Podłogi', [
      'Brak klawiszowania: chodzenie po całej powierzchni, nie tylko po środku.',
      'Szczelina dylatacyjna przy ścianach, ukryta pod listwą, nie wypełniona klejem.',
      'Listwy przylegające na całej długości, bez szczelin w narożnikach.',
      'Przy płytkach: równe fugi, brak pustek pod płytką sprawdzony opukaniem.',
    ]],
    ['Łazienka i kuchnia', [
      'Spadki: woda wylana przy prysznicu odpływa, a nie stoi.',
      'Silikon ciągły w narożnikach i na styku wanny ze ścianą, bez pęcherzy.',
      'Rewizja do zaworów w zabudowie pionu, dostępna bez skuwania.',
      'Sprawdzenie szczelności podejść przy pełnym otwarciu wody, także pod zlewem.',
    ]],
    ['Instalacje', [
      'Protokół z pomiarów elektrycznych: ciągłość, rezystancja izolacji, test różnicówki.',
      'Każdy włącznik steruje tym, czym powinien, a gniazda mają prawidłową biegunowość.',
      'Grzejniki odpowietrzone i grzejące równomiernie na całej powierzchni.',
      'Wentylacja: kartka przyłożona do kratki powinna się trzymać.',
    ]],
    ['Stolarka', [
      'Skrzydła drzwi i okien zamykają się bez oporu i nie otwierają samoczynnie.',
      'Okna: test kartki na całym obwodzie, sprawdza docisk uszczelki.',
      'Ościeżnice w pionie, szczeliny wokół równe na całej wysokości.',
      'Parapety uszczelnione pod ramą, bez śladów po skroplinach.',
    ]],
  ];

  return layout({
    title: 'Odbiór prac remontowych: lista kontrolna',
    description: 'Co sprawdzić przy odbiorze remontu: ściany, podłogi, łazienka, instalacje i stolarka. Lista kontrolna i zasady spisywania protokołu usterek.',
    path: '/odbior-prac/',
    breadcrumb: `<a href="${R}">Cennik</a> · Odbiór prac`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Lista kontrolna</p>
  <h1>Odbiór prac remontowych</h1>
  <p class="lede">Odbiór to nie formalność na koniec, tylko ostatni moment, w którym poprawki są jeszcze po stronie wykonawcy. Po zapłaceniu ostatniej transzy zmieniają się w Twój problem.</p>
  <p class="section-note">Najlepiej odbierać etapami, a nie wszystko naraz: instalacje przed tynkiem, hydroizolację przed płytkami, wylewkę przed podłogą. Etap zakryty przez następny przestaje być sprawdzalny, a jego poprawa oznacza rozbiórkę tego, co powstało później.</p>

  ${listy.map(([t, p]) => `
  <h2 style="margin-top:2rem">${t}</h2>
  <ul class="factors">${p.map((x) => `<li>${x}</li>`).join('')}</ul>`).join('')}

  <h2 style="margin-top:2.2rem">Protokół usterek</h2>
  <p class="section-note">Spisany na miejscu, z listą punktów i terminem usunięcia, podpisany przez obie strony. Zdjęcia przy każdej pozycji rozstrzygają późniejsze wątpliwości szybciej niż opis. Bez protokołu trudno dowieść, co było zgłoszone, a co pojawiło się później.</p>
  <p class="section-note">Zatrzymanie części wynagrodzenia do czasu usunięcia usterek jest standardem rynkowym, a nie wyrazem nieufności. Wysokość ustala się w umowie, zwykle jako kilka procent wartości prac.</p>

  <h2 style="margin-top:2.2rem">Czego nie sprawdzisz przy odbiorze</h2>
  <p class="section-note">Skuteczności hydroizolacji, jakości wykonania instalacji pod tynkiem i tego, czy wylewka była dostatecznie sucha przed ułożeniem podłogi. Te rzeczy ujawniają się po miesiącach i dlatego obejmuje je rękojmia. To także powód, dla którego warto oglądać etapy w trakcie, a nie ufać, że wyjdzie na jaw przy odbiorze.</p>

  <p class="receipt-foot" style="margin-top:1.4rem">Zanim podpiszesz protokół, sprawdź, czy zakres zgadza się z <a href="${R}jak-czytac-kosztorys/">kosztorysem</a>, a warunki odbioru z <a href="${R}umowa-z-ekipa/">umową</a>.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [
        { '@type': 'Question', name: 'Jak sprawdzić równość ścian przy odbiorze?', acceptedAnswer: { '@type': 'Answer', text: 'Łatą dwumetrową przykładaną w kilku miejscach oraz światłem latarki prowadzonym wzdłuż ściany. Boczne światło ujawnia fale i ślady po szpachlowaniu, których nie widać w oświetleniu górnym.' } },
        { '@type': 'Question', name: 'Czy można zatrzymać część zapłaty do usunięcia usterek?', acceptedAnswer: { '@type': 'Answer', text: 'Tak, i jest to standard rynkowy. Wysokość zatrzymanej kwoty ustala się w umowie, zwykle jako kilka procent wartości prac, wypłacanych po usunięciu usterek z protokołu.' } },
        { '@type': 'Question', name: 'Kiedy odbierać poszczególne etapy remontu?', acceptedAnswer: { '@type': 'Answer', text: 'Zanim zakryje je następny etap: instalacje przed tynkowaniem, hydroizolację przed płytkami, wylewkę przed układaniem podłogi. Etap zakryty przestaje być sprawdzalny, a jego poprawa oznacza rozbiórkę późniejszych warstw.' } },
      ],
    },
  });
}

/* ---------- wybór wykonawcy ---------- */

export function wyborEkipyPage() {
  const sygnaly = [
    ['Dobry znak', 'Chce obejrzeć miejsce przed wyceną', 'Rzetelna wycena wymaga zobaczenia stanu ścian, podłoża i dostępu. Kwota podana przez telefon po samym metrażu to zgadywanie, które później koryguje się w górę.'],
    ['Dobry znak', 'Rozpisuje ofertę na pozycje', 'Kosztorys z jednostkami i ilościami oznacza, że wykonawca sam policzył zakres. Jedna kwota za całość bywa uczciwa, ale nie da się jej z niczym porównać.'],
    ['Dobry znak', 'Mówi, czego nie zrobi', 'Ekipa, która przyznaje, że nie robi hydroizolacji tarasów albo nie bierze się za rąbek stojący, jest wiarygodniejsza niż taka, która robi wszystko.'],
    ['Dobry znak', 'Pyta o terminy dostaw materiału', 'Znak, że planuje harmonogram, a nie zamierza improwizować. Przy materiale kupowanym przez inwestora to również sygnał, że rozumie ryzyko przestoju.'],
    ['Sygnał ostrzegawczy', 'Cena wyraźnie poniżej rynku', 'Zwykle oznacza węższy zakres, a nie większą hojność. Przed odrzuceniem droższej oferty warto sprawdzić, co dokładnie zawiera tania: często brakuje w niej przygotowania podłoża albo wywozu gruzu.'],
    ['Sygnał ostrzegawczy', 'Wysoka zaliczka z góry', 'Zaliczka na materiał jest normalna, przedpłata za całość nie. Ryzyko rośnie, gdy do tego dochodzi presja na szybką decyzję.'],
    ['Sygnał ostrzegawczy', 'Brak umowy albo niechęć do jej podpisania', 'Umowa chroni obie strony i wykonawca pracujący uczciwie zwykle sam ją proponuje. Argument, że „u nas wszystko na słowo” brzmi sympatycznie do pierwszego sporu.'],
    ['Sygnał ostrzegawczy', 'Termin od zaraz w sezonie', 'W kwietniu i maju dobre ekipy mają zapełnione kalendarze. Natychmiastowa dostępność w szczycie sezonu nie przesądza o niczym, ale warto wtedy dopytać o realizacje z ostatnich miesięcy.'],
  ];

  return layout({
    title: 'Jak wybrać ekipę remontową',
    description: 'Na co zwrócić uwagę przy wyborze wykonawcy: co świadczy o rzetelności, jakie sygnały powinny niepokoić i o co zapytać przed podpisaniem umowy.',
    path: '/wybor-ekipy/',
    breadcrumb: `<a href="${R}">Cennik</a> · Wybór ekipy`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Poradnik</p>
  <h1>Jak wybrać ekipę remontową</h1>
  <p class="lede">Wybór wykonawcy wpływa na końcowy koszt bardziej niż stawka za metr. Ta sama robota zrobiona dwa razy kosztuje dwa razy tyle, niezależnie od tego, jak tanio poszła za pierwszym razem.</p>
  <p class="section-note">Nie prowadzimy rankingu ekip i nie pośredniczymy w zleceniach, więc nikogo tu nie polecamy. Poniżej to, co daje się ocenić samodzielnie, na etapie pierwszej rozmowy i pierwszej oferty.</p>

  <h2 style="margin-top:2rem">Na co patrzeć</h2>
  <div class="board-wrap"><table class="board">
    <thead><tr><th data-sort="off">Typ</th><th data-sort="off">Obserwacja</th><th data-sort="off">Dlaczego to ważne</th></tr></thead>
    <tbody>${sygnaly.map(([typ, obs, dlaczego]) => `<tr>
      <td><span class="delta ${typ === 'Dobry znak' ? 'down' : 'up'}">${typ}</span></td>
      <td style="text-align:left;white-space:normal"><b>${obs}</b></td>
      <td style="text-align:left;white-space:normal">${dlaczego}</td>
    </tr>`).join('')}</tbody>
  </table></div>

  <h2 style="margin-top:2.2rem">O co zapytać przy pierwszej rozmowie</h2>
  <ul class="factors">
    <li>Czy w cenie jest przygotowanie podłoża, czy zakłada się, że jest gotowe.</li>
    <li>Kto kupuje materiał i kto odpowiada za braki oraz przestoje z tego wynikające.</li>
    <li>Ile osób będzie pracować i czy ekipa prowadzi równolegle inne budowy.</li>
    <li>Jak wygląda harmonogram przy pracach z przerwami technologicznymi.</li>
    <li>Czy przy odbiorze będzie protokół i jaka część wynagrodzenia zostaje do usunięcia usterek.</li>
    <li>Co obejmuje gwarancja i na jak długo.</li>
  </ul>

  <h2 style="margin-top:2.2rem">Ile ofert zebrać</h2>
  <p class="section-note">Trzy wystarczą, o ile wszystkie dotyczą tego samego zakresu. Zebranie dziesięciu ofert o różnym zakresie daje mniej informacji niż trzy porównywalne. Najprostszy sposób na porównywalność to rozesłanie wszystkim tego samego zestawienia pozycji bez cen, opisanego w poradniku <a href="${R}jak-czytac-kosztorys/">jak czytać kosztorys</a>.</p>

  <h2 style="margin-top:2.2rem">Kolejne kroki</h2>
  <p class="section-note">Gdy masz już wyceny, porównaj je z rynkiem w <a href="${R}sprawdz-oferte/">narzędziu do oceny oferty</a>, ustal warunki według poradnika o <a href="${R}umowa-z-ekipa/">umowie</a>, a przed ostatnią płatnością przejdź <a href="${R}odbior-prac/">listę kontrolną odbioru</a>.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [
        { '@type': 'Question', name: 'Ile ofert zebrać przed wyborem ekipy?', acceptedAnswer: { '@type': 'Answer', text: 'Trzy wystarczą, pod warunkiem że dotyczą tego samego zakresu. Dziesięć ofert o różnym zakresie daje mniej informacji niż trzy porównywalne, dlatego warto rozesłać wykonawcom identyczne zestawienie pozycji bez cen.' } },
        { '@type': 'Question', name: 'Czy najtańsza oferta jest zła?', acceptedAnswer: { '@type': 'Answer', text: 'Nie zawsze, ale cena wyraźnie poniżej rynku najczęściej oznacza węższy zakres, a nie większą hojność. Warto sprawdzić, czy zawiera przygotowanie podłoża, wywóz gruzu i materiał, zanim uzna się ją za okazję.' } },
        { '@type': 'Question', name: 'Czy wykonawca powinien obejrzeć miejsce przed wyceną?', acceptedAnswer: { '@type': 'Answer', text: 'Tak. Rzetelna wycena wymaga zobaczenia stanu ścian, podłoża i warunków dostępu. Kwota podana przez telefon na podstawie samego metrażu to szacunek, który zwykle koryguje się w górę w trakcie prac.' } },
      ],
    },
  });
}