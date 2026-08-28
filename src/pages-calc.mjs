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
    title: `Kalkulator malowania ${YEAR}: ile kosztuje malowanie`,
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
    title: `Kalkulator układania płytek ${YEAR}: cena za m²`,
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
  {
    slug: 'balkon',
    h1: 'Remont balkonu',
    title: `Kalkulator remontu balkonu ${YEAR}: cena za m²`,
    desc: 'Policz koszt remontu balkonu: skucie posadzki, hydroizolacja ze spadkami, płytki mrozoodporne, obróbki blacharskie i balustrada. Ceny w zł.',
    lede: 'Na balkonie płaci się za to, czego nie widać. Hydroizolacja i spadki to ułamek kosztu, a ich pominięcie oznacza przeciek do mieszkania poniżej.',
    faq: [
      ['Ile kosztuje remont balkonu?', 'Balkon sześciometrowy w standardzie podstawowym zamyka się zwykle w przedziale od pięciu do dziesięciu tysięcy złotych razem z balustradą. Nasze wyliczenie podaje robociznę z materiałami budowlanymi, bez ceny samej balustrady, którą kupuje inwestor.'],
      ['Czy remont balkonu wymaga zgody wspólnoty?', 'Wymiana posadzki i hydroizolacji zwykle nie. Zgoda jest potrzebna, gdy zmienia się wygląd zewnętrzny: kolor balustrady, sposób wykończenia od strony elewacji, zadaszenie albo oszklenie. Warto sprawdzić regulamin wspólnoty przed rozpoczęciem prac.'],
      ['Jakie płytki na balkon?', 'Wyłącznie mrozoodporne, o nasiąkliwości poniżej trzech procent, i antypoślizgowe. Zwykła ceramika z wnętrza pęka po pierwszej zimie. Fugę stosuje się epoksydową, bo cementowa nie znosi zamarzania i soli.'],
      ['Dlaczego balkon przecieka mimo nowych płytek?', 'Bo płytki i fuga nie są szczelne, a warstwą chroniącą strop jest hydroizolacja pod nimi. Sama wymiana okładziny bez izolacji i spadków to najczęstszy i najdroższy błąd przy remoncie balkonu.'],
    ],
    fields: (opts) => `
      ${field({ name: 'pow', label: 'Powierzchnia balkonu', value: 6, min: 1, max: 60, step: .5, suffix: 'm²' })}
      ${field({ name: 'krawedz', label: 'Długość krawędzi zewnętrznej', value: 3, min: 0, max: 40, step: .5, suffix: 'mb', hint: 'Bok od strony elewacji, wzdłuż którego biegnie balustrada.' })}
      <div class="fields-2">
        ${select({ name: 'city', label: 'Miasto', options: opts })}
        ${select({ name: 'level', label: 'Standard', options: [{ v: 'ekonom', t: 'Ekonomiczny' }, { v: 'standard', t: 'Standardowy', sel: true }, { v: 'premium', t: 'Premium' }] })}
      </div>
      <p class="group-title">Zakres</p>
      ${check({ name: 'skucie', label: 'Skucie starej posadzki', checked: true })}
      ${check({ name: 'hydro', label: 'Hydroizolacja ze spadkami', checked: true })}
      ${check({ name: 'plytki', label: 'Płytki mrozoodporne', checked: true })}
      ${check({ name: 'obrobki', label: 'Obróbki blacharskie i kapinos', checked: true })}
      ${check({ name: 'balustrada', label: 'Montaż balustrady' })}
      ${check({ name: 'malowanie', label: 'Malowanie ścian balkonu farbą elewacyjną' })}`,
    logic: `
      const pow = v.pow || 0;
      const kr = v.krawedz || 0;
      if (v.skucie) { add('skucie_balkonu', pow); add('wywoz_gruzu', pow * 0.06); }
      if (v.hydro) add('hydroizolacja_balkonu', pow);
      if (v.plytki) { add('plytki_mrozoodporne', pow); add('silikonowanie', kr + Math.sqrt(pow) * 2); }
      if (v.obrobki) add('obrobki_balkonu', kr);
      if (v.balustrada) add('balustrada', kr);
      if (v.malowanie) add('tynk_silikonowy', Math.sqrt(pow) * 2.4);
      window.__area = pow;
      window.__sub = F(pow) + ' m² płyty, ' + F(kr) + ' mb krawędzi';`,
  },
  {
    slug: 'poddasze',
    h1: 'Wykończenie poddasza',
    title: `Kalkulator wykończenia poddasza ${YEAR}: koszt adaptacji`,
    desc: 'Policz koszt adaptacji poddasza: ocieplenie wełną, paroizolacja, zabudowa skosów płytą, ścianki kolankowe, gładzie, podłoga i instalacje. Ceny w zł.',
    lede: 'Poddasze wykańcza się raz, a błąd w paroizolacji ujawnia się dopiero po dwóch sezonach, kiedy wełna jest już zamknięta pod płytą. Kolejność prac opisuje <a href="${R}poradnik/wykonczenie-poddasza-krok-po-kroku/">osobny poradnik</a>.',
    faq: [
      ['Ile kosztuje wykończenie poddasza?', 'Ocieplenie, zabudowa skosów, ścianki, instalacja elektryczna i podłoga to około tysiąca złotych za metr powierzchni podłogi. Rynkowe widełki bywają wyższe, od tysiąca do tysiąca czterystu, bo obejmują też okna dachowe i łazienkę na poddaszu, które w tym kalkulatorze są osobnymi pozycjami do zaznaczenia.'],
      ['Jaka grubość ocieplenia poddasza?', 'Dziś przyjmuje się od 25 do 30 centymetrów wełny w dwóch warstwach układanych krzyżowo: pierwsza między krokwiami, druga w poprzek pod nimi. Druga warstwa likwiduje mostki termiczne na drewnie, dlatego pomijanie jej jest częstym i kosztownym uproszczeniem.'],
      ['Czy paroizolacja jest konieczna?', 'Tak, i musi być szczelna, ze sklejonymi zakładami oraz uszczelnieniem przy kominie i oknach. Nieszczelna folia wpuszcza wilgoć z pomieszczenia w wełnę, która traci właściwości i przestaje grzać, a problem widać dopiero po kilku sezonach.'],
      ['Jak liczyć powierzchnię poddasza ze skosami?', 'Do powierzchni użytkowej wlicza się zwykle części o wysokości powyżej 1,4 metra, a te powyżej 2,2 metra liczy się w całości. Do wyceny prac bierzemy jednak całą powierzchnię do zabudowania, bo skos też trzeba ocieplić i obłożyć płytą.'],
    ],
    fields: (opts) => `
      ${field({ name: 'pow', label: 'Powierzchnia poddasza', value: 60, min: 10, max: 300, suffix: 'm²', hint: 'Cała powierzchnia do zabudowania, razem ze skosami.' })}
      ${field({ name: 'skosy', label: 'Powierzchnia skosów i sufitu', value: 75, min: 0, max: 400, suffix: 'm²', hint: 'Zwykle o jedną czwartą większa od powierzchni podłogi.' })}
      <div class="fields-2">
        ${select({ name: 'city', label: 'Miasto', options: opts })}
        ${select({ name: 'level', label: 'Standard', options: [{ v: 'ekonom', t: 'Ekonomiczny' }, { v: 'standard', t: 'Standardowy', sel: true }, { v: 'premium', t: 'Premium' }] })}
      </div>
      <p class="group-title">Zakres</p>
      ${check({ name: 'ocieplenie', label: 'Ocieplenie wełną z paroizolacją', checked: true })}
      ${check({ name: 'zabudowa', label: 'Zabudowa skosów płytą gipsowo-kartonową', checked: true })}
      ${check({ name: 'kolankowa', label: 'Ścianki kolankowe i działowe', checked: true, qty: 20 })}
      ${check({ name: 'elektryka', label: 'Instalacja elektryczna', checked: true })}
      ${check({ name: 'wodkan', label: 'Punkty wodne pod łazienkę na poddaszu', qty: 4 })}
      ${check({ name: 'podloga', label: 'Wylewka i podłoga', checked: true })}
      ${check({ name: 'okna', label: 'Okna dachowe', qty: 2 })}`,
    logic: `
      const pow = v.pow || 0;
      const skosy = v.skosy || 0;
      if (v.ocieplenie) add('ocieplenie_poddasza', skosy);
      if (v.zabudowa) add('gk_sufit', skosy);
      if (v.kolankowa) add('scianka_gk', v.kolankowa_qty || 0);
      if (v.elektryka) { add('punkt_elektryczny', pow * 0.4); add('montaz_lampy', Math.max(3, Math.round(pow * 0.1))); }
      if (v.wodkan) add('punkt_wod_kan', v.wodkan_qty || 0);
      if (v.podloga) { add('wylewka_cem', pow); add('panele', pow); add('listwy', pow * 0.8); }
      if (v.okna) add('okno_dachowe', v.okna_qty || 0);
      add('gladz', skosy + (v.kolankowa_qty || 0));
      add('gruntowanie', skosy + (v.kolankowa_qty || 0));
      add('malowanie', skosy + (v.kolankowa_qty || 0));
      add('sprzatanie', pow);
      window.__area = pow;
      window.__sub = F(pow) + ' m² podłogi, ' + F(skosy) + ' m² skosów';`,
  },
  {
    slug: 'kuchnia',
    h1: 'Remont kuchni',
    title: `Kalkulator remontu kuchni ${YEAR}: ile kosztuje`,
    desc: 'Policz koszt remontu kuchni: płytki nad blatem, punkty wodne pod zlew i zmywarkę, obwody pod płytę i piekarnik, gładzie i podłoga. Ceny w zł.',
    lede: 'Kuchnia jest po łazience najdroższym pomieszczeniem w przeliczeniu na metr, i to nie przez okładziny, tylko przez instalacje. Płyta, piekarnik i zmywarka to trzy osobne obwody. Kolejność prac opisuje <a href="${R}poradnik/remont-kuchni-krok-po-kroku/">osobny poradnik</a>.',
    faq: [
      ['Ile kosztuje remont kuchni?', 'Bez mebli i sprzętu liczy się zwykle od kilku do kilkunastu tysięcy złotych, zależnie od zakresu instalacji i wielkości pomieszczenia. Największą pozycją są punkty elektryczne i wodno-kanalizacyjne, a nie płytki nad blatem.'],
      ['Kiedy zamawiać meble kuchenne?', 'Pomiar do mebli robi się po tynkach i wylewce, ale rozmieszczenie gniazd i punktów wodnych trzeba znać wcześniej, na etapie instalacji. Dlatego projekt kuchni powstaje przed kuciem bruzd, a nie po wykończeniu ścian.'],
      ['Czy fartuch nad blatem musi być z płytek?', 'Nie. Sprawdza się też szkło hartowane, konglomerat albo płyta laminowana. Płytki są najtańsze i najłatwiejsze w naprawie punktowej, szkło łatwiejsze w czyszczeniu, bo nie ma fug.'],
      ['Ile obwodów elektrycznych potrzebuje kuchnia?', 'Płyta indukcyjna wymaga osobnego obwodu, często trójfazowego. Piekarnik, zmywarka i lodówka to kolejne trzy. Do tego gniazda nad blatem i oświetlenie, czyli w praktyce od pięciu do siedmiu obwodów w samej kuchni.'],
    ],
    fields: (opts) => `
      <div class="fields-2">
        ${field({ name: 'len', label: 'Długość kuchni', value: 3.2, min: 1.5, max: 10, step: .1, suffix: 'm' })}
        ${field({ name: 'wid', label: 'Szerokość kuchni', value: 2.5, min: 1.5, max: 10, step: .1, suffix: 'm' })}
      </div>
      ${field({ name: 'fartuch', label: 'Długość blatu z fartuchem', value: 4, min: 0, max: 20, step: .5, suffix: 'mb', hint: 'Fartuch liczymy jako pas 60 cm nad blatem.' })}
      <div class="fields-2">
        ${select({ name: 'city', label: 'Miasto', options: opts })}
        ${select({ name: 'level', label: 'Standard', options: [{ v: 'ekonom', t: 'Ekonomiczny' }, { v: 'standard', t: 'Standardowy', sel: true }, { v: 'premium', t: 'Premium' }] })}
      </div>
      <p class="group-title">Instalacje</p>
      ${check({ name: 'elektryka', label: 'Nowe obwody: płyta, piekarnik, zmywarka', checked: true })}
      ${check({ name: 'gniazda', label: 'Gniazda nad blatem i oświetlenie', checked: true, qty: 8 })}
      ${check({ name: 'wodkan', label: 'Punkty wodne: zlew i zmywarka', checked: true, qty: 2 })}
      ${check({ name: 'wentylacja', label: 'Kanał wentylacyjny pod okap', qty: 3 })}
      <p class="group-title">Wykończenie</p>
      ${check({ name: 'demont', label: 'Demontaż starej kuchni i wywóz', checked: true })}
      ${check({ name: 'gladz', label: 'Gładzie i malowanie', checked: true })}
      ${check({ name: 'podloga', label: 'Płytki na podłodze', checked: true })}
      ${check({ name: 'sufit', label: 'Sufit podwieszany z oświetleniem' })}`,
    logic: `
      const pow = (v.len || 0) * (v.wid || 0);
      const obwod = 2 * ((v.len || 0) + (v.wid || 0));
      const sciany = obwod * 2.6 * 0.9;
      const fartuch = (v.fartuch || 0) * 0.6;
      if (v.demont) { add('skuwanie_plytek', fartuch + pow * 0.5); add('wywoz_gruzu', pow * 0.05); }
      if (v.elektryka) { add('punkt_elektryczny', 4); add('bruzdowanie', obwod * 1.2); }
      if (v.gniazda) add('punkt_elektryczny', v.gniazda_qty || 0);
      if (v.wodkan) add('punkt_wod_kan', v.wodkan_qty || 0);
      if (v.wentylacja) add('kanaly_wentylacyjne', v.wentylacja_qty || 0);
      if (v.gladz) { add('gladz', sciany + pow); add('gruntowanie', sciany + pow); add('malowanie', sciany + pow); }
      add('plytki_sciana', fartuch);
      add('silikonowanie', (v.fartuch || 0) + 2);
      if (v.podloga) { add('plytki_podloga', pow); add('samopoziomujaca', pow); }
      if (v.sufit) { add('gk_sufit', pow); add('montaz_lampy', 4); }
      add('sprzatanie', pow);
      window.__area = pow;
      window.__sub = F(Math.round(pow * 10) / 10) + ' m² kuchni, ' + F(Math.round(fartuch)) + ' m² fartucha';`,
  },
  {
    slug: 'wykonczenie-pod-klucz',
    h1: 'Wykończenie mieszkania od dewelopera',
    title: `Kalkulator wykończenia mieszkania od dewelopera ${YEAR}`,
    desc: 'Policz koszt wykończenia mieszkania w stanie deweloperskim: gładzie, malowanie, podłogi, łazienka, biały montaż i drzwi. Ceny w zł za m².',
    lede: 'Stan deweloperski to nie remont. Nie ma demontaży ani wywozu gruzu, za to gładzie idą na całą powierzchnię, a łazienka powstaje od zera. Liczymy robociznę i materiały budowlane, bez ceny drzwi, armatury i opraw, które kupujesz sam. Kolejność prac opisuje <a href="${R}poradnik/wykonczenie-mieszkania-krok-po-kroku/">osobny poradnik</a>.',
    faq: [
      ['Ile kosztuje wykończenie mieszkania od dewelopera?', 'Robocizna z materiałami budowlanymi to zwykle od 650 do 900 złotych za metr, zależnie od miasta i standardu. Rynkowe hasło „wykończenie pod klucz za 1500 do 2500 zł za metr” obejmuje dodatkowo wyposażenie: drzwi, armaturę, oświetlenie, czasem meble. To właśnie ta różnica dziwi najbardziej przy pierwszej wycenie.'],
      ['Czego nie ma w tym wyliczeniu?', 'Nie ma ceny drzwi, armatury, baterii, opraw oświetleniowych ani mebli, bo te pozycje kupuje inwestor i ich koszt zależy wyłącznie od wybranego modelu. Policzony jest za to ich montaż. Same drzwi wewnętrzne to zwykle od 800 do 1500 złotych za sztukę, a wyposażenie łazienki potrafi dorównać kosztowi jej wykończenia.'],
      ['Czy w stanie deweloperskim trzeba robić wylewkę?', 'Zwykle nie, bo deweloper oddaje mieszkanie z gotową wylewką. Warto jednak sprawdzić jej równość łatą i wilgotność miernikiem, bo to od niej zależy, czy podłoga po roku nie zacznie falować. Drobne nierówności wyrównuje się masą samopoziomującą.'],
      ['Co jest droższe: wykończenie czy remont?', 'Wykończenie jest zwykle tańsze o kilkanaście procent, bo odpada demontaż, wywóz gruzu i przeróbki instalacji. Za to gładzie robi się na całej powierzchni, a nie tylko w miejscach uszkodzonych.'],
      ['Czy warto brać pakiet wykończeniowy od dewelopera?', 'Pakiety bywają wygodne, ale rzadko tańsze. Warto rozbić taki pakiet na pozycje i porównać z wyceną niezależnej ekipy, bo różnica w standardzie materiałów potrafi być większa niż różnica w cenie.'],
    ],
    fields: (opts) => `
      ${field({ name: 'area', label: 'Powierzchnia mieszkania', value: 45, min: 15, max: 200, suffix: 'm²' })}
      <div class="fields-2">
        ${select({ name: 'city', label: 'Miasto', options: opts })}
        ${select({ name: 'level', label: 'Standard', options: [{ v: 'ekonom', t: 'Ekonomiczny' }, { v: 'standard', t: 'Standardowy', sel: true }, { v: 'premium', t: 'Premium' }] })}
      </div>
      ${field({ name: 'drzwi', label: 'Drzwi wewnętrzne', value: 3, min: 0, max: 10, step: 1, suffix: 'szt.' })}
      <p class="group-title">Zakres</p>
      ${check({ name: 'gladz', label: 'Gładzie na ścianach i sufitach', checked: true })}
      ${check({ name: 'poziom', label: 'Wyrównanie wylewki masą samopoziomującą', checked: true })}
      ${check({ name: 'lazienka', label: 'Łazienka: płytki, hydroizolacja, biały montaż', checked: true })}
      ${check({ name: 'kuchnia', label: 'Płytki nad blatem w kuchni', checked: true })}
      ${check({ name: 'osprzet', label: 'Osprzęt elektryczny i oprawy', checked: true })}
      ${check({ name: 'sprzatanie', label: 'Sprzątanie po pracach', checked: true })}`,
    logic: `
      const a = v.area || 0;
      const sciany = a * 2.9;
      if (v.gladz) { add('gladz', sciany); add('gruntowanie', sciany); }
      add('malowanie', sciany);
      if (v.poziom) add('samopoziomujaca', a * 0.85);
      add('panele', a * 0.62);
      add('listwy', a * 0.75);
      if (v.lazienka) {
        add('hydroizolacja', a * 0.16);
        add('plytki_podloga', a * 0.12);
        add('plytki_sciana', a * 0.45);
        add('silikonowanie', 12);
        add('montaz_wc', 1); add('montaz_umywalki', 1); add('montaz_wanny', 1);
        add('montaz_baterii', 3); add('grzejnik', 1); add('podlaczenie_pralki', 1);
        add('punkt_wod_kan', 4);
      }
      if (v.kuchnia) add('plytki_sciana', 4);
      if (v.osprzet) { add('punkt_elektryczny', a * 0.32); add('montaz_lampy', Math.max(3, Math.round(a * 0.12))); }
      add('montaz_drzwi', v.drzwi || 0);
      if (v.sprzatanie) add('sprzatanie', a);
      window.__area = a;
      window.__sub = 'stan deweloperski, ' + F(a) + ' m²';`,
  },
  {
    slug: 'wymiana-okien',
    h1: 'Wymiana okien',
    title: `Kalkulator wymiany okien ${YEAR}: ile kosztuje montaż`,
    desc: 'Policz koszt wymiany okien: demontaż starej stolarki, montaż za metr obwodu ramy, ciepły montaż warstwowy, obróbka ościeży, parapety i rolety.',
    lede: 'Montaż liczy się za metr bieżący obwodu ramy, a nie za sztukę. Podaj wymiary swoich okien, a kalkulator przeliczy to sam.',
    faq: [
      ['Dlaczego montaż liczy się za obwód, a nie za sztukę?', 'Bo nakład pracy zależy od długości styku okna ze ścianą: to tam idą kotwy, pianka i taśmy. Jedno okno dwa na półtora metra ma siedem metrów obwodu, dwa okna metr na metr razem osiem, choć powierzchnia szyb jest podobna.'],
      ['Czy cena obejmuje same okna?', 'Nie. Okna kupuje inwestor i ich cena zależy od profilu, pakietu szybowego i okuć. Tu liczona jest wyłącznie robocizna oraz materiały montażowe: taśmy, pianka i kotwy.'],
      ['Czy trzeba wymieniać parapety przy okazji?', 'Zewnętrzne prawie zawsze, bo stare rzadko pasują do nowej ramy i nie da się ich szczelnie podłączyć. Wewnętrzne czasem da się zachować, jeśli głębokość się zgadza i nie zostały uszkodzone przy demontażu.'],
      ['Ile trwa wymiana okien w całym mieszkaniu?', 'Sam montaż to zwykle jeden dzień na kilka okien. Obróbka ościeży i malowanie dochodzą następnego dnia, po związaniu pianki.'],
    ],
    fields: (opts) => `
      <p class="panel-note">Podaj typowe wymiary i liczbę okien. Jeśli masz różne rozmiary, policz osobno największą grupę, a potem zmień wartości.</p>
      <div class="fields-2">
        ${field({ name: 'szer', label: 'Szerokość okna', value: 1.5, min: 0.4, max: 4, step: .1, suffix: 'm' })}
        ${field({ name: 'wys', label: 'Wysokość okna', value: 1.4, min: 0.4, max: 3, step: .1, suffix: 'm' })}
      </div>
      <div class="fields-2">
        ${field({ name: 'ile', label: 'Liczba okien', value: 5, min: 1, max: 40, step: 1, suffix: 'szt.' })}
        ${select({ name: 'city', label: 'Miasto', options: opts })}
      </div>
      <p class="group-title">Zakres</p>
      ${check({ name: 'demontaz', label: 'Demontaż starej stolarki', checked: true })}
      ${check({ name: 'cieply', label: 'Ciepły montaż warstwowy z taśmami', checked: true })}
      ${check({ name: 'oscierza', label: 'Obróbka ościeży po montażu', checked: true })}
      ${check({ name: 'parapetyW', label: 'Parapety wewnętrzne', checked: true })}
      ${check({ name: 'parapetyZ', label: 'Parapety zewnętrzne', checked: true })}
      ${check({ name: 'rolety', label: 'Rolety zewnętrzne', qty: 2 })}
      ${check({ name: 'drzwi', label: 'Drzwi zewnętrzne', qty: 1 })}`,
    logic: `
      const ile = v.ile || 0;
      const obwod = 2 * ((v.szer || 0) + (v.wys || 0)) * ile;
      if (v.demontaz) add('demontaz_okna', ile);
      add('montaz_okna', obwod);
      if (v.cieply) add('cieply_montaz', obwod);
      if (v.oscierza) add('obrobka_oscierzy', ile);
      if (v.parapetyW) add('montaz_parapetu_wew', ile);
      if (v.parapetyZ) add('parapet_zewnetrzny', ile);
      if (v.rolety) add('montaz_rolety', v.rolety_qty || 0);
      if (v.drzwi) add('drzwi_zewnetrzne', v.drzwi_qty || 0);
      window.__area = ile;
      window.__sub = F(ile) + ' okien, ' + F(Math.round(obwod)) + ' mb obwodu ram';`,
  },
  {
    slug: 'klimatyzacja',
    h1: 'Klimatyzacja i wentylacja',
    title: `Kalkulator klimatyzacji ${YEAR}: koszt montażu`,
    desc: 'Policz koszt montażu klimatyzacji split i multi-split, rekuperacji oraz kanałów wentylacyjnych. Robocizna i materiał osobno, ceny w zł.',
    lede: 'Cena urządzenia to jedno, a instalacji drugie. Tu liczymy montaż i uruchomienie, bo sprzęt kupuje zwykle inwestor.',
    faq: [
      ['Ile kosztuje montaż klimatyzacji?', 'Montaż pojedynczego splitu to zwykle od dwóch do trzech tysięcy złotych razem z materiałem instalacyjnym, bez ceny samego urządzenia. Multi-split z kilkoma jednostkami wewnętrznymi kosztuje odpowiednio więcej, bo dochodzą kolejne trasy chłodnicze.'],
      ['Czy w bloku potrzebna jest zgoda na klimatyzację?', 'Na montaż jednostki zewnętrznej na elewacji tak, bo elewacja jest częścią wspólną. Zgodę wydaje wspólnota albo spółdzielnia i warto ją mieć przed zamówieniem sprzętu, a nie po.'],
      ['Rekuperacja w gotowym domu czy w budowie?', 'W stanie surowym montaż trwa od pięciu do dziesięciu dni i jest wyraźnie tańszy. W domu zamieszkanym dochodzi kucie, zabudowy i odtworzenie wykończenia, przez co koszt rośnie o mniej więcej jedną trzecią.'],
    ],
    fields: (opts) => `
      ${select({ name: 'city', label: 'Miasto', options: opts })}
      <p class="group-title">Klimatyzacja</p>
      ${check({ name: 'split', label: 'Klimatyzacja split, jedno pomieszczenie', checked: true, qty: 1 })}
      ${check({ name: 'multi', label: 'Multi-split, kilka pomieszczeń' })}
      ${check({ name: 'punkty', label: 'Punkty elektryczne pod jednostki', checked: true, qty: 2 })}
      <p class="group-title">Wentylacja</p>
      ${field({ name: 'dom', label: 'Powierzchnia domu pod rekuperację', value: 0, min: 0, max: 400, step: 5, suffix: 'm²', hint: 'Zostaw zero, jeśli nie planujesz rekuperacji.' })}
      ${check({ name: 'kanaly', label: 'Dodatkowe kanały wentylacyjne', qty: 10 })}`,
    logic: `
      if (v.split) add('klimatyzacja_split', v.split_qty || 0);
      if (v.multi) add('klimatyzacja_multisplit', 1);
      if (v.punkty) add('punkt_elektryczny', v.punkty_qty || 0);
      if (v.dom) add('rekuperacja', v.dom);
      if (v.kanaly) add('kanaly_wentylacyjne', v.kanaly_qty || 0);
      window.__area = 0;
      window.__sub = 'montaż i uruchomienie, bez ceny urządzeń';`,
  },
  {
    slug: 'ocieplenie-elewacji',
    h1: 'Ocieplenie i elewacja',
    title: `Kalkulator ocieplenia elewacji ${YEAR}: koszt za m²`,
    desc: 'Policz koszt ocieplenia domu: styropian albo wełna, warstwa zbrojona, tynk silikonowy lub mineralny, rusztowanie i cokół. Ceny w zł za m².',
    lede: 'Ocieplenie liczy się od powierzchni ścian, a nie od metrażu domu. Podaj obwód i wysokość, a kalkulator odejmie typową powierzchnię okien.',
    faq: [
      ['Styropian czy wełna mineralna?', 'Styropian jest tańszy i lżejszy, wełna niepalna i lepiej tłumi dźwięki. Przy domu jednorodzinnym w suchej technologii wybiera się zwykle styropian grafitowy, przy starym murze i wymaganiach przeciwpożarowych wełnę. Porównanie obu rozwiązań mamy w osobnym zestawieniu.'],
      ['Jaka grubość ocieplenia w 2026 roku?', 'Standardem jest 20 cm styropianu na ścianie zewnętrznej. Piętnaście centymetrów bywa jeszcze spotykane przy termomodernizacji budynku, który już był ocieplony, ale przy nowym ociepleniu schodzenie poniżej dwudziestu przestało się opłacać.'],
      ['Czy rusztowanie jest wliczone w cenę?', 'W naszym wyliczeniu jest osobną pozycją, bo rozlicza się je za metr i za dobę postoju. Część ekip wlicza je w stawkę za ocieplenie, dlatego przy porównywaniu ofert trzeba dopytać, co dokładnie obejmuje cena.'],
    ],
    fields: (opts) => `
      <div class="fields-2">
        ${field({ name: 'obwod', label: 'Obwód budynku', value: 38, min: 4, max: 300, step: .5, suffix: 'm' })}
        ${field({ name: 'h', label: 'Wysokość ściany', value: 6, min: 2, max: 20, step: .1, suffix: 'm' })}
      </div>
      ${field({ name: 'otwory', label: 'Powierzchnia okien i drzwi', value: 22, min: 0, max: 200, step: 1, suffix: 'm²', hint: 'Ta powierzchnia jest odejmowana od ścian.' })}
      <div class="fields-2">
        ${select({ name: 'city', label: 'Miasto', options: opts })}
        ${select({ name: 'material', label: 'Materiał', options: [{ v: 'ocieplenie_styropian', t: 'Styropian', sel: true }, { v: 'ocieplenie_welna', t: 'Wełna mineralna' }] })}
      </div>
      ${select({ name: 'tynk', label: 'Tynk elewacyjny', options: [{ v: 'tynk_silikonowy', t: 'Silikonowy', sel: true }, { v: 'tynk_mineralny', t: 'Mineralny' }] })}
      <p class="group-title">Zakres</p>
      ${check({ name: 'siatka', label: 'Warstwa zbrojona z siatką', checked: true })}
      ${check({ name: 'rusztowanie', label: 'Rusztowanie', checked: true })}
      ${check({ name: 'mycie', label: 'Mycie i przygotowanie podłoża', checked: true })}
      ${check({ name: 'cokol', label: 'Cokół XPS z tynkiem mozaikowym', qty: 30 })}
      ${check({ name: 'parapety', label: 'Parapety zewnętrzne', qty: 8 })}`,
    logic: `
      const sciany = Math.max(0, (v.obwod || 0) * (v.h || 0) - (v.otwory || 0));
      add(v.material, sciany);
      if (v.siatka) add('siatka_zbrojaca', sciany);
      add(v.tynk, sciany);
      if (v.rusztowanie) add('rusztowanie', sciany);
      if (v.mycie) add('mycie_elewacji', sciany);
      if (v.cokol) add('cokol_xps', v.cokol_qty || 0);
      if (v.parapety) add('parapet_zewnetrzny', v.parapety_qty || 0);
      window.__area = sciany;
      window.__sub = F(Math.round(sciany)) + ' m² ścian do ocieplenia';`,
  },
  {
    slug: 'kostka-brukowa',
    h1: 'Kostka brukowa',
    title: `Kalkulator kostki brukowej ${YEAR}: cena za m²`,
    desc: 'Policz koszt ułożenia kostki brukowej: podbudowa, obrzeża, krawężniki, odwodnienie liniowe i niwelacja terenu. Ceny w zł za m².',
    lede: 'Największa część kosztu bruku siedzi pod spodem. Podbudowa i wywóz urobku potrafią kosztować tyle samo co sama kostka.',
    faq: [
      ['Jak gruba powinna być podbudowa?', 'Pod ścieżkę dla pieszych wystarczy około dwudziestu centymetrów kruszywa, pod podjazd dla samochodu osobowego trzydzieści, a przy gruncie gliniastym dochodzi geowłóknina. Oszczędność na tym etapie kończy się koleinami po pierwszej zimie.'],
      ['Ile kosztuje kostka z ułożeniem?', 'Przy kostce betonowej i prostym układzie liczy się średnio około stu dziewięćdziesięciu złotych za metr razem z podbudową i materiałem. Wzory typu jodełka podnoszą robociznę o dwadzieścia do czterdziestu procent i zwiększają ilość odpadu.'],
      ['Czy trzeba obrzeża?', 'Tak. Bez krawężnika albo obrzeża kostka z czasem rozjeżdża się na bokach, a piasek ze spoin wypłukuje się na zewnątrz. To najtańsze zabezpieczenie całej nawierzchni.'],
    ],
    fields: (opts) => `
      ${field({ name: 'pow', label: 'Powierzchnia nawierzchni', value: 60, min: 1, max: 2000, step: 1, suffix: 'm²' })}
      ${field({ name: 'obrzeza', label: 'Długość obrzeży i krawężników', value: 40, min: 0, max: 500, step: 1, suffix: 'mb' })}
      <div class="fields-2">
        ${select({ name: 'city', label: 'Miasto', options: opts })}
        ${select({ name: 'rodzaj', label: 'Rodzaj kostki', options: [{ v: 'kostka_brukowa', t: 'Betonowa', sel: true }, { v: 'kostka_granitowa', t: 'Granitowa' }] })}
      </div>
      <p class="group-title">Zakres</p>
      ${check({ name: 'podbudowa', label: 'Podbudowa z kruszywa', checked: true })}
      ${check({ name: 'niwelacja', label: 'Niwelacja i przygotowanie terenu', checked: true })}
      ${check({ name: 'krawezniki', label: 'Krawężniki zamiast obrzeży' })}
      ${check({ name: 'odwodnienie', label: 'Odwodnienie liniowe', qty: 4 })}
      ${check({ name: 'schody', label: 'Schody zewnętrzne', qty: 3 })}`,
    logic: `
      const pow = v.pow || 0;
      if (v.niwelacja) add('niwelacja_terenu', pow);
      if (v.podbudowa) add('podbudowa', pow);
      add(v.rodzaj, pow);
      add(v.krawezniki ? 'krawezniki' : 'obrzeza', v.obrzeza || 0);
      if (v.odwodnienie) add('odwodnienie_liniowe', v.odwodnienie_qty || 0);
      if (v.schody) add('schody_zewnetrzne', v.schody_qty || 0);
      window.__area = pow;
      window.__sub = F(pow) + ' m² nawierzchni';`,
  },
  {
    slug: 'ogrodzenie',
    h1: 'Ogrodzenie posesji',
    title: `Kalkulator ogrodzenia ${YEAR}: cena za metr bieżący`,
    desc: 'Policz koszt ogrodzenia panelowego: przęsła, podmurówka, brama przesuwna i furtka. Ceny w zł za metr bieżący.',
    lede: 'Ogrodzenie wycenia się na metry bieżące, ale prawdziwe pieniądze robią brama i podmurówka. Dwie pozycje potrafią przebić koszt wszystkich przęseł razem.',
    faq: [
      ['Ile kosztuje ogrodzenie panelowe za metr?', 'Z materiałem i montażem liczy się średnio około stu pięćdziesięciu złotych za metr bieżący przęseł. Podmurówka to drugie tyle, a brama przesuwna z montażem zamyka się zwykle w granicach tysiąca złotych za samą robociznę.'],
      ['Czy podmurówka jest konieczna?', 'Nie, ale bez niej pod ogrodzeniem zostaje szczelina, przez którą przechodzą małe zwierzęta i wypłukuje się grunt. Prefabrykowana płyta jest wyraźnie tańsza od podmurówki murowanej z bloczka.'],
      ['Jak głęboko osadza się słupki?', 'Poniżej strefy przemarzania, w Polsce zwykle od osiemdziesięciu centymetrów do metra dwudziestu w zależności od regionu. Zbyt płytkie fundamenty wypycha mróz i ogrodzenie zaczyna się przechylać po kilku sezonach.'],
    ],
    fields: (opts) => `
      ${field({ name: 'dlugosc', label: 'Długość ogrodzenia', value: 45, min: 1, max: 500, step: 1, suffix: 'mb' })}
      ${select({ name: 'city', label: 'Miasto', options: opts })}
      <p class="group-title">Zakres</p>
      ${check({ name: 'podmurowka', label: 'Podmurówka', checked: true })}
      ${check({ name: 'brama', label: 'Brama przesuwna', checked: true, qty: 1 })}
      ${check({ name: 'furtka', label: 'Furtka', checked: true, qty: 1 })}
      ${check({ name: 'niwelacja', label: 'Wyrównanie terenu wzdłuż ogrodzenia' })}`,
    logic: `
      const d = v.dlugosc || 0;
      add('ogrodzenie_panelowe', d);
      if (v.podmurowka) add('podmurowka', d);
      if (v.brama) add('brama_przesuwna', v.brama_qty || 0);
      if (v.furtka) add('furtka', v.furtka_qty || 0);
      if (v.niwelacja) add('niwelacja_terenu', d * 1.5);
      window.__area = d;
      window.__sub = F(d) + ' mb ogrodzenia';`,
  },
  {
    slug: 'dach',
    h1: 'Pokrycie dachu',
    title: `Kalkulator dachu ${YEAR}: koszt pokrycia i wymiany za m²`,
    desc: 'Policz koszt pokrycia dachu: blachodachówka, dachówka ceramiczna, rąbek, papa. Membrana, obróbki, rynny, okna dachowe i ocieplenie poddasza.',
    lede: 'Powierzchnia połaci jest większa od powierzchni domu: przy typowym nachyleniu o mniej więcej jedną trzecią. Podaj powierzchnię dachu, a nie rzutu.',
    faq: [
      ['Ile kosztuje wymiana dachu 150 m²?', 'Przy blachodachówce z demontażem starego pokrycia, membraną, obróbkami i rynnami wychodzi zwykle od trzydziestu do pięćdziesięciu tysięcy złotych. Dachówka ceramiczna podnosi tę kwotę mniej więcej o połowę, bo cięższe pokrycie często wymaga wzmocnienia więźby.'],
      ['Czy na wymianę pokrycia potrzebne jest pozwolenie?', 'Wymiana pokrycia na takie samo wymaga zgłoszenia w urzędzie gminy przed rozpoczęciem prac. Zmiana geometrii dachu, kąta nachylenia albo dodanie lukarn wymaga już pozwolenia na budowę z projektem.'],
      ['Kiedy najlepiej robić dach?', 'Od późnej wiosny do wczesnej jesieni, przy stabilnej pogodzie. Jesienią stawki dekarzy bywają o dziesięć do piętnastu procent niższe niż w szczycie sezonu, bo kalendarze ekip pustoszeją.'],
    ],
    fields: (opts) => `
      ${field({ name: 'polac', label: 'Powierzchnia połaci', value: 150, min: 5, max: 2000, step: 1, suffix: 'm²' })}
      ${field({ name: 'rynny', label: 'Długość rynien', value: 24, min: 0, max: 300, step: 1, suffix: 'mb' })}
      <div class="fields-2">
        ${select({ name: 'city', label: 'Miasto', options: opts })}
        ${select({ name: 'pokrycie', label: 'Pokrycie', options: [
          { v: 'blachodachowka', t: 'Blachodachówka', sel: true },
          { v: 'dachowka_ceramiczna', t: 'Dachówka ceramiczna' },
          { v: 'blacha_trapezowa', t: 'Blacha trapezowa' },
          { v: 'rabek_stojacy', t: 'Rąbek stojący' },
          { v: 'papa_termozgrzewalna', t: 'Papa termozgrzewalna' },
          { v: 'gont_bitumiczny', t: 'Gont bitumiczny' },
        ] })}
      </div>
      <p class="group-title">Zakres</p>
      ${check({ name: 'demontaz', label: 'Demontaż starego pokrycia', checked: true })}
      ${check({ name: 'membrana', label: 'Membrana z łaceniem', checked: true })}
      ${check({ name: 'obrobki', label: 'Obróbki blacharskie', checked: true, qty: 30 })}
      ${check({ name: 'podbitka', label: 'Podbitka', qty: 40 })}
      ${check({ name: 'okna', label: 'Okna dachowe', qty: 2 })}
      ${check({ name: 'poddasze', label: 'Ocieplenie poddasza', qty: 80 })}
      ${check({ name: 'wiezba', label: 'Nowa więźba dachowa' })}`,
    logic: `
      const p = v.polac || 0;
      if (v.demontaz) add('demontaz_pokrycia', p);
      if (v.wiezba) add('wiezba', p);
      if (v.membrana) add('membrana_laty', p);
      add(v.pokrycie, p);
      if (v.obrobki) add('obrobki_blacharskie', v.obrobki_qty || 0);
      add('rynny', v.rynny || 0);
      if (v.podbitka) add('podbitka', v.podbitka_qty || 0);
      if (v.okna) add('okno_dachowe', v.okna_qty || 0);
      if (v.poddasze) add('ocieplenie_poddasza', v.poddasze_qty || 0);
      window.__area = p;
      window.__sub = F(p) + ' m² połaci';`,
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


/* ---------- spis kalkulatorów ---------- */

const GRUPY = [
  {
    nazwa: 'Całe mieszkanie albo dom',
    opis: 'Zaczynasz od zera i chcesz poznać rząd wielkości.',
    poz: [
      ['remont-mieszkania', 'Remont mieszkania', 'Pełny zakres pod klucz według metrażu, z wyborem standardu i miasta.'],
      ['wykonczenie-pod-klucz', 'Wykończenie od dewelopera', 'Stan deweloperski bez demontaży, za to z gładziami na całej powierzchni.'],
      ['poddasze', 'Wykończenie poddasza', 'Ocieplenie wełną, zabudowa skosów, ścianki kolankowe i podłoga.'],
    ],
  },
  {
    nazwa: 'Pojedyncze pomieszczenia',
    opis: 'Remontujesz jedno pomieszczenie i chcesz policzyć je dokładnie.',
    poz: [
      ['lazienka', 'Łazienka', 'Płytki, hydroizolacja, biały montaż i punkty wodne sztuka po sztuce.'],
      ['kuchnia', 'Kuchnia', 'Instalacje pod sprzęt, fartuch nad blatem, gładzie i podłoga.'],
    ],
  },
  {
    nazwa: 'Pojedyncze roboty',
    opis: 'Znasz zakres i potrzebujesz kwoty za konkretną robotę.',
    poz: [
      ['malowanie', 'Malowanie', 'Wymiary pokoju przeliczone na metry ścian i sufitu.'],
      ['gladzie-i-tynki', 'Gładzie i tynki', 'Tynk, gładź, grunt i malowanie rozdzielone na etapy.'],
      ['plytki', 'Układanie płytek', 'Podłoga i ściany osobno, format wielkoformatowy, hydroizolacja.'],
      ['wylewka', 'Wylewka podłogowa', 'Powierzchnia i grubość dają objętość zaprawy i liczbę worków.'],
      ['wymiana-okien', 'Wymiana okien', 'Montaż liczony za metr obwodu ramy, z ciepłym montażem.'],
    ],
  },
  {
    nazwa: 'Dom i otoczenie',
    opis: 'Prace na zewnątrz, sezonowe i zależne od pogody.',
    poz: [
      ['ocieplenie-elewacji', 'Ocieplenie elewacji', 'Obwód i wysokość minus otwory, styropian albo wełna.'],
      ['dach', 'Pokrycie dachu', 'Sześć rodzajów pokrycia, membrana, obróbki i rynny.'],
      ['kostka-brukowa', 'Kostka brukowa', 'Nawierzchnia z podbudową, obrzeża i odwodnienie.'],
      ['ogrodzenie', 'Ogrodzenie', 'Przęsła na metry bieżące plus podmurówka, brama i furtka.'],
      ['balkon', 'Remont balkonu', 'Skucie, hydroizolacja ze spadkami, płytki mrozoodporne i balustrada.'],
      ['klimatyzacja', 'Klimatyzacja i wentylacja', 'Split, multi-split, rekuperacja i kanały.'],
    ],
  },
];

export function kalkulatoryIndexPage() {
  const ile = GRUPY.reduce((s, g) => s + g.poz.length, 0);
  return layout({
    title: `Kalkulatory kosztów remontu ${YEAR}`,
    description: `${ile} kalkulatorów kosztorysu: mieszkanie, łazienka, kuchnia, poddasze, elewacja, dach, kostka, ogrodzenie, okna i klimatyzacja. Kosztorys pozycja po pozycji.`,
    path: '/kalkulatory/',
    breadcrumb: `<a href="${R}">Cennik</a> · Kalkulatory`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">${ile} kalkulatorów</p>
  <h1>Kalkulatory kosztorysu</h1>
  <p class="lede">Każdy liczy pozycja po pozycji, z podziałem na robociznę i materiał, i przelicza wynik na wybrane miasto. Kosztorys można wydrukować albo wysłać linkiem, bo parametry zapisują się w adresie strony.</p>
  ${GRUPY.map((g) => `
  <h2 style="margin-top:2rem">${g.nazwa}</h2>
  <p class="section-note">${g.opis}</p>
  <div class="cards">
    ${g.poz.map(([slug, tytul, opis]) => `<div class="card"><h3><a href="${R}kalkulator/${slug}/">${tytul}</a></h3><p>${opis}</p></div>`).join('')}
  </div>`).join('')}

  <h2 style="margin-top:2.2rem">Nie wiesz, od którego zacząć?</h2>
  <p class="section-note">Jeśli szukasz kwoty na już, szybciej trafisz do <a href="${R}">gotowych wyliczeń</a> dla typowych metraży. Jeśli masz już wycenę od ekipy, sprawdź ją w <a href="${R}sprawdz-oferte/">narzędziu do oceny oferty</a>. A jeśli dopiero planujesz zakres, zacznij od <a href="${R}poradnik/">poradników o kolejności prac</a>.</p>
</div></section>`,
  });
}