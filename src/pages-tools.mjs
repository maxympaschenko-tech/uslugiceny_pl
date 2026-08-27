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