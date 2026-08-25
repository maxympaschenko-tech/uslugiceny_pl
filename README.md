# Kosztorys.pl — baza cen robót remontowych

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
| `/` | 1 | szybka wycena, tablica cen za m², katalog |
| `/uslugi/` i `/uslugi/<kategoria>/` | 8 | spis robót ze stawkami |
| `/<kategoria>/<usluga>/` | 42 | cena min/średnia/max, podział robocizna i materiał, kalkulator, ceny w miastach |
| `/<kategoria>/<usluga>/<miasto>/` | 420 | stawka lokalna i odchylenie od średniej krajowej |
| `/ceny/<miasto>/` | 10 | pełny cennik robót w mieście |
| `/kalkulator/*` | 3 | remont mieszkania, łazienka, wylewka |
| `/jak-liczymy/` | 1 | metodyka i źródła |
| `/404.html` | 1 | strona błędu ze skrótami |

Razem 485 stron plus sitemap, robots.txt i strona 404.

## Dane

**W repozytorium jest wersja robocza.** `works.json` ma `meta.status: "draft"` i dopóki tak jest,
na każdej stronie wisi żółty baner. Rząd wielkości jest rynkowy, stawki wymagają weryfikacji
z cennikami ekip.

Źródła docelowe:

1. **Publiczne cenniki wykonawców** w każdym z 10 miast. Główne źródło stawek robocizny.
2. **Ceny materiałów** w sieciach budowlanych, przeliczone na jednostkę roboty
   z uwzględnieniem zużycia i docinki.
3. **GUS** — statystyka cen w budownictwie, otwarte API, licencja CC BY 4.0.
   Do kontroli dynamiki, nie wartości bezwzględnych.

Docelowo każda stawka dostanie pola `source` i `checked`.

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
