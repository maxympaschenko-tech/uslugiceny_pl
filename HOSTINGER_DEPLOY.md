# uslugiceny.pl — bezpośrednia migracja na Hostinger

Ustalone wdrożenie produkcyjne: **od razu na domenie `uslugiceny.pl`**, bez domeny tymczasowej i bez blokowania indeksowania.

## Architektura

- Istniejące repozytorium: `maxympaschenko-tech/uslugiceny_pl`, gałąź `main`.
- `npm run build` generuje kompletną statyczną stronę do `dist/` z kalkulatorami, obrazami, favicon, `sitemap.xml`, `robots.txt` i plikami HTML.
- WordPress, baza danych i proces Node.js działający stale nie są wymagane.
- Docelowo: **GitHub `main` → Hostinger Web App → build → statyczny `dist`**, bez GitHub Actions/FTP.

## Rozwinięcie bezpośrednio pod właściwą domeną

1. Zaloguj się do Hostinger hPanel → **Websites → Create site → Web App**.
2. Na ekranie wyboru domeny wpisz **`uslugiceny.pl`** (nie wybieraj **Use temporary domain**).
3. Wybierz **Import your Git repository**. Nie wybieraj **Public repository URL**: ten wariant może utworzyć kopię w nowym repozytorium, przez co zmiany na właściwym `main` nie będą wdrażane.
4. Zaloguj się przez GitHub, autoryzuj Hostinger i wybierz `maxympaschenko-tech/uslugiceny_pl`, gałąź `main`.
5. W ustawieniach Build and output ustaw:

| Pole | Wartość |
|---|---|
| Framework | `Other` |
| Node.js version | `22.x` |
| Root directory | `./` |
| Package manager | `npm` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Entry file | zostaw puste |
| `SITE_URL` | `https://uslugiceny.pl` |
| `BASE_PATH` | `/` |

**Nie ustawiaj `SITE_PREVIEW`**: gdy brak tej zmiennej, strony docelowe generują `index, follow, max-image-preview:large`, a `robots.txt` ma `Allow: /` i prowadzi do `sitemap.xml`.

6. Wykonaj **Deploy** i sprawdź zielony status na stronie **Deployments** w Hostinger.
7. Hostinger poda, jak skierować domenę na nowy hosting. Jeśli domena nadal używa DNS Ukraine.com.ua / rejestratora, ustaw wskazane przez Hostinger rekordy **A/AAAA** i `www`. **Nie zgaduj IP ani nazwy hosta**.
8. Zanim zmienisz serwery nazw NS, wykonaj kopię strefy DNS i zachowaj konfigurację poczty (MX, SPF, DKIM, DMARC, TXT). Jeśli to możliwe, zmień tylko rekordy WWW, bez NS.
9. Gdy DNS wskazuje Hostinger, sprawdź wydany certyfikat SSL oraz ładowanie `https://uslugiceny.pl/`.

## Kontrola po wdrożeniu

- `https://uslugiceny.pl/` — główna strona, poprawne CSS i JS.
- `/cennik/` — wszystkie 105 pozycji, filtr, wybór miasta, druk i CSV.
- `/kalkulator/remont-mieszkania/` i `/sprawdz-oferte/` — interaktywne przeliczenia.
- `/poradnik/` i `/poradnik/ukladanie-paneli-podlogowych-krok-po-kroku/` — kompletne treści.
- `/ceny/warszawa/` i przykładowe strony usług z `/` na końcu.
- `/robots.txt` — `Allow: /`; `/sitemap.xml` — prawidłowe adresy HTTPS.
- Na indeksowanych stronach: `<meta name="robots" content="index, follow, max-image-preview:large">` i poprawne kanoniczne URL.
- `www` → wersja bez `www`, HTTP → HTTPS, brak pętli przekierowań.
- Sprawdź, czy formularze, kalkulatory, druk, SEO i przekierowania działają.

## Kiedy wyłączyć stary FTP

**Nie wyłączaj `.github/workflows/deploy-ftp.yml` przed potwierdzonym uruchomieniem Hostinger**: jest to dotychczasowa ścieżka dostarczania zmian na Ukraine.com.ua. Po poprawnym produkcyjnym wdrożeniu, sprawdzeniu DNS, SSL oraz testowym nowym commicie auto-deploy w Hostinger usuń ten przestarzały workflow. Wcześniej zrób kopię starego hostingu; nie usuwaj od razu plików z Ukraine.com.ua.

## Hostinger — dokumentacja

- https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- https://www.hostinger.com/support/1863967-how-to-point-a-domain-to-hostinger/
