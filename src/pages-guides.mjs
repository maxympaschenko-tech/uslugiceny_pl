// Poradniki krok po kroku. Inny typ zapytania niż cennik: użytkownik nie liczy
// jeszcze pieniędzy, tylko próbuje zrozumieć kolejność prac. Każdy etap ma
// przypiętą pozycję z cennika, więc poradnik prowadzi wprost do kalkulatora.
import { layout, money } from './templates.mjs';
import { SITE } from './config.mjs';

const R = SITE.root;
const YEAR = new Date().getFullYear();

export const PORADNIKI = [
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
      { t: 'Układanie płytek', w: 'plytki_sciana', txt: 'Najpierw ściany, potem podłoga, choć część ekip robi odwrotnie i obie kolejności są poprawne. Płytki układa się od najbardziej widocznej ściany, żeby docinki wypadły w narożnikach zasłoniętych przez wyposażenie. Fugowanie po pełnym związaniu kleju.' },
      { t: 'Biały montaż', w: 'montaz_wc', txt: 'Wanna albo kabina, WC, umywalka, baterie, grzejnik drabinkowy i podłączenie pralki. Dopiero na tym etapie widać, czy punkty wodne wypadły dokładnie tam, gdzie powinny.' },
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
      { t: 'Demontaże i wyburzenia', w: 'skucie_tynkow', txt: 'Zdjęcie starych podłóg, skucie tynków tam, gdzie odparzone, wyburzenie ścianek działowych i wywóz gruzu. Wszystko, co brudne i głośne, robi się na początku i zamyka jednym kontenerem.' },
      { t: 'Instalacje: elektryka i hydraulika', w: 'punkt_elektryczny', txt: 'Bruzdowanie, nowe obwody, rozdzielnica, punkty wodno-kanalizacyjne. Etap wykonywany na surowych ścianach, bo później każde przesunięcie gniazda oznacza kucie w gotowej powierzchni. Warto tu przewidzieć więcej punktów, niż wydaje się potrzebne.' },
      { t: 'Ścianki działowe i zabudowy', w: 'scianka_gk', txt: 'Nowe ścianki z płyt gipsowo-kartonowych, zabudowy pionów i sufity podwieszane. Robi się je po instalacjach, żeby przewody schowały się w konstrukcji.' },
      { t: 'Tynki i wyrównanie ścian', w: 'tynk_gipsowy', txt: 'Tynk gipsowy maszynowy na ścianach wymagających wyrównania. Etap mokry, po którym mieszkanie musi być intensywnie wietrzone. Wilgoć z tynków potrafi zniszczyć wcześniej ułożone podłogi, dlatego kolejność jest tu nienegocjowalna.' },
      { t: 'Wylewka podłogowa', w: 'wylewka_cem', txt: 'Izolacja, dylatacje i nowa wylewka. Najdłuższy przestój całego remontu: wylewka cementowa potrzebuje mniej więcej tygodnia na każdy centymetr grubości, zanim można na niej układać okładziny. Tego terminu nie da się skrócić nagrzewnicą.' },
      { t: 'Hydroizolacja i płytki w strefach mokrych', w: 'plytki_podloga', txt: 'Łazienka i kuchnia. Płytki układa się przed gładziami w pozostałych pomieszczeniach, bo cięcie gresu produkuje pył, który osiada na wszystkim w promieniu kilku metrów.' },
      { t: 'Gładzie i gruntowanie', w: 'gladz', txt: 'Dwuwarstwowa gładź ze szlifowaniem i gruntowanie przed malowaniem. Drugi najbardziej pylący etap remontu, po którym mieszkanie trzeba dokładnie odkurzyć.' },
      { t: 'Pierwsze malowanie', w: 'malowanie', txt: 'Pierwsza warstwa farby przed montażem podłóg. Łatwiej pomalować ściany, gdy na podłodze jest jeszcze surowa wylewka, niż zabezpieczać świeże panele folią.' },
      { t: 'Podłogi i listwy', w: 'panele', txt: 'Panele albo deska, po sprawdzeniu wilgotności wylewki miernikiem, a nie na oko. Ułożenie okładziny na niewyschniętym podkładzie kończy się falowaniem po kilku miesiącach.' },
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
      { t: 'Parapety wewnętrzne i zewnętrzne', w: 'montaz_parapetu_wew', txt: 'Parapet zewnętrzny z wyprowadzeniem poza lico ściany i podniesieniem pod ramę, wewnętrzny z uszczelnieniem styku. Nieszczelność pod parapetem to najczęstsza przyczyna skroplin i pleśni w narożniku okna.' },
    ],
    faq: [
      ['Ile trwa wymiana okien w mieszkaniu?', 'Sam montaż to zwykle jeden dzień na kilka okien. Obróbka ościeży i malowanie dochodzą następnego dnia, po związaniu pianki, więc całość zamyka się w dwóch albo trzech dniach.'],
      ['Czy montaż na samą piankę jest dozwolony?', 'Przepisy nie zakazują pianki wprost, ale wymagania dotyczące szczelności połączenia okna ze ścianą sprawiają, że montaż bez taśm jest dziś traktowany jako błąd w sztuce budowlanej. Może też być podstawą do odrzucenia reklamacji.'],
      ['Kiedy najlepiej wymieniać okna?', 'Od wiosny do wczesnej jesieni, przy temperaturze powyżej pięciu stopni, bo pianki montażowe mają określony zakres pracy. Zimą wymiana jest możliwa, ale wymaga materiałów zimowych i szybszego tempa.'],
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
      { t: 'Układanie kostki', w: 'kostka_brukowa', txt: 'Praca od krawędzi, zawsze z gotowej nawierzchni, nie z podsypki. Zachowuje się fugi dwóch do trzech milimetrów: kostka musi mieć luz na pracę, bo ułożona na styk pęka przy krawędziach. Docinki wykonuje się na końcu.' },
      { t: 'Zamulanie spoin i wibrowanie', w: null, txt: 'Zamiecenie piasku w fugi, przewibrowanie całości płytą z osłoną gumową, potem ponowne zamulenie. Spoiny wypełnia się dwukrotnie, bo po pierwszym wibrowaniu piasek osiada.' },
      { t: 'Schody i wykończenia', w: 'schody_zewnetrzne', txt: 'Stopnie, obrzeża trawnika, uzupełnienie gruntu wzdłuż krawędzi. Nawierzchni nie obciąża się samochodem przez pierwsze dni, aż spoiny się ustabilizują.' },
    ],
    faq: [
      ['Jaka grubość kostki na podjazd?', 'Pod samochód osobowy stosuje się kostkę ośmiocentymetrową, sześciocentymetrowa nadaje się tylko na ścieżki i tarasy. Różnica w cenie materiału jest niewielka, różnica w trwałości ogromna.'],
      ['Ile trwa ułożenie kostki na podjeździe?', 'Przy powierzchni około sześćdziesięciu metrów liczy się zwykle od pięciu do siedmiu dni roboczych, z czego połowa przypada na korytowanie i podbudowę.'],
      ['Czy kostkę można układać zimą?', 'Nie przy przemarzniętym gruncie, bo zagęszczenie podbudowy jest wtedy pozorne i po odwilży nawierzchnia osiada. Sezon trwa zwykle od kwietnia do października.'],
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
      { t: 'Dobór mocy i miejsca montażu', w: null, txt: 'Moc dobiera się do kubatury, nasłonecznienia i liczby okien, a nie na oko. Jednostkę wewnętrzną planuje się tak, żeby strumień powietrza nie szedł prosto na łóżko ani biurko, a zewnętrzną tam, gdzie da się ją serwisować i gdzie nie będzie hałasować sąsiadowi pod oknem.' },
      { t: 'Zgoda wspólnoty', w: null, txt: 'W bloku elewacja jest częścią wspólną, więc montaż jednostki zewnętrznej wymaga zgody wspólnoty albo spółdzielni. Warto ją uzyskać przed zamówieniem sprzętu, bo odmowa po zakupie oznacza szukanie zupełnie innego rozwiązania.' },
      { t: 'Trasa chłodnicza', w: null, txt: 'Wytyczenie drogi rur miedzianych, przewodu zasilającego i odprowadzenia skroplin. Podtynkowo wygląda lepiej, ale wymaga kucia bruzd, więc robi się to przed wykończeniem ścian. Natynkowo jest taniej i szybciej, za to widać korytko.' },
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
      { t: 'Klejenie płyt izolacji', w: 'ocieplenie_styropian', txt: 'Płyty układa się mijankowo, jak cegły, z pełnym przewiązaniem w narożnikach. Szczeliny między płytami wypełnia się wyłącznie klinami z tej samej izolacji, nigdy pianą montażową, która ma inną rozszerzalność i wypycha tynk.' },
      { t: 'Kołkowanie', w: null, txt: 'Po związaniu kleju, zwykle po dwóch dobach, płyty mocuje się dodatkowo kołkami. Liczba kołków na metr zależy od wysokości budynku i strefy wiatrowej, a przy wełnie jest wyraźnie większa niż przy styropianie.' },
      { t: 'Warstwa zbrojona z siatką', w: 'siatka_zbrojaca', txt: 'Siatka zatapiana w kleju, z podwójnym zbrojeniem w strefie cokołu i ukośnymi pasami nad narożnikami okien. To właśnie tam pojawiają się rysy, jeśli ktoś ten detal pominie.' },
      { t: 'Gruntowanie pod tynk', w: 'gruntowanie', txt: 'Podkład tynkarski wyrównuje chłonność warstwy zbrojonej i zwykle jest barwiony w kolorze przyszłego tynku, żeby prześwity nie rzucały się w oczy.' },
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
      { t: 'Montaż pokrycia', w: 'blachodachowka', txt: 'Układanie od okapu, z zachowaniem zakładów i kolejności wynikającej z kierunku wiatrów. Przy dachu wielospadowym moduły dają wyraźnie mniej odpadu niż arkusze cięte na wymiar.' },
      { t: 'Obróbki blacharskie', w: 'obrobki_blacharskie', txt: 'Kominy, kosze, okna dachowe i połączenia ze ścianami. To najczęstsze miejsce przecieków w całym dachu, więc etap, na którym nie ma sensu oszczędzać ani przyspieszać.' },
      { t: 'Rynny i rury spustowe', w: 'rynny', txt: 'System rynnowy ze spadkiem w stronę rur spustowych i odprowadzeniem wody z dala od fundamentów. Zdecydowana większość reklamacji dachowych bierze się z niesprawnego odprowadzenia wody, a nie z samego pokrycia.' },
      { t: 'Okna dachowe i kominki wentylacyjne', w: 'okno_dachowe', txt: 'Osadzenie okien z kołnierzem dobranym do rodzaju pokrycia oraz kominki wentylacyjne w liczbie wynikającej z powierzchni połaci.' },
      { t: 'Podbitka i ocieplenie poddasza', w: 'ocieplenie_poddasza', txt: 'Podbitka okapu z kratkami wentylacyjnymi, a od środka wełna w dwóch krzyżowych warstwach i szczelna paroizolacja. Nieszczelna folia od strony pomieszczeń zawilgaca wełnę i po kilku sezonach ocieplenie przestaje działać.' },
    ],
    faq: [
      ['Ile trwa wymiana dachu 150 m²?', 'Sama wymiana pokrycia to zwykle od siedmiu do dziesięciu dni roboczych dla ekipy trzech albo czterech dekarzy. Wymiana więźby albo ocieplenie poddasza wydłużają ten czas o kolejny tydzień.'],
      ['Czy wymiana dachu wymaga pozwolenia?', 'Wymiana pokrycia na takie samo wymaga zgłoszenia w urzędzie gminy. Pozwolenie na budowę jest potrzebne dopiero przy zmianie geometrii dachu, kąta nachylenia lub dodaniu lukarn.'],
      ['Co zrobić z eternitem?', 'Eternit zawiera azbest i podlega osobnej procedurze demontażu i utylizacji przez uprawnioną firmę. Wiele gmin prowadzi programy, które pokrywają koszt zdjęcia i wywozu, więc przed zleceniem prac warto zapytać w urzędzie.'],
    ],
  },
];

export function poradnikPage({ p, byId, units, unitPrice, catSlug, slugify }) {
  const kroki = p.kroki.map((k) => {
    if (!k.w) return { ...k, cena: null };
    const w = byId[k.w];
    const pr = unitPrice(k.w, 1, 1, w.perCm ? 5 : 1);
    return {
      ...k,
      cena: Math.round(pr.labour + pr.material),
      nazwa: w.name,
      jedn: units[w.unit].name,
      link: `${R}${catSlug(w.cat)}/${slugify(w.name)}/`,
    };
  });

  return layout({
    title: p.title,
    description: p.desc,
    path: `/poradnik/${p.slug}/`,
    breadcrumb: `<a href="${R}">Cennik</a> · <a href="${R}poradnik/">Poradniki</a> · ${p.h1}`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Poradnik · aktualizacja ${SITE.updated}</p>
  <h1>${p.h1}</h1>
  <p class="lede">${p.lede}</p>
  <p class="section-note">${p.wstep}</p>

  <ol class="kroki">
    ${kroki.map((k, i) => `
    <li>
      <span class="krok-nr">${String(i + 1).padStart(2, '0')}</span>
      <div class="krok-tresc">
        <h2>${k.t}</h2>
        <p>${k.txt}</p>
        ${k.cena ? `<p class="krok-cena"><a href="${k.link}">${k.nazwa}</a> <b>${money(k.cena)} zł</b> za ${k.jedn}</p>` : '<p class="krok-cena">Etap bez robocizny: koszt zależy od tego, co kupisz.</p>'}
      </div>
    </li>`).join('')}
  </ol>

  <h2 style="margin-top:2.5rem">Częste pytania</h2>
  ${p.faq.map(([q, a]) => `<h3 style="margin:1.2rem 0 .3rem">${q}</h3><p class="section-note">${a}</p>`).join('')}

  <p class="receipt-foot" style="margin-top:1.6rem">Policz swój zakres: <a href="${R}kalkulator/lazienka/">kalkulator łazienki</a>, <a href="${R}kalkulator/remont-mieszkania/">kalkulator remontu mieszkania</a>.</p>
</div></section>`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: p.h1,
        description: p.desc,
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
    description: 'Kolejność prac przy remoncie mieszkania i łazienki: co po czym, ile trwa każdy etap i ile kosztuje.',
    path: '/poradnik/',
    breadcrumb: `<a href="${R}">Cennik</a> · Poradniki`,
    body: `
<section><div class="wrap">
  <h1>Poradniki</h1>
  <p class="lede">Kolejność prac decyduje o kosztach bardziej niż wybór ekipy. Etap zrobiony nie w porę trzeba powtórzyć.</p>
  <div class="cards" style="margin-top:1.4rem">
    ${list.map((p) => `<div class="card"><h3><a href="${R}poradnik/${p.slug}/">${p.h1}</a></h3><p>${p.lede}</p></div>`).join('')}
  </div>
</div></section>`,
  });
}
