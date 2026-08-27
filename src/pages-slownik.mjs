// Słownik pojęć. Odpowiada na pytania typu „co to jest gładź” albo „stan
// deweloperski co to znaczy”, a przy okazji spina hasła z pozycjami cennika.
import { layout, money } from './templates.mjs';
import { SITE } from './config.mjs';

const R = SITE.root;
const YEAR = new Date().getFullYear();

export const HASLA = [
  ['Stan deweloperski', 'stan-deweloperski', 'Mieszkanie oddane z tynkami, wylewkami, oknami i doprowadzonymi instalacjami, ale bez wykończenia. Nie ma podłóg, drzwi wewnętrznych, białego montażu ani osprzętu elektrycznego. Wykończenie takiego lokalu jest zwykle o kilkanaście procent tańsze niż remont, bo odpada demontaż i wywóz gruzu.', 'wykonczenie_kalk'],
  ['Stan surowy zamknięty', 'stan-surowy-zamkniety', 'Budynek z gotowymi ścianami, stropami, dachem oraz zamontowanymi oknami i drzwiami zewnętrznymi. Wnętrze jest jeszcze bez tynków i instalacji.', null],
  ['Gładź', 'gladz', 'Cienka warstwa wykończeniowa nakładana na tynk, nadająca ścianie gładkość pod malowanie. Standardem są dwie warstwy ze szlifowaniem. Nie należy mylić jej z tynkiem, który jest grubszą warstwą wyrównującą.', 'gladz'],
  ['Tynk gipsowy', 'tynk-gipsowy', 'Warstwa wyrównująca o grubości kilkunastu milimetrów, nakładana zwykle maszynowo na surową ścianę. Przygotowuje podłoże pod gładź albo bezpośrednio pod malowanie.', 'tynk_gipsowy'],
  ['Wylewka', 'wylewka', 'Warstwa podkładu podłogowego układana na stropie lub izolacji, na której później leżą panele albo płytki. Cementowa schnie mniej więcej tydzień na każdy centymetr grubości.', 'wylewka_cem'],
  ['Mixokret', 'mixokret', 'Agregat, który miesza i podaje zaprawę wężem, nawet na wyższe kondygnacje. Pozwala wykonać wylewkę szybciej niż ręcznie, ale wymaga dojazdu sprzętu pod budynek.', 'wylewka_anhydryt'],
  ['Masa samopoziomująca', 'masa-samopoziomujaca', 'Rzadka zaprawa, która rozlewa się sama i wyrównuje drobne nierówności podkładu. Warstwa cienka, od kilku do kilkunastu milimetrów, nie zastępuje wylewki.', 'samopoziomujaca'],
  ['Hydroizolacja podpłytkowa', 'hydroizolacja', 'Elastyczna powłoka nakładana pod płytki w strefach mokrych, z taśmami w narożnikach. Płytki i fuga nie są szczelne, więc to ona chroni strop przed przeciekiem.', 'hydroizolacja'],
  ['Dylatacja', 'dylatacja', 'Celowa szczelina oddzielająca elementy, które pracują niezależnie: wylewkę od ściany, pole posadzki od sąsiedniego. Bez niej materiał pęka przy rozszerzalności cieplnej.', null],
  ['ETICS', 'etics', 'System ocieplenia ścian zewnętrznych: klej, płyta izolacji, kołki, warstwa zbrojona z siatką, podkład i tynk. Wszystkie elementy powinny pochodzić z jednej rodziny produktowej, bo tylko wtedy producent odpowiada za całość.', 'ocieplenie_styropian'],
  ['Warstwa zbrojona', 'warstwa-zbrojona', 'Siatka z włókna szklanego zatopiona w kleju na płytach ocieplenia. Przenosi naprężenia i zapobiega rysom, zwłaszcza nad narożnikami okien.', 'siatka_zbrojaca'],
  ['Kołkowanie', 'kolkowanie', 'Mechaniczne mocowanie płyt ocieplenia po związaniu kleju. Liczba kołków na metr zależy od wysokości budynku i strefy wiatrowej, a przy wełnie jest większa niż przy styropianie.', null],
  ['Glif okienny', 'glif', 'Boczna powierzchnia ościeża widoczna po zamontowaniu okna. Przy ociepleniu wymaga osobnego docieplenia cienką warstwą, inaczej powstaje mostek termiczny.', 'obrobka_oscierzy'],
  ['Mostek termiczny', 'mostek-termiczny', 'Miejsce, w którym ciepło ucieka szybciej niż przez resztę przegrody: nadproże, balkon, nieocieplony glif. Objawia się skroplinami i pleśnią w narożniku.', null],
  ['Ciepły montaż', 'cieply-montaz', 'Trójwarstwowe uszczelnienie połączenia okna ze ścianą: taśma paroszczelna od wewnątrz, pianka w środku, taśma paroprzepuszczalna na zewnątrz. Zasada brzmi: szczelniej wewnątrz niż na zewnątrz.', 'cieply_montaz'],
  ['Uw', 'wspolczynnik-uw', 'Współczynnik przenikania ciepła całego okna, razem z ramą. Im niższy, tym mniejsze straty. Dla pomieszczeń ogrzewanych obowiązuje dziś wartość nie wyższa niż 0,9 W/(m²·K).', null],
  ['Więźba dachowa', 'wiezba', 'Drewniana konstrukcja nośna dachu. Przy wymianie pokrycia to jedyny moment, kiedy można ją obejrzeć w całości i wymienić uszkodzone elementy niewielkim kosztem.', 'wiezba'],
  ['Membrana dachowa', 'membrana', 'Wysokoparoprzepuszczalna folia układana pod pokryciem. Odprowadza wilgoć z konstrukcji i chroni przed wodą nawianą pod dachówkę.', 'membrana_laty'],
  ['Kontrłaty', 'kontrlaty', 'Listwy przybijane wzdłuż krokwi na membranie, tworzące szczelinę wentylacyjną pod pokryciem. Ich pominięcie zamyka wentylację i powoduje skraplanie wody pod blachą.', null],
  ['Obróbki blacharskie', 'obrobki-blacharskie', 'Elementy uszczelniające połączenia dachu z kominem, oknem dachowym czy ścianą. Najczęstsze miejsce przecieków w całym dachu.', 'obrobki_blacharskie'],
  ['Rąbek stojący', 'rabek-stojacy', 'Pokrycie z blachy łączonej podwójnym zagięciem zamykanym na miejscu. Sprawdza się nawet na bardzo płaskich połaciach, ale wymaga specjalistycznej maszyny i wprawy.', 'rabek_stojacy'],
  ['Podbitka', 'podbitka', 'Wykończenie okapu od spodu, zwykle z paneli PCV lub drewna, z kratkami wentylacyjnymi. Bez kratek poddasze przestaje oddychać.', 'podbitka'],
  ['Podbudowa', 'podbudowa', 'Warstwa kruszywa pod nawierzchnią z kostki, przenosząca obciążenia na grunt. Pod ścieżkę wystarcza około dwudziestu centymetrów, pod podjazd trzydzieści.', 'podbudowa'],
  ['Punkt elektryczny', 'punkt-elektryczny', 'Jednostka rozliczeniowa instalacji: gniazdo, włącznik albo wyprowadzenie oświetleniowe wraz z ułożeniem przewodu i puszką. Cena zależy od materiału ściany i długości trasy.', 'punkt_elektryczny'],
  ['Punkt wodno-kanalizacyjny', 'punkt-wod-kan', 'Doprowadzenie wody ciepłej i zimnej oraz podejście kanalizacyjne do jednego odbiornika, z kuciem bruzd i próbą szczelności.', 'punkt_wod_kan'],
  ['Biały montaż', 'bialy-montaz', 'Montaż ceramiki i armatury: wanny, kabiny, WC, umywalki, baterii. Same urządzenia kupuje zwykle inwestor, wykonawca liczy robociznę.', 'montaz_wc'],
  ['Stelaż podtynkowy', 'stelaz', 'Konstrukcja pod miskę WC zabudowywana płytą i obkładana płytkami, ze spłuczką ukrytą w ścianie. Wymaga przewidzenia rewizji dostępowej.', 'montaz_wc'],
  ['Odpływ liniowy', 'odplyw-liniowy', 'Podłużna kratka odprowadzająca wodę w prysznicu bez brodzika. Wymaga wyrobienia spadków w posadzce i pełnej hydroizolacji.', 'odplyw_liniowy'],
  ['Rekuperacja', 'rekuperacja', 'Wentylacja mechaniczna z odzyskiem ciepła z powietrza wywiewanego. W domu zamieszkanym montaż kosztuje o około jedną trzecią więcej niż w stanie surowym.', 'rekuperacja'],
  ['kWp', 'kwp', 'Moc szczytowa instalacji fotowoltaicznej w warunkach wzorcowych. Jednostka, w której wycenia się instalacje: cena podawana jest za kilowatopik.', 'fotowoltaika'],
  ['Ścianka działowa', 'scianka-dzialowa', 'Lekka ściana nienośna dzieląca pomieszczenie, murowana z bloczków albo zbudowana z płyt gipsowo-kartonowych na profilach. Wyburzenie takiej ścianki nie wymaga ekspertyzy, ale przed rozbiórką trzeba sprawdzić, czy nie biegną w niej instalacje.', 'wyburzenie_scianki'],
  ['Sufit podwieszany', 'sufit-podwieszany', 'Konstrukcja z profili i płyt gipsowo-kartonowych zawieszona pod stropem. Ukrywa instalacje i pozwala osadzić oprawy punktowe, ale obniża pomieszczenie o kilkanaście centymetrów.', 'gk_sufit'],
  ['Zabudowa z płyt g-k', 'zabudowa-gk', 'Obłożenie ściany albo pionu płytami gipsowo-kartonowymi na ruszcie. Szybsza i czystsza niż tynkowanie, ale nie uniesie ciężkich szafek bez wcześniejszego wzmocnienia rusztu.', 'gk_sciana'],
  ['Płytka wielkoformatowa', 'plytka-wielkoformatowa', 'Płyta o boku od sześćdziesięciu centymetrów wzwyż, często 120 na 280. Wymaga dwóch osób, systemu przyssawek i podłoża o płaskości bliskiej idealnej, dlatego robocizna jest wyraźnie wyższa niż przy zwykłym gresie.', 'plytki_wielkoformat'],
  ['Listwa przypodłogowa', 'listwa-przypodlogowa', 'Element maskujący szczelinę dylatacyjną między podłogą a ścianą. Szczelina jest potrzebna, bo panele i deska pracują wraz z wilgotnością, a listwa mocowana jest do ściany, nigdy do podłogi.', 'listwy'],
  ['Wywóz gruzu', 'wywoz-gruzu', 'Usunięcie odpadów budowlanych wraz z opłatą za przyjęcie ich w punkcie utylizacji. Gruz czysty jest tańszy w utylizacji niż zmieszany z opakowaniami i styropianem, dlatego warto go segregować już na budowie.', 'wywoz_gruzu'],
  ['Izolacja podłogi', 'izolacja-podlogi', 'Warstwa styropianu lub wełny układana pod wylewką, ograniczająca ucieczkę ciepła do gruntu albo do sąsiada poniżej. Pod wylewkę stosuje się styropian o podwyższonej wytrzymałości na ściskanie.', 'izolacja_styropian'],
  ['Grzejnik drabinkowy', 'grzejnik-drabinkowy', 'Grzejnik łazienkowy o formie poziomych rurek, służący też jako suszarka. Montowany zwykle na ścianie przy umywalce, wymaga przewidzenia podejść grzewczych przed ułożeniem płytek.', 'grzejnik'],
  ['Roboczogodzina', 'roboczogodzina', 'Jednostka rozliczenia drobnych prac, gdy nie da się ich wycenić za metr ani za punkt. Stosowana zwykle przy usuwaniu usterek i pracach nietypowych.', null],
  ['Kosztorys ślepy', 'kosztorys-slepy', 'Zestawienie zakresu i ilości robót bez cen, przekazywane wykonawcom do wyceny. Pozwala porównać oferty pozycja po pozycji, zamiast zestawiać same sumy końcowe.', null],
];

export function slownikPage({ byId, categories, units, unitPrice, slugify }) {
  const catSlug = (id) => categories.find((c) => c.id === id).slug;
  const link = (wid) => {
    if (!wid || !byId[wid]) return '';
    const w = byId[wid];
    const p = unitPrice(wid, 1, 1, w.perCm ? 5 : 1);
    return `<p class="krok-cena"><a href="${R}${catSlug(w.cat)}/${slugify(w.name)}/">${w.name}</a> <b>${money(Math.round(p.labour + p.material))} zł</b> za ${units[w.unit].name}</p>`;
  };

  return layout({
    title: `Słownik pojęć remontowych i budowlanych ${YEAR}`,
    description: 'Co to jest gładź, ETICS, ciepły montaż, stan deweloperski i mixokret. Krótkie wyjaśnienia pojęć, które pojawiają się w kosztorysach i ofertach ekip.',
    path: '/slownik/',
    breadcrumb: `<a href="${R}">Cennik</a> · Słownik`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">${HASLA.length} haseł</p>
  <h1>Słownik pojęć</h1>
  <p class="lede">Oferta od ekipy bywa napisana językiem, którego inwestor nie musi znać. Tu tłumaczymy pojęcia, które najczęściej pojawiają się w kosztorysach.</p>
  <div class="city-links" style="margin:1.4rem 0 2rem">${HASLA.map(([t, id]) => `<a href="#${id}">${t}</a>`).join('')}</div>
  ${HASLA.map(([t, id, opis, wid]) => `
  <div class="haslo" id="${id}">
    <h2>${t}</h2>
    <p>${opis}</p>
    ${link(wid)}
  </div>`).join('')}
</div></section>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'DefinedTermSet',
      name: 'Słownik pojęć remontowych',
      inLanguage: 'pl',
      hasDefinedTerm: HASLA.map(([t, id, opis]) => ({
        '@type': 'DefinedTerm',
        name: t,
        description: opis,
        url: `${SITE.base}${R}slownik/#${id}`,
      })),
    },
  });
}
