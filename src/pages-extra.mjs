// Dwie rodziny stron pod konkretne zapytania:
// 1) metraże ("ile kosztuje remont mieszkania 50 m2") — najczęstsza forma pytania o remont,
// 2) porównania ("wylewka cementowa czy anhydrytowa") — pytanie zadawane tuż przed decyzją.
// Obie korzystają z tych samych danych co reszta serwisu, więc nie rozjadą się z cennikiem.
import { layout, estimateSheet, calcScript, field, select, money, tytul } from './templates.mjs';
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
  bindSheetActions(sheet);
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
  {
    slug: 'pompa-ciepla-czy-kociol-gazowy',
    h1: 'Pompa ciepła czy kocioł gazowy',
    a: 'kociol_gazowy', b: 'pompa_ciepla',
    lede: 'Montaż pompy kosztuje kilkakrotnie więcej niż wymiana kotła. Rachunek wychodzi na zero dopiero po latach, więc decyduje nie cena instalacji, tylko to, jak długo zamierzasz tu mieszkać.',
    za: ['Wyraźnie niższy koszt samego urządzenia i montażu.', 'Działa bez względu na temperaturę zewnętrzną i bez dodatkowej mocy elektrycznej.', 'Sprawdzona technologia, serwis dostępny w każdym mieście.'],
    przeciw: ['Wymaga sprawnego komina i przeglądów kominiarskich.', 'Koszt ogrzewania zależy od ceny gazu, na którą nie masz wpływu.', 'Nie łączy się sensownie z fotowoltaiką: prądem nie zasilisz palnika.'],
    zaB: ['Znacznie niższe koszty eksploatacji, zwłaszcza w domu ocieplonym z ogrzewaniem podłogowym.', 'Świetnie współpracuje z fotowoltaiką, bo zamienia własny prąd na ciepło.', 'Bez komina, bez spalin i bez przeglądów kominiarskich, a latem może chłodzić.'],
    przeciwB: ['Kilkakrotnie wyższy koszt instalacji i uruchomienia.', 'W nieocieplonym domu z grzejnikami działa nieefektywnie i rachunki potrafią rozczarować.', 'Potrzebuje miejsca na jednostkę zewnętrzną, fundamentu i osobnego obwodu w rozdzielnicy.'],
    werdykt: 'Dom ocieplony, z ogrzewaniem podłogowym i najlepiej z fotowoltaiką: pompa ciepła. Stary dom z grzejnikami, którego na razie nie zamierzasz ocieplać: kocioł gazowy, a pompa dopiero po termomodernizacji.',
  },
  {
    slug: 'blachodachowka-czy-dachowka-ceramiczna',
    h1: 'Blachodachówka czy dachówka ceramiczna',
    a: 'blachodachowka', b: 'dachowka_ceramiczna',
    lede: 'Dachówka wychodzi około trzy czwarte drożej za metr i waży kilkakrotnie więcej. Za to przeżyje właściciela, podczas gdy blacha ma określony termin przydatności.',
    za: ['Wyraźnie tańsza w materiale i szybsza w montażu.', 'Lekka, więc nie wymaga wzmacniania więźby przy wymianie pokrycia.', 'Duże arkusze zamykają połać w kilka dni.'],
    przeciw: ['Głośniejsza podczas deszczu, jeśli poddasze nie jest dobrze ocieplone.', 'Uszkodzenie powłoki zaczyna korozję, której nie da się zatrzymać punktowo.', 'Przy dachu wielospadowym powstaje sporo odpadu z docinania arkuszy.'],
    zaB: ['Żywotność liczona w dziesiątkach lat, często dłuższa niż konstrukcja pod nią.', 'Cicha i dobrze znosi mróz oraz promieniowanie słoneczne.', 'Pojedynczą uszkodzoną sztukę wymienia się w kilka minut, bez ruszania reszty połaci.'],
    przeciwB: ['Dwa razy droższa i znacznie wolniejsza w układaniu.', 'Ciężka: przy wymianie pokrycia więźba często wymaga wzmocnienia, co jest osobnym kosztem.', 'Karpiówka układana podwójnie oznacza dwa razy więcej sztuk na metr i odpowiednio wyższą robociznę.'],
    werdykt: 'Wymiana pokrycia na istniejącej więźbie, przy ograniczonym budżecie: blachodachówka, najlepiej modułowa, bo daje mniej odpadu. Nowy dom albo remont z myślą o kilku dekadach: dachówka ceramiczna, o ile konstrukcja ją udźwignie.',
  },
  {
    slug: 'tynk-silikonowy-czy-mineralny',
    h1: 'Tynk silikonowy czy mineralny',
    a: 'tynk_mineralny', b: 'tynk_silikonowy',
    lede: 'Różnica w cenie za metr jest niewielka i cała siedzi w materiale. Decyduje to, czy elewacja ma się sama myć deszczem, czy ma oddychać.',
    za: ['Najtańszy tynk elewacyjny w tej grupie.', 'Bardzo dobrze przepuszcza parę wodną, więc pasuje do wełny i starych murów.', 'Odporny na algi i grzyby dzięki wysokiej zasadowości.'],
    przeciw: ['Wymaga późniejszego malowania farbą elewacyjną, co jest osobną pozycją.', 'Sztywniejszy, przez co bardziej podatny na mikropęknięcia przy pracy podłoża.', 'Ograniczona paleta kolorów w wersji niemalowanej.'],
    zaB: ['Powierzchnia odpycha wodę, więc elewacja dłużej zostaje czysta.', 'Elastyczny, lepiej znosi ruchy podłoża i różnice temperatur.', 'Barwiony w masie, bez konieczności malowania po nałożeniu.'],
    przeciwB: ['Droższy materiał przy zbliżonej robociźnie.', 'Niższa paroprzepuszczalność niż w tynku mineralnym.', 'Wymaga starannego prowadzenia pracy mokre na mokre, bo ślady łączeń są bardziej widoczne.'],
    werdykt: 'Ściana ocieplona wełną, stary mur albo elewacja od strony zacienionej: tynk mineralny. Dom przy ruchliwej ulicy, ściana od południa i chęć uniknięcia malowania: tynk silikonowy.',
  },
  {
    slug: 'panele-czy-plytki-na-podloge',
    h1: 'Panele czy płytki na podłogę',
    a: 'panele', b: 'plytki_podloga',
    lede: 'Płytki wychodzą około półtora raza drożej za metr, ale w kuchni i przedpokoju wygrywają bezapelacyjnie. W salonie i sypialni sprawa nie jest już oczywista.',
    za: ['Wyraźnie tańsze w materiale i w montażu.', 'Cieplejsze w dotyku, przyjemne na boso bez ogrzewania podłogowego.', 'Montaż na klik w jeden dzień, bez klejenia i bez czekania na wiązanie.'],
    przeciw: ['Pęcznieją przy zalaniu i wtedy nadają się tylko do wymiany.', 'Zarysowań nie da się usunąć, uszkodzoną deskę trzeba wymienić.', 'Gorzej znoszą piasek wnoszony na butach, więc w przedpokoju zużywają się szybciej.'],
    zaB: ['Nie boją się wody, dlatego są jedynym rozsądnym wyborem w łazience i kuchni.', 'Znoszą piasek, pazury i ciężkie meble praktycznie bez śladu.', 'Najlepiej przewodzą ciepło, więc pod ogrzewaniem podłogowym dają najwyższą sprawność.'],
    przeciwB: ['Wyraźnie droższe razem z robocizną i wymagają równego, wypoziomowanego podłoża.', 'Zimne w dotyku bez ogrzewania podłogowego.', 'Twarde: upuszczony talerz się rozbije, a upuszczone naczynie może wyszczerbić płytkę.'],
    werdykt: 'Kuchnia, łazienka, przedpokój i taras: płytki, bez dyskusji. Salon i sypialnia: panele, chyba że masz ogrzewanie podłogowe, bo wtedy płytki oddają ciepło wyraźnie lepiej i różnica w rachunkach zwraca dopłatę.',
  },
  {
    slug: 'tapeta-czy-farba',
    h1: 'Tapeta czy farba',
    a: 'malowanie', b: 'tapetowanie',
    lede: 'Tapetowanie wychodzi około półtora raza drożej od malowania, ale to nie robocizna przesądza o wyborze. Decyduje to, jak często zamierzasz zmieniać wystrój.',
    za: ['Najtańsze wykończenie ściany i najszybsze w wykonaniu.', 'Poprawka po uszkodzeniu to kwestia pędzla i resztki farby z puszki.', 'Zmiana koloru w weekend, bez zrywania czegokolwiek.'],
    przeciw: ['Nie zakryje żadnej nierówności, a przy bocznym świetle je podkreśli.', 'Ściany w ciągach komunikacyjnych brudzą się szybciej i wymagają odświeżania co kilka lat.', 'Płaska powierzchnia bez faktury bywa monotonna na dużych ścianach.'],
    zaB: ['Faktura i wzór, których farbą nie da się uzyskać.', 'Winylowa i flizelinowa znoszą mycie lepiej niż większość farb.', 'Dobrze maskuje drobne rysy i mikropęknięcia podłoża.'],
    przeciwB: ['Droższa robocizna i wyraźnie droższy materiał przy wzorach z raportem.', 'Uszkodzonego brytu nie da się naprawić punktowo, wymienia się cały pas.', 'Zmiana wystroju wymaga zerwania, a przy starych klejach także naprawy podłoża.'],
    werdykt: 'Całe mieszkanie i ściany, które chcesz odświeżać co kilka lat: farba. Jedna ściana z charakterem, sypialnia albo pokój dziecka, gdzie liczy się faktura: tapeta, najlepiej flizelinowa, bo schodzi później na sucho.',
  },
  {
    slug: 'sufit-podwieszany-czy-gladz',
    h1: 'Sufit podwieszany czy gładź',
    a: 'gladz', b: 'gk_sufit',
    lede: 'Sufit z płyty kosztuje kilkakrotnie więcej niż wygładzenie istniejącego stropu i zabiera kilkanaście centymetrów wysokości. Płaci się za to, czego nie widać: instalacje i oświetlenie.',
    za: ['Wielokrotnie tańsza i szybsza w wykonaniu.', 'Nie obniża pomieszczenia, co w bloku z niskim stropem bywa rozstrzygające.', 'Przy równym stropie daje efekt nie do odróżnienia od płyty.'],
    przeciw: ['Nie schowa przewodów ani kanałów wentylacyjnych.', 'Na nierównym albo popękanym stropie wymaga grubszej warstwy i tak nie zawsze wystarcza.', 'Oświetlenie punktowe wymaga stropu podwieszanego, więc zostają lampy natynkowe.'],
    zaB: ['Ukrywa instalacje, kanały i nierówny strop bez kompromisów.', 'Pozwala na oprawy punktowe, taśmy LED i wielopoziomowe formy.', 'Poprawia akustykę, zwłaszcza z wypełnieniem wełną.'],
    przeciwB: ['Obniża pomieszczenie o kilkanaście centymetrów, licząc z oprawami.', 'Kilkakrotnie droższy, a przy wielu poziomach różnica rośnie jeszcze bardziej.', 'Dostęp do instalacji nad płytą wymaga rewizji zaplanowanej wcześniej.'],
    werdykt: 'Równy strop i wysokość poniżej 2,6 metra: gładź, bez wahania. Konieczność ukrycia wentylacji, oświetlenie punktowe albo strop, którego nie da się wyrównać: sufit podwieszany, licząc się z utratą wysokości.',
  },
  {
    slug: 'cyklinowanie-czy-nowa-podloga',
    h1: 'Cyklinowanie czy nowa podłoga',
    a: 'cyklinowanie', b: 'panele',
    lede: 'Odnowienie starego parkietu bywa tańsze od najprostszych paneli, a daje materiał, którego dziś w tej cenie się nie kupuje. Pytanie brzmi, ile warstwy użytkowej zostało.',
    za: ['Zwykle taniej niż położenie nowej podłogi razem z materiałem.', 'Zachowuje lite drewno, którego odpowiednik dziś kosztuje wielokrotnie więcej.', 'Bez demontażu i wywozu gruzu, więc mniej brudu i krótszy czas prac.'],
    przeciw: ['Wymaga sprawdzenia grubości warstwy użytkowej: przy cienkiej cyklinowanie już się nie uda.', 'Szlifowanie produkuje ogromne ilości pyłu, który osiada w całym mieszkaniu.', 'Nie naprawi ubytków w klepkach ani problemów z podłożem.'],
    zaB: ['Gotowy, przewidywalny efekt bez niespodzianek pod spodem.', 'Możliwość zmiany wysokości i wyrównania podłoża przy okazji.', 'Montaż w jeden dzień, bez tygodnia schnięcia lakieru.'],
    przeciwB: ['Wyrzucenie materiału, którego często nie da się dziś kupić w tej cenie.', 'Dochodzi demontaż starej podłogi i wywóz gruzu.', 'Przy zalaniu panele nadają się tylko do wymiany, parkiet zwykle da się uratować.'],
    werdykt: 'Parkiet z warstwą użytkową powyżej trzech milimetrów i bez większych ubytków: cyklinowanie, prawie zawsze. Klepki luźne, zawilgocone albo zbyt cienkie do szlifowania: nowa podłoga, bo odnawianie takiego podłoża to wyrzucone pieniądze.',
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
    title: tytul(`${p.h1}?`, ` Porównanie kosztów ${YEAR}`, ` ${YEAR}`),
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
  <h2 style="margin-top:1.8rem">Zestawienia</h2>
  <div class="cards">
    ${list.map((p) => `<div class="card"><h3><a href="${R}porownanie/${p.slug}/">${p.h1}?</a></h3><p>${p.lede}</p></div>`).join('')}
  </div>
</div></section>`,
  });
}


/* ---------- metraże ociepleń ---------- */

export const DOMY = [
  { m: 80,  opis: 'Mały dom parterowy albo bliźniak.', uwaga: 'Przy tej wielkości koszt rusztowania i dojazdu rozkłada się na niewielką powierzchnię, więc stawka za metr wychodzi wyżej niż przy dużym domu.' },
  { m: 100, opis: 'Typowy dom parterowy z poddaszem użytkowym.', uwaga: 'Poddasze użytkowe oznacza ścianę kolankową, która też podlega ociepleniu, choć nie liczy się do powierzchni użytkowej.' },
  { m: 120, opis: 'Najczęstsza wielkość domu jednorodzinnego w Polsce.', uwaga: 'To metraż, przy którym warto policzyć dotację z programu wsparcia termomodernizacji: potrafi pokryć znaczną część kosztu ocieplenia ścian.' },
  { m: 150, opis: 'Duży dom jednorodzinny, zwykle dwukondygnacyjny.', uwaga: 'Powyżej dwóch kondygnacji rusztowanie trzeba kotwić do ściany, co podnosi zarówno koszt, jak i czas montażu.' },
  { m: 200, opis: 'Dom o rozbudowanej bryle albo z garażem w bryle.', uwaga: 'Im bardziej rozczłonkowana bryła, tym więcej narożników, glifów i docinek. Przy skomplikowanej elewacji robocizna rośnie o dwadzieścia do trzydziestu procent.' },
];

// Ścian jest zwykle więcej niż podłogi: dla domu na planie zbliżonym do kwadratu
// obwód to około czterech pierwiastków z powierzchni jednej kondygnacji.
export const scianyZDomu = (m2, kondygnacje = 1.6, wysokosc = 2.9, otworyProc = 0.14) => {
  const naKondygnacje = m2 / kondygnacje;
  const obwod = 4 * Math.sqrt(naKondygnacje);
  const brutto = obwod * wysokosc * kondygnacje;
  return Math.round(brutto * (1 - otworyProc));
};

export function ocieplenieMetrazPage({ dm, cities, unitPrice, cityOptions, W_JSON, CITY_MAP, sourceFlag }) {
  const sciany = scianyZDomu(dm.m);
  const zakres = ['ocieplenie_styropian', 'siatka_zbrojaca', 'tynk_silikonowy', 'rusztowanie', 'mycie_elewacji'];
  const dlaMiasta = (coef) =>
    zakres.reduce((s, id) => {
      const p = unitPrice(id, coef, 1, 1);
      return s + (p.labour + p.material) * sciany;
    }, 0);

  const rows = [...cities]
    .sort((a, b) => dlaMiasta(b.coef) - dlaMiasta(a.coef))
    .map((c) => `<tr>
<td data-v="${c.name}"><a href="${R}ceny/${c.slug}/">${c.name}</a></td>
<td class="num" data-v="${Math.round(dlaMiasta(c.coef) / sciany)}">${money(Math.round(dlaMiasta(c.coef) / sciany))}</td>
<td class="num" data-v="${Math.round(dlaMiasta(c.coef))}"><b>${money(Math.round(dlaMiasta(c.coef)))}</b></td>
</tr>`).join('');

  const war = cities.find((c) => c.slug === 'warszawa');
  const tani = cities.reduce((a, b) => (a.coef < b.coef ? a : b));

  return layout({
    title: `Ile kosztuje ocieplenie domu ${dm.m} m² w ${YEAR} roku`,
    description: `Koszt ocieplenia domu ${dm.m} m²: około ${money(Math.round(dlaMiasta(1)))} zł przy ${sciany} m² ścian. Styropian, warstwa zbrojona, tynk, rusztowanie. Ceny w 10 miastach.`,
    path: `/koszt-ocieplenia/${dm.m}-m2/`,
    breadcrumb: `<a href="${R}">Cennik</a> · <a href="${R}kalkulator/ocieplenie-elewacji/">Ocieplenie</a> · Dom ${dm.m} m²`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Termomodernizacja · aktualizacja ${SITE.updated}</p>
  <h1>Ocieplenie domu ${dm.m} m²</h1>
  <p class="lede">Dom o powierzchni ${dm.m} m² ma zwykle około ${sciany} m² ścian do ocieplenia. Pełen zakres kosztuje od ${money(Math.round(dlaMiasta(tani.coef)))} zł ${tani.loc} do ${money(Math.round(dlaMiasta(war.coef)))} zł w Warszawie.</p>
  <p class="section-note">${dm.opis} Powierzchnia ścian nie jest tym samym co powierzchnia użytkowa: liczymy obwód budynku razy wysokość kondygnacji, odejmując mniej więcej ${'14'}% na okna i drzwi. Dla bryły rozczłonkowanej albo dla domu na planie wydłużonym prostokąta wyjdzie więcej.</p>
  ${sourceFlag}

  <h2 style="margin-top:2rem">Koszt w dziesięciu miastach</h2>
  <p class="section-note">Zakres: ocieplenie styropianem, warstwa zbrojona z siatką, tynk silikonowy, rusztowanie oraz mycie i przygotowanie podłoża. Bez cokołu, parapetów i obróbek.</p>
  <div class="board-wrap"><table class="board" id="board">
    <thead><tr><th data-sort="off">Miasto</th><th>Za m² ściany</th><th>Całość</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>

  <h2 style="margin-top:2rem">O czym pamiętać przy tej wielkości</h2>
  <p class="section-note">${dm.uwaga}</p>

  <p class="receipt-foot" style="margin-top:1.4rem">Chcesz policzyć dokładnie swój budynek, z cokołem i parapetami? Przejdź do <a href="${R}kalkulator/ocieplenie-elewacji/">kalkulatora ocieplenia</a>. Kolejność prac opisuje <a href="${R}poradnik/ocieplenie-domu-krok-po-kroku/">poradnik krok po kroku</a>.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [
        { '@type': 'Question', name: `Ile kosztuje ocieplenie domu ${dm.m} m²?`, acceptedAnswer: { '@type': 'Answer', text: `Przy około ${sciany} m² ścian pełen zakres z tynkiem i rusztowaniem kosztuje od ${money(Math.round(dlaMiasta(tani.coef)))} do ${money(Math.round(dlaMiasta(war.coef)))} zł zależnie od miasta.` } },
        { '@type': 'Question', name: 'Ile metrów ściany ma dom o tej powierzchni?', acceptedAnswer: { '@type': 'Answer', text: `Dla bryły zbliżonej do kwadratu wychodzi około ${sciany} m² po odjęciu okien i drzwi. Dom wydłużony albo z wykuszami ma tych metrów więcej przy tej samej powierzchni użytkowej.` } },
      ],
    },
    script: `${calcScript}
bindSort(document.getElementById('board'));`,
  });
}

/* ---------- metraże wykończenia stanu deweloperskiego ---------- */

export const WYKONCZENIA = [
  { m: 35, opis: 'Kawalerka albo małe mieszkanie dwupokojowe od dewelopera.', uwaga: 'Przy małym metrażu łazienka stanowi nieproporcjonalnie dużą część kosztu, bo jej wyposażenie i hydroizolacja kosztują tyle samo co w mieszkaniu dwa razy większym.' },
  { m: 45, opis: 'Najczęściej kupowane mieszkanie dwupokojowe.', uwaga: 'To metraż, przy którym warto porównać pakiet wykończeniowy dewelopera z wyceną niezależnej ekipy. Różnica bywa mniejsza w cenie niż w standardzie materiałów.' },
  { m: 55, opis: 'Mieszkanie dwu albo trzypokojowe z osobną kuchnią.', uwaga: 'Powyżej pięćdziesięciu metrów rośnie udział gładzi i malowania, bo ścian przybywa szybciej niż podłogi.' },
  { m: 65, opis: 'Trzypokojowe mieszkanie rodzinne.', uwaga: 'Przy tej wielkości często dochodzi druga strefa mokra albo osobna toaleta, co oznacza kolejny punkt wodno-kanalizacyjny i osobny biały montaż.' },
];

const zakresWykonczenia = (a) => [
  ['gladz', a * 2.9], ['gruntowanie', a * 2.9], ['malowanie', a * 2.9],
  ['samopoziomujaca', a * 0.85], ['panele', a * 0.62], ['listwy', a * 0.75],
  ['hydroizolacja', a * 0.16], ['plytki_podloga', a * 0.12], ['plytki_sciana', a * 0.45 + 4],
  ['silikonowanie', 12], ['montaz_wc', 1], ['montaz_umywalki', 1], ['montaz_wanny', 1],
  ['montaz_baterii', 3], ['grzejnik', 1], ['podlaczenie_pralki', 1], ['punkt_wod_kan', 4],
  ['punkt_elektryczny', a * 0.32], ['montaz_lampy', Math.max(3, Math.round(a * 0.12))],
  ['montaz_drzwi', Math.max(2, Math.round(a / 18))], ['sprzatanie', a],
];

export function wykonczenieMetrazPage({ wm, cities, unitPrice, levels, sourceFlag }) {
  const lvl = Object.fromEntries(levels.map((l) => [l.id, l.k]));
  const suma = (coef, k) =>
    zakresWykonczenia(wm.m).reduce((s, [id, q]) => {
      const p = unitPrice(id, coef, k, 1);
      return s + (p.labour + p.material) * q;
    }, 0);

  const rows = [...cities]
    .sort((a, b) => suma(b.coef, 1) - suma(a.coef, 1))
    .map((c) => `<tr>
<td data-v="${c.name}"><a href="${R}ceny/${c.slug}/">${c.name}</a></td>
<td class="num" data-v="${Math.round(suma(c.coef, lvl.ekonom))}">${money(Math.round(suma(c.coef, lvl.ekonom)))}</td>
<td class="num" data-v="${Math.round(suma(c.coef, 1))}"><b>${money(Math.round(suma(c.coef, 1)))}</b></td>
<td class="num" data-v="${Math.round(suma(c.coef, lvl.premium))}">${money(Math.round(suma(c.coef, lvl.premium)))}</td>
<td class="num" data-v="${Math.round(suma(c.coef, 1) / wm.m)}">${money(Math.round(suma(c.coef, 1) / wm.m))}</td>
</tr>`).join('');

  const war = cities.find((c) => c.slug === 'warszawa');
  const tani = cities.reduce((a, b) => (a.coef < b.coef ? a : b));

  return layout({
    title: `Wykończenie mieszkania ${wm.m} m²: cena w ${YEAR}`,
    description: `Ile kosztuje wykończenie mieszkania ${wm.m} m² w stanie deweloperskim: od ${money(Math.round(suma(tani.coef, 1)))} do ${money(Math.round(suma(war.coef, 1)))} zł. Robocizna z materiałami, ceny w 10 miastach.`,
    path: `/koszt-wykonczenia/${wm.m}-m2/`,
    breadcrumb: `<a href="${R}">Cennik</a> · <a href="${R}kalkulator/wykonczenie-pod-klucz/">Wykończenie</a> · ${wm.m} m²`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Stan deweloperski · aktualizacja ${SITE.updated}</p>
  <h1>Wykończenie mieszkania ${wm.m} m²</h1>
  <p class="lede">Wykończenie ${wm.m} metrów w standardzie podstawowym kosztuje od ${money(Math.round(suma(tani.coef, 1)))} zł ${tani.loc} do ${money(Math.round(suma(war.coef, 1)))} zł w Warszawie.</p>
  <p class="section-note">${wm.opis} Kwota obejmuje robociznę i materiały budowlane: gładzie, malowanie, podłogi, płytki, hydroizolację, osprzęt elektryczny i montaż. Nie obejmuje ceny drzwi, armatury, opraw oświetleniowych ani mebli, bo te kupuje inwestor i ich koszt zależy wyłącznie od wybranych modeli.</p>
  ${sourceFlag}

  <h2 style="margin-top:2rem">Koszt w dziesięciu miastach</h2>
  <div class="board-wrap"><table class="board" id="board">
    <thead><tr><th data-sort="off">Miasto</th><th>Ekonomiczny</th><th>Standardowy</th><th>Premium</th><th>zł/m²</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>

  <h2 style="margin-top:2rem">O czym pamiętać przy tym metrażu</h2>
  <p class="section-note">${wm.uwaga}</p>

  <p class="receipt-foot" style="margin-top:1.4rem">Chcesz zmienić zakres? Przejdź do <a href="${R}kalkulator/wykonczenie-pod-klucz/">kalkulatora wykończenia</a>. Kolejność prac krok po kroku opisuje <a href="${R}poradnik/wykonczenie-mieszkania-krok-po-kroku/">osobny poradnik</a>. Jeśli masz już wycenę od ekipy, sprawdź ją w <a href="${R}sprawdz-oferte/">narzędziu do oceny oferty</a>.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [
        { '@type': 'Question', name: `Ile kosztuje wykończenie mieszkania ${wm.m} m²?`, acceptedAnswer: { '@type': 'Answer', text: `Robocizna z materiałami budowlanymi to od ${money(Math.round(suma(tani.coef, 1)))} do ${money(Math.round(suma(war.coef, 1)))} zł zależnie od miasta, czyli mniej więcej ${money(Math.round(suma(1, 1) / wm.m))} zł za metr. Bez drzwi, armatury i opraw, które kupuje inwestor.` } },
      ],
    },
    script: `${calcScript}
bindSort(document.getElementById('board'));`,
  });
}

/* ---------- kompleksowy remont domu ---------- */

export const DOMY_REMONT = [
  { m: 100, opis: 'Dom parterowy albo z niewielkim poddaszem użytkowym.' },
  { m: 120, opis: 'Najczęstsza wielkość domu jednorodzinnego w Polsce.' },
  { m: 150, opis: 'Duży dom, zwykle dwukondygnacyjny, z dwiema łazienkami.' },
];

export function remontDomuPage({ dm, cities, unitPrice, standardScope, sourceFlag }) {
  const sciany = scianyZDomu(dm.m);
  const dach = Math.round(dm.m * 0.72); // połać przy typowym nachyleniu, dla domu z poddaszem

  const wnetrza = (coef) =>
    Object.entries(standardScope.items).reduce((s, [id, q]) => {
      const p = unitPrice(id, coef, 1, 5);
      return s + (p.labour + p.material) * q * dm.m;
    }, 0);
  const elewacja = (coef) =>
    ['ocieplenie_styropian', 'siatka_zbrojaca', 'tynk_silikonowy', 'rusztowanie', 'mycie_elewacji']
      .reduce((s, id) => { const p = unitPrice(id, coef, 1, 1); return s + (p.labour + p.material) * sciany; }, 0);
  const dachy = (coef) =>
    [['demontaz_pokrycia', dach], ['membrana_laty', dach], ['blachodachowka', dach],
     ['obrobki_blacharskie', 30], ['rynny', 24], ['ocieplenie_poddasza', dm.m * 0.6]]
      .reduce((s, [id, q]) => { const p = unitPrice(id, coef, 1, 1); return s + (p.labour + p.material) * q; }, 0);
  const razem = (coef) => wnetrza(coef) + elewacja(coef) + dachy(coef);

  const rows = [...cities]
    .sort((a, b) => razem(b.coef) - razem(a.coef))
    .map((c) => `<tr>
<td data-v="${c.name}"><a href="${R}ceny/${c.slug}/">${c.name}</a></td>
<td class="num" data-v="${Math.round(wnetrza(c.coef))}">${money(Math.round(wnetrza(c.coef)))}</td>
<td class="num" data-v="${Math.round(elewacja(c.coef))}">${money(Math.round(elewacja(c.coef)))}</td>
<td class="num" data-v="${Math.round(dachy(c.coef))}">${money(Math.round(dachy(c.coef)))}</td>
<td class="num" data-v="${Math.round(razem(c.coef))}"><b>${money(Math.round(razem(c.coef)))}</b></td>
</tr>`).join('');

  const war = cities.find((c) => c.slug === 'warszawa');
  const tani = cities.reduce((a, b) => (a.coef < b.coef ? a : b));

  return layout({
    title: `Ile kosztuje remont domu ${dm.m} m² w ${YEAR} roku`,
    description: `Kompleksowy remont domu ${dm.m} m²: wnętrza, ocieplenie elewacji i wymiana dachu. Od ${money(Math.round(razem(tani.coef)))} do ${money(Math.round(razem(war.coef)))} zł zależnie od miasta.`,
    path: `/koszt-remontu-domu/${dm.m}-m2/`,
    breadcrumb: `<a href="${R}">Cennik</a> · Remont domu ${dm.m} m²`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Kompleksowy remont · aktualizacja ${SITE.updated}</p>
  <h1>Remont domu ${dm.m} m²</h1>
  <p class="lede">Pełny zakres, czyli wnętrza razem z ociepleniem elewacji i wymianą pokrycia dachu, kosztuje od ${money(Math.round(razem(tani.coef)))} zł ${tani.loc} do ${money(Math.round(razem(war.coef)))} zł w Warszawie.</p>
  <p class="section-note">${dm.opis} Wyliczenie zakłada ${dm.m} m² powierzchni użytkowej, około ${sciany} m² ścian zewnętrznych i mniej więcej ${dach} m² połaci dachowej. Dla bryły rozczłonkowanej albo dachu o dużym nachyleniu wyjdzie więcej.</p>
  ${sourceFlag}

  <h2 style="margin-top:2rem">Trzy części budżetu</h2>
  <p class="section-note">Rzadko robi się wszystko naraz i rzadko jest to konieczne. Rozbicie na etapy pokazuje, ile kosztuje każdy z nich osobno i który warto zrobić najpierw.</p>
  <div class="board-wrap"><table class="board" id="board">
    <thead><tr><th data-sort="off">Miasto</th><th>Wnętrza</th><th>Elewacja</th><th>Dach</th><th>Razem</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>

  <h2 style="margin-top:2rem">Od czego zacząć</h2>
  <p class="section-note">Kolejność narzuca się sama: najpierw dach, potem elewacja, na końcu wnętrza. Nieszczelne pokrycie zniszczy świeżo ocieploną ścianę, a ocieplenie po wykończeniu wnętrz oznacza kucie w gotowych ościeżach przy wymianie okien. Odwrócenie tej kolejności to najdroższy błąd, jaki można popełnić przy remoncie domu.</p>
  <p class="section-note">Jeśli budżet nie pozwala na wszystko naraz, największy zwrot daje zwykle dach i ocieplenie, bo od nich zależą rachunki za ogrzewanie przez kolejne dekady. Wnętrza można wykańczać etapami, pomieszczenie po pomieszczeniu.</p>

  <p class="receipt-foot" style="margin-top:1.4rem">Policz swój zakres: <a href="${R}kalkulator/remont-mieszkania/">wnętrza</a>, <a href="${R}kalkulator/ocieplenie-elewacji/">ocieplenie</a>, <a href="${R}kalkulator/dach/">dach</a>. Kolejność prac opisują <a href="${R}poradnik/">poradniki krok po kroku</a>.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [
        { '@type': 'Question', name: `Ile kosztuje remont domu ${dm.m} m²?`, acceptedAnswer: { '@type': 'Answer', text: `Pełny zakres z ociepleniem i dachem to od ${money(Math.round(razem(tani.coef)))} do ${money(Math.round(razem(war.coef)))} zł. Same wnętrza to około ${money(Math.round(wnetrza(1)))} zł, ocieplenie ${money(Math.round(elewacja(1)))} zł, dach ${money(Math.round(dachy(1)))} zł przy średnich stawkach krajowych.` } },
        { '@type': 'Question', name: 'Co robić najpierw przy remoncie domu?', acceptedAnswer: { '@type': 'Answer', text: 'Najpierw dach, potem elewacja, na końcu wnętrza. Nieszczelne pokrycie zniszczy nowe ocieplenie, a ocieplenie po wykończeniu wnętrz wymusza kucie przy wymianie okien.' } },
      ],
    },
    script: `${calcScript}
bindSort(document.getElementById('board'));`,
  });
}

/* ---------- metraże łazienek ---------- */

export const LAZIENKI = [
  { m: 4,  wym: '2,0 × 2,0 m', opis: 'Mała łazienka w bloku, zwykle z kabiną zamiast wanny.', uwaga: 'Na czterech metrach o koszcie decyduje nie powierzchnia, tylko liczba urządzeń. Hydroizolacja, punkty wodne i biały montaż kosztują tyle samo co w łazience dwa razy większej, dlatego stawka za metr wychodzi tu najwyższa w całym mieszkaniu.' },
  { m: 5,  wym: '2,2 × 2,3 m', opis: 'Typowa łazienka w mieszkaniu dwupokojowym, z wanną i pralką.', uwaga: 'Przy tej wielkości wanna i pralka mieszczą się bez kompromisów, ale warto z góry ustalić, czy pralka stanie pod blatem, bo to zmienia rozmieszczenie punktu wodnego i odpływu.' },
  { m: 6,  wym: '2,4 × 2,5 m', opis: 'Łazienka w mieszkaniu trzypokojowym albo w domu.', uwaga: 'Sześć metrów pozwala zmieścić i wannę, i osobną kabinę, ale każde dodatkowe urządzenie to kolejny punkt wodno-kanalizacyjny, a te liczy się osobno i kosztują więcej niż sam montaż ceramiki.' },
  { m: 8,  wym: '2,8 × 2,9 m', opis: 'Duża łazienka rodzinna, często z oknem i osobną strefą prysznica.', uwaga: 'Powyżej ośmiu metrów rośnie udział okładzin w kosztorysie, więc wybór półki cenowej płytek waży tu więcej niż przy małej łazience, gdzie dominuje biały montaż.' },
];

export function lazienkaMetrazPage({ lz, cities, unitPrice, levels, sourceFlag }) {
  const lvl = Object.fromEntries(levels.map((l) => [l.id, l.k]));
  const bok = Math.sqrt(lz.m);
  const obwod = 4 * bok;
  const sciany = obwod * 2.4;

  const zakres = [
    ['skuwanie_plytek', sciany + lz.m], ['wywoz_gruzu', (sciany + lz.m) * 0.03],
    ['hydroizolacja', lz.m + obwod * 0.6], ['plytki_podloga', lz.m], ['plytki_sciana', sciany],
    ['silikonowanie', obwod + 4], ['zabudowa_rury', 3],
    ['montaz_wanny', 1], ['montaz_baterii', 3], ['punkt_wod_kan', 4],
    ['montaz_wc', 1], ['montaz_umywalki', 1], ['podlaczenie_pralki', 1],
    ['grzejnik', 1], ['punkt_elektryczny', 4],
  ];
  const suma = (coef, k) =>
    zakres.reduce((s, [id, q]) => {
      const p = unitPrice(id, coef, k, 1);
      return s + (p.labour + p.material) * q;
    }, 0);

  const rows = [...cities]
    .sort((a, b) => suma(b.coef, 1) - suma(a.coef, 1))
    .map((c) => `<tr>
<td data-v="${c.name}"><a href="${R}ceny/${c.slug}/">${c.name}</a></td>
<td class="num" data-v="${Math.round(suma(c.coef, lvl.ekonom))}">${money(Math.round(suma(c.coef, lvl.ekonom)))}</td>
<td class="num" data-v="${Math.round(suma(c.coef, 1))}"><b>${money(Math.round(suma(c.coef, 1)))}</b></td>
<td class="num" data-v="${Math.round(suma(c.coef, lvl.premium))}">${money(Math.round(suma(c.coef, lvl.premium)))}</td>
<td class="num" data-v="${Math.round(suma(c.coef, 1) / lz.m)}">${money(Math.round(suma(c.coef, 1) / lz.m))}</td>
</tr>`).join('');

  const war = cities.find((c) => c.slug === 'warszawa');
  const tani = cities.reduce((a, b) => (a.coef < b.coef ? a : b));

  return layout({
    title: `Remont łazienki ${lz.m} m²: cena w ${YEAR} roku`,
    description: `Ile kosztuje remont łazienki ${lz.m} m²: od ${money(Math.round(suma(tani.coef, 1)))} do ${money(Math.round(suma(war.coef, 1)))} zł zależnie od miasta. Płytki, hydroizolacja, biały montaż i elektryka.`,
    path: `/koszt-lazienki/${lz.m}-m2/`,
    breadcrumb: `<a href="${R}">Cennik</a> · <a href="${R}kalkulator/lazienka/">Łazienka</a> · ${lz.m} m²`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Około ${lz.wym} · aktualizacja ${SITE.updated}</p>
  <h1>Remont łazienki ${lz.m} m²</h1>
  <p class="lede">Pełny remont łazienki o powierzchni ${lz.m} m² kosztuje od ${money(Math.round(suma(tani.coef, 1)))} zł ${tani.loc} do ${money(Math.round(suma(war.coef, 1)))} zł w Warszawie.</p>
  <p class="section-note">${lz.opis} Wyliczenie obejmuje skucie starych płytek i wywóz gruzu, hydroizolację, płytki na podłodze i ścianach do wysokości 2,4 m, zabudowę pionu, cztery punkty wodno-kanalizacyjne, wannę, WC ze stelażem, umywalkę, baterie, grzejnik drabinkowy, podłączenie pralki i cztery punkty elektryczne. Bez ceny samej ceramiki i armatury, którą kupuje inwestor.</p>
  ${sourceFlag}

  <h2 style="margin-top:2rem">Koszt w dziesięciu miastach</h2>
  <div class="board-wrap"><table class="board" id="board">
    <thead><tr><th data-sort="off">Miasto</th><th>Ekonomiczny</th><th>Standardowy</th><th>Premium</th><th>zł/m²</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>

  <h2 style="margin-top:2rem">O czym pamiętać przy tym metrażu</h2>
  <p class="section-note">${lz.uwaga}</p>

  <p class="receipt-foot" style="margin-top:1.4rem">Chcesz policzyć swój zakres, z kabiną zamiast wanny albo z ogrzewaniem podłogowym? Przejdź do <a href="${R}kalkulator/lazienka/">kalkulatora łazienki</a>. Kolejność prac opisuje <a href="${R}poradnik/remont-lazienki-krok-po-kroku/">poradnik krok po kroku</a>.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [
        { '@type': 'Question', name: `Ile kosztuje remont łazienki ${lz.m} m²?`, acceptedAnswer: { '@type': 'Answer', text: `Od ${money(Math.round(suma(tani.coef, 1)))} do ${money(Math.round(suma(war.coef, 1)))} zł zależnie od miasta, czyli około ${money(Math.round(suma(1, 1) / lz.m))} zł za metr. Kwota obejmuje robociznę i materiały budowlane, bez ceramiki i armatury.` } },
        { '@type': 'Question', name: 'Dlaczego mała łazienka kosztuje tyle co duża?', acceptedAnswer: { '@type': 'Answer', text: 'Bo o koszcie decyduje liczba urządzeń, a nie powierzchnia. Hydroizolacja, punkty wodno-kanalizacyjne i biały montaż kosztują tyle samo w łazience czterometrowej co w ośmiometrowej, a różnicę robi jedynie ilość płytek.' } },
      ],
    },
    script: `${calcScript}
bindSort(document.getElementById('board'));`,
  });
}

/* ---------- metraże kuchni ---------- */

export const KUCHNIE = [
  { m: 6,  blat: 3, opis: 'Mała kuchnia w bloku, zwykle w układzie jednorzędowym.', uwaga: 'Przy sześciu metrach cała różnica siedzi w instalacjach: obwody pod płytę, piekarnik i zmywarkę kosztują tyle samo co w kuchni dwa razy większej. Dlatego stawka za metr wychodzi tu najwyższa.' },
  { m: 8,  blat: 4, opis: 'Typowa kuchnia w mieszkaniu trzypokojowym.', uwaga: 'To metraż, przy którym warto rozstrzygnąć, czy zmywarka stanie pod blatem obok zlewu, czy dalej. Każdy metr od pionu to dodatkowa długość podejścia i wyższy koszt punktu wodnego.' },
  { m: 10, blat: 5, opis: 'Kuchnia z miejscem na stół albo wyspę.', uwaga: 'Wyspa oznacza doprowadzenie wody, odpływu i zasilania w posadzce, a więc bruzdy w wylewce. Decyzję o niej trzeba podjąć przed wylaniem podkładu, nie po.' },
  { m: 12, blat: 6, opis: 'Duża kuchnia otwarta na salon.', uwaga: 'Przy kuchni otwartej rośnie znaczenie wentylacji: okap musi realnie wyprowadzać powietrze, bo zapachy idą wprost do części dziennej. Kanał planuje się razem z sufitem podwieszanym.' },
];

export function kuchniaMetrazPage({ kh, cities, unitPrice, levels, sourceFlag }) {
  const lvl = Object.fromEntries(levels.map((l) => [l.id, l.k]));
  const bok = Math.sqrt(kh.m);
  const obwod = 4 * bok;
  const sciany = obwod * 2.6 * 0.9;
  const fartuch = kh.blat * 0.6;

  const zakres = [
    ['skuwanie_plytek', fartuch + kh.m * 0.5], ['wywoz_gruzu', kh.m * 0.05],
    ['punkt_elektryczny', 12], ['bruzdowanie', obwod * 1.2],
    ['punkt_wod_kan', 2], ['kanaly_wentylacyjne', 3],
    ['gladz', sciany + kh.m], ['gruntowanie', sciany + kh.m], ['malowanie', sciany + kh.m],
    ['plytki_sciana', fartuch], ['silikonowanie', kh.blat + 2],
    ['plytki_podloga', kh.m], ['samopoziomujaca', kh.m], ['sprzatanie', kh.m],
  ];
  const suma = (coef, k) =>
    zakres.reduce((s, [id, q]) => {
      const p = unitPrice(id, coef, k, 1);
      return s + (p.labour + p.material) * q;
    }, 0);

  const rows = [...cities]
    .sort((a, b) => suma(b.coef, 1) - suma(a.coef, 1))
    .map((c) => `<tr>
<td data-v="${c.name}"><a href="${R}ceny/${c.slug}/">${c.name}</a></td>
<td class="num" data-v="${Math.round(suma(c.coef, lvl.ekonom))}">${money(Math.round(suma(c.coef, lvl.ekonom)))}</td>
<td class="num" data-v="${Math.round(suma(c.coef, 1))}"><b>${money(Math.round(suma(c.coef, 1)))}</b></td>
<td class="num" data-v="${Math.round(suma(c.coef, lvl.premium))}">${money(Math.round(suma(c.coef, lvl.premium)))}</td>
<td class="num" data-v="${Math.round(suma(c.coef, 1) / kh.m)}">${money(Math.round(suma(c.coef, 1) / kh.m))}</td>
</tr>`).join('');

  const war = cities.find((c) => c.slug === 'warszawa');
  const tani = cities.reduce((a, b) => (a.coef < b.coef ? a : b));

  return layout({
    title: `Remont kuchni ${kh.m} m²: cena w ${YEAR} roku`,
    description: `Ile kosztuje remont kuchni ${kh.m} m²: od ${money(Math.round(suma(tani.coef, 1)))} do ${money(Math.round(suma(war.coef, 1)))} zł zależnie od miasta. Instalacje, fartuch, gładzie i podłoga, bez mebli.`,
    path: `/koszt-kuchni/${kh.m}-m2/`,
    breadcrumb: `<a href="${R}">Cennik</a> · <a href="${R}kalkulator/kuchnia/">Kuchnia</a> · ${kh.m} m²`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Blat około ${kh.blat} mb · aktualizacja ${SITE.updated}</p>
  <h1>Remont kuchni ${kh.m} m²</h1>
  <p class="lede">Remont kuchni o powierzchni ${kh.m} m² kosztuje od ${money(Math.round(suma(tani.coef, 1)))} zł ${tani.loc} do ${money(Math.round(suma(war.coef, 1)))} zł w Warszawie, bez mebli i sprzętu.</p>
  <p class="section-note">${kh.opis} Wyliczenie obejmuje demontaż starej zabudowy i wywóz, obwody pod płytę, piekarnik i zmywarkę, gniazda nad blatem, dwa punkty wodno-kanalizacyjne, kanał pod okap, gładzie z malowaniem, fartuch nad blatem oraz płytki na podłodze. Meble, sprzęt i armaturę kupuje inwestor.</p>
  ${sourceFlag}

  <h2 style="margin-top:2rem">Koszt w dziesięciu miastach</h2>
  <div class="board-wrap"><table class="board" id="board">
    <thead><tr><th data-sort="off">Miasto</th><th>Ekonomiczny</th><th>Standardowy</th><th>Premium</th><th>zł/m²</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>

  <h2 style="margin-top:2rem">O czym pamiętać przy tym metrażu</h2>
  <p class="section-note">${kh.uwaga}</p>

  <p class="receipt-foot" style="margin-top:1.4rem">Chcesz policzyć swój układ, z sufitem podwieszanym albo dłuższym blatem? Przejdź do <a href="${R}kalkulator/kuchnia/">kalkulatora kuchni</a>. Kolejność prac opisuje <a href="${R}poradnik/remont-kuchni-krok-po-kroku/">poradnik o remoncie kuchni</a>.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [
        { '@type': 'Question', name: `Ile kosztuje remont kuchni ${kh.m} m²?`, acceptedAnswer: { '@type': 'Answer', text: `Od ${money(Math.round(suma(tani.coef, 1)))} do ${money(Math.round(suma(war.coef, 1)))} zł zależnie od miasta, bez mebli i sprzętu. Największą pozycją są instalacje, a nie okładziny.` } },
        { '@type': 'Question', name: 'Czy w tej kwocie są meble kuchenne?', acceptedAnswer: { '@type': 'Answer', text: 'Nie. Wyliczenie obejmuje prace budowlane i instalacyjne. Meble na wymiar, sprzęt i armaturę kupuje inwestor, a ich koszt bywa wyższy niż cały remont pomieszczenia.' } },
      ],
    },
    script: `${calcScript}
bindSort(document.getElementById('board'));`,
  });
}

/* ---------- metraże poddaszy ---------- */

export const PODDASZA = [
  { m: 40, opis: 'Poddasze nad małym domem albo jedna kondygnacja w bliźniaku.', uwaga: 'Przy czterdziestu metrach skosy zajmują nieproporcjonalnie dużą część powierzchni, więc udział zabudowy i ocieplenia w kosztorysie jest tu najwyższy.' },
  { m: 60, opis: 'Typowe poddasze w domu jednorodzinnym, zwykle dwa pokoje i łazienka.', uwaga: 'To metraż, przy którym warto rozstrzygnąć, czy na poddaszu stanie łazienka. Punkty wodne wymagają podejść od pionu i wpływają na układ ścianek działowych, więc decyzja zapada przed zabudową skosów.' },
  { m: 80, opis: 'Duże poddasze użytkowe, często z osobną strefą dzienną.', uwaga: 'Powyżej osiemdziesięciu metrów rośnie znaczenie wentylacji i chłodzenia: latem poddasze nagrzewa się najbardziej ze wszystkich kondygnacji, a sama gruba wełna nie wystarczy bez sprawnej szczeliny pod pokryciem.' },
];

export function poddaszeMetrazPage({ pd, cities, unitPrice, levels, sourceFlag }) {
  const lvl = Object.fromEntries(levels.map((l) => [l.id, l.k]));
  const skosy = Math.round(pd.m * 1.25);
  const kolankowa = Math.round(Math.sqrt(pd.m) * 3);

  const zakres = [
    ['ocieplenie_poddasza', skosy], ['gk_sufit', skosy], ['scianka_gk', kolankowa],
    ['punkt_elektryczny', pd.m * 0.4], ['montaz_lampy', Math.max(3, Math.round(pd.m * 0.1))],
    ['wylewka_cem', pd.m], ['panele', pd.m], ['listwy', pd.m * 0.8],
    ['gladz', skosy + kolankowa], ['gruntowanie', skosy + kolankowa], ['malowanie', skosy + kolankowa],
    ['sprzatanie', pd.m],
  ];
  const suma = (coef, k) =>
    zakres.reduce((s, [id, q]) => {
      const p = unitPrice(id, coef, k, 5);
      return s + (p.labour + p.material) * q;
    }, 0);

  const rows = [...cities]
    .sort((a, b) => suma(b.coef, 1) - suma(a.coef, 1))
    .map((c) => `<tr>
<td data-v="${c.name}"><a href="${R}ceny/${c.slug}/">${c.name}</a></td>
<td class="num" data-v="${Math.round(suma(c.coef, lvl.ekonom))}">${money(Math.round(suma(c.coef, lvl.ekonom)))}</td>
<td class="num" data-v="${Math.round(suma(c.coef, 1))}"><b>${money(Math.round(suma(c.coef, 1)))}</b></td>
<td class="num" data-v="${Math.round(suma(c.coef, lvl.premium))}">${money(Math.round(suma(c.coef, lvl.premium)))}</td>
<td class="num" data-v="${Math.round(suma(c.coef, 1) / pd.m)}">${money(Math.round(suma(c.coef, 1) / pd.m))}</td>
</tr>`).join('');

  const war = cities.find((c) => c.slug === 'warszawa');
  const tani = cities.reduce((a, b) => (a.coef < b.coef ? a : b));

  return layout({
    title: `Wykończenie poddasza ${pd.m} m²: cena w ${YEAR}`,
    description: `Ile kosztuje adaptacja poddasza ${pd.m} m²: od ${money(Math.round(suma(tani.coef, 1)))} do ${money(Math.round(suma(war.coef, 1)))} zł. Ocieplenie, zabudowa skosów, ścianki, instalacje i podłoga.`,
    path: `/koszt-poddasza/${pd.m}-m2/`,
    breadcrumb: `<a href="${R}">Cennik</a> · <a href="${R}kalkulator/poddasze/">Poddasze</a> · ${pd.m} m²`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Około ${skosy} m² skosów · aktualizacja ${SITE.updated}</p>
  <h1>Wykończenie poddasza ${pd.m} m²</h1>
  <p class="lede">Adaptacja poddasza o powierzchni ${pd.m} m² kosztuje od ${money(Math.round(suma(tani.coef, 1)))} zł ${tani.loc} do ${money(Math.round(suma(war.coef, 1)))} zł w Warszawie.</p>
  <p class="section-note">${pd.opis} Wyliczenie obejmuje ocieplenie wełną w dwóch warstwach, zabudowę skosów i sufitu płytą, ${kolankowa} m² ścianek kolankowych i działowych, instalację elektryczną, wylewkę z podłogą oraz gładzie z malowaniem. Bez okien dachowych i bez łazienki na poddaszu, które liczymy osobno w <a href="${R}kalkulator/poddasze/">kalkulatorze</a>.</p>
  ${sourceFlag}

  <h2 style="margin-top:2rem">Koszt w dziesięciu miastach</h2>
  <div class="board-wrap"><table class="board" id="board">
    <thead><tr><th data-sort="off">Miasto</th><th>Ekonomiczny</th><th>Standardowy</th><th>Premium</th><th>zł/m²</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>

  <h2 style="margin-top:2rem">O czym pamiętać przy tym metrażu</h2>
  <p class="section-note">${pd.uwaga}</p>

  <p class="receipt-foot" style="margin-top:1.4rem">Chcesz doliczyć okna dachowe albo łazienkę? Przejdź do <a href="${R}kalkulator/poddasze/">kalkulatora poddasza</a>. Kolejność prac opisuje <a href="${R}poradnik/wykonczenie-poddasza-krok-po-kroku/">poradnik krok po kroku</a>.</p>
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'pl',
      mainEntity: [
        { '@type': 'Question', name: `Ile kosztuje wykończenie poddasza ${pd.m} m²?`, acceptedAnswer: { '@type': 'Answer', text: `Od ${money(Math.round(suma(tani.coef, 1)))} do ${money(Math.round(suma(war.coef, 1)))} zł zależnie od miasta, czyli około ${money(Math.round(suma(1, 1) / pd.m))} zł za metr podłogi. Bez okien dachowych i łazienki.` } },
        { '@type': 'Question', name: 'Dlaczego liczy się powierzchnię skosów osobno?', acceptedAnswer: { '@type': 'Answer', text: `Bo to ona decyduje o kosztach ocieplenia i zabudowy płytą, a jest zwykle o jedną czwartą większa od powierzchni podłogi. Przy ${pd.m} m² podłogi wychodzi około ${skosy} m² do ocieplenia i obłożenia.` } },
      ],
    },
    script: `${calcScript}
bindSort(document.getElementById('board'));`,
  });
}