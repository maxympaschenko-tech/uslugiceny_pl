# uslugiceny.pl — baza cen robót remontowych

Statyczna strona z cenami robót remontowych w 10 największych miastach Polski
oraz kalkulatorami, które zwracają kosztorys pozycja po pozycji, a nie jedną kwotę.

Cały projekt jest po polsku: treść, adresy URL, dane, komentarze w kodzie i ta dokumentacja.

**Stos:** czysty Node.js, zero zależności. Generator `build.mjs` składa `dist/` w około sekundę.
Bez `npm install`, bez frameworka, który trzeba będzie aktualizować. Wdrożenie na GitHub Pages
przez Actions.

## Uruchomienie

```bash
node build.mjs        # budowa do dist/
npm run dev           # budowa + lokalny serwer na http://localhost:4321
```

Zmienne środowiskowe:

| Zmienna | Do czego | Przykład |
|---|---|---|
| `SITE_URL` | adresy kanoniczne i sitemap | `https://kosztorys.pl` |
| `BASE_PATH` | prefiks ścieżek, gdy strona stoi w podkatalogu | `/kosztorys-pl/` |

Domyślnie `SITE_URL` to `https://uslugiceny.pl`, więc lokalnie nic nie trzeba ustawiać.

## Zasada: liczby wymagają zdania

Serwis pokazuje dużo liczb i przez długi czas na tym poprzestawał. Wykres cen
w miastach, tabela składników, przedział od-do: wszystko poprawne, a czytelnik
i tak zostawał z pytaniem „i co z tego".

Dlatego każdy typ strony kończy się zdaniem wyliczonym z danych, które
odpowiada na to pytanie:

| Strona | Zdanie |
|---|---|
| usługa | skąd bierze się rozrzut między miastami |
| usługa w mieście | dlaczego akurat tyle i gdzie jest najtaniej |
| cennik miasta | ile to znaczy w złotówkach na mieszkaniu 50 m² |
| metraż | która część budżetu jest największa |
| porównanie | ile wynosi różnica przy typowym zakresie |
| poradnik | w jaką sumę składają się opisane etapy |
| kategoria | czy negocjuje się stawkę ekipy, czy wybiera produkt |

Zdanie musi wynikać z danych, nie z szablonu. Test jest prosty: jeśli to samo
zdanie pasuje do wylewki i do montażu wanny, to nie mówi nic o żadnej z nich.

## Zasada: grafika albo pokazuje coś ponad liczby, albo znika

Trzy elementy graficzne wyleciały albo zostały przerobione, bo tego nie robiły:

- **wykres słupkowy cen w miastach**: przy rozpiętości 33–48 zł na skali od zera
  wszystkie słupki wyglądały tak samo. Zastąpiony skalą z dziesięcioma punktami,
  na której widać, że miasta układają się w dwie grupy
- **pasek robocizna-materiał** przy pozycjach bez materiału: jednolity, zero
  informacji. Znika z 374 stron
- **linijka pod przedziałem cen**: znacznik stał zawsze pośrodku niezależnie od
  danych. Teraz stoi tam, gdzie średnia leży w przedziale, co pokazuje asymetrię
  rozkładu

## Progi jakości

Progi są w `audyt.py`, nie w workflow. Skrypt sam kończy się kodem błędu, gdy
któryś zostanie przekroczony, więc CI nie potrzebuje osobnego kroku z bashem.

Powód jest praktyczny: edytor GitHuba przy dłuższych plikach zapisuje tylko
załadowaną część i ucina resztę. Dwa razy uszkodził tak krok z progami, za
każdym razem niezauważalnie, bo w edytorze plik wyglądał na kompletny. Logika
w pliku wersjonowanym przez git jest odporna na ten problem.

## Odmiana w tekstach generowanych

Polska odmiana to najczęstsze źródło błędów w tym projekcie: wracała sześć razy,
w tytułach, opisach, pytaniach, wyjaśnieniach i w kodzie działającym w przeglądarce.
Schemat zawsze ten sam: generator skleja przyimek z nazwą w mianowniku.

Zasady, które to zamykają:

- **Nazwa miasta nigdy nie jest sklejana z przyimkiem.** W `cities.json` jest pole
  `loc` z gotowym miejscownikiem (`w Warszawie`, `we Wrocławiu`, `w Łodzi`) i to
  ono trafia do tekstu. Dotyczy też danych przekazywanych do przeglądarki.
- **Nazwa roboty zostaje w mianowniku.** Zdania buduje się wokół niej, zamiast ją
  odmieniać: „Płytki na ścianie w Krakowie: jaka jest cena?" zamiast „Ile kosztuje
  płytki...".
- **Hasła słownika mają listę form.** Pole piąte we wpisie zawiera odmiany, pod
  którymi pojęcie występuje w tekstach, bo „więźba dachowa" w słowniku i „więźby"
  w poradniku to dla wyszukiwania dwa różne ciągi.

Sprawdzenie po zmianie: `grep -rE '\bw (Warszawa|Kraków|Łódź)' dist/` powinno
zwracać zero trafień.

## Powtarzalność treści

Przy tysiącu stron z jednego szablonu łatwo nie zauważyć, że jakieś zdanie stoi
identycznie na kilkuset z nich. `narzedzia/powtorzenia.py` pokazuje listę
najczęściej powtarzanych zdań razem z tym, na ilu procentach stron występują.

Zasada, według której oceniam wynik: **rada może się powtarzać, opis pozycji nie**.
Zdanie o tym, jak porównywać oferty, jest takie samo dla wylewki i dla montażu
wanny, bo dotyczy sposobu czytania kosztorysu. Zdanie o tym, co obejmuje stawka,
musi być liczone z danych tej pozycji, inaczej nie mówi nic o żadnej z nich.

Tak powstały odpowiedzi podające kwotę i udział materiału zamiast jednego zdania
powtórzonego 781 razy oraz wyjaśnienie różnicy między miastami z konkretną
rozpiętością zamiast tego samego tekstu na 340 stronach.

## Znak marki

Trzy słupki jako poziomy standardu: ekonomiczny, standardowy i premium, środkowy
w kolorze sygnałowym. Nawiązuje do tego, czym serwis operuje na każdej stronie,
i pozostaje czytelny przy 16 px.

| Element | Gdzie |
|---|---|
| SVG w nagłówku i stopce | `ZNAK()` w `src/templates.mjs` |
| ikony, favicon, obraz udostępnień | `narzedzia/ikony.py` |
| kolory słupków | klasy `.s-tlo` i `.s-akcent` w `style.css` |

Kwadrat znaku dziedziczy kolor tekstu (`currentColor`), więc w ciemnej stopce robi
się biały. Dlatego słupki mają własne klasy i na ciemnym tle przemalowują się na
grafit: bez tego biały znak na białym tle znikał i zostawał sam żółty słupek.

Zmiana geometrii wymaga poprawki w **dwóch** miejscach: w `ZNAK()` oraz w stałej
`SLUPKI` w skrypcie ikon. Po zmianie uruchom `python3 narzedzia/ikony.py`
i obejrzyj wynik, bo błędy w znaku są wyłącznie wizualne i żadna z kontroli
ich nie wychwyci.

## Waga stron

Kod liczący kosztorys jest w `/assets/kalkulator.js`, wspólnym dla całego serwisu,
a nie wklejany do każdej strony. Do przeglądarki trafiają tylko te pola pozycji,
których używa kalkulator: nazwa, jednostka, stawki i adres strony. Czynniki cenowe,
znaczniki weryfikacji i opisy kategorii służą generowaniu stron i zostają po stronie
buildu.

| Strona | Przed | Po |
|---|---|---|
| kalkulator | 81 kB | 38 kB |
| strona główna | 86 kB | 51 kB |
| katalog `dist` | 32 MB | 25 MB |

Uwaga przy zmianach: skrypty stron są owinięte w `DOMContentLoaded`, bo zewnętrzny
plik z `defer` wykonuje się dopiero po sparsowaniu dokumentu. Kod wstawiony poza tym
opakowaniem nie znajdzie funkcji silnika.

## Wdrożenie

Strona jedzie na własny hosting przez FTP, workflow `.github/workflows/deploy-ftp.yml`
uruchamia się przy każdym pushu na `main`.

### Hosting

| Parametr | Wartość |
|---|---|
| Dostawca | ukraine.com.ua, panel adm.tools, konto `uageek` |
| Serwer WWW | Apache (czyli `.htaccess` działa) |
| Katalog strony | `/home/uageek/uslugiceny.pl/www/` |
| Host FTP | `uageek.ftp.tools`, port 21 |
| Ograniczenie FTP po IP | wyłączone (musi takie zostać, bo runnery GitHuba mają zmienne IP) |

### Sekrety w repozytorium

Settings → Secrets and variables → Actions → Secrets:

| Sekret | Wartość |
|---|---|
| `FTP_SERVER` | `uageek.ftp.tools` |
| `FTP_USERNAME` | osobny użytkownik FTP, np. `uageek_uslugiceny` |
| `FTP_PASSWORD` | hasło tego użytkownika |
| `FTP_DIR` | `./` |

Użytkownika FTP zakłada się w panelu (Хостинг → Користувачі FTP → Додати користувача FTP)
z katalogiem dostępu `/home/uageek/uslugiceny.pl/www/`. Osobne konto na jeden projekt,
a nie główne `uageek_ftp`: gdyby hasło wyciekło z repozytorium, ucierpi tylko ta jedna strona.

Drugi workflow, `build-check.yml`, sprawdza przy pull requeście, czy projekt się buduje
i czy w wygenerowanych stronach nie pojawiła się cyrylica.

Do katalogu głównego trafia też `.htaccess`: wymusza HTTPS, przekierowuje `www` na wersję bez,
włącza kompresję i ustawia stronę 404.

## Struktura

```
build.mjs                generator stron
src/config.mjs           adres bazowy, prefiks ścieżek
src/templates.mjs        layout, kosztorys, tabele, silnik wyceny w przeglądarce
src/pages-service.mjs    strony usług, usług w mieście, kategorii i spisu
src/data/cities.json     10 miast: slug, nazwa, miejscownik, województwo, TERYT, współczynnik cen
src/data/works.json      roboty, kategorie, jednostki, standardy wykończenia, typowy zakres na m²
src/assets/style.css     system wizualny
```

Nowe miasto: jeden wiersz w `cities.json` ze współczynnikiem. Nowa robota: jeden obiekt
w `works.json` ze stawką bazową robocizny i materiału. Cenniki wszystkich miast przeliczą się same.

## Model cen

Każda robota ma jedną stawkę bazową, czyli medianę dla Polski.
Cena w mieście = stawka bazowa × współczynnik miasta, przy czym współczynnik obciąża
przede wszystkim robociznę (materiał tylko w 20%): worek kleju kosztuje wszędzie podobnie.
Standard wykończenia mnoży materiały w całości, a robociznę w jednej trzeciej.

## Strony

| Adres | Ile | Co zawiera |
|---|---|---|
| `/` | 1 | szybka wycena, trzy ścieżki wejścia, tablica cen za m² |
| `/uslugi/` i `/uslugi/<kategoria>/` | 14 | spis robót ze stawkami, wstęp merytoryczny |
| `/<kategoria>/<usluga>/` | 105 | przedział cen, podział robocizna i materiał, wykres miast, kalkulator, pytania, powiązane treści |
| `/<kategoria>/<usluga>/<miasto>/` | 1050 | stawka lokalna i odchylenie od średniej krajowej |
| `/ceny/<miasto>/` | 10 | pełny cennik w mieście plus opis lokalnego rynku |
| `/kalkulatory/` i `/kalkulator/*` | 19 | spis oraz 18 kalkulatorów: mieszkanie, wykończenie, poddasze, pokój, łazienka, kuchnia, balkon, wylewka, malowanie, płytki, gładzie, okna, elewacja, dach, kostka, ogrodzenie, klimatyzacja, ilości materiałów |
| `/koszty/` i `/koszt-*/` | 49 | spis oraz gotowe wyliczenia dla metraży: pokój, mieszkanie, łazienka, kuchnia, balkon, poddasze, dom, ocieplenie, wykończenie |
| `/poradnik/*` | 16 | spis oraz 15 poradników krok po kroku, ponad 160 etapów, schemat HowTo |
| `/porownanie/*` | 21 | spis oraz 20 zestawień rozwiązań z werdyktem |
| `/slownik/`, `/cennik/`, `/struktura-kosztow/` | 3 | 76 haseł, pełne zestawienie stawek, udział robocizny |
| `/sprawdz-oferte/`, `/porownaj-miasta/`, `/szukaj/`, `/kiedy-remontowac/` | 4 | narzędzia |
| `/wybor-ekipy/`, `/jak-czytac-kosztorys/`, `/umowa-z-ekipa/`, `/odbior-prac/` | 4 | poradniki okołoremontowe: od wyboru wykonawcy do odbioru prac |
| `/jak-liczymy/`, `/aktualizacje/`, `/o-nas/`, `/kontakt/`, `/polityka-prywatnosci/` | 5 | metodyka, historia zmian, strony zaufania |

Razem 1299 stron plus sitemap, robots.txt i strona 404.

## Dane

**Stan weryfikacji:** 103 z 105 stawek sprawdzonych punktowo, czyli takich, dla których źródło
podaje liczbę dla tej konkretnej roboty. Pozostałe wyprowadzono z widełek dla całej grupy robót
i są oznaczone na swoich stronach jako orientacyjne. Historia zmian jest na `/aktualizacje/`.

Źródła docelowe:

1. **Publiczne cenniki wykonawców** w każdym z 10 miast. Główne źródło stawek robocizny.
2. **Ceny materiałów** w sieciach budowlanych, przeliczone na jednostkę roboty
   z uwzględnieniem zużycia i docinki.
3. **GUS** — statystyka cen w budownictwie, otwarte API, licencja CC BY 4.0.
   Do kontroli dynamiki, nie wartości bezwzględnych.

Docelowo każda stawka dostanie pola `source` i `checked`.

## Kontrola jakości

Trzy niezależne skrypty, uruchamiane lokalnie i w CI przy każdym pull requeście:

| Skrypt | Czego pilnuje |
|---|---|
| `kontrola-danych.py` | struktura cennika, źródła przy kategoriach, powiązanie każdej pozycji z treścią i z etapem w poradniku, zgodność słownych opisów różnicy cen z liczbami |
| `audyt.py` (progi w środku) | powtórzone tytuły i opisy, długość metadanych, liczba H1, martwe odnośniki, strony bez linków przychodzących, waga stron |
| `kontrola-dostepnosci.py` | kontrast par kolorów, język dokumentu, przeskoki poziomów nagłówków, pola bez etykiety |
| `kontrola-schematow.py` | poprawność JSON-LD, wymagane pola schematów, sensowność wartości (np. dolna cena wyższa od górnej) |
| `narzedzia/jezyk.py` | literówki typu „i i", spacje przed interpunkcją, przyimek z mianownikiem nazwy miasta, błędne formy liczby mnogiej |
| `narzedzia/szerokosc.py` | typowe przyczyny poziomego przewijania na telefonie: sztywne szerokości, tabele bez opakowania, brak `min-width: 0` |
| `narzedzia/spojnosc-cen.py` | czy ta sama pozycja pokazuje tę samą kwotę na stronie pozycji, w pełnym cenniku i na stronie kategorii |
| `narzedzia/kalkulatory.mjs` | uruchamia silnik na trzech zakresach i sprawdza, czy kwoty są sensowne, czy współczynnik miejski działa tylko na robociznę i czy standardy układają się rosnąco |

## Zasada: liczby wymagają zdania

Serwis pokazuje dużo liczb i przez długi czas na tym poprzestawał. Wykres cen
w miastach, tabela składników, przedział od-do: wszystko poprawne, a czytelnik
i tak zostawał z pytaniem „i co z tego".

Dlatego każdy typ strony kończy się zdaniem wyliczonym z danych, które
odpowiada na to pytanie:

| Strona | Zdanie |
|---|---|
| usługa | skąd bierze się rozrzut między miastami |
| usługa w mieście | dlaczego akurat tyle i gdzie jest najtaniej |
| cennik miasta | ile to znaczy w złotówkach na mieszkaniu 50 m² |
| metraż | która część budżetu jest największa |
| porównanie | ile wynosi różnica przy typowym zakresie |
| poradnik | w jaką sumę składają się opisane etapy |
| kategoria | czy negocjuje się stawkę ekipy, czy wybiera produkt |

Zdanie musi wynikać z danych, nie z szablonu. Test jest prosty: jeśli to samo
zdanie pasuje do wylewki i do montażu wanny, to nie mówi nic o żadnej z nich.

## Zasada: grafika albo pokazuje coś ponad liczby, albo znika

Trzy elementy graficzne wyleciały albo zostały przerobione, bo tego nie robiły:

- **wykres słupkowy cen w miastach**: przy rozpiętości 33–48 zł na skali od zera
  wszystkie słupki wyglądały tak samo. Zastąpiony skalą z dziesięcioma punktami,
  na której widać, że miasta układają się w dwie grupy
- **pasek robocizna-materiał** przy pozycjach bez materiału: jednolity, zero
  informacji. Znika z 374 stron
- **linijka pod przedziałem cen**: znacznik stał zawsze pośrodku niezależnie od
  danych. Teraz stoi tam, gdzie średnia leży w przedziale, co pokazuje asymetrię
  rozkładu

## Progi jakości

Progi są w `audyt.py`, nie w workflow. Skrypt sam kończy się kodem błędu, gdy
któryś zostanie przekroczony, więc CI nie potrzebuje osobnego kroku z bashem.

Powód jest praktyczny: edytor GitHuba przy dłuższych plikach zapisuje tylko
załadowaną część i ucina resztę. Dwa razy uszkodził tak krok z progami, za
każdym razem niezauważalnie, bo w edytorze plik wyglądał na kompletny. Logika
w pliku wersjonowanym przez git jest odporna na ten problem.

## Odmiana w tekstach generowanych

Polska odmiana to najczęstsze źródło błędów w tym projekcie: wracała sześć razy,
w tytułach, opisach, pytaniach, wyjaśnieniach i w kodzie działającym w przeglądarce.
Schemat zawsze ten sam: generator skleja przyimek z nazwą w mianowniku.

Zasady, które to zamykają:

- **Nazwa miasta nigdy nie jest sklejana z przyimkiem.** W `cities.json` jest pole
  `loc` z gotowym miejscownikiem (`w Warszawie`, `we Wrocławiu`, `w Łodzi`) i to
  ono trafia do tekstu. Dotyczy też danych przekazywanych do przeglądarki.
- **Nazwa roboty zostaje w mianowniku.** Zdania buduje się wokół niej, zamiast ją
  odmieniać: „Płytki na ścianie w Krakowie: jaka jest cena?" zamiast „Ile kosztuje
  płytki...".
- **Hasła słownika mają listę form.** Pole piąte we wpisie zawiera odmiany, pod
  którymi pojęcie występuje w tekstach, bo „więźba dachowa" w słowniku i „więźby"
  w poradniku to dla wyszukiwania dwa różne ciągi.

Sprawdzenie po zmianie: `grep -rE '\bw (Warszawa|Kraków|Łódź)' dist/` powinno
zwracać zero trafień.

## Powtarzalność treści

Przy tysiącu stron z jednego szablonu łatwo nie zauważyć, że jakieś zdanie stoi
identycznie na kilkuset z nich. `narzedzia/powtorzenia.py` pokazuje listę
najczęściej powtarzanych zdań razem z tym, na ilu procentach stron występują.

Zasada, według której oceniam wynik: **rada może się powtarzać, opis pozycji nie**.
Zdanie o tym, jak porównywać oferty, jest takie samo dla wylewki i dla montażu
wanny, bo dotyczy sposobu czytania kosztorysu. Zdanie o tym, co obejmuje stawka,
musi być liczone z danych tej pozycji, inaczej nie mówi nic o żadnej z nich.

Tak powstały odpowiedzi podające kwotę i udział materiału zamiast jednego zdania
powtórzonego 781 razy oraz wyjaśnienie różnicy między miastami z konkretną
rozpiętością zamiast tego samego tekstu na 340 stronach.

## Znak marki

Trzy słupki jako poziomy standardu: ekonomiczny, standardowy i premium, środkowy
w kolorze sygnałowym. Nawiązuje do tego, czym serwis operuje na każdej stronie,
i pozostaje czytelny przy 16 px.

| Element | Gdzie |
|---|---|
| SVG w nagłówku i stopce | `ZNAK()` w `src/templates.mjs` |
| ikony, favicon, obraz udostępnień | `narzedzia/ikony.py` |
| kolory słupków | klasy `.s-tlo` i `.s-akcent` w `style.css` |

Kwadrat znaku dziedziczy kolor tekstu (`currentColor`), więc w ciemnej stopce robi
się biały. Dlatego słupki mają własne klasy i na ciemnym tle przemalowują się na
grafit: bez tego biały znak na białym tle znikał i zostawał sam żółty słupek.

Zmiana geometrii wymaga poprawki w **dwóch** miejscach: w `ZNAK()` oraz w stałej
`SLUPKI` w skrypcie ikon. Po zmianie uruchom `python3 narzedzia/ikony.py`
i obejrzyj wynik, bo błędy w znaku są wyłącznie wizualne i żadna z kontroli
ich nie wychwyci.

## Waga stron

Kod liczący kosztorys jest w `/assets/kalkulator.js`, wspólnym dla całego serwisu,
a nie wklejany do każdej strony. Do przeglądarki trafiają tylko te pola pozycji,
których używa kalkulator: nazwa, jednostka, stawki i adres strony. Czynniki cenowe,
znaczniki weryfikacji i opisy kategorii służą generowaniu stron i zostają po stronie
buildu.

| Strona | Przed | Po |
|---|---|---|
| kalkulator | 81 kB | 38 kB |
| strona główna | 86 kB | 51 kB |
| katalog `dist` | 32 MB | 25 MB |

Uwaga przy zmianach: skrypty stron są owinięte w `DOMContentLoaded`, bo zewnętrzny
plik z `defer` wykonuje się dopiero po sparsowaniu dokumentu. Kod wstawiony poza tym
opakowaniem nie znajdzie funkcji silnika.

## Wdrożenie

| Etap | Czas |
|---|---|
| budowa 1251 stron | 2 s |
| instalacja lftp | 14 s |
| wysyłka zmienionych plików | 13 s |
| **cały deploy** | **42 s** |

Dojście do tych liczb zajęło kilka podejść i warto pamiętać, co dało efekt:

1. Pierwotnie deploy trwał **33 minuty**: build kasował cały katalog i zapisywał
   wszystko od nowa, więc każdy plik miał świeży czas modyfikacji i `lftp --only-newer`
   wysyłał 1250 plików przy każdej poprawce.
2. Build przyrostowy plus cache `dist` w CI skrócił to do **19 minut**. Wciąż dużo,
   bo czas szedł nie na transfer, tylko na obejście drzewa: `mirror` sprawdza po kolei
   każdy plik w kilkuset katalogach, a każde zapytanie to osobna runda do serwera.
3. Build wypisuje listę zmienionych stron do `zmienione.txt`, a workflow wysyła
   wyłącznie je. Efekt: **42 sekundy**.

Przy więcej niż 400 zmienionych plikach workflow wraca do `mirror`, bo wtedy
porównanie całości jest szybsze niż setki osobnych poleceń `put`.

## Budowanie przyrostowe

`build.mjs` nie kasuje katalogu `dist` i nadpisuje tylko pliki o zmienionej treści.
Ma to jeden konkretny cel: `lftp` wysyła na serwer pliki nowsze niż zdalne, więc
przepisanie wszystkich stron przy każdej poprawce oznaczało wysyłkę całego serwisu.

Konsekwencje, o których warto wiedzieć:

- zmiana w `style.css` przebudowuje **wszystkie** strony, bo adres arkusza zawiera
  odcisk jego treści (`style.css?v=hash`) i zmienia się w każdym dokumencie
- zmiana w jednej pozycji cennika przebudowuje jej stronę oraz strony miejskie tej
  pozycji, katalog kategorii i wszystko, co pokazuje jej stawkę
- strony, których build już nie generuje, są usuwane z `dist` osobnym krokiem;
  bez tego zostawałyby na serwerze po skasowaniu sekcji
- w CI katalog `dist` jest zapamiętywany przez `actions/cache`, inaczej każdy
  przebieg zaczynałby od pustego katalogu i porównanie nie miałoby czego szukać

Licznik na końcu budowania pokazuje, ile plików faktycznie zapisano.

## Znany dług techniczny

Trzy najstarsze kalkulatory (mieszkanie, łazienka, wylewka) są napisane bezpośrednio
w `build.mjs`, a nie w tablicy `CALCS` w `src/pages-calc.mjs` jak pozostałe czternaście.
Mają własną logikę: kalkulator mieszkania korzysta z grup zakresu (`standardScope.groups`),
których wspólny szablon nie obsługuje.

Świadomie tego nie ujednolicam: przeniesienie wymagałoby rozszerzenia szablonu o rzeczy
potrzebne tylko jednej stronie, a ryzyko zepsucia trzech najważniejszych kalkulatorów
przewyższa zysk z jednolitości. Konsekwencja jest jedna i trzeba o niej pamiętać:
zmiany dotyczące wszystkich kalkulatorów (jak dopisanie sekcji kontekstu) wymagają
edycji w dwóch miejscach.

## Plan rozwoju

- [x] Szkielet: cennik w 10 miastach, 3 kalkulatory, metodyka
- [x] Model „stawka bazowa × współczynnik miasta × standard wykończenia”
- [x] Strony usług i usług w mieście, 485 stron w sitemapie
- [ ] Teksty „co wpływa na cenę” dla pozostałych 35 pozycji (gotowe: 7)
- [ ] Pola `source` i `checked` przy każdej stawce, oznaczanie danych przeterminowanych
- [ ] Druk i PDF kosztorysu oraz link z parametrami, żeby dało się wysłać ekipie
- [ ] Sprawdzenie oferty: użytkownik wpisuje kwotę od wykonawcy, my mówimy, czy to powyżej rynku
- [ ] Kolejne kalkulatory: malowanie, płytki, płyty g-k, ocieplenie balkonu
- [ ] Historia stawek miesiąc po miesiącu i wykres dynamiki
- [ ] Weryfikacja polszczyzny przez native speakera przed startem
- [ ] Domena: sprawdzić dostępność, dobrać nazwę
