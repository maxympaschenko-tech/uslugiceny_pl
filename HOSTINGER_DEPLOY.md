# Migracja uslugiceny.pl z Ukraine.com.ua na Hostinger

## Architektura

Serwis nie wymaga WordPressa ani stale działającego Node.js. `npm run build` (Node.js 22) tworzy statyczny katalog `dist/`: strony HTML, kalkulatory JS, CSS, grafiki, `sitemap.xml`, `robots.txt` i `.htaccess`.

Docelowy przepływ: **commit do GitHub `main` → automatyczny build Hostinger → publikacja `dist/`**. Nie trzeba używać GitHub Actions ani FTP po migracji.

## 1. Przygotowanie wersji testowej (bez zmiany DNS)

1. Hostinger hPanel → **Websites** → **Create site** → **Web App**. Użyj istniejącego planu Business/Cloud, który wspiera Node.js Web Apps.
2. Wybierz **Use temporary domain**, żeby produkcyjne `https://uslugiceny.pl` nadal było obsługiwane przez Ukraine.com.ua.
3. Wybierz **Import your Git repository** (a NIE `Public repository URL`, ponieważ ta druga opcja może skopiować projekt do nowego repozytorium).
4. Połącz GitHub i udziel aplikacji Hostinger uprawnień do istniejącego `maxympaschenko-tech/uslugiceny_pl`.
5. Ustaw:
   - Repository: `maxympaschenko-tech/uslugiceny_pl`
   - Branch: `main`
   - Framework: `Other`
   - Node.js: `22.x`
   - Root directory: `./`
   - Package manager: `npm`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Entry file: **pozostaw puste**, bo to statyczny serwis
6. W Environment Variables dodaj:
   - `SITE_URL=https://uslugiceny.pl`
   - `BASE_PATH=/`
   - `SITE_PREVIEW=1` (WAŻNE tylko podczas testów)
7. Kliknij **Deploy** i zaczekaj na status ukończenia w Hostinger. Otwórz URL tymczasowy.

### Dlaczego SITE_PREVIEW=1?

Podczas budowania z tą zmienną wszystkie strony dostają meta `noindex`, a `robots.txt` ma `Disallow: /`. Dzięki temu wersja testowa nie konkuruje z produkcyjnymi stronami w wyszukiwarkach.

**UWAGA: przed uruchomieniem domeny produkcyjnej trzeba usunąć `SITE_PREVIEW` (lub nadać jej wartość inną niż `1`) i wykonać ponowny build.** Jeśli pozostanie `1`, witryna produkcyjna będzie zablokowana dla indeksowania.

## 2. Kontrola wersji testowej

- Strony: `/`, `/cennik/`, `/uslugi/`, `/poradnik/`, `/ceny/warszawa/`, `/kalkulator/remont-mieszkania/`, `/sprawdz-oferte/` i przykładowe `/poradnik/*/`.
- Test interakcji: wybór miasta, kalkulator, wyszukiwarka pełnego cennika, pobranie CSV, wydruk, menu i mobile.
- Zasoby: `/assets/style.css`, `/assets/kalkulator.js`, wszystkie obrazy OG i favicon.
- SEO: kanoniczne URL nadal wskazują `https://uslugiceny.pl`, stare ścieżki istnieją, `/sitemap.xml` ma listę istniejących URL, `/404.html` jest obecna.
- Preview musi zwracać `noindex` w HTML oraz `Disallow: /` w `robots.txt`.
- Sprawdź serwowanie adresów z końcowym `/` jako `index.html` i przekierowania HTTP → HTTPS.

## 3. Przełączenie domeny

1. W hPanel użyj opcji **Connect domain**, podaj `uslugiceny.pl` i odczytaj zalecany rekord A lub serwery nazw. **Nie zgaduj IP.**
2. W obecnej strefie DNS zrób kopię wszystkich rekordów. Szczególnie zachowaj pocztowe **MX, SPF, DKIM, DMARC i TXT**.
3. Preferowane: zmień odpowiednie rekordy WWW (A/AAAA i ewentualny CNAME `www`) w istniejącej strefie DNS, zamiast zmieniać NS całej domeny. Tak nie naruszysz przypadkowo poczty.
4. Upewnij się, że `SITE_PREVIEW` już nie ma w ustawieniach produkcyjnego buildu; wykonaj ponowny build i zweryfikuj `robots.txt` zawierający `Allow: /`, oraz meta `index, follow` na stronach docelowych.
5. Dopiero gdy Hostinger pokazuje udane wdrożenie i domena obsługuje poprawny HTML, przełącz ruch DNS. Skontroluj HTTPS/SSL, `www` i brak przekierowań w pętli.
6. Porównaj liczbę stron `sitemap.xml`, statusy wybranych starych adresów oraz formularze/kalkulatory na nowym serwerze.

## 4. Wyłączenie starego FTP

**Nie usuwaj** `.github/workflows/deploy-ftp.yml` podczas przygotowania i testowania Hostinger. Ten workflow wciąż dostarcza obecne wydanie do Ukraine.com.ua.

Dopiero po potwierdzonym uruchomieniu produkcji na Hostinger:
- usuń stary workflow `.github/workflows/deploy-ftp.yml` lub wyłącz go w GitHub Actions;
- sprawdź, że kolejny commit w `main` powoduje udany automatyczny deployment w Hostinger bez FTP;
- zachowaj stary hosting przez krótki okres bezpieczeństwa i wykonaj backup przed usunięciem.

## Źródła Hostinger

- [Node.js Web App z GitHub](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Migracja Node.js na Hostinger](https://www.hostinger.com/support/how-to-migrate-a-node-js-application-to-hostinger/)
- [Połączenie domeny](https://www.hostinger.com/support/how-to-connect-a-custom-domain-to-a-node-js-application/)
