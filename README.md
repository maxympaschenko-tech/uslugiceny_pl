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
| `/<kategoria>/<usluga>/` | 102 | przedział cen, podział robocizna i materiał, wykres miast, kalkulator, pytania, powiązane treści |
| `/<kategoria>/<usluga>/<miasto>/` | 1020 | stawka lokalna i odchylenie od średniej krajowej |
| `/ceny/<miasto>/` | 10 | pełny cennik w mieście plus opis lokalnego rynku |
| `/kalkulatory/` i `/kalkulator/*` | 17 | spis oraz 16 kalkulatorów: mieszkanie, wykończenie, poddasze, łazienka, kuchnia, balkon, wylewka, malowanie, płytki, gładzie, okna, elewacja, dach, kostka, ogrodzenie, klimatyzacja |
| `/koszty/` i `/koszt-*/` | 34 | spis oraz gotowe wyliczenia dla metraży: mieszkanie, łazienka, kuchnia, balkon, poddasze, dom, ocieplenie, wykończenie |
| `/poradnik/*` | 16 | kolejność prac krok po kroku, ponad 150 etapów, schemat HowTo |
| `/porownanie/*` | 15 | zestawienia rozwiązań z werdyktem |
| `/slownik/`, `/cennik/`, `/struktura-kosztow/` | 3 | 62 hasła, pełne zestawienie stawek, udział robocizny |
| `/sprawdz-oferte/`, `/porownaj-miasta/`, `/szukaj/`, `/kiedy-remontowac/` | 4 | narzędzia |
| `/jak-liczymy/`, `/aktualizacje/`, `/o-nas/`, `/kontakt/`, `/polityka-prywatnosci/` | 5 | metodyka, historia zmian, strony zaufania |

Razem ponad 1240 stron plus sitemap, robots.txt i strona 404.

## Dane

**Stan weryfikacji:** 94 z 102 stawek sprawdzonych punktowo, czyli takich, dla których źródło
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
| `audyt.py` | powtórzone tytuły i opisy, długość metadanych, liczba H1, martwe odnośniki, strony bez linków przychodzących, waga stron |
| `kontrola-dostepnosci.py` | kontrast par kolorów, język dokumentu, przeskoki poziomów nagłówków, pola bez etykiety |
| `kontrola-schematow.py` | poprawność JSON-LD, wymagane pola schematów, sensowność wartości (np. dolna cena wyższa od górnej) |

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
