// Poradniki krok po kroku. Inny typ zapytania niż cennik: użytkownik nie liczy
// jeszcze pieniędzy, tylko próbuje zrozumieć kolejność prac. Każdy etap ma
// przypiętą pozycję z cennika, więc poradnik prowadzi wprost do kalkulatora.
import { layout, money } from './templates.mjs';
import { SITE } from './config.mjs';
import EXTRA_PORADNIKI from './data/guides-more.json' with { type: 'json' };
import MIASTA from './data/cities.json' with { type: 'json' };
import { photoForGuide, guideImage } from './photo-guides.mjs';

const R = SITE.root;
// Rok przy cenach odnosi się do potwierdzonej kalibracji danych,
// nie zmienia się automatycznie 1 stycznia bez nowych źródeł.
const YEAR = Number(SITE.updated.slice(0, 4)) || new Date().getFullYear();
const MEDIA_PORADNIKI = {
  "montaz-listew-przypodlogowych-krok-po-kroku": { alt: "Montaż listew przypodłogowych — schemat prac", caption: "Mocowanie do ściany i ochrona szczeliny dylatacyjnej." },
  "wymiana-silikonu-w-lazience-krok-po-kroku": { alt: "Wymiana silikonu w łazience — schemat prac", caption: "Usunięcie starej spoiny i nowa elastyczna fuga." },
  "gruntowanie-scian-przed-malowaniem-krok-po-kroku": { alt: "Gruntowanie ścian — schemat prac", caption: "Ocena chłonności, oczyszczenie i równomierna warstwa." },
  "remont-pokoju-krok-po-kroku": { alt: "Remont pokoju — autorski schemat", caption: "Plan pomieszczenia i właściwa kolejność prac." },
  "remont-lazienki-krok-po-kroku": { alt: "Remont łazienki — autorski schemat", caption: "Plan łazienki i strefy wymagające uszczelnienia." },
  "kolejnosc-prac-remontowych": { alt: "Kolejność prac — autorski schemat", caption: "Od przygotowania pomieszczeń do odbioru robót." },
  "wymiana-okien-krok-po-kroku": { alt: "Wymiana okien — autorski schemat", caption: "Ościeże, rama, izolacja i uszczelnienie połączenia." },
  "wykonczenie-poddasza-krok-po-kroku": { alt: "Wykończenie poddasza — autorski schemat", caption: "Przekrój połaci, izolacji i okładziny g-k." },
  "remont-kuchni-krok-po-kroku": { alt: "Remont kuchni — autorski schemat", caption: "Strefy zasilania, wody i zabudowy." },
  "wykonczenie-mieszkania-krok-po-kroku": { alt: "Wykończenie mieszkania — autorski schemat", caption: "Od stanu deweloperskiego do wnętrza gotowego do zamieszkania." },
  "remont-balkonu-krok-po-kroku": { alt: "Remont balkonu — autorski schemat", caption: "Spadek, hydroizolacja i odprowadzenie wody." },
  "ogrodzenie-krok-po-kroku": { alt: "Budowa ogrodzenia — autorski schemat", caption: "Słupki, fundamenty, przęsła i poziom terenu." },
  "kostka-brukowa-krok-po-kroku": { alt: "Układanie kostki brukowej — autorski schemat", caption: "Przekrój nawierzchni i warstw podbudowy." },
  "instalacja-elektryczna-krok-po-kroku": { alt: "Instalacja elektryczna — autorski schemat", caption: "Przykładowy schemat rozdzielenia obwodów." },
  "modernizacja-ogrzewania-krok-po-kroku": { alt: "Modernizacja ogrzewania — autorski schemat", caption: "Źródło ciepła, rury, regulacja i odbiór." },
  "montaz-klimatyzacji-krok-po-kroku": { alt: "Montaż klimatyzacji — autorski schemat", caption: "Jednostka wewnętrzna i zewnętrzna oraz przewody." },
  "ocieplenie-domu-krok-po-kroku": { alt: "Ocieplenie domu — autorski schemat", caption: "Układ warstw ocieplenia elewacji." },
  "wymiana-dachu-krok-po-kroku": { alt: "Wymiana dachu — autorski schemat", caption: "Konstrukcja, membrana, łaty i pokrycie." },
  "ukladanie-paneli-podlogowych-krok-po-kroku": { alt: "Układanie paneli — autorski schemat", caption: "Podłoże, folia, podkład i panele pływające." },
  "hydroizolacja-lazienki-pod-plytki-krok-po-kroku": { alt: "Hydroizolacja łazienki — schemat wykonania", caption: "Membrana, taśmy i szczelny odpływ." },
  "gladz-gipsowa-sciany-krok-po-kroku": { alt: "Gładź gipsowa — schemat wykonania", caption: "Przygotowanie, wygładzanie i odpylanie." },
  "montaz-drzwi-wewnetrznych-krok-po-kroku": { alt: "Montaż drzwi wewnętrznych — schemat wykonania", caption: "Ościeżnica, kliny i regulacja skrzydła." },
  "ukladanie-plytek-podlogowych-krok-po-kroku": { alt: "Układanie płytek — schemat wykonania", caption: "Podłoże, klej, okładzina i dylatacje." },
  "cyklinowanie-parkietu-i-lakierowanie-krok-po-kroku": { alt: "Cyklinowanie parkietu — schemat wykonania", caption: "Szlifowanie drewna i nowa powłoka." },
  "sufit-podwieszany-z-plyt-gk-krok-po-kroku": { alt: "Sufit podwieszany g-k — schemat wykonania", caption: "Strop, wieszaki, ruszt i płyty." },
  "wylewka-cementowa-krok-po-kroku": { alt: "Wylewka cementowa — schemat wykonania", caption: "Warstwy podłogi — wariant 5 cm." },
  "malowanie-scian-krok-po-kroku": { alt: "Malowanie ścian — schemat wykonania", caption: "Przygotowanie podłoża i dwie warstwy." }
};
const grafikaPoradnika = (p, mini = false) => {
  const m = MEDIA_PORADNIKI[p.slug];
  if (!m) return '';
  const photo = photoForGuide(p.slug);
  const scheme = `${R}assets/media/${p.slug}.svg`;
  if (mini) return `<a href="${R}poradnik/${p.slug}/" class="guide-card-media" aria-label="Otwórz poradnik: ${p.h1}">
    <img src="${photo ? R + photo : scheme}" alt="${photo ? p.h1 + ' — ilustracja redakcyjna' : m.alt}" width="1200" height="675" loading="lazy" decoding="async"></a>`;
  return `<figure class="guide-visual"><img src="${scheme}" alt="${m.alt}" width="1200" height="675" loading="${photo ? 'lazy' : 'eager'}" decoding="async"${photo ? '' : ' fetchpriority="high"'}><figcaption>${m.caption} Schemat poglądowy; szczegóły w dokumentacji systemu.</figcaption></figure>`;
};
const fotoPoradnika = p => {
  const src = photoForGuide(p.slug);
  if (!src) return '';
  return `<figure class="guide-photo-hero"><img src="${R}${src}" width="1600" height="900" alt="${p.h1} — ilustracja redakcyjna przykładowych prac" decoding="async" fetchpriority="high"><figcaption>Ilustracja redakcyjna. Schemat techniczny poniżej wyjaśnia kolejność prac.</figcaption></figure>`;
};

// Przejścia tematyczne, zamiast odnośników do łazienki pod każdym poradnikiem.
const NARZEDZIA_PORADNIKA = {
  "sufit-podwieszany-z-plyt-gk-krok-po-kroku": [["uslugi/sciany-i-sufity/","Cennik sufitów i zabudów g-k"],["kalkulator/wykonczenie-pod-klucz/","Kalkulator wykończenia mieszkania"]],
  "wylewka-cementowa-krok-po-kroku": [["kalkulator/wylewka/","Kalkulator wylewki"],["kalkulator/materialy/","Kalkulator materiałów"]],
  "ukladanie-plytek-podlogowych-krok-po-kroku": [["kalkulator/plytki/","Kalkulator płytek"],["kalkulator/lazienka/","Kalkulator łazienki"]],
  "montaz-drzwi-wewnetrznych-krok-po-kroku": [["uslugi/stolarka-i-wykonczenia/","Cennik montażu stolarki"],["kalkulator/wykonczenie-pod-klucz/","Kalkulator wykończenia mieszkania"]],
  "cyklinowanie-parkietu-i-lakierowanie-krok-po-kroku": [["uslugi/podlogi/","Cennik robót podłogowych"],["kalkulator/pokoj/","Kalkulator remontu pokoju"]],
  "hydroizolacja-lazienki-pod-plytki-krok-po-kroku": [["kalkulator/lazienka/","Kalkulator remontu łazienki"],["kalkulator/plytki/","Kalkulator płytek"]],
  "gladz-gipsowa-sciany-krok-po-kroku": [["kalkulator/gladzie-i-tynki/","Kalkulator gładzi i tynków"],["kalkulator/malowanie/","Kalkulator malowania"]],
  "remont-pokoju-krok-po-kroku": [
    [
      "kalkulator/pokoj/",
      "Kalkulator remontu pokoju"
    ],
    [
      "kalkulator/malowanie/",
      "Kalkulator malowania"
    ]
  ],
  "remont-lazienki-krok-po-kroku": [
    [
      "kalkulator/lazienka/",
      "Kalkulator łazienki"
    ],
    [
      "kalkulator/plytki/",
      "Kalkulator płytek"
    ]
  ],
  "wymiana-okien-krok-po-kroku": [
    [
      "kalkulator/wymiana-okien/",
      "Kalkulator wymiany okien"
    ]
  ],
  "wykonczenie-poddasza-krok-po-kroku": [
    [
      "kalkulator/poddasze/",
      "Kalkulator poddasza"
    ]
  ],
  "remont-kuchni-krok-po-kroku": [
    [
      "kalkulator/kuchnia/",
      "Kalkulator remontu kuchni"
    ]
  ],
  "wykonczenie-mieszkania-krok-po-kroku": [
    [
      "kalkulator/wykonczenie-pod-klucz/",
      "Kalkulator wykończenia mieszkania"
    ]
  ],
  "remont-balkonu-krok-po-kroku": [
    [
      "kalkulator/balkon/",
      "Kalkulator remontu balkonu"
    ]
  ],
  "ogrodzenie-krok-po-kroku": [
    [
      "kalkulator/ogrodzenie/",
      "Kalkulator ogrodzenia"
    ]
  ],
  "kostka-brukowa-krok-po-kroku": [
    [
      "kalkulator/kostka-brukowa/",
      "Kalkulator kostki brukowej"
    ]
  ],
  "instalacja-elektryczna-krok-po-kroku": [
    [
      "uslugi/elektryka/",
      "Cennik robót elektrycznych"
    ],
    [
      "kalkulator/remont-mieszkania/",
      "Kalkulator remontu mieszkania"
    ]
  ],
  "modernizacja-ogrzewania-krok-po-kroku": [
    [
      "uslugi/instalacje-i-klimatyzacja/",
      "Cennik instalacji grzewczych"
    ]
  ],
  "montaz-klimatyzacji-krok-po-kroku": [
    [
      "kalkulator/klimatyzacja/",
      "Kalkulator klimatyzacji"
    ]
  ],
  "ocieplenie-domu-krok-po-kroku": [
    [
      "kalkulator/ocieplenie-elewacji/",
      "Kalkulator ocieplenia"
    ]
  ],
  "wymiana-dachu-krok-po-kroku": [
    [
      "kalkulator/dach/",
      "Kalkulator dachu"
    ]
  ],
  "ukladanie-paneli-podlogowych-krok-po-kroku": [
    ["kalkulator/pokoj/", "Kalkulator remontu pokoju"],
    ["kalkulator/materialy/", "Kalkulator materiałów"]
  ],
  "malowanie-scian-krok-po-kroku": [
    [
      "kalkulator/malowanie/",
      "Kalkulator malowania"
    ],
    [
      "kalkulator/gladzie-i-tynki/",
      "Kalkulator gładzi"
    ]
  ],
  "kolejnosc-prac-remontowych": [
    [
      "kalkulator/remont-mieszkania/",
      "Kalkulator remontu mieszkania"
    ]
  ]
};

export const PORADNIKI = [
  {
    slug: 'remont-pokoju-krok-po-kroku',
    h1: 'Remont pokoju krok po kroku',
    title: `Remont pokoju krok po kroku ${YEAR}: kolejność prac`,
    desc: 'Jak wyremontować pokój: opróżnienie, demontaże, naprawa ścian, gładzie, malowanie, podłoga i listwy. Kolejność, terminy i typowe błędy.',
    lede: 'Jedyny remont, który da się zrobić bez wyprowadzania się z mieszkania. Wymaga za to dyscypliny w kolejności, bo pomyłka oznacza malowanie drugi raz.',
    czas: 'P10D',
    wstep: 'Kolejność dla pojedynczego pomieszczenia w mieszkaniu zamieszkanym. Przy każdym etapie podajemy średnią stawkę dla Polski.',
    kroki: [
      { t: 'Opróżnienie i zabezpieczenie', w: null, txt: 'Meble wynosimy albo zsuwamy na środek i przykrywamy folią. Przejście do reszty mieszkania zasłaniamy folią z zamkiem, bo pył ze szlifowania gładzi dociera wszędzie. To etap, który najczęściej się pomija i którego brak najbardziej daje się we znaki mieszkającym obok.' },
      { t: 'Demontaże', w: 'demontaz_podlogi', txt: 'Stara podłoga, listwy, czasem tapety. Dopiero teraz widać stan podłoża: nierówną wylewkę, ubytki przy ścianach albo legary do wymiany. Przy pokoju to zwykle jeden dzień pracy i kilka worków gruzu, więc kontener bywa niepotrzebny.' },
      { t: 'Zrywanie tapet', w: 'zrywanie_tapet', txt: 'Tapetę moczy się i zdejmuje warstwami. Zostawienie jej pod gładzią to gwarancja pęcherzy: klej tapetowy rozpuszcza się pod wilgocią z masy szpachlowej i odspaja całość.' },
      { t: 'Instalacje, jeśli mają się zmienić', w: 'punkt_elektryczny', txt: 'Nowe gniazda, przesunięcie włącznika, punkt pod telewizor albo lampę. Bruzdowanie robi się przed tynkami i gładziami, bo inaczej trzeba kuć w gotowej powierzchni. To moment na decyzję, której nie da się cofnąć bez powtarzania całego wykończenia.' },
      { t: 'Naprawa i wyrównanie ścian', w: 'gladz', txt: 'Pęknięcia, dziury po kołkach, odparzony tynk. Przy krzywych ścianach potrzebny jest najpierw tynk, a dopiero potem gładź: sama gładź powtórzy każdą krzywiznę. Szlifowanie to najbardziej pylący etap w całym remoncie pokoju.' },
      { t: 'Gruntowanie', w: 'gruntowanie', txt: 'Po odkurzeniu, przed malowaniem. Grunt wyrównuje chłonność podłoża, dzięki czemu farba kryje równomiernie i wystarczają dwie warstwy zamiast trzech.' },
      { t: 'Malowanie sufitu i ścian', w: 'malowanie', txt: 'Najpierw sufit, potem ściany, zawsze przed montażem podłogi. Malowanie po ułożeniu paneli oznacza zabezpieczanie całej powierzchni folią i poprawki przy listwach. Przy zmianie koloru na jaśniejszy trzeba liczyć trzecią warstwę.' },
      { t: 'Wyrównanie podłoża pod podłogę', w: 'samopoziomujaca', txt: 'Masa samopoziomująca wyrównuje kilka milimetrów na istniejącej wylewce. Jeśli różnice są większe niż centymetr albo podłoże jest spękane, potrzebna jest pełna wylewka, a wtedy remont wydłuża się o tygodnie schnięcia.' },
      { t: 'Podłoga', w: 'panele', txt: 'Panele układa się pływająco, z dylatacją przy ścianach ukrytą pod listwą. Deski powinny poleżeć w pomieszczeniu dobę przed montażem, żeby dopasowały się do wilgotności. Alternatywą przy zachowanym parkiecie jest cyklinowanie, często tańsze od nowej podłogi.' },
      { t: 'Listwy przypodłogowe', w: 'listwy', txt: 'Na końcu, po podłodze i malowaniu. Listwa zakrywa dylatację, więc nie może być przykręcona do podłogi, tylko do ściany. Silikonowanie górnej krawędzi przy krzywej ścianie kosztuje niewiele, a odróżnia wykończenie porządne od byle jakiego.' },
      { t: 'Sprzątanie i wniesienie mebli', w: 'sprzatanie', txt: 'Pył ze szlifowania osiada jeszcze kilka dni, więc pierwsze sprzątanie rzadko jest ostatnim. Meble wnosi się po całkowitym wyschnięciu farby, zwykle po dwóch, trzech dniach od ostatniej warstwy.' },
    ],
    faq: [
      ['Ile trwa remont pokoju?', 'Przy pełnym zakresie od siedmiu do dziesięciu dni roboczych, z czego znaczna część to schnięcie: gładzi, gruntu i farby. Samo malowanie i podłoga to dwa, trzy dni.'],
      ['Czy da się mieszkać w mieszkaniu w trakcie?', 'Tak, i to główna zaleta remontu pomieszczeniami. Warunek to szczelne odgrodzenie przejścia folią i pogodzenie się z pyłem przy szlifowaniu. Prace mokre wydłużają się, bo trudniej intensywnie wietrzyć.'],
      ['Malować przed podłogą czy po?', 'Przed. Malowanie po ułożeniu podłogi wymaga zabezpieczenia całej powierzchni i kończy się poprawkami przy listwach. Wyjątkiem jest ostatnia warstwa przy listwach, którą czasem robi się na końcu.'],
      ['Co jeśli pod wykładziną jest parkiet?', 'Warto go obejrzeć przed decyzją o nowej podłodze. Parkiet z warstwą użytkową powyżej trzech milimetrów nadaje się do cyklinowania, które bywa tańsze od paneli i daje trwalszy efekt.'],
    ],
  },
  {
    slug: 'remont-lazienki-krok-po-kroku',
    h1: 'Remont łazienki krok po kroku',
    title: `Remont łazienki krok po kroku ${YEAR}: kolejność prac`,
    desc: 'Kolejność prac przy remoncie łazienki: od demontażu przez hydroizolację po biały montaż. Co po czym, ile trwa i ile kosztuje każdy etap.',
    lede: 'Łazienka jest najbardziej nieprzebaczalnym pomieszczeniem w mieszkaniu. Pomyłka w kolejności prac oznacza tu nie poprawkę, tylko skuwanie tego, co zrobiono dzień wcześniej.',
    czas: 'P14D',
    wstep: 'Poniższa kolejność zakłada pełny remont łazienki w bloku, od starych płytek po gotowe pomieszczenie. Przy każdym etapie podajemy średnią stawkę dla Polski, żeby było widać, gdzie naprawdę uciekają pieniądze.',
    kroki: [
      { t: 'Projekt i zakupy przed rozpoczęciem', w: null, txt: 'Płytki, wanna, kabina, stelaż i armatura muszą być na miejscu przed pierwszym uderzeniem młota. Powód jest prozaiczny: rozmieszczenie punktów wodnych i elektrycznych zależy od konkretnych modeli, a nie od ogólnego zamysłu. Zamówienie płytek potrafi trwać kilka tygodni, a ekipa nie będzie czekać.' },
      { t: 'Demontaż i wywóz gruzu', w: 'skuwanie_plytek', txt: 'Skuwanie starych płytek razem z klejem, demontaż starej armatury i wanny. Gruz z łazienki jest wyjątkowo ciężki, więc worki napełnia się do połowy. To najbardziej uciążliwy etap dla sąsiadów, warto ich uprzedzić.' },
      { t: 'Przeróbki instalacji wodno-kanalizacyjnych', w: 'punkt_wod_kan', txt: 'Nowe podejścia do umywalki, wanny, WC i pralki, kucie bruzd i próba szczelności pod ciśnieniem. Ten etap przesądza o układzie pomieszczenia na kolejne kilkanaście lat, bo po ułożeniu płytek przesunięcie odpływu oznacza kolejne skuwanie.' },
      { t: 'Instalacja elektryczna', w: 'punkt_elektryczny', txt: 'Punkty na oświetlenie, gniazda przy umywalce, zasilanie pralki, grzejnika i ewentualnie ogrzewania podłogowego. W łazience obowiązują strefy ochronne, w których nie wolno umieszczać gniazd, i to nie jest zalecenie, tylko przepis.' },
      { t: 'Zabudowa stelaża i pionu', w: 'zabudowa_rury', txt: 'Stelaż WC obudowuje się płytą wodoodporną, pion kanalizacyjny również, zostawiając rewizję do zaworów. Konstrukcja musi udźwignąć obłożenie płytkami i ciężar użytkownika opierającego się o ściankę.' },
      { t: 'Wyrównanie podłoża i spadki', w: 'samopoziomujaca', txt: 'Wylanie masy samopoziomującej, a przy prysznicu bez brodzika wyrobienie spadków w kierunku odpływu. Bez prawidłowego spadku woda zbiera się w rogu i po roku fuga zaczyna czernieć.' },
      { t: 'Hydroizolacja podpłytkowa', w: 'hydroizolacja', txt: 'Dwuskładnikowa masa na podłodze i ścianach w strefie mokrej, z taśmami w narożnikach i mankietami wokół przejść instalacyjnych. To najtańszy etap całego remontu i jednocześnie ten, którego pominięcie kosztuje najwięcej: przeciek do sąsiada poniżej to koszt dwóch remontów zamiast jednego.' },
      { t: 'Format płytek', w: 'plytki_wielkoformat', txt: 'Duży format daje mniej fug i optycznie powiększa małą łazienkę, ale wymaga podłoża o płaskości bliskiej idealnej, dwóch osób i systemu przyssawek. Przy krzywych ścianach taniej wychodzi mniejsza płytka niż wyrównywanie całego pomieszczenia.' },
      { t: 'Układanie płytek', w: 'plytki_sciana', txt: 'Najpierw ściany, potem podłoga, choć część ekip robi odwrotnie i obie kolejności są poprawne. Płytki układa się od najbardziej widocznej ściany, żeby docinki wypadły w narożnikach zasłoniętych przez wyposażenie. Fugowanie po pełnym związaniu kleju.' },
      { t: 'Odpływ i spadki przy prysznicu', w: 'odplyw_liniowy', txt: 'Przy prysznicu bez brodzika odpływ liniowy montuje się przed wylaniem spadków, a spadki wyrabia w kierunku kratki. Klasa obciążenia i długość korytka dobierane są do wielkości strefy natrysku. To rozwiązanie wygodne w każdym wieku, ale najmniej wybaczające błędy wykonawcze.' },
      { t: 'Baterie', w: 'montaz_baterii', txt: 'Baterie podtynkowe wymagają osadzenia korpusu w ścianie przed płytkowaniem, natynkowe montuje się na końcu. Decyzję o rodzaju podejmuje się więc na etapie instalacji, a nie przy zakupie armatury.' },
      { t: 'Podłączenie pralki', w: 'podlaczenie_pralki', txt: 'Zawór kątowy na zimnej wodzie i syfon z króćcem odpływowym. Bez króćca wąż wkłada się luzem do odpływu, co przy pierwszym zapchaniu kończy się zalaniem podłogi, a w bloku także sufitu sąsiada.' },
      { t: 'Umywalka i ceramika', w: 'montaz_umywalki', txt: 'Osadzenie umywalki na wysokości dobranej do domowników, montaż baterii oraz podłączenie pralki z zaworem kątowym i syfonem z króćcem. Baterie podtynkowe wymagają osadzenia korpusu w ścianie jeszcze przed płytkowaniem, więc decyzję o nich trzeba podjąć znacznie wcześniej.' },
      { t: 'Kabina prysznicowa', w: 'montaz_kabiny', txt: 'Kabina z brodzikiem jest prostsza i tańsza w montażu, walk-in bez brodzika wygodniejszy i lepiej wyglądający, ale wymaga spadków i pełnej izolacji wykonanych wcześniej. Szkło docina się do ścian, więc ich krzywizna przekłada się wprost na cenę.' },
      { t: 'Wanna', w: 'montaz_wanny', txt: 'Wanna akrylowa idzie na stelaż z obudową i rewizją do syfonu, kabina z brodzikiem albo bez. Wersja bez brodzika wymaga spadków wyrobionych wcześniej i lepiej wygląda, ale przy nieszczelnej izolacji mści się natychmiast.' },
      { t: 'Biały montaż i grzejnik', w: 'montaz_wc', txt: 'WC ze stelażem, umywalka, baterie, grzejnik drabinkowy i podłączenie pralki z zaworem kątowym oraz syfonem z króćcem. Dopiero na tym etapie widać, czy punkty wodne wypadły dokładnie tam, gdzie powinny.' },
      { t: 'Grzejnik drabinkowy', w: 'grzejnik', txt: 'Montowany na ścianie przy umywalce, z podejściami grzewczymi przewidzianymi przed płytkowaniem. Służy też jako suszarka, dlatego wysokość dobiera się do wzrostu domowników, a nie do środka wolnej ściany.' },
      { t: 'Silikonowanie i wykończenie', w: 'silikonowanie', txt: 'Silikon sanitarny w narożnikach, na styku wanny ze ścianą i wokół brodzika. Fuga cementowa w tych miejscach pęknie, bo materiały pracują względem siebie. Na koniec montaż lustra, oświetlenia i akcesoriów.' },
    ],
    faq: [
      ['Ile trwa remont łazienki?', 'Przy sprawnej ekipie i materiałach na miejscu od dziesięciu dni do trzech tygodni. Najdłuższe przestoje to schnięcie wylewki i wiązanie hydroizolacji, których nie da się przyspieszyć.'],
      ['Czy hydroizolacja jest naprawdę konieczna?', 'W strefie prysznica i wokół wanny bezwzględnie. Płytki i fuga nie są szczelne, przepuszczają wilgoć do podłoża, a w bloku oznacza to zalanie mieszkania poniżej i koszt wielokrotnie wyższy niż sama izolacja.'],
      ['Co zrobić najpierw: płytki czy biały montaż?', 'Najpierw płytki, potem biały montaż. Płytki muszą wchodzić pod wannę i za stelaż, inaczej po latach przy wymianie armatury zostanie nieobłożony fragment ściany.'],
    ],
  },
  {
    slug: 'kolejnosc-prac-remontowych',
    h1: 'Kolejność prac przy remoncie mieszkania',
    title: `Kolejność prac remontowych ${YEAR}: co po czym`,
    desc: 'W jakiej kolejności prowadzić remont mieszkania: od demontażu i instalacji po malowanie i podłogi. Etapy, czasy schnięcia i koszty.',
    lede: 'Remont ma jedną żelazną zasadę: zawsze od góry do dołu i od brudnego do czystego. Kto ją złamie, będzie malował dwa razy.',
    czas: 'P56D',
    wstep: 'Kolejność poniżej dotyczy pełnego remontu mieszkania z wymianą instalacji. Przy każdym etapie podajemy średnią stawkę dla Polski i zaznaczamy, gdzie trzeba przewidzieć czas na schnięcie, bo to on, a nie praca ekipy, wyznacza termin zakończenia.',
    kroki: [
      { t: 'Zdjęcie starych podłóg', w: 'demontaz_podlogi', txt: 'Panele schodzą w godzinę, klejony parkiet i płytki znacznie wolniej. Pod spodem bywa legarowanie albo stara wylewka do skucia, o czym przekonujemy się dopiero po zdjęciu wierzchniej warstwy. To najczęstsze źródło niespodzianek w kosztorysie remontu.' },
      { t: 'Zrywanie tapet i starych powłok', w: 'zrywanie_tapet', txt: 'Tapeta na gładzi schodzi płatami, na farbie olejnej fragmentami, a w starym budownictwie bywa kilka warstw jedna na drugiej. Po zerwaniu prawie zawsze zostaje podłoże do naprawy, więc ten etap wycenia się osobno od samego zrywania.' },
      { t: 'Wywóz gruzu', w: 'wywoz_gruzu', txt: 'Kontener podstawiony pod klatkę albo znoszenie w workach, jeśli nie ma gdzie go ustawić. Do robocizny dochodzi opłata za przyjęcie odpadów, która przy gruzie zmieszanym potrafi przewyższyć koszt samego skuwania, dlatego segregacja opłaca się już na budowie.' },
      { t: 'Wyburzenia ścianek', w: 'wyburzenie_scianki', txt: 'Rozbiórka ścianek działowych. Przed rozbiórką sprawdza się, czy w ściance nie biegną instalacje i czy na pewno nie jest nośna. Gruz czysty jest tańszy w utylizacji niż zmieszany, więc segregacja opłaca się już na budowie.' },
      { t: 'Demontaże i skuwanie', w: 'skucie_tynkow', txt: 'Skucie tynków tam, gdzie odparzone, skucie tynków tam, gdzie odparzone, wyburzenie ścianek działowych i wywóz gruzu. Wszystko, co brudne i głośne, robi się na początku i zamyka jednym kontenerem.' },
      { t: 'Instalacje: elektryka i hydraulika', w: 'punkt_elektryczny', txt: 'Bruzdowanie, nowe obwody, rozdzielnica, punkty wodno-kanalizacyjne. Etap wykonywany na surowych ścianach, bo później każde przesunięcie gniazda oznacza kucie w gotowej powierzchni. Warto tu przewidzieć więcej punktów, niż wydaje się potrzebne.' },
      { t: 'Ścianki działowe', w: 'scianka_gk', txt: 'Nowe ścianki z płyt gipsowo-kartonowych na profilach, z wypełnieniem wełną tam, gdzie liczy się cisza. Robi się je po instalacjach, żeby przewody schowały się w konstrukcji.' },
      { t: 'Zabudowa ścian płytą', w: 'gk_sciana', txt: 'Obłożenie ściany płytą na ruszcie zamiast tynkowania: szybsze, czystsze i pozwala schować instalacje, ale nie uniesie ciężkich szafek bez wcześniejszego wzmocnienia rusztu. Przy ścianach zewnętrznych w starym budownictwie bywa jedynym sensownym sposobem wyrównania.' },
      { t: 'Sufity podwieszane', w: 'gk_sufit', txt: 'Obudowa pionów, sufit podwieszany oraz sufit podwieszany pod oświetlenie punktowe. Sufit obniża pomieszczenie o kilkanaście centymetrów, więc przy niskich stropach warto policzyć, czy warto. Wycięcia pod oprawy planuje się razem z elektrykiem.' },
      { t: 'Tynki i wyrównanie ścian', w: 'tynk_gipsowy', txt: 'Tynk gipsowy maszynowy na ścianach wymagających wyrównania. Etap mokry, po którym mieszkanie musi być intensywnie wietrzone. Wilgoć z tynków potrafi zniszczyć wcześniej ułożone podłogi, dlatego kolejność jest tu nienegocjowalna.' },
      { t: 'Izolacja pod wylewką', w: 'izolacja_styropian', txt: 'Styropian podłogowy o podwyższonej wytrzymałości na ściskanie, folia i taśmy dylatacyjne przy ścianach. W mieszkaniu ogranicza ucieczkę ciepła do sąsiada poniżej i tłumi dźwięki, na parterze nad piwnicą jest wręcz konieczny.' },
      { t: 'Wybór technologii wylewki', w: 'wylewka_anhydryt', txt: 'Cementowa znosi wilgoć i nadaje się do łazienki, anhydrytowa schnie szybciej, lepiej przewodzi ciepło i sama się rozlewa, ale wymaga podania mieszanki wężem, czyli dojazdu mixokreta pod budynek. Wybór przesądza o terminie zakończenia całego remontu.' },
      { t: 'Wylewka podłogowa', w: 'wylewka_cem', txt: 'Izolacja, dylatacje i nowa wylewka. Najdłuższy przestój całego remontu: wylewka cementowa potrzebuje mniej więcej tygodnia na każdy centymetr grubości, zanim można na niej układać okładziny. Tego terminu nie da się skrócić nagrzewnicą.' },
      { t: 'Kuchnia: instalacje pod sprzęt', w: 'punkt_wod_kan', txt: 'Zlew, zmywarka i osobne obwody pod płytę indukcyjną oraz piekarnik. Rozmieszczenie wynika z projektu mebli, dlatego projekt kuchni musi powstać przed kuciem bruzd. Gniazda nad blatem planuje się na wysokości, która nie koliduje z szafkami górnymi.' },
      { t: 'Hydroizolacja i płytki w strefach mokrych', w: 'plytki_podloga', txt: 'Łazienka i kuchnia. Płytki układa się przed gładziami w pozostałych pomieszczeniach, bo cięcie gresu produkuje pył, który osiada na wszystkim w promieniu kilku metrów.' },
      { t: 'Gładzie i gruntowanie', w: 'gladz', txt: 'Dwuwarstwowa gładź ze szlifowaniem i gruntowanie przed malowaniem. Drugi najbardziej pylący etap remontu, po którym mieszkanie trzeba dokładnie odkurzyć.' },
      { t: 'Pierwsze malowanie', w: 'malowanie', txt: 'Pierwsza warstwa farby przed montażem podłóg. Łatwiej pomalować ściany, gdy na podłodze jest jeszcze surowa wylewka, niż zabezpieczać świeże panele folią.' },
      { t: 'Deska warstwowa albo lita', w: 'parkiet', txt: 'Deska kosztuje kilkakrotnie więcej od paneli, ale można ją cyklinować, czyli odnowić powierzchnię kilka razy w ciągu życia podłogi. Liczbę powtórzeń wyznacza grubość warstwy użytkowej nad piórem, dlatego przy zakupie sprawdza się właśnie ten parametr, a nie samą cenę za metr.' },
      { t: 'Odnowienie starego parkietu', w: 'cyklinowanie', txt: 'Jeśli pod wykładziną znalazł się parkiet w dobrym stanie, cyklinowanie z trzykrotnym lakierowaniem bywa tańsze niż nowa podłoga i zachowuje charakter mieszkania. Etap wykonuje się po pracach mokrych i po malowaniu, bo pył z szlifowania osiada na wszystkim.' },
      { t: 'Podłogi', w: 'panele', txt: 'Panele albo deska, po sprawdzeniu wilgotności wylewki miernikiem, a nie na oko. Ułożenie okładziny na niewyschniętym podkładzie kończy się falowaniem po kilku miesiącach. Deskę litą można później cyklinować kilka razy, panele przy uszkodzeniu wymienia się w całości.' },
      { t: 'Listwy przypodłogowe', w: 'listwy', txt: 'Listwa maskuje szczelinę dylatacyjną przy ścianie i mocowana jest do ściany, nigdy do podłogi: okładzina musi mieć swobodę pracy wraz z wilgotnością. Przy kanale na przewody warto od razu przewidzieć, co w nim pobiegnie.' },
      { t: 'Tapety albo farba', w: 'tapetowanie', txt: 'Tapetę kładzie się po gładziach i gruntowaniu, na tym samym przygotowanym podłożu co farbę: nierówności nie zakryje, a przy bocznym świetle je podkreśli. Flizelinowa klejona metodą na ścianę schodzi później na sucho, co bardzo ułatwia następny remont.' },
      { t: 'Parapety wewnętrzne', w: 'parapet', txt: 'Montowane po tynkach, a przed malowaniem, żeby styk z ościeżem dało się wykończyć jednym ciągiem. Uszczelnienie pod parapetem decyduje o tym, czy zimą w narożniku okna pojawią się skropliny.' },
      { t: 'Drzwi, biały montaż i poprawki', w: 'montaz_drzwi', txt: 'Ościeżnice i skrzydła, armatura, oprawy oświetleniowe, gniazdka i włączniki. Na koniec druga warstwa farby maskująca ślady po montażu.' },
      { t: 'Sprzątanie po remoncie', w: 'sprzatanie', txt: 'Usunięcie pyłu budowlanego z każdej powierzchni, w tym z wnętrza szafek i kanałów wentylacyjnych. Pył gipsowy potrafi wracać tygodniami, jeśli sprzątanie było pobieżne.' },
    ],
    faq: [
      ['Od czego zacząć remont mieszkania?', 'Od demontaży i instalacji, czyli od prac najbrudniejszych i wymagających kucia. Zasada jest jedna: od góry do dołu i od brudnego do czystego.'],
      ['Kiedy układać podłogi?', 'Na samym końcu, po malowaniu, kiedy wszystkie prace mokre są zakończone, a wilgotność wylewki sprawdzona miernikiem. Panele ułożone za wcześnie zaczynają falować.'],
      ['Ile trwa remont mieszkania 50 m²?', 'Od sześciu do dziesięciu tygodni przy pełnym zakresie. O terminie decyduje nie tempo pracy ekipy, tylko schnięcie tynków i wylewki.'],
    ],
  },
  {
    slug: 'wymiana-okien-krok-po-kroku',
    h1: 'Wymiana okien krok po kroku',
    title: `Wymiana okien krok po kroku ${YEAR}: przebieg prac i koszty`,
    desc: 'Jak przebiega wymiana okien: pomiar, demontaż starej stolarki, ciepły montaż warstwowy, obróbka ościeży i parapety. Etapy, czasy i koszty.',
    lede: 'Okno kupuje się raz na dwadzieścia lat, a o jego szczelności decyduje nie producent, tylko dwa dni pracy montażysty.',
    czas: 'P3D',
    wstep: 'Kolejność dotyczy wymiany okien w mieszkaniu albo domu jednorodzinnym, z zachowaniem istniejących otworów. Przy każdym etapie podajemy średnią stawkę dla Polski.',
    kroki: [
      { t: 'Pomiar z natury', w: null, txt: 'Mierzy montażysta, nie sprzedawca i nie inwestor. Sprawdza się szerokość i wysokość otworu w trzech miejscach, bo w starym budownictwie różnice sięgają kilku centymetrów. Błąd na tym etapie oznacza okno, które trzeba przyjąć i zapłacić, choć nie wejdzie w otwór.' },
      { t: 'Przygotowanie pomieszczenia', w: null, txt: 'Zabezpieczenie podłóg i mebli, bo demontaż starej ramy produkuje gruz i pył. W mieszkaniu zamieszkanym prace planuje się pomieszczeniami, żeby nie zostawiać całego lokalu bez okien na noc.' },
      { t: 'Demontaż starej stolarki', w: 'demontaz_okna', txt: 'Wycięcie skrzydeł i ramy, usunięcie starej pianki i zaprawy. Przy oknach skrzynkowych w kamienicach etap potrafi trwać kilka razy dłużej niż przy typowej ramie z lat siedemdziesiątych.' },
      { t: 'Przygotowanie ościeża', w: null, txt: 'Wyrównanie i odpylenie powierzchni, do której będą klejone taśmy. Taśma nie przyklei się do sypiącego się tynku, a to ona odpowiada za szczelność całego połączenia.' },
      { t: 'Osadzenie i mocowanie ramy', w: 'montaz_okna', txt: 'Ustawienie ramy w otworze na klinach, wypoziomowanie i zakotwienie. Stawkę liczy się za metr bieżący obwodu ramy, więc jedno duże okno kosztuje więcej niż dwa mniejsze o tej samej łącznej powierzchni.' },
      { t: 'Ciepły montaż warstwowy', w: 'cieply_montaz', txt: 'Od wewnątrz taśma paroszczelna, w środku pianka, od zewnątrz taśma paroprzepuszczalna. Zasada jest prosta: szczelniej wewnątrz niż na zewnątrz, żeby wilgoć mogła uciekać na zewnątrz, a nie wnikać w mur. Montaż na samą piankę jest dziś traktowany jako błąd sztuki.' },
      { t: 'Regulacja okuć', w: null, txt: 'Ustawienie docisku skrzydła i sprawdzenie kartką papieru na całym obwodzie. Źle wyregulowane okno przewiewa mimo poprawnego montażu, a po sezonie grzewczym trudno już udowodnić, gdzie leżał błąd.' },
      { t: 'Obróbka ościeży', w: 'obrobka_oscierzy', txt: 'Uzupełnienie tynku, gładź i malowanie wokół okna. Etap wykonywany po związaniu pianki, zwykle następnego dnia.' },
      { t: 'Drzwi zewnętrzne', w: 'drzwi_zewnetrzne', txt: 'Jeśli wymieniane są przy okazji okien, warto to zgrać w czasie: ekipa jest na miejscu, a obróbki wykonuje się jednym zestawem materiałów. Ciężkie skrzydło antywłamaniowe wymaga dwóch osób i starannej regulacji zawiasów oraz progu, bo od niej zależy szczelność.' },
      { t: 'Rolety zewnętrzne', w: 'montaz_rolety', txt: 'Rolety adaptacyjne montuje się do gotowego okna, nadstawne razem z nim, a podtynkowe wymagają przewidzenia skrzynki jeszcze przed tynkowaniem. Napęd elektryczny potrzebuje zasilania doprowadzonego przed wykończeniem ościeży.' },
      { t: 'Parapety wewnętrzne i zewnętrzne', w: 'montaz_parapetu_wew', txt: 'Parapet zewnętrzny z wyprowadzeniem poza lico ściany i podniesieniem pod ramę, wewnętrzny z uszczelnieniem styku. Nieszczelność pod parapetem to najczęstsza przyczyna skroplin i pleśni w narożniku okna.' },
    ],
    faq: [
      ['Ile trwa wymiana okien w mieszkaniu?', 'Sam montaż to zwykle jeden dzień na kilka okien. Obróbka ościeży i malowanie dochodzą następnego dnia, po związaniu pianki, więc całość zamyka się w dwóch albo trzech dniach.'],
      ['Czy montaż na samą piankę jest dozwolony?', 'Przepisy nie zakazują pianki wprost, ale wymagania dotyczące szczelności połączenia okna ze ścianą sprawiają, że montaż bez taśm jest dziś traktowany jako błąd w sztuce budowlanej. Może też być podstawą do odrzucenia reklamacji.'],
      ['Kiedy najlepiej wymieniać okna?', 'Od wiosny do wczesnej jesieni, przy temperaturze powyżej pięciu stopni, bo pianki montażowe mają określony zakres pracy. Zimą wymiana jest możliwa, ale wymaga materiałów zimowych i szybszego tempa.'],
    ],
  },
  {
    slug: 'wykonczenie-poddasza-krok-po-kroku',
    h1: 'Wykończenie poddasza krok po kroku',
    title: `Wykończenie poddasza krok po kroku ${YEAR}: kolejność prac`,
    desc: 'Jak zaadaptować poddasze: sprawdzenie więźby, ocieplenie wełną, paroizolacja, ruszt, zabudowa skosów, ścianki kolankowe, instalacje i podłoga.',
    lede: 'Na poddaszu wszystko zamyka się pod płytą i wełną. Błąd popełniony na tym etapie ujawnia się po dwóch sezonach i kosztuje rozbiórkę tego, co już gotowe.',
    czas: 'P28D',
    wstep: 'Kolejność dotyczy adaptacji poddasza w domu jednorodzinnym, z ociepleniem i pełnym wykończeniem. Przy każdym etapie podajemy średnią stawkę dla Polski.',
    kroki: [
      { t: 'Przegląd więźby i pokrycia', w: 'wiezba', txt: 'Zanim cokolwiek zniknie pod zabudową, ogląda się konstrukcję: ślady owadów, zawilgocenia, ugięcia i stan membrany. To ostatni moment, kiedy wymiana uszkodzonej krokwi kosztuje jedną pozycję, a nie rozbiórkę wykończonego poddasza.' },
      { t: 'Okna dachowe', w: 'okno_dachowe', txt: 'Osadzenie okien przed ociepleniem, bo kołnierz uszczelniający łączy się z membraną, a nie z warstwą wykończeniową. Przy większych oknach trzeba przeciąć krokiew i wykonać wymian, co jest ingerencją w konstrukcję i wymaga sprawdzenia przez konstruktora.' },
      { t: 'Instalacje w przestrzeni poddasza', w: 'punkt_elektryczny', txt: 'Przewody elektryczne, ewentualne podejścia wodne pod łazienkę i kanały wentylacyjne prowadzi się przed ociepleniem. Późniejsze dołożenie gniazda oznacza rozcięcie paroizolacji, czyli dokładnie to, czego na poddaszu robić nie wolno.' },
      { t: 'Ocieplenie w dwóch warstwach', w: 'ocieplenie_poddasza', txt: 'Pierwsza warstwa wełny między krokwiami, druga w poprzek pod nimi, na ruszcie. Druga warstwa likwiduje mostki termiczne na drewnie i to ona najczęściej pada ofiarą oszczędności, choć odpowiada za znaczną część efektu.' },
      { t: 'Paroizolacja', w: null, txt: 'Folia od strony pomieszczenia, ze sklejonymi zakładami i uszczelnieniem przy kominie, oknach i ścianach. Musi być szczelna: nieszczelna wpuszcza wilgoć z wnętrza w wełnę, która przestaje grzać, a problem widać dopiero po kilku sezonach jako zimne ściany i pleśń w narożnikach.' },
      { t: 'Ruszt i zabudowa skosów', w: 'gk_sufit', txt: 'Profile mocowane na wieszakach, płyta gipsowo-kartonowa na skosach i suficie. Ruszt daje szczelinę dla przewodów i pozwala prowadzić je bez naruszania paroizolacji, dlatego mocowanie płyty wprost do krokwi jest złym pomysłem.' },
      { t: 'Ścianki kolankowe i działowe', w: 'scianka_gk', txt: 'Ścianka kolankowa zamyka przestrzeń przy okapie, a za nią zostaje schowek, do którego warto przewidzieć drzwiczki rewizyjne. Ścianki działowe wydzielają pokoje i ewentualną łazienkę.' },
      { t: 'Wylewka i podłoga', w: 'wylewka_cem', txt: 'Na poddaszu liczy się ciężar: przy stropie drewnianym stosuje się lekkie rozwiązania zamiast grubej wylewki cementowej. Warstwa akustyczna pod podkładem ma tu większe znaczenie niż na parterze, bo kroki niosą się w dół.' },
      { t: 'Gładzie, malowanie i wykończenie', w: 'gladz', txt: 'Gładzie na płycie, gruntowanie, malowanie i montaż listew. Na skosach światło pada bokiem i podkreśla każdą nierówność, dlatego warto przewidzieć trzecią warstwę gładzi tam, gdzie płaszczyzna jest najbardziej widoczna.' },
    ],
    faq: [
      ['Czy adaptacja poddasza wymaga pozwolenia?', 'Jeśli nie zmienia się konstrukcji ani geometrii dachu, zwykle wystarczy zgłoszenie zmiany sposobu użytkowania. Przecięcie krokwi pod duże okno albo zmiana kształtu dachu to już ingerencja w konstrukcję, wymagająca projektu.'],
      ['Ile centymetrów wełny na poddaszu?', 'Od 25 do 30 centymetrów w dwóch warstwach krzyżowych. Pierwsza między krokwiami, druga w poprzek pod nimi, żeby przykryć drewno, które przewodzi ciepło znacznie lepiej niż wełna.'],
      ['Dlaczego na poddaszu jest gorąco latem?', 'Najczęściej przez zbyt cienkie ocieplenie i brak wentylacji szczeliny pod pokryciem. Wełna chroni nie tylko przed utratą ciepła zimą, ale też przed jego napływem latem, a szczelina odprowadza nagrzane powietrze spod dachu.'],
    ],
  },
  {
    slug: 'remont-kuchni-krok-po-kroku',
    h1: 'Remont kuchni krok po kroku',
    title: `Remont kuchni krok po kroku ${YEAR}: kolejność prac`,
    desc: 'Jak przebiega remont kuchni: projekt mebli, instalacje pod sprzęt, gładzie, podłoga, fartuch nad blatem i montaż zabudowy. Etapy, kolejność i koszty.',
    lede: 'W kuchni kolejność wyznacza projekt mebli, a nie budowlańcy. Bez niego elektryk nie wie, gdzie postawić gniazdo, a hydraulik gdzie wyprowadzić odpływ.',
    czas: 'P21D',
    wstep: 'Kolejność dotyczy remontu kuchni w mieszkaniu, z wymianą instalacji i nową zabudową. Przy każdym etapie podajemy średnią stawkę dla Polski.',
    kroki: [
      { t: 'Projekt mebli przed pracami', w: null, txt: 'To jedyne pomieszczenie, w którym projekt zabudowy powstaje przed remontem, a nie po. Z niego wynika, gdzie stanie płyta, zlew i zmywarka, na jakiej wysokości mają być gniazda nad blatem i czy któreś nie wypadnie za szafką. Ekipa bez projektu rozmieszcza punkty według doświadczenia, co zwykle oznacza kilka poprawek po wniesieniu mebli.' },
      { t: 'Demontaż starej zabudowy', w: 'skuwanie_plytek', txt: 'Wyniesienie mebli, skucie starego fartucha i płytek z podłogi, odłączenie sprzętu. Przy okazji widać stan ścian za szafkami, gdzie latami zbierała się wilgoć, i to zwykle tam trzeba naprawić tynk.' },
      { t: 'Punkty wodno-kanalizacyjne', w: 'punkt_wod_kan', txt: 'Podejścia do zlewu i zmywarki, z odpowiednim spadkiem odpływu. Każdy metr od pionu to dodatkowa długość instalacji i wyższy koszt, dlatego przesuwanie zlewu na przeciwległą ścianę bywa nieproporcjonalnie drogie w stosunku do efektu.' },
      { t: 'Obwody elektryczne', w: 'punkt_elektryczny', txt: 'Płyta indukcyjna wymaga osobnego obwodu, często trójfazowego, a piekarnik, zmywarka i lodówka kolejnych trzech. Do tego gniazda nad blatem i oświetlenie: w praktyce od pięciu do siedmiu obwodów w jednym pomieszczeniu. Gniazda nad blatem planuje się tak, żeby nie kolidowały z szafkami górnymi.' },
      { t: 'Wentylacja i okap', w: 'kanaly_wentylacyjne', txt: 'Kanał do kratki wentylacyjnej z zachowaniem przekroju, bez ostrych załamań, które dławią przepływ. W kuchni otwartej na salon to nie detal: źle wyprowadzony okap oznacza zapachy w części dziennej mimo drogiego sprzętu.' },
      { t: 'Tynki, gładzie i sufit', w: 'gladz', txt: 'Uzupełnienie bruzd, gładzie na ścianach i suficie, gruntowanie. Jeśli w planie jest sufit podwieszany z oświetleniem, wykonuje się go teraz, przed malowaniem i przed montażem mebli.' },
      { t: 'Podłoga', w: 'plytki_podloga', txt: 'W kuchni najlepiej sprawdzają się płytki: znoszą wodę, tłuszcz i przesuwanie krzeseł. Układa się je na całej powierzchni, także pod zabudową, bo późniejsza zmiana ustawienia mebli nie odsłoni wtedy gołej wylewki.' },
      { t: 'Pierwsze malowanie', w: 'malowanie', txt: 'Warstwa przed montażem zabudowy, żeby nie malować wokół szafek. Farba w kuchni powinna znosić mycie, bo ściany nad blatem i przy piekarniku brudzą się szybciej niż gdziekolwiek indziej.' },
      { t: 'Montaż zabudowy i sprzętu', w: null, txt: 'Szafki, blat, zlew, płyta i piekarnik. Dopiero teraz okazuje się, czy punkty trafiły tam, gdzie powinny. Blat wycinany na miejscu wymaga dokładnego pomiaru po zamontowaniu szafek dolnych, a nie z projektu.' },
      { t: 'Fartuch nad blatem', w: 'plytki_sciana', txt: 'Płytki, szkło albo konglomerat montowane po ustawieniu szafek, bo dopiero wtedy znana jest dokładna wysokość między blatem a szafką górną. Wykonanie fartucha wcześniej kończy się widocznym pasem w złym miejscu.' },
      { t: 'Silikonowanie i poprawki', w: 'silikonowanie', txt: 'Silikon na styku blatu ze ścianą i wokół zlewu, druga warstwa farby, montaż osprzętu. Styk blatu ze ścianą to miejsce, w którym woda najczęściej dostaje się pod zabudowę i niszczy płytę meblową od spodu.' },
    ],
    faq: [
      ['Od czego zacząć remont kuchni?', 'Od projektu zabudowy, jeszcze przed pracami budowlanymi. Rozmieszczenie gniazd, punktów wodnych i wentylacji wynika wprost z ustawienia mebli, więc bez projektu instalacje robi się na wyczucie.'],
      ['Kiedy montuje się fartuch nad blatem?', 'Po ustawieniu szafek dolnych i blatu, bo dopiero wtedy znana jest dokładna wysokość pasa. Wykonanie go wcześniej, według projektu, kończy się przesunięciem widocznym po zawieszeniu szafek górnych.'],
      ['Czy płytki układać pod zabudową?', 'Tak, na całej powierzchni. Późniejsza zmiana ustawienia mebli albo wymiana zmywarki nie odsłoni wtedy gołej wylewki, a różnica w koszcie jest niewielka.'],
      ['Ile trwa remont kuchni?', 'Przy pełnym zakresie od dwóch do trzech tygodni, z czego znaczna część to oczekiwanie na meble na wymiar. Sam remont bez zabudowy zamyka się zwykle w dziesięciu dniach roboczych.'],
    ],
  },
  {
    slug: 'wykonczenie-mieszkania-krok-po-kroku',
    h1: 'Wykończenie mieszkania od dewelopera krok po kroku',
    title: `Wykończenie mieszkania krok po kroku ${YEAR}: kolejność prac`,
    desc: 'Jak wykończyć mieszkanie w stanie deweloperskim: odbiór, sprawdzenie wylewki, instalacje, gładzie, łazienka, podłogi i biały montaż. Etapy i koszty.',
    lede: 'Stan deweloperski wygląda na gotowy do wprowadzenia się w miesiąc. Nie jest: sama wylewka potrafi jeszcze schnąć, choć wygląda na suchą.',
    czas: 'P42D',
    wstep: 'Kolejność dotyczy mieszkania odebranego od dewelopera, z gotowymi tynkami, wylewką, oknami i doprowadzonymi instalacjami. Przy każdym etapie podajemy średnią stawkę dla Polski.',
    kroki: [
      { t: 'Odbiór i lista usterek', w: null, txt: 'Przed jakimikolwiek pracami warto obejrzeć lokal z fachowcem: równość ścian łatą, kąty, sprawność okien, kompletność instalacji. Usterki zgłoszone przy odbiorze usuwa deweloper na swój koszt, te zauważone po rozpoczęciu wykończenia stają się już Twoim problemem, bo trudno dowieść, kto je spowodował.' },
      { t: 'Pomiar wilgotności wylewki', w: null, txt: 'Wylewka anhydrytowa dojrzewa tygodniami, a cementowa jeszcze dłużej: liczy się mniej więcej tydzień na centymetr grubości. Wilgotność sprawdza się miernikiem, nie dotykiem. Panele ułożone na niedosuszonym podkładzie zaczynają falować po kilku miesiącach i nie jest to przypadek objęty gwarancją.' },
      { t: 'Zmiany w instalacjach', w: 'punkt_elektryczny', txt: 'Deweloper zostawia podstawowy układ gniazd i punktów. To moment, żeby dołożyć te, których zabraknie: przy biurku, przy łóżku, w kuchni nad blatem. Każdy punkt dodany teraz to jedna pozycja w kosztorysie, dodany po malowaniu to kucie, uzupełnianie tynku i malowanie całej ściany.' },
      { t: 'Ścianki i zabudowy', w: 'scianka_gk', txt: 'Wydzielenie garderoby, zabudowa pralki albo sufit podwieszany pod oświetlenie. Wykonuje się je przed gładziami, bo styk nowej ścianki ze starą trzeba potem wykończyć jednym ciągiem.' },
      { t: 'Gładzie na całej powierzchni', w: 'gladz', txt: 'W przeciwieństwie do remontu tu gładź idzie na wszystkie ściany i sufity, bo tynk deweloperski jest surowy. To największa pozycja w całym wykończeniu: ścian i sufitów jest mniej więcej trzykrotność powierzchni podłogi.' },
      { t: 'Hydroizolacja i płytki w łazience', w: 'hydroizolacja', txt: 'Łazienka powstaje od zera: izolacja w strefie mokrej, płytki na podłodze i ścianach, fugowanie. Kuchenny fartuch nad blatem układa się zwykle później, po ustaleniu wysokości szafek, żeby płytki nie wypadły w przypadkowym miejscu.' },
      { t: 'Gruntowanie i pierwsze malowanie', w: 'malowanie', txt: 'Pierwsza warstwa przed montażem podłóg. Malowanie po ułożeniu paneli oznacza zabezpieczanie całej powierzchni folią, co kosztuje czas i tak kończy się poprawkami przy listwach.' },
      { t: 'Podłogi i listwy', w: 'panele', txt: 'Panele albo deska po ponownym sprawdzeniu wilgotności, z dylatacją przy ścianach. Listwa mocowana jest do ściany, nigdy do podłogi, bo okładzina musi mieć swobodę pracy.' },
      { t: 'Drzwi wewnętrzne', w: 'montaz_drzwi', txt: 'Montaż po ułożeniu podłóg, bo dopiero wtedy znana jest ostateczna wysokość progu i można właściwie podciąć skrzydło. Ościeżnice regulowane dopasowuje się do rzeczywistej grubości ściany po gładziach.' },
      { t: 'Biały montaż i osprzęt', w: 'montaz_wc', txt: 'Ceramika, baterie, grzejnik drabinkowy, gniazda, włączniki i oprawy. Na tym etapie ujawniają się wszystkie nieścisłości z etapu instalacyjnego, dlatego warto go nie przyspieszać.' },
      { t: 'Druga warstwa farby i sprzątanie', w: 'sprzatanie', txt: 'Druga warstwa maskuje ślady po montażu, a sprzątanie usuwa pył gipsowy, który potrafi wracać tygodniami. Dopiero teraz wnosi się meble.' },
    ],
    faq: [
      ['Ile trwa wykończenie mieszkania od dewelopera?', 'Przy pełnym zakresie i jednej ekipie liczy się zwykle od czterech do ośmiu tygodni. Termin zależy nie od tempa pracy, tylko od schnięcia gładzi i od tego, czy wylewka jest już gotowa do układania okładzin.'],
      ['Czy trzeba czekać z podłogą?', 'Tak, do czasu aż wilgotność podkładu spadnie do wartości podanej przez producenta okładziny. Sprawdza się to miernikiem, a nie na oko. To najczęstsza przyczyna reklamacji odrzucanych przez producentów paneli.'],
      ['Co zrobić przed odbiorem mieszkania?', 'Obejrzeć lokal z osobą, która wie, na co patrzeć: równość ścian, kąty, okna, kompletność instalacji, wilgotność. Usterki zgłoszone przy odbiorze usuwa deweloper, późniejsze stają się kosztem inwestora.'],
    ],
  },
  {
    slug: 'remont-balkonu-krok-po-kroku',
    h1: 'Remont balkonu krok po kroku',
    title: `Remont balkonu krok po kroku ${YEAR}: kolejność prac`,
    desc: 'Jak wyremontować balkon: skucie posadzki, ocena płyty, spadki, hydroizolacja, próba wodna, płytki mrozoodporne, obróbki i balustrada.',
    lede: 'Balkon przecieka nie dlatego, że płytki są stare, tylko dlatego, że pod nimi nigdy nie było sprawnej izolacji. Wymiana samej okładziny to najdroższy sposób na odłożenie problemu o trzy lata.',
    czas: 'P7D',
    wstep: 'Kolejność dotyczy remontu balkonu w budynku wielorodzinnym albo tarasu nad pomieszczeniem. Przy każdym etapie podajemy średnią stawkę dla Polski.',
    kroki: [
      { t: 'Zgoda wspólnoty i formalności', w: null, txt: 'Wymiana posadzki i izolacji zwykle nie wymaga zgody, ale zmiana wyglądu zewnętrznego już tak: kolor balustrady, zadaszenie, oszklenie albo sposób wykończenia od strony elewacji. Regulamin wspólnoty sprawdza się przed pracami, bo naruszenie kończy się nakazem przywrócenia stanu poprzedniego.' },
      { t: 'Skucie posadzki i ocena płyty', w: 'skucie_balkonu', txt: 'Zdjęcie okładziny i starej warstwy dociskowej aż do płyty konstrukcyjnej. Dopiero teraz widać stan betonu i zbrojenia. Wystający, rdzewiejący pręt oznacza konieczność reprofilacji zaprawą naprawczą, co jest osobną pozycją, ale bez niej dalsze prace nie mają sensu.' },
      { t: 'Wyrobienie spadków', w: null, txt: 'Spadek zawsze od budynku, minimum półtora procenta, czyli półtora centymetra na metr. Woda musi mieć dokąd odpłynąć, zanim położy się cokolwiek na wierzch. Balkon z zerowym spadkiem będzie stał w wodzie przy ścianie niezależnie od jakości izolacji.' },
      { t: 'Hydroizolacja', w: 'hydroizolacja_balkonu', txt: 'Masa dwuskładnikowa, papa termozgrzewalna albo membrana, z taśmami w narożnikach, przy drzwiach balkonowych i wokół wpustu. To właśnie ta warstwa chroni strop, a nie płytki, które są przepuszczalne wraz z fugą.' },
      { t: 'Próba wodna', w: null, txt: 'Zalanie powierzchni i sprawdzenie szczelności przed ułożeniem okładziny. Etap pomijany przez większość ekip, a jedyny, który daje pewność, zanim izolacja zniknie pod płytkami. Kosztuje dobę czekania i nic poza tym.' },
      { t: 'Deska drewniana jako wariant', w: 'deska_tarasowa_drewno', txt: 'Sosna i modrzew są tańsze od kompozytu i dają naturalny wygląd, ale wymagają impregnacji przed montażem oraz olejowania co jeden do dwóch sezonów. W cieniu pokrywają się glonami i robią śliskie, więc przy balkonie od północy trzeba to wziąć pod uwagę.' },
      { t: 'Płytki mrozoodporne', w: 'plytki_mrozoodporne', txt: 'Gres o nasiąkliwości poniżej trzech procent, antypoślizgowy, na kleju elastycznym i z fugą epoksydową. Konieczna dylatacja obwodowa przy ścianie i przy balustradzie, bo okładzina na zewnątrz pracuje w zakresie kilkudziesięciu stopni w ciągu roku.' },
      { t: 'Obróbki blacharskie i kapinos', w: 'obrobki_balkonu', txt: 'Obróbka krawędzi z kapinosem odrywającym wodę od lica płyty. Bez niego woda spływa po elewacji i zostawia zacieki, a z czasem podchodzi pod izolację od spodu.' },
      { t: 'Balustrada', w: 'balustrada', txt: 'Montaż na końcu, po wykończeniu posadzki, chyba że mocowana jest do czoła płyty, wtedy przed obróbkami. Wysokość i rozstaw wypełnień wynikają z przepisów, a przy wyższych kondygnacjach są zaostrzone.' },
      { t: 'Alternatywa: taras wentylowany', w: 'konstrukcja_tarasu', txt: 'Zamiast płytek klejonych na sztywno można ułożyć deskę na legarach, ze szczeliną powietrzną pod spodem. Woda odpływa i odparowuje, a konstrukcja schnie, więc rozwiązanie jest trwalsze i wybacza drobne błędy w spadkach. Wymaga jednak kilku centymetrów wysokości, co przy progu drzwi balkonowych bywa rozstrzygające.' },
      { t: 'Deska: kompozyt albo drewno', w: 'deska_kompozytowa', txt: 'Kompozyt montuje się na klipsach i nie wymaga konserwacji, drewno jest tańsze na starcie, ale potrzebuje olejowania co jeden do dwóch sezonów. Przy obu rozwiązaniach zachowuje się szczeliny dylatacyjne, bo deska pracuje wraz z temperaturą.' },
      { t: 'Wykończenie ścian balkonu', w: 'tynk_silikonowy', txt: 'Farba albo tynk elewacyjny odporny na warunki zewnętrzne, nakładany po zakończeniu prac mokrych. Zwykła farba wewnętrzna nie przetrwa tu jednego sezonu.' },
    ],
    faq: [
      ['Dlaczego balkon przecieka po remoncie?', 'Najczęściej dlatego, że wymieniono samą okładzinę bez izolacji i bez spadków. Płytki i fuga przepuszczają wodę, a chroni ją dopiero warstwa hydroizolacji pod spodem.'],
      ['Ile trwa remont balkonu?', 'Zwykle od pięciu do ośmiu dni roboczych, z przerwami technologicznymi na wiązanie izolacji i kleju. Sam montaż płytek to jeden dzień, reszta to przygotowanie i schnięcie.'],
      ['Czy można remontować balkon zimą?', 'Nie przy ujemnych temperaturach: masy izolacyjne i kleje mają określony zakres pracy, a fuga epoksydowa wymaga ciepła. Sezon trwa zwykle od kwietnia do października.'],
    ],
  },
  {
    slug: 'ogrodzenie-krok-po-kroku',
    h1: 'Budowa ogrodzenia krok po kroku',
    title: `Budowa ogrodzenia krok po kroku ${YEAR}: kolejność prac`,
    desc: 'Jak zbudować ogrodzenie: wytyczenie granicy, fundamenty słupków, podmurówka, przęsła, brama i furtka. Kolejność prac, formalności i koszty etapów.',
    lede: 'Ogrodzenie stawia się raz, a stoi na granicy działki przez dekady. Błąd w wytyczeniu bywa droższy niż całe przęsła, bo prostuje się go w sądzie, a nie na budowie.',
    czas: 'P10D',
    wstep: 'Kolejność dotyczy ogrodzenia panelowego z podmurówką przy domu jednorodzinnym. Przy każdym etapie podajemy średnią stawkę dla Polski.',
    kroki: [
      { t: 'Granica działki i formalności', w: null, txt: 'Przebieg granicy bierze się z mapy, a przy wątpliwościach z wznowienia znaków przez geodetę, nie z ustaleń z sąsiadem przy kawie. Ogrodzenie od strony drogi wymaga zgłoszenia, a przy wysokości powyżej 2,2 metra zgłoszenia niezależnie od strony. Wykonanie ogrodzenia choćby o kilkanaście centymetrów na cudzym gruncie kończy się nakazem rozbiórki.' },
      { t: 'Wyrównanie terenu wzdłuż linii', w: 'niwelacja_terenu', txt: 'Wyrównanie pasa pod ogrodzenie i ustalenie, czy przęsła pobiegną poziomo, czy schodkowo. Na pochyłej działce schodkowanie jest jedynym sensownym rozwiązaniem, ale trzeba je rozplanować przed zamówieniem przęseł, bo ich wysokość jest stała.' },
      { t: 'Fundamenty pod słupki', w: null, txt: 'Punktowe stopy poniżej strefy przemarzania, w Polsce od osiemdziesięciu centymetrów do metra dwudziestu w zależności od regionu. Zbyt płytkie fundamenty wypycha mróz i po kilku sezonach ogrodzenie zaczyna się przechylać. Przy bramie stopy są większe, bo przenoszą obciążenie ruchome.' },
      { t: 'Przewody do bramy i furtki', w: null, txt: 'Zasilanie napędu, domofon i elektrozaczep prowadzi się w peszlach jeszcze przed betonowaniem słupków. To pięć minut pracy na tym etapie i rozkuwanie fundamentu, jeśli ktoś o tym zapomni.' },
      { t: 'Podmurówka', w: 'podmurowka', txt: 'Prefabrykowana płyta albo murowanie z bloczka na ławie. Zamyka szczelinę przy gruncie i powstrzymuje wypłukiwanie ziemi, ale wymaga przewidzenia przejść dla wody, żeby po ulewie ogrodzenie nie działało jak tama.' },
      { t: 'Montaż przęseł', w: 'ogrodzenie_panelowe', txt: 'Panele mocowane do słupków w równym rozstawie, z zachowaniem jednej linii górnej krawędzi. Rozstaw słupków wynika z długości przęsła i to on decyduje o liczbie fundamentów, dlatego liczy się go przed zamówieniem materiału.' },
      { t: 'Brama przesuwna', w: 'brama_przesuwna', txt: 'Brama odjeżdża w bok, więc potrzebuje wolnego miejsca równego szerokości przejazdu plus zapas. Montaż na przygotowanym wcześniej fundamencie, z belką samonośną albo szyną. Automatyka, fotokomórki i listwa bezpieczeństwa to osobna pozycja.' },
      { t: 'Furtka', w: 'furtka', txt: 'Osadzenie w linii ogrodzenia, z kierunkiem otwierania ustalonym pod ukształtowanie terenu. Jeśli ma mieć elektrozaczep, przewód musi już czekać w słupku z wcześniejszego etapu.' },
      { t: 'Wykończenie i zieleń', w: 'obrzeza', txt: 'Obrzeże oddzielające trawnik od kostki wzdłuż ogrodzenia, uzupełnienie gruntu i uprzątnięcie terenu. Dopiero teraz widać, czy linia ogrodzenia trzyma się prosto, bo dopóki wokół leży urobek, wszystko wygląda równo.' },
    ],
    faq: [
      ['Czy budowa ogrodzenia wymaga zgłoszenia?', 'Ogrodzenie od strony drogi, ulicy albo placu publicznego wymaga zgłoszenia w urzędzie. Zgłoszenia wymaga też każde ogrodzenie wyższe niż 2,2 metra, niezależnie od tego, gdzie stoi. Pozostałe można stawiać bez formalności.'],
      ['Jak głęboko osadza się słupki ogrodzenia?', 'Poniżej strefy przemarzania gruntu, czyli w Polsce od osiemdziesięciu centymetrów do metra dwudziestu w zależności od regionu. Płytsze fundamenty wypycha mróz.'],
      ['Ile kosztuje ogrodzenie panelowe za metr?', 'Same przęsła z montażem to około stu pięćdziesięciu złotych za metr bieżący. Z podmurówką kwota mniej więcej się podwaja, a brama przesuwna to osobny koszt rzędu tysiąca złotych za samą robociznę.'],
    ],
  },
  {
    slug: 'kostka-brukowa-krok-po-kroku',
    h1: 'Układanie kostki brukowej krok po kroku',
    title: `Kostka brukowa krok po kroku ${YEAR}: kolejność prac`,
    desc: 'Jak układa się kostkę brukową: korytowanie, podbudowa, obrzeża, podsypka, układanie i zamulanie spoin. Etapy, grubości warstw i koszty.',
    lede: 'O trwałości bruku decyduje to, czego po skończeniu prac nie widać. Kostka to ostatnie dziesięć procent roboty i pierwsze, na czym widać oszczędności sprzed miesiąca.',
    czas: 'P7D',
    wstep: 'Kolejność dotyczy nawierzchni przy domu jednorodzinnym: podjazdu, ścieżki albo tarasu. Przy każdym etapie podajemy średnią stawkę dla Polski.',
    kroki: [
      { t: 'Wytyczenie i spadki', w: null, txt: 'Wyznaczenie obrysu i ustalenie spadków, zawsze od budynku, minimum jeden procent, czyli centymetr na metr. Woda musi mieć dokąd odpłynąć, zanim zacznie się cokolwiek układać. Ten etap trwa godziny, a przesądza o kolejnych dwudziestu latach.' },
      { t: 'Korytowanie i niwelacja', w: 'niwelacja_terenu', txt: 'Wybranie gruntu na głębokość zależną od obciążenia: około trzydziestu centymetrów pod ścieżkę, czterdziestu pięciu pod podjazd. Urobek trzeba wywieźć, co liczy się osobno w metrach sześciennych.' },
      { t: 'Podbudowa z kruszywa', w: 'podbudowa', txt: 'Warstwa tłucznia zagęszczana płytą wibracyjną co dziesięć centymetrów, nie na raz. Przy gruncie gliniastym pod spód idzie geowłóknina, żeby kruszywo nie wtapiało się w podłoże. To tutaj powstają koleiny, jeśli ktoś przyspieszył.' },
      { t: 'Obrzeża i krawężniki', w: 'krawezniki', txt: 'Osadzenie na ławie betonowej wzdłuż całego obrysu. Bez tego kostka rozjeżdża się na bokach, a piasek ze spoin wypłukuje się na zewnątrz. Najtańsze zabezpieczenie całej nawierzchni.' },
      { t: 'Odwodnienie liniowe', w: 'odwodnienie_liniowe', txt: 'Korytka przy garażu i w miejscach, gdzie spadek nie wystarcza. Klasa obciążenia kratki musi odpowiadać temu, co po niej jeździ: inna przy ścieżce, inna przy wjeździe.' },
      { t: 'Podsypka', w: null, txt: 'Warstwa trzech do pięciu centymetrów piasku lub kruszywa drobnego, ściągana łatą i nigdy niezagęszczana przed układaniem. Kostka dociskana wibratorem sama się w niej osadza.' },
      { t: 'Wybór kostki', w: 'kostka_granitowa', txt: 'Beton jest tańszy i równy wymiarowo, granit droższy, ale praktycznie niezniszczalny i nie blaknie. Na podjazd użytkowy wystarcza beton ośmiocentymetrowy, przy reprezentacyjnym wejściu granit zwraca się wyglądem po latach, gdy beton zaczyna się kruszyć na krawędziach.' },
      { t: 'Układanie kostki', w: 'kostka_brukowa', txt: 'Praca od krawędzi, zawsze z gotowej nawierzchni, nie z podsypki. Zachowuje się fugi dwóch do trzech milimetrów: kostka musi mieć luz na pracę, bo ułożona na styk pęka przy krawędziach. Docinki wykonuje się na końcu.' },
      { t: 'Zamulanie spoin i wibrowanie', w: null, txt: 'Zamiecenie piasku w fugi, przewibrowanie całości płytą z osłoną gumową, potem ponowne zamulenie. Spoiny wypełnia się dwukrotnie, bo po pierwszym wibrowaniu piasek osiada.' },
      { t: 'Trawnik i zieleń wokół nawierzchni', w: 'trawnik_rolowany', txt: 'Darń z rolki układa się na końcu, po uprzątnięciu terenu i wyrównaniu gruntu, z obrzeżem oddzielającym ją od kostki. Musi trafić na podłoże w ciągu doby od dostawy i wymaga intensywnego podlewania przez pierwsze tygodnie.' },
      { t: 'Ogrodzenie i furtka', w: 'ogrodzenie_panelowe', txt: 'Jeśli w planie jest też ogrodzenie, słupki osadza się przed układaniem nawierzchni, a nie po. Fundament punktowy sięga poniżej strefy przemarzania, więc kopanie po ułożonej kostce oznacza jej rozbieranie. Furtkę i bramę ustawia się w tym samym etapie.' },
      { t: 'Schody i wykończenia', w: 'schody_zewnetrzne', txt: 'Stopnie, obrzeża trawnika, uzupełnienie gruntu wzdłuż krawędzi. Nawierzchni nie obciąża się samochodem przez pierwsze dni, aż spoiny się ustabilizują.' },
    ],
    faq: [
      ['Jaka grubość kostki na podjazd?', 'Pod samochód osobowy stosuje się kostkę ośmiocentymetrową, sześciocentymetrowa nadaje się tylko na ścieżki i tarasy. Różnica w cenie materiału jest niewielka, różnica w trwałości ogromna.'],
      ['Ile trwa ułożenie kostki na podjeździe?', 'Przy powierzchni około sześćdziesięciu metrów liczy się zwykle od pięciu do siedmiu dni roboczych, z czego połowa przypada na korytowanie i podbudowę.'],
      ['Czy kostkę można układać zimą?', 'Nie przy przemarzniętym gruncie, bo zagęszczenie podbudowy jest wtedy pozorne i po odwilży nawierzchnia osiada. Sezon trwa zwykle od kwietnia do października.'],
    ],
  },
  {
    slug: 'instalacja-elektryczna-krok-po-kroku',
    h1: 'Wymiana instalacji elektrycznej krok po kroku',
    title: `Instalacja elektryczna krok po kroku ${YEAR}: kolejność prac`,
    desc: 'Jak przebiega wymiana instalacji elektrycznej: projekt rozmieszczenia, bruzdowanie, układanie przewodów, rozdzielnica, pomiary i biały montaż. Etapy i koszty.',
    lede: 'Instalację wymienia się raz na kilkadziesiąt lat i tylko wtedy, gdy ściany są surowe. Każdy punkt dodany po malowaniu kosztuje wielokrotnie więcej niż przewidziany wcześniej.',
    czas: 'P7D',
    wstep: 'Kolejność dotyczy kompleksowej wymiany instalacji w mieszkaniu z lat sześćdziesiątych albo siedemdziesiątych, gdzie zwykle zastano aluminium i dwa obwody na całe mieszkanie. Przy każdym etapie podajemy średnią stawkę dla Polski.',
    kroki: [
      { t: 'Rozmieszczenie punktów na ścianach', w: null, txt: 'Przed jakimkolwiek kuciem warto obejść mieszkanie z ołówkiem i zaznaczyć na ścianach każde gniazdo, włącznik i wypust. Wtedy widać, że gniazdo za łóżkiem wypada za szafką, a nad blatem brakuje dwóch. Dodanie punktu na tym etapie to jedna pozycja w kosztorysie, dodanie po wykończeniu to kucie, tynkowanie i malowanie całej ściany.' },
      { t: 'Dobór obwodów i mocy', w: null, txt: 'Dzisiejsze mieszkanie potrzebuje osobnych obwodów dla kuchni, łazienki, pralki, zmywarki i płyty indukcyjnej. Stara instalacja aluminiowa z dwoma obwodami nie jest przystosowana do tylu odbiorników, dlatego wymiana samych gniazd bez przewodów niczego nie rozwiązuje.' },
      { t: 'Bruzdowanie', w: 'bruzdowanie', txt: 'Wycinanie rowków pod przewody i puszki. Najbardziej pylący etap całego remontu, wykonywany z odkurzaczem przemysłowym przy bruzdownicy. W ścianach nośnych obowiązują ograniczenia głębokości i kierunku bruzd, bo poziome cięcie osłabia konstrukcję.' },
      { t: 'Układanie przewodów i puszek', w: 'punkt_elektryczny', txt: 'Przewody w peszlach albo bezpośrednio w bruzdach, puszki osadzane w jednej linii, żeby później osprzęt układał się równo. To moment na przewód pod przyszłą klimatyzację albo rolety, nawet jeśli montaż planujesz za trzy lata: pusty peszel kosztuje grosze, kucie po fakcie kilkaset złotych.' },
      { t: 'Ogrzewanie podłogowe elektryczne', w: 'ogrzewanie_podlogowe', txt: 'Mata grzewcza w łazience układana jest przed wylewką wyrównującą i płytkami, z czujnikiem temperatury w peszlu, żeby dało się go wymienić bez skuwania posadzki. Pod zabudową meblową i pod wanną maty się nie układa.' },
      { t: 'Rozdzielnica', w: 'rozdzielnica', txt: 'Nowa tablica z wyłącznikami nadprądowymi na każdym obwodzie, różnicowoprądowymi na gniazdach i ochroną przepięciową. Liczba modułów decyduje o rozmiarze obudowy, dlatego warto od razu przewidzieć zapas na przyszłe obwody.' },
      { t: 'Pomiary i protokół odbiorowy', w: null, txt: 'Sprawdzenie ciągłości przewodów ochronnych, rezystancji izolacji i skuteczności wyłączników różnicowoprądowych. Protokół z pomiarów to dokument, którego zażąda ubezpieczyciel po ewentualnym pożarze i rzeczoznawca przy sprzedaży mieszkania. Bez niego trudno dowieść, że instalacja była wykonana poprawnie.' },
      { t: 'Zatynkowanie bruzd', w: 'tynk_gipsowy', txt: 'Uzupełnienie bruzd zaprawą przed gładziami. Etap wykonywany dopiero po pomiarach, bo poprawka w zatynkowanej ścianie oznacza ponowne kucie.' },
      { t: 'Montaż osprzętu i opraw', w: 'montaz_lampy', txt: 'Gniazda, włączniki i oprawy montuje się na samym końcu, po malowaniu, żeby nie ubrudzić białego osprzętu. Wtedy też sprawdza się, czy każdy włącznik steruje tym, czym powinien.' },
    ],
    faq: [
      ['Czy trzeba wymieniać całą instalację?', 'Jeśli przewody są aluminiowe, praktycznie zawsze. Aluminium kruszy się na stykach i nie jest przystosowane do dzisiejszej liczby odbiorników. Wymiana samych gniazd przy starych przewodach poprawia wygląd, a nie bezpieczeństwo.'],
      ['Ile punktów elektrycznych w mieszkaniu?', 'Przyjmuje się mniej więcej pół punktu na metr powierzchni, czyli około dwudziestu pięciu w mieszkaniu pięćdziesięciometrowym. To wartość orientacyjna: kuchnia i miejsce pracy potrzebują znacznie więcej niż sypialnia.'],
      ['Czy potrzebne są pomiary po wymianie instalacji?', 'Tak. Protokół z pomiarów jest podstawą przy zgłoszeniu szkody i przy sprzedaży mieszkania. Ekipa, która nie proponuje pomiarów, powinna budzić ostrożność.'],
    ],
  },
  {
    slug: 'modernizacja-ogrzewania-krok-po-kroku',
    h1: 'Modernizacja ogrzewania krok po kroku',
    title: `Modernizacja ogrzewania ${YEAR}: pompa ciepła krok po kroku`,
    desc: 'Jak przebiega wymiana ogrzewania na pompę ciepła: ocena domu, ocieplenie, instalacja odbiorcza, montaż pompy, fotowoltaika i rekuperacja. Etapy i koszty.',
    lede: 'Kolejność jest tu ważniejsza niż wybór urządzenia. Pompa ciepła wstawiona do nieocieplonego domu z grzejnikami rozczarowuje rachunkami, a winą obarcza się technologię.',
    czas: 'P30D',
    wstep: 'Kolejność dotyczy domu jednorodzinnego przechodzącego z kotła na pompę ciepła. Przy każdym etapie podajemy średnią stawkę dla Polski, liczoną za montaż, bo urządzenia kupuje inwestor.',
    kroki: [
      { t: 'Ocena zapotrzebowania na ciepło', w: null, txt: 'Punkt wyjścia to nie katalog pomp, tylko odpowiedź na pytanie, ile ciepła dom naprawdę potrzebuje. Liczy się to z przegród, powierzchni okien i wentylacji. Dobór mocy na oko kończy się urządzeniem przewymiarowanym, które taktuje, czyli włącza się i wyłącza co kilka minut, przez co zużywa więcej prądu i szybciej się zużywa.' },
      { t: 'Najpierw ocieplenie, potem źródło ciepła', w: 'ocieplenie_styropian', txt: 'To najczęściej pomijana kolejność. Ocieplenie ścian obniża zapotrzebowanie na tyle, że pompa może być mniejsza i tańsza, a jej sprawność wyraźnie rośnie. Wstawienie pompy przed termomodernizacją oznacza kupno urządzenia o mocy, która za rok będzie już niepotrzebna.' },
      { t: 'Instalacja odbiorcza', w: 'instalacja_co', txt: 'Pompa pracuje wydajnie przy niskiej temperaturze zasilania, dlatego najlepiej współpracuje z ogrzewaniem podłogowym. Przy grzejnikach trzeba sprawdzić, czy powierzchnia wymiany ciepła wystarczy przy niższym parametrze; czasem konieczna jest wymiana kilku grzejników na większe. To tańsze niż wymiana całej instalacji, ale musi być policzone wcześniej.' },
      { t: 'Przygotowanie miejsca i zasilania', w: 'punkt_elektryczny', txt: 'Fundament albo wsporniki pod jednostkę zewnętrzną z zachowaniem odstępów od ściany i od granicy działki, osobny obwód w rozdzielnicy i zabezpieczenia. Jednostka pracuje głośniej zimą, więc miejsce dobiera się z myślą o oknach sypialni, także u sąsiada.' },
      { t: 'Montaż pompy i uruchomienie', w: 'pompa_ciepla', txt: 'Podłączenie do instalacji, bufor albo zasobnik ciepłej wody, napełnienie, odpowietrzenie i konfiguracja krzywej grzewczej. Ostatni krok jest tym, na którym najczęściej się oszczędza: źle ustawiona krzywa potrafi podnieść rachunki o kilkadziesiąt procent przy poprawnie zamontowanym urządzeniu.' },
      { t: 'Fotowoltaika', w: 'fotowoltaika', txt: 'Pompa zamienia prąd na ciepło, więc własna produkcja energii zmienia rachunek ekonomiczny całego przedsięwzięcia. Instalację wycenia się za kilowatopik, a jej wielkość dobiera do rocznego zużycia razem z pompą, a nie do samego oświetlenia i sprzętu domowego.' },
      { t: 'Rekuperacja', w: 'rekuperacja', txt: 'W szczelnym, ocieplonym domu wentylacja grawitacyjna przestaje działać, bo nie ma czym napływać powietrzu. Rekuperacja odzyskuje ciepło z powietrza wywiewanego i domyka bilans. W domu zamieszkanym montaż kosztuje około jednej trzeciej więcej niż w stanie surowym.' },
      { t: 'Chłodzenie latem', w: 'klimatyzacja_multisplit', txt: 'Część pomp potrafi chłodzić przez podłogówkę, ale bez osuszania powietrza i z ograniczoną mocą. Jeśli latem ma być realnie chłodno, planuje się układ multi-split razem z resztą prac, żeby trasy chłodnicze schować przed wykończeniem ścian.' },
      { t: 'Rozliczenie dotacji', w: null, txt: 'Programy wsparcia termomodernizacji wymagają dokumentów z każdego etapu: faktur, kart urządzeń, protokołów. Warto zbierać je na bieżąco, bo skompletowanie ich po zakończeniu prac bywa trudniejsze niż same prace. Zasady zmieniają się co roku, więc szczegóły sprawdza się przed rozpoczęciem, a nie po.' },
    ],
    faq: [
      ['Czy pompa ciepła opłaca się w starym domu?', 'Dopiero po ociepleniu. W nieocieplonym budynku z grzejnikami pompa pracuje przy wysokiej temperaturze zasilania i traci sprawność, przez co rachunki potrafią rozczarować. Kolejność powinna być odwrotna: najpierw przegrody, potem źródło ciepła.'],
      ['Pompa ciepła czy kocioł gazowy?', 'W domu ocieplonym, z ogrzewaniem podłogowym i najlepiej z fotowoltaiką wygrywa pompa. W starym budynku z grzejnikami, którego na razie nie zamierzasz ocieplać, sensowniejszy bywa kocioł, a pompa dopiero po termomodernizacji. Porównanie kosztów obu rozwiązań mamy w osobnym zestawieniu.'],
      ['Ile trwa cała modernizacja?', 'Sam montaż pompy to kilka dni, ale pełen zakres z ociepleniem, instalacją odbiorczą i fotowoltaiką rozkłada się zwykle na kilka tygodni i zależy od pogody, bo prace elewacyjne wymagają temperatury powyżej pięciu stopni.'],
    ],
  },
  {
    slug: 'montaz-klimatyzacji-krok-po-kroku',
    h1: 'Montaż klimatyzacji krok po kroku',
    title: `Montaż klimatyzacji krok po kroku ${YEAR}: przebieg prac`,
    desc: 'Jak przebiega montaż klimatyzacji split: dobór mocy, zgoda wspólnoty, trasa chłodnicza, próba szczelności i uruchomienie. Etapy i koszty.',
    lede: 'Klimatyzację montuje się raz i na lata, a najczęstszy błąd popełnia się jeszcze przed zakupem: przy doborze miejsca dla jednostki zewnętrznej.',
    czas: 'P2D',
    wstep: 'Kolejność dotyczy montażu układu split w mieszkaniu albo domu. Przy każdym etapie podajemy średnią stawkę dla Polski.',
    kroki: [
      { t: 'Co jeszcze warto zrobić przy okazji', w: 'kociol_gazowy', txt: 'Jeśli w planie jest wymiana źródła ciepła, warto zgrać ją z montażem klimatyzacji: obie ekipy pracują przy instalacjach i rozdzielnicy, a jedno rusztowanie albo jeden zestaw przejść przez ścianę służy obu robotom. Przy przejściu na kocioł kondensacyjny dochodzi wymiana wkładu kominowego i odbiór kominiarski.' },
      { t: 'Dobór mocy i miejsca montażu', w: null, txt: 'Moc dobiera się do kubatury, nasłonecznienia i liczby okien, a nie na oko. Jednostkę wewnętrzną planuje się tak, żeby strumień powietrza nie szedł prosto na łóżko ani biurko, a zewnętrzną tam, gdzie da się ją serwisować i gdzie nie będzie hałasować sąsiadowi pod oknem.' },
      { t: 'Zgoda wspólnoty', w: null, txt: 'W bloku elewacja jest częścią wspólną, więc montaż jednostki zewnętrznej wymaga zgody wspólnoty albo spółdzielni. Warto ją uzyskać przed zamówieniem sprzętu, bo odmowa po zakupie oznacza szukanie zupełnie innego rozwiązania.' },
      { t: 'Trasa chłodnicza', w: null, txt: 'Wytyczenie drogi rur miedzianych, przewodu zasilającego i odprowadzenia skroplin. Podtynkowo wygląda lepiej, ale wymaga kucia bruzd, więc robi się to przed wykończeniem ścian. Natynkowo jest taniej i szybciej, za to widać korytko.' },
      { t: 'Kanały i punkty grzewcze', w: 'kanaly_wentylacyjne', txt: 'Przy rekuperacji rozprowadza się kanały nawiewne i wywiewne, a przy modernizacji ogrzewania punkty do grzejników. Oba etapy wykonuje się na surowych ścianach i stropach, przed zabudowami i sufitami podwieszanymi, bo później każda zmiana trasy oznacza rozbieranie wykończenia.' },
      { t: 'Zasilanie elektryczne', w: 'punkt_elektryczny', txt: 'Osobny obwód z zabezpieczeniem w rozdzielnicy. Podpięcie klimatyzatora pod istniejące gniazdo oświetleniowe jest częstą improwizacją i typową przyczyną problemów przy pierwszym upale.' },
      { t: 'Montaż jednostek', w: 'klimatyzacja_split', txt: 'Powieszenie jednostki wewnętrznej na płycie montażowej i osadzenie zewnętrznej na wspornikach albo na fundamencie, z zachowaniem odstępów wymaganych przez producenta. Zbyt ciasne zabudowanie agregatu obniża sprawność i skraca jego życie.' },
      { t: 'Odprowadzenie skroplin', w: null, txt: 'Grawitacyjnie ze spadkiem albo pompką skroplin, jeśli spadku nie da się uzyskać. Woda z jednostki wewnętrznej musi mieć pewną drogę, inaczej pojawi się na ścianie pod urządzeniem.' },
      { t: 'Próba szczelności i wakuowanie', w: null, txt: 'Sprawdzenie instalacji azotem pod ciśnieniem, potem odessanie powietrza i wilgoci pompą próżniową. Etap niewidoczny i pomijany przez przypadkowe ekipy, a to on decyduje, czy układ przepracuje dziesięć lat, czy dwa sezony.' },
      { t: 'Uruchomienie i przeszkolenie', w: null, txt: 'Napełnienie czynnikiem, pomiar parametrów pracy, ustawienie trybów i pokazanie, jak czyścić filtry. Filtry myje się co kilka tygodni w sezonie i to jedyna czynność, która realnie przedłuża życie urządzenia.' },
    ],
    faq: [
      ['Ile kosztuje montaż klimatyzacji?', 'Montaż pojedynczego splitu to zwykle od dwóch do trzech tysięcy złotych z materiałem instalacyjnym, bez ceny urządzenia. Dłuższa trasa chłodnicza i montaż podtynkowy podnoszą tę kwotę.'],
      ['Czy klimatyzacja wymaga zgody w bloku?', 'Montaż jednostki zewnętrznej na elewacji tak, bo elewacja należy do części wspólnych. Procedura zależy od wspólnoty, więc pytanie warto zadać przed zakupem sprzętu.'],
      ['Kiedy montować klimatyzację?', 'Najlepiej wiosną albo jesienią. W czerwcu i lipcu terminy ekip wydłużają się do kilku tygodni, a ceny idą w górę razem z temperaturą.'],
    ],
  },
  {
    slug: 'ocieplenie-domu-krok-po-kroku',
    h1: 'Ocieplenie domu krok po kroku',
    title: `Ocieplenie domu krok po kroku ${YEAR}: kolejność prac`,
    desc: 'Jak przebiega ocieplenie domu w systemie ETICS: przygotowanie podłoża, klejenie płyt, kołkowanie, warstwa zbrojona i tynk. Etapy i koszty.',
    lede: 'Ocieplenie to system, a nie zestaw materiałów. Zamiana jednego elementu na tańszy z innej rodziny potrafi unieważnić gwarancję na całość.',
    czas: 'P21D',
    wstep: 'Kolejność dotyczy ocieplenia ściany zewnętrznej w systemie ETICS, najczęściej stosowanym w Polsce. Przy każdym etapie podajemy średnią stawkę dla kraju.',
    kroki: [
      { t: 'Ocena podłoża i rusztowanie', w: 'rusztowanie', txt: 'Sprawdzenie nośności starego tynku prostą próbą odrywania, ustawienie i zakotwienie rusztowania. Rusztowanie rozlicza się za metr i za dobę postoju, więc każdy przestój z powodu pogody kosztuje realne pieniądze.' },
      { t: 'Mycie i gruntowanie ściany', w: 'mycie_elewacji', txt: 'Zmycie kurzu, glonów i luźnych warstw, uzupełnienie ubytków i zagruntowanie. Klej trzyma się tego, co pod spodem: przyklejenie płyty do odparzonego tynku oznacza, że za kilka lat odpadnie razem z nim.' },
      { t: 'Montaż listwy startowej i cokołu', w: 'cokol_xps', txt: 'Listwa startowa wyznacza poziom pierwszego rzędu płyt na całym obwodzie. W strefie cokołu zamiast styropianu układa się XPS, bo tam ściana ma kontakt z wodą rozbryzgową i śniegiem.' },
      { t: 'Wybór izolacji', w: 'ocieplenie_welna', txt: 'Styropian jest tańszy i lżejszy, wełna niepalna, lepiej tłumi hałas i przepuszcza parę wodną, przez co pasuje do starych murów. Wełna wymaga gęstszego kołkowania i pracy we dwóch, a montaż zależy od pogody, bo po zamoknięciu traci właściwości.' },
      { t: 'Klejenie płyt izolacji', w: 'ocieplenie_styropian', txt: 'Płyty układa się mijankowo, jak cegły, z pełnym przewiązaniem w narożnikach. Szczeliny między płytami wypełnia się wyłącznie klinami z tej samej izolacji, nigdy pianą montażową, która ma inną rozszerzalność i wypycha tynk.' },
      { t: 'Kołkowanie', w: null, txt: 'Po związaniu kleju, zwykle po dwóch dobach, płyty mocuje się dodatkowo kołkami. Liczba kołków na metr zależy od wysokości budynku i strefy wiatrowej, a przy wełnie jest wyraźnie większa niż przy styropianie.' },
      { t: 'Warstwa zbrojona z siatką', w: 'siatka_zbrojaca', txt: 'Siatka zatapiana w kleju, z podwójnym zbrojeniem w strefie cokołu i ukośnymi pasami nad narożnikami okien. To właśnie tam pojawiają się rysy, jeśli ktoś ten detal pominie.' },
      { t: 'Gruntowanie pod tynk', w: 'gruntowanie', txt: 'Podkład tynkarski wyrównuje chłonność warstwy zbrojonej i zwykle jest barwiony w kolorze przyszłego tynku, żeby prześwity nie rzucały się w oczy.' },
      { t: 'Wybór tynku', w: 'tynk_mineralny', txt: 'Mineralny jest najtańszy i najlepiej przepuszcza parę, ale wymaga późniejszego malowania. Silikonowy odpycha wodę i jest barwiony w masie, więc elewacja dłużej zostaje czysta. Do wełny dobiera się tynk o wysokiej paroprzepuszczalności.' },
      { t: 'Tynk elewacyjny', w: 'tynk_silikonowy', txt: 'Nakładanie i zacieranie tynku całą ścianą bez przerwy, metodą mokre na mokre. Przerwa w połowie ściany zostawia widoczną na zawsze granicę. Prace prowadzi się przy temperaturze powyżej pięciu stopni i bez ostrego słońca.' },
      { t: 'Parapety, obróbki i demontaż rusztowania', w: 'parapet_zewnetrzny', txt: 'Parapety zewnętrzne z wyprowadzeniem poza lico elewacji, obróbki wokół otworów i uszczelnienia. Rusztowanie schodzi na końcu, a miejsca po kotwach uzupełnia się systemowo.' },
    ],
    faq: [
      ['Ile centymetrów styropianu na elewację?', 'Dziś standardem jest dwadzieścia centymetrów na ścianie zewnętrznej. Piętnaście bywa spotykane przy dociepleniu budynku, który już był ocieplony, ale przy pierwszym ociepleniu schodzenie poniżej dwudziestu przestało się opłacać.'],
      ['Kiedy można ocieplać dom?', 'Przy temperaturze powyżej pięciu stopni i bez opadów, czyli w praktyce od kwietnia do października. Systemy zimowe pozwalają pracować niżej, ale kosztują więcej i mają węższe okno bezpieczeństwa.'],
      ['Ile trwa ocieplenie domu jednorodzinnego?', 'Około dwóch do trzech tygodni przy sprzyjającej pogodzie. Najwięcej czasu zabierają przerwy technologiczne: klej musi związać przed kołkowaniem, a warstwa zbrojona przed tynkiem.'],
    ],
  },
  {
    slug: 'wymiana-dachu-krok-po-kroku',
    h1: 'Wymiana dachu krok po kroku',
    title: `Wymiana dachu krok po kroku ${YEAR}: kolejność prac`,
    desc: 'Jak przebiega wymiana pokrycia dachowego: demontaż, przegląd więźby, membrana, łacenie, pokrycie, obróbki i rynny. Etapy, koszty i formalności.',
    lede: 'Dach wymienia się raz na kilkadziesiąt lat i zwykle pod presją czasu, bo przecieka. Presja jest złym doradcą przy wyborze ekipy.',
    czas: 'P10D',
    wstep: 'Kolejność dotyczy wymiany pokrycia na dachu skośnym domu jednorodzinnego. Przy każdym etapie podajemy średnią stawkę dla kraju.',
    kroki: [
      { t: 'Zgłoszenie i przygotowanie', w: null, txt: 'Wymiana pokrycia na takie samo wymaga zgłoszenia w urzędzie gminy przed rozpoczęciem prac. Zmiana geometrii dachu, kąta nachylenia albo dodanie lukarn to już pozwolenie na budowę z projektem. Na tym etapie zamawia się też kontener i ustala miejsce na składowanie materiału.' },
      { t: 'Demontaż starego pokrycia', w: 'demontaz_pokrycia', txt: 'Zdejmowanie pokrycia połaciami, tak żeby nigdy nie odsłonić więcej dachu, niż da się zabezpieczyć folią przed wieczorem. Prognoza pogody jest tu częścią harmonogramu, a nie ciekawostką.' },
      { t: 'Przegląd i naprawa więźby', w: 'wiezba', txt: 'Odsłonięta konstrukcja to jedyna okazja, żeby zobaczyć krokwie w całości. Sprawdza się ślady owadów, zawilgocenia i ugięcia. Wymiana pojedynczych elementów kosztuje ułamek tego, co konstrukcja odtwarzana po latach przecieków.' },
      { t: 'Membrana i łacenie', w: 'membrana_laty', txt: 'Membrana wysokoparoprzepuszczalna układana od okapu w górę z zakładami, potem kontrłaty dające szczelinę wentylacyjną i łaty w rozstawie dobranym do modułu pokrycia. Pominięcie kontrłat zamyka wentylację i skrapla wodę pod blachą.' },
      { t: 'Pokrycie ceramiczne albo rąbek', w: 'dachowka_ceramiczna', txt: 'Dachówka ceramiczna przeżyje właściciela, ale waży kilkakrotnie więcej i przy wymianie pokrycia często wymaga wzmocnienia więźby. Rąbek stojący sprawdza się nawet na bardzo płaskich połaciach i jest najdroższą, ale też najtrwalszą blachą.' },
      { t: 'Wybór pokrycia', w: 'blacha_trapezowa', txt: 'Przy budynku gospodarczym albo garażu wystarcza blacha trapezowa, wyraźnie tańsza od blachodachówki i szybsza w montażu, bo arkusze są większe. Na domu mieszkalnym stosuje się ją rzadziej, głównie ze względu na wygląd i głośniejszą pracę przy deszczu.' },
      { t: 'Montaż pokrycia', w: 'blachodachowka', txt: 'Układanie od okapu, z zachowaniem zakładów i kolejności wynikającej z kierunku wiatrów. Przy dachu wielospadowym moduły dają wyraźnie mniej odpadu niż arkusze cięte na wymiar.' },
      { t: 'Obróbki blacharskie', w: 'obrobki_blacharskie', txt: 'Kominy, kosze, okna dachowe i połączenia ze ścianami. To najczęstsze miejsce przecieków w całym dachu, więc etap, na którym nie ma sensu oszczędzać ani przyspieszać.' },
      { t: 'Rynny i rury spustowe', w: 'rynny', txt: 'System rynnowy ze spadkiem w stronę rur spustowych i odprowadzeniem wody z dala od fundamentów. Zdecydowana większość reklamacji dachowych bierze się z niesprawnego odprowadzenia wody, a nie z samego pokrycia.' },
      { t: 'Dach płaski albo o małym spadku', w: 'papa_termozgrzewalna', txt: 'Na połaciach o niewielkim nachyleniu pokrycia układane z zakładem nie zadziałają: woda podchodzi pod spód. Stosuje się wtedy papę termozgrzewalną w dwóch warstwach.' },
      { t: 'Rąbek na płaskiej połaci', w: 'rabek_stojacy', txt: 'Blacha łączona podwójnym zagięciem zamykanym na miejscu, bez otworów w pokryciu. Sprawdza się przy nachyleniu, przy którym inne rozwiązania zawodzą, ale wymaga maszyny i wprawy, więc krąg wykonawców jest wyraźnie węższy.' },
      { t: 'Łuki i wieżyczki', w: 'gont_bitumiczny', txt: 'Gont bitumiczny na pełnym deskowaniu dopasowuje się do kształtów, których nie pokryje ani blacha, ani dachówka. Warstwa samoprzylepna aktywuje się w cieple, dlatego montaż w chłodzie wymaga dodatkowego klejenia.' },
      { t: 'Okna dachowe', w: 'okno_dachowe', txt: 'Osadzenie okna z kołnierzem uszczelniającym dobranym do rodzaju pokrycia. Przy większych rozmiarach trzeba przeciąć krokiew i wykonać wymian, co jest osobną pozycją. Wykończenie ościeży od strony poddasza robi się później, razem z pracami wewnętrznymi.' },
      { t: 'Kominki wentylacyjne', w: 'kominek_wentylacyjny', txt: 'Liczba kominków wynika z powierzchni połaci, a przy dachówce potrzebna jest dachówka systemowa. Część z nich odpowietrza pion kanalizacyjny, dlatego ich rozmieszczenie ustala się razem z hydraulikiem, a nie po jego wyjściu.' },
      { t: 'Podbitka okapu', w: 'podbitka', txt: 'Wykończenie okapu od spodu, z kratkami wentylacyjnymi na całej długości. Bez nich szczelina pod pokryciem przestaje działać i wilgoć zostaje w konstrukcji, więc oszczędność na kratkach kosztuje potem więźbę.' },
      { t: 'Ocieplenie poddasza', w: 'ocieplenie_poddasza', txt: 'Podbitka okapu z kratkami wentylacyjnymi, a od środka wełna w dwóch krzyżowych warstwach i szczelna paroizolacja. Nieszczelna folia od strony pomieszczeń zawilgaca wełnę i po kilku sezonach ocieplenie przestaje działać.' },
    ],
    faq: [
      ['Ile trwa wymiana dachu 150 m²?', 'Sama wymiana pokrycia to zwykle od siedmiu do dziesięciu dni roboczych dla ekipy trzech albo czterech dekarzy. Wymiana więźby albo ocieplenie poddasza wydłużają ten czas o kolejny tydzień.'],
      ['Czy wymiana dachu wymaga pozwolenia?', 'Wymiana pokrycia na takie samo wymaga zgłoszenia w urzędzie gminy. Pozwolenie na budowę jest potrzebne dopiero przy zmianie geometrii dachu, kąta nachylenia lub dodaniu lukarn.'],
      ['Co zrobić z eternitem?', 'Eternit zawiera azbest i podlega osobnej procedurze demontażu i utylizacji przez uprawnioną firmę. Wiele gmin prowadzi programy, które pokrywają koszt zdjęcia i wywozu, więc przed zleceniem prac warto zapytać w urzędzie.'],
    ],
  },
  {
  "slug": "malowanie-scian-krok-po-kroku",
  "h1": "Malowanie ścian krok po kroku",
  "title": `Malowanie ścian krok po kroku ${YEAR}: przygotowanie i koszt`,
  "desc": "Jak malować ściany i sufit bez smug: przygotowanie podłoża, gruntowanie, dwie warstwy farby, kolejność prac oraz koszt za m².",
  "lede": "Równa powłoka zaczyna się długo przed pierwszym ruchem wałka. Najdroższy błąd to malowanie po ścianie, która się pyli, łuszczy albo ma niewyschnięte poprawki.",
  "czas": "P3D",
  "wstep": "Schemat dla typowego pokoju bez aktywnego zawilgocenia. Stawki przy etapach odnoszą się do metra kwadratowego obrabianej powierzchni, nie do metra podłogi. Nie każdy etap musi być potrzebny: na stabilnej starej farbie zwykle nie trzeba wykonywać pełnej gładzi ani gruntować całego pomieszczenia.",
  "kroki": [
    {
      "t": "Zmierz powierzchnię, a nie sam metraż pokoju",
      "w": null,
      "txt": "Powierzchnia malowania to suma ścian i sufitu: obwód pokoju pomnóż przez jego wysokość, dodaj powierzchnię sufitu i odejmij duże otwory. Pokój o podłodze 20 m² ma znacznie więcej niż 20 m² powierzchni do pomalowania. Ustal też, czy wycena obejmuje dwie warstwy i odcinanie kolorów, czy wyłącznie samo nakładanie farby."
    },
    {
      "t": "Zabezpiecz podłogę i wyposażenie",
      "w": null,
      "txt": "Wynieś ruchome meble, pozostałe odsuń od ścian, przykryj podłogę i oklej listwy, ościeżnice oraz krawędzie przy suficie. Zadbaj o oświetlenie boczne, bo pokazuje nierówności niewidoczne przy świetle z góry. Przy pracy w okolicy osprzętu elektrycznego nie maluj przez gniazda i przełączniki; bezpieczne odłączenie obwodu zleć osobie z odpowiednimi kwalifikacjami."
    },
    {
      "t": "Sprawdź przyczepność starej farby i usuń luźne warstwy",
      "w": "zrywanie_tapet",
      "txt": "Zetrzyj pył, usuń odspajające się powłoki i pozostałości kleju. Jeśli ściana pokryta jest tapetą, usuń ją zgodnie z rodzajem okładziny i oceń stan tynku pod spodem. Nie przykrywaj nową farbą miejsc z łuszczącą się powłoką: nowa warstwa nie przyklei starej do podłoża. Zabrudzenia tłuszczem usuń przed kolejnymi etapami."
    },
    {
      "t": "Napraw pęknięcia i nierówności",
      "w": "gladz",
      "txt": "Punktowe ubytki wypełnij masą przeznaczoną do konkretnego podłoża. Po całkowitym wyschnięciu zeszlifuj poprawki, usuń pył i obejrzyj ścianę w świetle padającym z boku. Pełna gładź na całej powierzchni jest osobną, znacznie większą pracą — stosuj ją tylko tam, gdzie lokalne poprawki nie wystarczą. Przy zawilgoceniu lub wykwitach najpierw usuń przyczynę, a nie maskuj jej farbą."
    },
    {
      "t": "Zagruntuj chłonne miejsca odpowiednim produktem",
      "w": "gruntowanie",
      "txt": "Nowa gładź, bardzo chłonny tynk i podłoże pylące wymagają preparatu dobranego do stanu powierzchni i farby. Na stabilnej powłoce grunt nie jest automatycznie potrzebny. Nie zalewaj ścian: nadmiar gruntu może stworzyć błyszczącą warstwę o słabej przyczepności. Poczekaj do pełnego wyschnięcia zgodnie z kartą techniczną użytego produktu."
    },
    {
      "t": "Najpierw pomaluj sufit",
      "w": "malowanie",
      "txt": "Zacznij od narożników i okolic opraw, później maluj wałkiem duże powierzchnie. Pracuj równymi pasami z zachowaniem mokrej krawędzi, aby nie powstały widoczne łączenia. Nie wracaj wałkiem do fragmentu, który już przesycha. Sufit przed ścianami oznacza też, że ewentualne drobne zachlapania zasłonisz w kolejnym etapie."
    },
    {
      "t": "Pomaluj ściany dwukrotnie z przerwą na schnięcie",
      "w": "malowanie",
      "txt": "Użyj wałka odpowiedniego do struktury ściany i rodzaju farby. Najpierw odetnij narożniki i miejsca przy listwach, potem wykonuj pasy na dużej powierzchni bez długich przerw. Drugą warstwę nakładaj dopiero po czasie wymaganym przez producenta; zależy on od produktu, temperatury i wilgotności. Zbyt szybkie ponowne malowanie może naruszyć pierwszą powłokę."
    },
    {
      "t": "Odbierz powierzchnię i usuń zabezpieczenia",
      "w": null,
      "txt": "Sprawdź ściany i sufit w dziennym świetle: wypatruj smug, prześwitów oraz śladów wałka. Taśmę zdejmij w momencie zalecanym przez jej producenta, aby nie zerwać krawędzi nowej farby. Nie testuj odporności na szorowanie od razu po wyschnięciu dotykowym — pełne utwardzenie powłoki trwa dłużej. Zapisz kod koloru i nazwę produktu na przyszłe poprawki."
    }
  ],
  "faq": [
    [
      "Ile kosztuje malowanie ścian za m²?",
      "Malowanie rozlicza się za m² malowanej powierzchni, a nie za m² podłogi. Stawka podstawowa obejmuje dwie warstwy farby; gruntowanie i pełna gładź to osobne pozycje, jeśli są potrzebne. Aktualne ceny i różnice między miastami sprawdzisz w kalkulatorze malowania oraz w cenniku usług."
    ],
    [
      "Czy gruntowanie przed malowaniem jest zawsze konieczne?",
      "Nie. Jest wskazane na nowej gładzi, pylącym lub nadmiernie chłonnym podłożu, ale na stabilnej, wcześniej malowanej powierzchni może być zbędne. Postępuj zgodnie z kartą techniczną wybranych produktów."
    ],
    [
      "Dlaczego po malowaniu widać smugi?",
      "Przyczyną bywa nierówna chłonność podłoża, poprawianie podsychającej farby, zbyt długie przerwy między sąsiednimi pasami lub źle dobrany wałek. Przed trzecią warstwą warto ocenić przyczynę."
    ],
    [
      "Czy malować najpierw ściany czy sufit?",
      "Najpierw sufit. Ewentualne zachlapania na ścianach zamalujesz podczas kolejnych etapów. Przy różnych kolorach zadbaj o pełne wyschnięcie powierzchni przed oklejaniem krawędzi."
    ],
    [
      "Ile trwa malowanie pokoju?",
      "Samo malowanie trwa krócej niż przygotowanie podłoża. Naprawy, gruntowanie i wymagane przerwy między warstwami mogą wydłużyć pracę do kilku dni; dokładny czas wynika z kart technicznych materiałów i warunków w pomieszczeniu."
    ]
  ]
},
  {
  "slug": "ukladanie-paneli-podlogowych-krok-po-kroku",
  "h1": "Układanie paneli podłogowych krok po kroku",
  "title": `Układanie paneli podłogowych ${YEAR}: instrukcja i ceny`,
  "desc": "Jak układać panele podłogowe: kontrola wilgotności wylewki, dobór podkładu, aklimatyzacja, dylatacje, montaż na klik i koszt za m².",
  "lede": "Panele łatwo połączyć na klik, ale trudno naprawić podłogę, która skrzypi lub wypiętrza się po kilku miesiącach. O wyniku decydują pomiary podłoża, podkład i szczeliny przy ścianach.",
  "czas": "P2D",
  "wstep": "Instrukcja dotyczy przede wszystkim laminowanych paneli pływających z zamkiem klik, w suchym pomieszczeniu. Panele winylowe, drewniane i systemy klejone mogą mieć inne wymagania. Parametry wilgotności, równości, dylatacji i ogrzewania podłogowego zawsze sprawdź w dokumentacji producenta konkretnego produktu.",
  "kosztWorkId": "panele",
  "kroki": [
    {
      "t": "Sprawdź typ paneli i warunki montażu",
      "w": null,
      "txt": "Zanim kupisz materiał, sprawdź klasę użytkowania, rodzaj zamka, możliwość montażu na ogrzewaniu podłogowym oraz dopuszczalne warunki wilgotności. Panel laminowany nie zachowuje się identycznie jak winylowy czy drewniany, a system na klik nie jest automatycznie odporny na wodę. Instrukcja danego producenta rozstrzyga, jakiego podkładu i jakich szczelin wymaga podłoga; ogólne rady z internetu nie zastępują karty produktu."
    },
    {
      "t": "Zmierz powierzchnię i policz zapas na docinki",
      "w": null,
      "txt": "Zmierz długość i szerokość pomieszczenia, zaznacz wnęki, progi i rury. Do powierzchni podłogi dolicz zapas na docinki uzależniony od układu: prosty pokój zużyje go mniej niż wnętrze z wieloma skosami. Kup paczki z tej samej partii, jeśli producent przewiduje oznaczenie partii lub odcienia. Zachowaj jedną paczkę na ewentualne naprawy, a ilość materiału porównaj w kalkulatorze zakupów."
    },
    {
      "t": "Usuń starą posadzkę, jeśli nie jest właściwym podłożem",
      "w": "demontaz_podlogi",
      "txt": "Starą wykładzinę dywanową, luźne płyty i niestabilne warstwy trzeba usunąć. W niektórych systemach dopuszcza się układanie na istniejących płytkach lub stabilnym drewnie, ale tylko po sprawdzeniu równości, wysokości podłogi i wymagań producenta. Nie przykrywaj podłogi z objawami zawilgocenia: nowa warstwa utrudni odparowanie wilgoci, a problem pozostanie niewidoczny do czasu powstania szkód."
    },
    {
      "t": "Sprawdź wilgotność, nośność i równość podłoża",
      "w": null,
      "txt": "Podłoże musi być suche, czyste, stabilne i wystarczająco równe. Sama ocena na oko nie zastąpi pomiaru wilgotności nowej wylewki, zwłaszcza przy ogrzewaniu podłogowym. Wymagane wartości i sposób badania zależą od produktu i rodzaju jastrychu; przy wątpliwościach zleć pomiar odpowiednią metodą. Długą łatą sprawdź zagłębienia i garby, a w progach także różnicę wysokości względem sąsiednich pomieszczeń."
    },
    {
      "t": "Wyrównaj ubytki i pozwól naprawom wyschnąć",
      "w": "samopoziomujaca",
      "txt": "Niewielkie nierówności napraw miejscowo, a przy większych różnicach rozważ masę samopoziomującą dobraną do podłoża. Nie próbuj ukrywać nierównej wylewki bardzo grubym, miękkim podkładem: zamek paneli będzie się uginał pod obciążeniem i może pękać. Przed kolejnym etapem odczekaj czas schnięcia wymagany przez producenta masy i ponownie sprawdź wilgotność, jeżeli tego wymaga system podłogowy."
    },
    {
      "t": "Przygotuj panele zgodnie z instrukcją producenta",
      "w": null,
      "txt": "Sprawdź opakowania, stan krawędzi i zgodność wzoru jeszcze przed montażem. Jeśli producent wymaga aklimatyzacji, przechowuj zamknięte paczki w pomieszczeniu przez wskazany czas, na płaskiej powierzchni i w zalecanej temperaturze. Nie opieraj ich pionowo o wilgotną ścianę. Ustal również, czy można montować podłogę przy działającym ogrzewaniu podłogowym i kiedy wolno stopniowo przywrócić temperaturę."
    },
    {
      "t": "Ułóż warstwę przeciwwilgociową i właściwy podkład",
      "w": null,
      "txt": "Na podłożach mineralnych część systemów wymaga folii paroizolacyjnej, z właściwymi zakładami i szczelnymi połączeniami. Podkład musi być kompatybilny z panelem i ewentualnym ogrzewaniem podłogowym. Zintegrowany podkład na spodzie paneli nie oznacza, że można bez sprawdzenia dołożyć kolejną miękką warstwę. Zbyt gruby lub nieodpowiedni podkład powoduje pracę zamków i skraca żywotność posadzki."
    },
    {
      "t": "Rozplanuj pierwszy i ostatni rząd oraz dylatacje",
      "w": null,
      "txt": "Sprawdź szerokość pomieszczenia w kilku miejscach i zaplanuj układ tak, aby ostatni rząd nie wyszedł skrajnie wąski. Kierunek desek dobierz do proporcji wnętrza i światła, ale najpierw uwzględnij zalecenia producenta. Przy ścianach, słupach, rurach i progach pozostaw wolną szczelinę dylatacyjną o szerokości wymaganej w instrukcji. Podłoga pływająca musi mieć możliwość naturalnej pracy, dlatego nie można jej sztywno przytwierdzać do ściany czy podłoża."
    },
    {
      "t": "Łącz kolejne rzędy bez uszkadzania zamków",
      "w": "panele",
      "txt": "Rozpocznij od pierwszego prostego rzędu, stosując kliny dystansowe. Krótsze połączenia sąsiednich desek przesuń względem siebie zgodnie z minimalnym przesunięciem podanym przez producenta; nie dopuszczaj do przypadkowych krótkich odcinków przy ścianach. Systemy klik różnią się sposobem wsuwania i opuszczania deski, dlatego używaj dobijaka tylko wtedy, gdy instrukcja na to pozwala. Uszkodzone zamki odłóż, zamiast ukrywać je w środku podłogi."
    },
    {
      "t": "Dopasuj przejścia, rury i ościeżnice",
      "w": "panele",
      "txt": "Przy rurach wycinaj otwory z uwzględnieniem wymaganej dylatacji, którą później zakryje rozeta. Ościeżnice trzeba dopasować do wysokości gotowej posadzki, bez ściskania jej od góry. Sprawdź wymagania dotyczące listew przejściowych i podziału większych powierzchni: możliwość ułożenia kilku pomieszczeń bez profili zależy od konkretnego systemu i wymiarów podłogi, a nie od samego wyglądu paneli."
    },
    {
      "t": "Zamontuj listwy, sprawdź podłogę i zachowaj dokumentację",
      "w": "listwy",
      "txt": "Listwę przypodłogową mocuj do ściany zgodnie z systemem montażowym, tak aby zakryła szczelinę, lecz nie blokowała ruchu paneli. Sprawdź, czy zamki nie odstają, czy podłoga nie ugina się nadmiernie i czy profile przejściowe nie dociskają paneli. Zachowaj instrukcję, numer partii, rachunki oraz informacje o przeprowadzonych pomiarach podłoża; przy późniejszej reklamacji mogą być równie ważne jak zdjęcia gotowego wnętrza."
    }
  ],
  "faq": [
    [
      "Ile kosztuje układanie paneli podłogowych za m²?",
      "Stawkę za montaż paneli z rozbiciem na robociznę i materiał znajdziesz w aktualnym cenniku uslugiceny.pl. Do całego budżetu dolicz ewentualny demontaż starej posadzki, wyrównanie podłoża, listwy i profile. W kalkulatorze można sprawdzić różnice między miastami."
    ],
    [
      "Czy można ułożyć panele na starych płytkach?",
      "Część producentów dopuszcza taki montaż, jeżeli płytki są stabilne, suche, równe, a cała konstrukcja mieści się w dopuszczalnej wysokości. Sprawdź też wymagania dotyczące podkładu i warstwy przeciwwilgociowej. Jeśli płytki odspajają się lub podłoga ma duże różnice poziomu, najpierw trzeba naprawić podłoże."
    ],
    [
      "Jak szeroka powinna być dylatacja przy ścianie?",
      "Szerokość szczeliny zależy od systemu paneli, wielkości podłogi i warunków montażu. Zastosuj wartość z instrukcji konkretnego produktu i zachowaj dylatacje również przy rurach, słupach oraz ościeżnicach. Nie blokuj ich listwą lub silikonem, jeśli producent tego zabrania."
    ],
    [
      "Czy panele muszą leżeć w pokoju przed montażem?",
      "Jeżeli producent wymaga aklimatyzacji, pozostaw paczki w warunkach i przez czas opisane w instrukcji. Wymagania różnią się między produktami; przechowywanie paneli w zimnym lub wilgotnym garażu do chwili montażu może powodować problemy."
    ],
    [
      "Czy panele można układać na ogrzewaniu podłogowym?",
      "Tak, ale tylko jeśli konkretne panele i podkład są do tego dopuszczone. Sprawdź maksymalną temperaturę powierzchni, opór cieplny całego układu, przygotowanie wygrzanej wylewki i zalecenia dotyczące uruchomienia ogrzewania po montażu."
    ]
  ]
},
  {
  "slug": "hydroizolacja-lazienki-pod-plytki-krok-po-kroku",
  "h1": "Hydroizolacja łazienki pod płytki krok po kroku",
  "title": `Hydroizolacja łazienki pod płytki ${YEAR}: etapy i koszt`,
  "desc": "Hydroizolacja łazienki przed układaniem płytek: strefy mokre, przygotowanie podłoża, taśmy i mankiety, dwie warstwy oraz koszt za m².",
  "lede": "Płytka i fuga nie zastąpią uszczelnienia. O trwałości prysznica decyduje niewidoczna warstwa pod okładziną, szczególnie przy odpływie, narożnikach i przejściach rur.",
  "czas": "P3D",
  "wstep": "Instrukcja dla typowej łazienki z okładziną ceramiczną, w tym strefy natrysku. Dobierz kompletny system hydroizolacji do podłoża i stopnia narażenia na wodę. Liczba warstw, zużycie, grubość i czas schnięcia są określone w karcie technicznej konkretnego produktu; nie wolno łączyć przypadkowych preparatów bez potwierdzenia kompatybilności.",
  "kosztWorkId": "hydroizolacja",
  "kroki": [
    {
      "t": "Wyznacz strefy mokre i zakres uszczelnienia",
      "w": null,
      "txt": "Narysuj na planie podłogę, ściany natrysku, okolice wanny i miejsca narażone na rozbryzgi. Zaznacz połączenia ściana–podłoga, narożniki, przejścia rur oraz odpływ. Nie oceniaj zakresu wyłącznie po wielkości płytek: woda może przedostawać się przez spoiny i szczeliny. Dla prysznica bez brodzika szczególnie ważne jest ciągłe uszczelnienie całej strefy odpływu i poprawnie wykonany spadek podłoża."
    },
    {
      "t": "Sprawdź nośność i wilgotność podłoża",
      "w": null,
      "txt": "Usuń resztki farby, luźne fragmenty tynku, mleczko cementowe i pył. Sprawdź stabilność ściany oraz posadzki. Wilgotne lub uszkodzone podłoże napraw przed izolowaniem; powłoka przeciwwodna nie służy do maskowania aktywnego przecieku. Nowa wylewka i tynk muszą osiągnąć parametry wymagane przez producenta wybranego systemu. Szczególnej uwagi wymagają płyty budowlane i miejsca łączenia różnych materiałów."
    },
    {
      "t": "Wyprofiluj spadek do odpływu w natrysku",
      "w": null,
      "txt": "W prysznicu bez brodzika spadek należy wykonać w stabilnej warstwie podłoża, przed układaniem płytek. Dobierz odpływ do konstrukcji posadzki i sprawdź jego wysokość oraz sposób łączenia z izolacją. Woda nie powinna stać w narożnikach ani tworzyć kałuż obok kratki. Sama fuga ani klej do płytek nie poprawią błędnej geometrii podłogi."
    },
    {
      "t": "Dobierz grunt i przygotuj połączenia",
      "w": "gruntowanie",
      "txt": "Nie każde podłoże wymaga takiego samego gruntu. Chłonny tynk, płyta i beton mogą potrzebować różnych preparatów lub innej technologii przygotowania. Przeczytaj kartę techniczną wybranej masy uszczelniającej, a następnie zagruntuj tylko w sposób przewidziany w systemie. Zaplanuj rozmieszczenie taśm narożnych i mankietów, zanim otworzysz pojemnik z hydroizolacją."
    },
    {
      "t": "Wklej taśmy w narożach i na połączeniach",
      "w": null,
      "txt": "W świeżej pierwszej warstwie materiału osadź dedykowane taśmy w narożach wewnętrznych oraz na styku ściany z podłogą. Stosuj gotowe narożniki systemowe albo wykonuj zakłady zgodnie z instrukcją. Taśm nie należy naciągać na sztywno ani pozostawiać pęcherzy powietrza. Uszczelnienie ma zachować ciągłość również tam, gdzie dwa materiały pracują inaczej pod obciążeniem."
    },
    {
      "t": "Uszczelnij przejścia rur i odpływ",
      "w": "odplyw_liniowy",
      "txt": "Mankiety wokół rur i kołnierz odpływu dobierz do konkretnego systemu hydroizolacji. Połączenie odpływu z izolacją jest jednym z najczęstszych miejsc późniejszego przecieku; nie zastępuj fabrycznego kołnierza samym silikonem. W przypadku odpływu liniowego lub punktowego postępuj również według instrukcji producenta odpływu, szczególnie w kwestii kołnierza uszczelniającego i połączeń mechanicznych."
    },
    {
      "t": "Nałóż pierwszą ciągłą warstwę hydroizolacji",
      "w": "hydroizolacja",
      "txt": "Rozprowadź materiał wałkiem, pędzlem lub pacą zgodnie z dopuszczoną metodą, bez prześwitów oraz suchych miejsc. Nie rozcieńczaj preparatu według uznania i nie zakładaj, że bardzo cienka warstwa zapewni ochronę. Kontroluj zużycie z powierzchni i wymaganej grubości zgodnie z kartą produktu. Po wklejeniu akcesoriów dopilnuj, by izolacja obejmowała ich krawędzie oraz zakłady."
    },
    {
      "t": "Wykonaj kolejną warstwę i zachowaj przerwy technologiczne",
      "w": null,
      "txt": "Kolejną warstwę nakładaj po wymaganym czasie wysychania poprzedniej, nie na mokrą powłokę. Producenci często zalecają zmianę kierunku nakładania, co pomaga uniknąć prześwitów. Liczba warstw oraz minimalna grubość suchej izolacji zależą od konkretnego systemu i warunków użytkowania. Temperatura i wilgotność w pomieszczeniu mogą wydłużyć schnięcie, dlatego nie skracaj przerw, aby przyspieszyć układanie płytek."
    },
    {
      "t": "Skontroluj ciągłość izolacji przed klejeniem płytek",
      "w": null,
      "txt": "Obejrzyj naroża, mankiety, odpływ, połączenia ścian z posadzką i miejsca przejścia elementów montażowych. Niedociągnięcia napraw zgodnie z technologią producenta. Nie zostawiaj pęknięć ani miejsc z odsłoniętym podłożem. Klejenie płytek rozpocznij dopiero po uzyskaniu przez izolację wymaganej gotowości; test zalewowy, jeżeli przewiduje go projekt lub system, wykonuje się według właściwej procedury."
    },
    {
      "t": "Układaj płytki kompatybilnym klejem i zakończ spoiny",
      "w": "plytki_podloga",
      "txt": "Użyj kleju i fugi przeznaczonych do wybranego rodzaju izolacji oraz formatu płytek. Zachowaj dylatacje i szczeliny na styku płaszczyzn; połączenia elastyczne wykonaj odpowiednim materiałem uszczelniającym. Silikon w narożu jest elementem wykończenia i konserwacji, nie zamiennikiem hydroizolacji pod okładziną. Przed uruchomieniem natrysku odczekaj czas wiązania wymagany przez klej i masy spoinujące."
    }
  ],
  "faq": [
    [
      "Czy płytki i fuga wystarczą jako hydroizolacja łazienki?",
      "Nie. Okładzina ceramiczna ogranicza kontakt wody z podłożem, ale spoiny i połączenia nie są same w sobie ciągłą izolacją przeciwwodną. W strefach mokrych należy przewidzieć właściwy system uszczelnienia pod płytkami."
    ],
    [
      "Czy hydroizolację robi się na całej podłodze?",
      "Zakres zależy od układu łazienki i projektu, ale podłoga oraz strefa natrysku wymagają szczególnej uwagi. Uszczelnienie trzeba połączyć szczelnie z narożnikami, odpływem i przejściami rur. Nie wystarczy izolacja tylko widocznych miejsc przy kabinie."
    ],
    [
      "Ile warstw folii w płynie trzeba nałożyć?",
      "Liczba warstw zależy od produktu i wymaganej grubości suchej izolacji. Wiele systemów przewiduje co najmniej dwie warstwy, ale decydujące są zalecenia karty technicznej wybranego materiału, a nie ogólna liczba ruchów wałka."
    ],
    [
      "Ile kosztuje hydroizolacja łazienki za m²?",
      "Orientacyjna stawka za m² znajduje się w cenniku usług uslugiceny.pl i jest rozbita na robociznę oraz materiał. Dodatkowo mogą wystąpić prace przy odpływie, profilowaniu spadków i naprawie podłoża. Wycena całego prysznica nie jest równa cenie samej powłoki."
    ],
    [
      "Czy silikon w narożniku zastąpi taśmę uszczelniającą?",
      "Nie. Silikon jest materiałem do elastycznego wypełniania spoin wykończeniowych, a nie zamiennikiem systemowej taśmy zatopionej w hydroizolacji. Najbardziej krytyczne połączenia należy wykonać jeszcze przed przyklejeniem płytek."
    ]
  ],
  "zrodla": [
    [
      "Sopro — systemy uszczelnień, taśmy i narożniki",
      "https://soprouszczelnienia.pl/"
    ],
    [
      "Renowacja łazienki z Sopro — wykonanie warstwy uszczelnienia",
      "https://budujemydom.pl/irbj/porady/41995-renowacja-lazienki-z-sopro-prace-przed-montazem-okladziny"
    ]
  ],
  "wideo": {"id":"KEidvRbqt3I","title":"ATLAS — hydroizolacja łazienki krok po kroku"}
},
  {
  "slug": "gladz-gipsowa-sciany-krok-po-kroku",
  "h1": "Gładź gipsowa na ścianach krok po kroku",
  "title": `Gładź gipsowa na ścianach ${YEAR}: jak wykonać i ile kosztuje`,
  "desc": "Jak wykonać gładź gipsową na ścianach: przygotowanie podłoża, dobór gruntu, nakładanie kolejnych warstw, szlifowanie, typowe błędy i cennik za m².",
  "lede": "Gładź ma wyrównać drobne nierówności, a nie zastąpić naprawę tynku. Praca zakończy się gładką ścianą tylko wtedy, gdy podłoże jest stabilne i każda warstwa zdąży wyschnąć.",
  "czas": "P3D",
  "wstep": "Poradnik dotyczy typowych suchych pomieszczeń mieszkalnych. Gładzie gipsowe, polimerowe i gotowe masy mają różne wymagania dotyczące podłoża, czasu schnięcia i dopuszczalnej grubości. Korzystaj z karty technicznej konkretnego produktu, zwłaszcza przy płytach g-k i ścianach już malowanych.",
  "kosztWorkId": "gladz",
  "kroki": [
    {
      "t": "Oceń stan ścian przed rozpoczęciem pracy",
      "w": null,
      "txt": "Obejrzyj ścianę przy bocznym oświetleniu. Zaznacz głębokie ubytki, rysy, odparzone fragmenty tynku oraz miejsca, w których stara farba się łuszczy. Sama gładź nie jest materiałem do naprawy poważnych uszkodzeń ani grubego wyrównywania krzywych ścian. W przypadku zawilgocenia najpierw ustal i usuń źródło wody. Jeśli powierzchnia jest równa i zdrowa, pełne szpachlowanie może być zbędne."
    },
    {
      "t": "Zabezpiecz pomieszczenie i przygotuj narzędzia",
      "w": null,
      "txt": "Osłoń podłogę, framugi i osprzęt, zapewnij oświetlenie oraz wentylację odpowiednią do stosowanych materiałów. Przygotuj czyste wiadra, mieszadło, pace i szpachle ze stali nierdzewnej, łatę kontrolną oraz narzędzia do późniejszego szlifowania. Nie wprowadzaj resztek starego związującego materiału do nowej mieszanki — skraca to czas pracy i powoduje grudki widoczne na powierzchni."
    },
    {
      "t": "Usuń luźne powłoki, pył i tłuste zabrudzenia",
      "w": null,
      "txt": "Zeskrob odspajającą się farbę i resztki tapet, napraw uszkodzenia tynku, a powierzchnię dokładnie odkurz. Zatłuszczone miejsca wymagają odpowiedniego oczyszczenia. Zrób próbę przyczepności na starej powłoce, jeśli producent dopuszcza jej pozostawienie. Gładź na ścianie pylącej może odspoić się płatami, nawet jeśli po nałożeniu wyglądała na mocną."
    },
    {
      "t": "Dobierz grunt do chłonności podłoża",
      "w": "gruntowanie",
      "txt": "Świeży tynk, beton, stara farba i płyty g-k nie wymagają identycznego przygotowania. Chłonne podłoże mineralne często trzeba zagruntować środkiem dopasowanym do gładzi, natomiast niektóre czyste płyty g-k według instrukcji danego produktu nie wymagają osobnego gruntowania. Nie nakładaj preparatu przypadkowo ani zbyt obficie. Kontynuuj po uzyskaniu czasu schnięcia wskazanego przez producenta."
    },
    {
      "t": "Zaszpachluj większe rysy i ubytki właściwą masą",
      "w": null,
      "txt": "Otwory po kołkach, bruzdy oraz pęknięcia najpierw napraw odpowiednim produktem, a tam gdzie jest to konieczne zastosuj przewidziane systemowo zbrojenie. Głębokich ubytków nie zapełniaj cienkowarstwową gładzią w jednej grubej warstwie. Przy styku różnych materiałów uwzględnij możliwość ich niezależnej pracy. Dopiero po zakończeniu napraw i wyschnięciu mas można przejść do wygładzania całości."
    },
    {
      "t": "Przygotuj masę zgodnie z kartą techniczną",
      "w": null,
      "txt": "Suchą mieszankę wsypuj do odmierzonej ilości czystej wody i mieszaj w kolejności określonej przez producenta. Gotową masę z wiadra, jeżeli tego wymaga, jedynie rozmieszaj. Nie dolewaj wody do materiału, który zaczął już wiązać. Przygotowuj taką porcję, jaką realnie zdążysz rozprowadzić w czasie użycia podanym na opakowaniu, zamiast zakładać jeden uniwersalny czas dla wszystkich produktów."
    },
    {
      "t": "Rozprowadź pierwszą warstwę gładzi",
      "w": "gladz",
      "txt": "Naciągaj materiał równą pacą w pasach, utrzymując kontrolowany kąt narzędzia i przewidzianą grubość warstwy. Pracuj od narożników i trudnych miejsc do większych płaszczyzn, systematycznie zbierając nadmiar masy. Nie próbuj jednym przejściem ukrywać wszystkich nierówności: to zwiększa zużycie, opóźnia schnięcie i ryzyko pęknięć. W narożnikach stosuj odpowiednie narzędzia, aby nie zaokrąglać przypadkowo krawędzi."
    },
    {
      "t": "Nałóż kolejną warstwę po wymaganym wyschnięciu",
      "w": null,
      "txt": "Nie zakładaj, że poprzednia warstwa wyschła tylko dlatego, że jej powierzchnia jest jasna. Wymagany odstęp zależy od rodzaju masy, grubości, podłoża, temperatury i wilgotności. Producenci gładzi często zalecają kolejną warstwę dopiero po wyschnięciu poprzedniej. Druga warstwa powinna wyrównać ślady prowadzenia pacy i drobne nierówności, a nie przykrywać ukryty problem z przyczepnością."
    },
    {
      "t": "Szlifuj wyschniętą powierzchnię z kontrolą pyłu",
      "w": null,
      "txt": "Szlifuj dopiero suchą gładź, narzędziem oraz gradacją zalecaną przez producenta. Użyj oświetlenia bocznego, aby zobaczyć rysy i zacieki, a do ograniczenia pyłu stosuj szlifierkę z odkurzaczem oraz właściwe środki ochrony dróg oddechowych i oczu. Nie szlifuj agresywnie w jednym miejscu — można odsłonić podłoże. Niewielkie ubytki uzupełnij punktowo i ponownie sprawdź po wyschnięciu."
    },
    {
      "t": "Odpyl ściany i przygotuj je do malowania",
      "w": "malowanie",
      "txt": "Całkowicie usuń pył po szlifowaniu, sprawdź przyczepność i chłonność powierzchni. Gruntowanie przed farbą dobierz do układu gładź–farba i karty technicznej zastosowanych wyrobów; nie każda powłoka wymaga identycznej procedury. Malowanie rozpoczynaj po pełnym wyschnięciu oraz przygotowaniu podłoża. Jeżeli na ścianie występują widoczne rysy w bocznym świetle, poprawki zrób przed pierwszą warstwą farby."
    }
  ],
  "faq": [
    [
      "Ile kosztuje wykonanie gładzi gipsowej za m²?",
      "Orientacyjną cenę gładzi z podziałem na robociznę i materiały podajemy w cenniku uslugiceny.pl. Stawka dotyczy konkretnej pozycji cennikowej; naprawa tynku, gruntowanie lub malowanie mogą być wyceniane osobno. Ceny zależą też od miasta i stanu podłoża."
    ],
    [
      "Czy trzeba gruntować ściany przed gładzią?",
      "To zależy od materiału i podłoża. Chłonne podłoża mineralne często wymagają odpowiedniego gruntu, ale niektóre systemy dopuszczają nakładanie gładzi bez gruntowania na określonych stabilnych powierzchniach. Ostateczna odpowiedź wynika z karty technicznej produktu."
    ],
    [
      "Czy gładź gipsowa nadaje się do bardzo krzywych ścian?",
      "Nie jest przeznaczona do zastępowania grubego tynku. Przy dużych nierównościach trzeba najpierw wykonać naprawę lub wyrównanie odpowiednią zaprawą, a dopiero potem gładź wykończeniową w dopuszczalnej grubości."
    ],
    [
      "Kiedy można szlifować gładź?",
      "Po wyschnięciu warstwy, zgodnie z instrukcją wybranego produktu. Czas zależy od grubości, temperatury, wilgotności i chłonności podłoża. Szlifowanie jeszcze wilgotnej masy zwykle pogarsza wykończenie i utrudnia kontrolę równości."
    ],
    [
      "Czy po gładzi można od razu malować?",
      "Przed malowaniem gładź musi całkowicie wyschnąć, zostać odpylona i odpowiednio przygotowana do konkretnej farby. Często stosuje się preparat gruntujący lub farbę podkładową według technologii producenta. Malowanie na wilgotnej powierzchni może powodować późniejsze problemy z powłoką."
    ]
  ],
  "zrodla": [
    [
      "Knauf MP Finish — produkt i zastosowanie",
      "https://knauf.com/pl-PL/p/produkt/knauf-mp-finish-21072_0120"
    ]
  ],
  "wideo": {"id":"_exjjSTuE3M","title":"Knauf — nakładanie gładzi wałkiem"}
},
  ...EXTRA_PORADNIKI,
];

export function poradnikPage({ p, byId, units, unitPrice, catSlug, slugify, podlinkuj = (x) => x, ileKosztuje = '' }) {

  const cenaZaRobote = p.kosztWorkId && byId[p.kosztWorkId];
  const stawka = cenaZaRobote ? unitPrice(cenaZaRobote.id, 1, 1, cenaZaRobote.perCm ? 5 : 1) : null;
  const kosztZCennika = stawka && !ileKosztuje
    ? '<h2 style="margin-top:2.2rem">Ile kosztuje ta praca</h2>' +
      '<p class="section-note">Orientacyjna stawka krajowa za ' + units[cenaZaRobote.unit].name +
      (cenaZaRobote.perCm ? ' przy warstwie 5 cm' : '') + ': <strong>' + money(Math.round(stawka.labour + stawka.material)) + ' zł</strong> (' +
      money(Math.round(stawka.labour)) + ' zł robocizny i ' +
      (stawka.material ? money(Math.round(stawka.material)) + ' zł materiału' : 'cena materiałów lub produktu nie jest wliczona') + '). To cena za samą pozycję, bez dodatkowych prac przygotowawczych. Porównaj warianty dla miast na <a href="' +
      R + catSlug(cenaZaRobote.cat) + '/' + slugify(cenaZaRobote.name) + '/">stronie usługi</a>.</p>'
    : '';

  // Wykres korzysta z tej samej stawki co cennik i nie wymaga aktualizowania ręcznie.
  const sumaWykresu = stawka ? stawka.labour + stawka.material : 0;
  const procentPracy = sumaWykresu > 0 ? Math.max(0, Math.min(100, stawka.labour / sumaWykresu * 100)) : 0;
  const kosztWykres = sumaWykresu > 0 && cenaZaRobote
    ? `<figure class="guide-cost-visual">
      <figcaption>Robocizna i materiały — struktura ceny orientacyjnej za ${units[cenaZaRobote.unit].name}${cenaZaRobote.perCm ? ' przy warstwie 5 cm' : ''}</figcaption>
      <div class="guide-cost-bar" role="img" aria-label="Robocizna ${money(Math.round(stawka.labour))} zł, materiały ${money(Math.round(stawka.material))} zł">
        <span class="guide-cost-fill" style="width:${procentPracy.toFixed(1)}%"></span>
      </div>
      <div class="guide-cost-legend">
        <span><i class="guide-cost-marker labour"></i>Robocizna <strong>${money(Math.round(stawka.labour))} zł</strong></span>
        <span><i class="guide-cost-marker material"></i>Materiały <strong>${money(Math.round(stawka.material))} zł</strong>${!stawka.material ? ' — poza wyceną' : ''}</span>
      </div>
      <p class="guide-cost-disclaimer">Ceny orientacyjne. Zakres i ilości materiałów uzgodnij z wykonawcą.</p>
    </figure>`
    : '';

  // To te same stawki i współczynniki, które napędzają miejskie strony cennika.
  // Dzięki temu zestawienie nie wymaga ręcznych aktualizacji kwot w artykułach.
  const stawkiMiast = cenaZaRobote ? MIASTA.map((city) => {
    const price = unitPrice(cenaZaRobote.id, city.coef, 1, cenaZaRobote.perCm ? 5 : 1);
    return { city, amount: Math.round(price.labour + price.material) };
  }).sort((a, b) => a.amount - b.amount) : [];
  const stawkaMax = Math.max(1, ...stawkiMiast.map((x) => x.amount));
  const wykresMiast = stawkiMiast.length
    ? `<section class="guide-city-prices" aria-labelledby="guide-city-prices-${p.slug}">
      <h2 id="guide-city-prices-${p.slug}">Porównanie ceny w 10 miastach</h2>
      <p class="section-note">Orientacyjna kwota za ${units[cenaZaRobote.unit].name}${cenaZaRobote.perCm ? ' dla warstwy 5 cm' : ''}, obejmująca zakres z jednej pozycji cennika. Kliknij miasto, aby zobaczyć czynniki wpływające na wycenę i zakres robót.</p>
      <div class="guide-city-prices-rows">${stawkiMiast.map(({ city, amount }) => `<div class="guide-city-prices-row">
        <a href="${R}${catSlug(cenaZaRobote.cat)}/${slugify(cenaZaRobote.name)}/${city.slug}/">${city.name}</a>
        <span class="guide-city-prices-track" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, amount / stawkaMax * 100)).toFixed(1)}%"></span></span>
        <strong>${money(amount)} zł</strong>
      </div>`).join('')}</div>
      <p class="guide-city-prices-note">Różnica między najniższą i najwyższą stawką: <b>${money(stawkiMiast.at(-1).amount - stawkiMiast[0].amount)} zł</b>. Stawki mają charakter orientacyjny, a ceny materiałów i robocizny są liczone według tej samej metodologii co na stronach lokalnych. <a href="${R}jak-liczymy/">Jak liczymy ceny?</a></p>
    </section>`
    : '';

  const maFoto = Boolean(photoForGuide(p.slug));
  const narzedzia = NARZEDZIA_PORADNIKA[p.slug] || [['kalkulator/remont-mieszkania/', 'Kalkulator remontu mieszkania']];
  const linkiNastepne = narzedzia.map(([path, name]) => '<a href="' + R + path + '">' + name + '</a>').join(' lub ');
  // Podpowiedzi z tej samej tematyki wynikają ze wspólnych pozycji cennika.
  // Minimum dwa wspólne etapy ogranicza przypadkowe linki (np. samo gruntowanie).
  const aktualnePrace = new Set(p.kroki.map((k) => k.w).filter(Boolean));
  const zwiazane = PORADNIKI.filter((kandydat) => kandydat.slug !== p.slug)
    .map((kandydat) => {
      const powiazanePrace = new Set(kandydat.kroki.map((k) => k.w).filter(Boolean));
      const wspolne = [...aktualnePrace].filter((id) => powiazanePrace.has(id)).length;
      return { kandydat, wspolne };
    })
    .filter((x) => x.wspolne >= 2)
    .sort((a, b) => b.wspolne - a.wspolne || a.kandydat.slug.localeCompare(b.kandydat.slug, 'pl'))
    .slice(0, 3);
  const innePoradniki = zwiazane.length
    ? '<h2 style="margin-top:2.5rem">Powiązane poradniki</h2><ul class="factors">' +
      zwiazane.map(({ kandydat }) => '<li><a href="' + R + 'poradnik/' + kandydat.slug + '/">' +
        kandydat.h1 + '</a></li>').join('') + '</ul>'
    : '';
  // Nawigacja do czterech kluczowych momentów prac, bez długiego spisu treści.
  const krokiNawigacji = [...new Set([0, Math.floor((p.kroki.length - 1) / 3), Math.floor(2 * (p.kroki.length - 1) / 3), p.kroki.length - 1])];
  const szybkaNawigacja = `<nav class="guide-step-nav" aria-label="Skróty do etapów">
    <p class="guide-step-nav-title">Przejdź do etapu</p>
    <div class="guide-step-nav-items">${krokiNawigacji.map((idx) => `<a href="#etap-${idx + 1}" class="guide-step-jump">
    <span>${String(idx + 1).padStart(2, '0')}</span><b>${p.kroki[idx].t}</b>
    </a>`).join('')}</div>
  </nav>`;

  const kroki = p.kroki.map((k) => {
    if (!k.w) return { ...k, cena: null };
    const w = byId[k.w];
    const pr = unitPrice(k.w, 1, 1, w.perCm ? 5 : 1);
    return {
      ...k,
      cena: Math.round(pr.labour + pr.material),
      nazwa: w.name,
      jedn: units[w.unit].name + (w.perCm ? ' (warstwa 5 cm)' : ''),
      link: `${R}${catSlug(w.cat)}/${slugify(w.name)}/`,
    };
  });

  return layout({
    title: p.title,
    description: p.desc,
    path: `/poradnik/${p.slug}/`,
    breadcrumb: [{ name: 'Cennik', path: '/' }, { name: 'Poradniki', path: '/poradnik/' }, { name: p.h1 }],
    body: `
<section><div class="wrap">
  <p class="eyebrow">Poradnik${p.opracowano ? ` · opracowano ${p.opracowano}` : ""} · dane cenowe ${SITE.updated}</p>
  <h1>${p.h1}</h1>
  <p class="lede">${p.lede}</p>
  <p class="section-note">${p.wstep}</p>
  ${fotoPoradnika(p)}
  ${maFoto ? '' : grafikaPoradnika(p)}
  ${szybkaNawigacja}

  <ol class="kroki">
    ${kroki.map((k, i) => `
    <li id="etap-${i + 1}">
      <span class="krok-nr">${String(i + 1).padStart(2, '0')}</span>
      <div class="krok-tresc">
        <h2>${k.t}</h2>
        <p>${podlinkuj(k.txt)}</p>
        ${k.cena ? `<p class="krok-cena"><a href="${k.link}">${k.nazwa}</a> <b>${money(k.cena)} zł</b> za ${k.jedn}</p>` : '<p class="krok-cena">Etap bez osobnej pozycji w cenniku; koszt zależy od zakresu.</p>'}
      </div>
    </li>${maFoto && i === Math.min(2, kroki.length - 1) ? grafikaPoradnika(p) : ''}`).join('')}
  </ol>

  ${p.wideo ? `<h2 style="margin-top:2.4rem">Film instruktażowy producenta</h2>
  <div style="aspect-ratio:16/9;max-width:850px"><iframe loading="lazy" title="${p.wideo.title}" src="https://www.youtube-nocookie.com/embed/${p.wideo.id}" style="width:100%;height:100%;border:0" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
  <p class="section-note">Film dotyczy konkretnego systemu producenta. Przed montażem sprawdź instrukcję swojego modelu.</p>` : ''}
  ${ileKosztuje}
  ${kosztZCennika}
  ${kosztWykres}
  ${wykresMiast}

  ${p.zrodla?.length ? `<h2 style="margin-top:2.5rem">Podstawy technologiczne i dokumentacja</h2>
  <p class="section-note">Opis jest poradnikiem ogólnym. Przy wykonaniu prac obowiązują instrukcje i karty techniczne zastosowanego systemu.</p>
  <ul class="factors">${p.zrodla.map(([n, url]) => `<li><a href="${url}" rel="noopener noreferrer">${n}</a></li>`).join('')}</ul>` : ''}

  <h2 style="margin-top:2.5rem">Częste pytania</h2>
  ${p.faq.map(([q, a]) => `<h3 style="margin:1.2rem 0 .3rem">${q}</h3><p class="section-note">${a}</p>`).join('')}

  <p class="guide-back-top"><a href="#etap-1">Wróć do początku etapów ↑</a></p>
  ${innePoradniki}

  <p class="receipt-foot" style="margin-top:1.6rem">Przydatne narzędzia i cenniki: ${linkiNastepne}.</p>
</div></section>`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: p.h1,
        description: p.desc,
        image: SITE.url('/' + guideImage(p.slug)),
        inLanguage: 'pl',
        totalTime: p.czas,
        step: kroki.map((k, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: k.t,
          text: k.txt,
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: 'pl',
        mainEntity: p.faq.map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  });
}

export function poradnikiIndex(list) {
  return layout({
    title: `Poradniki remontowe ${YEAR}`,
    description: `Poradniki remontowe krok po kroku: ${list.length} instrukcji o łazience, ścianach, podłogach, dachu, elewacji i instalacjach z cenami i kalkulatorami.`,
    path: '/poradnik/',
    breadcrumb: [{ name: 'Cennik', path: '/' }, { name: 'Poradniki' }],
    body: `
<section><div class="wrap">
  <h1>Poradniki remontowe krok po kroku</h1>
  <p class="lede">${list.length} szczegółowych poradników po polsku: ściany, łazienka, podłogi, dach, elewacje i instalacje. Każdy prowadzi przez kolejność prac, typowe błędy i powiązane stawki z cennika oraz kalkulatory.</p>
  <h2 style="margin-top:1.8rem">Dostępne poradniki</h2>
  <div class="cards">
    ${list.map((p) => `<div class="card guide-card">${grafikaPoradnika(p, true)}<h3><a href="${R}poradnik/${p.slug}/">${p.h1}</a></h3><p>${p.lede}</p></div>`).join('')}
  </div>
</div></section>`,
  });
}
