"""Sprawdzenie SEO wygenerowanej strony, bez połączeń z siecią i zależności.

Uruchom po budowaniu: python3 narzedzia/seo.py [katalog-dist]
Katalog roboczy może wskazywać inny checkout lub kopię projektu.
"""
import argparse
import json
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET


def text(value):
    return ' '.join(value.split())


class Page(HTMLParser):
    """Czyta atrybuty przez parser HTML, więc obsługuje też &amp; i &quot;."""
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
            'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.canonical = []
        self.meta = {}
        self.refs = []
        self.ids = Counter()
        self.named_anchors = set()
        self.schemas = []
        self.schema_errors = []
        self.crumbs = []
        self.crumb_navs = 0
        self.crumb_lists = 0
        self.stack = []
        self.in_crumbs = False
        self.crumb = None
        self.title = []
        self.schema = None
        self.feed(source)
        self.close()

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get('id'):
            self.ids[attrs['id']] += 1
        if tag == 'a' and attrs.get('name'):
            self.named_anchors.add(attrs['name'])
        if tag == 'link' and 'canonical' in attrs.get('rel', '').split():
            self.canonical.append(attrs.get('href', ''))
        if tag == 'meta':
            key = attrs.get('name', attrs.get('property', '')).lower()
            self.meta.setdefault(key, []).append(attrs.get('content', ''))
            if key == 'og:image':
                self.refs.append(attrs.get('content', ''))
        for attribute in ('href', 'src', 'poster'):
            if attrs.get(attribute):
                self.refs.append(attrs[attribute])
        if tag == 'script' and attrs.get('type', '').lower() == 'application/ld+json':
            self.schema = []
        if tag == 'nav' and 'crumbs' in attrs.get('class', '').split():
            self.in_crumbs = True
            self.crumb_navs += 1
        if self.in_crumbs:
            if tag == 'ol':
                self.crumb_lists += 1
            if tag == 'li':
                self.crumb = {'name': [], 'links': [], 'current': [],
                              'in_ol': bool(self.stack and self.stack[-1] == 'ol')}
                self.crumbs.append(self.crumb)
            if self.crumb is not None:
                if tag == 'a':
                    self.crumb['links'].append(attrs.get('href', ''))
                if tag == 'span' and 'aria-current' in attrs:
                    self.crumb['current'].append(attrs['aria-current'])
        if tag not in self.VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag == 'script' and self.schema is not None:
            try:
                value = json.loads(''.join(self.schema))
                self.schemas.extend(value if isinstance(value, list) else [value])
            except (ValueError, TypeError) as error:
                self.schema_errors.append(str(error))
            self.schema = None
        if self.in_crumbs and tag == 'li':
            self.crumb = None
        if self.in_crumbs and tag == 'nav':
            self.in_crumbs = False
        if tag in self.stack:
            index = len(self.stack) - 1 - self.stack[::-1].index(tag)
            del self.stack[index:]

    def handle_startendtag(self, tag, attributes):
        self.handle_starttag(tag, attributes)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_data(self, value):
        if self.schema is not None:
            self.schema.append(value)
        if self.stack and self.stack[-1] == 'title':
            self.title.append(value)
        if self.crumb is not None:
            self.crumb['name'].append(value)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', nargs='?', default='dist', help='katalog wygenerowanej strony (domyślnie dist)')
    output = Path(parser.parse_args().output).resolve()
    errors = []

    def check(condition, message):
        if not condition:
            errors.append(message)

    def load(name):
        try:
            return (output / name).read_text(encoding='utf-8')
        except (OSError, UnicodeError) as error:
            errors.append(f'{name}: nie można odczytać pliku ({error})')
            return ''

    homepage = Page(load('index.html'))
    if len(homepage.canonical) != 1:
        raise SystemExit('SEO: strona główna musi mieć dokładnie jeden adres canonical. Uruchom node build.mjs.')
    home = homepage.canonical[0]
    address = urlsplit(home)
    if address.scheme not in ('http', 'https') or not address.netloc or address.query or address.fragment or not address.path.endswith('/'):
        raise SystemExit('SEO: canonical strony głównej musi być pełnym adresem HTTP(S), zakończonym /, bez zapytania i fragmentu.')
    origin = (address.scheme.lower(), address.netloc.lower())
    root = unquote(address.path, errors='strict')
    pages = {(output / 'index.html').resolve(): homepage}

    def page_for(file):
        file = file.resolve()
        if file not in pages:
            pages[file] = Page(load(file.relative_to(output).as_posix()))
        return pages[file]

    def local_target(reference, page_url, label, required=False):
        """Sprawdza odnośnik po usunięciu prefiksu wdrożenia, nie prefiksu plików."""
        if not isinstance(reference, str):
            errors.append(f'{label}: odnośnik musi być tekstowym adresem')
            return None
        try:
            resolved = urlsplit(urljoin(page_url, reference))
            if (resolved.scheme.lower(), resolved.netloc.lower()) != origin:
                check(not required, f'{label}: adres wychodzi poza domenę ({reference})')
                return None
            pathname = unquote(resolved.path, errors='strict')
            if pathname == root.rstrip('/'):
                pathname += '/'
            if not pathname.startswith(root):
                errors.append(f'{label}: adres pomija prefiks {address.path} ({reference})')
                return None
            candidate = (output / pathname[len(root):]).resolve()
            if not candidate.is_relative_to(output):
                errors.append(f'{label}: adres wychodzi poza katalog strony ({reference})')
                return None
            if candidate.is_dir() or pathname.endswith('/'):
                candidate /= 'index.html'
            check(candidate.is_file(), f'{label}: brak lokalnego celu ({reference})')
            if candidate.is_file() and candidate.suffix.lower() == '.html' and resolved.fragment:
                # Dyrektywa tekstowa może działać bez elementu id; pozostała
                # część fragmentu nadal wskazuje zwykłą kotwicę dokumentu.
                fragment = unquote(resolved.fragment, errors='strict').split(':~:', 1)[0]
                if fragment and fragment.lower() != 'top':
                    target_page = page_for(candidate)
                    check(fragment in target_page.ids or fragment in target_page.named_anchors,
                          f'{label}: brak kotwicy #{fragment} ({reference})')
            return resolved
        except (ValueError, UnicodeError, OSError) as error:
            errors.append(f'{label}: niepoprawny odnośnik ({reference}): {error}')
            return None

    files = sorted(output.rglob('*.html'))
    check(bool(files), 'Nie znaleziono wygenerowanych stron HTML.')
    check((output / '404.html').is_file(), 'Brak strony 404.html.')
    check((output / 'szukaj/index.html').is_file(), 'Brak strony wyszukiwarki.')
    indexable = set()
    breadcrumb_count = 0
    for file in files:
        relative = file.relative_to(output).as_posix()
        route = relative[:-len('index.html')] if file.name == 'index.html' else relative
        expected_url = urljoin(home, quote(route, safe='/'))
        page = page_for(file)
        repeated_ids = [value for value, count in page.ids.items() if count > 1]
        check(not repeated_ids, f'{relative}: powtórzone identyfikatory id {repeated_ids[:3]}')
        error_page = relative == '404.html'
        search_page = relative == 'szukaj/index.html'
        check(len(page.canonical) == (0 if error_page else 1), f'{relative}: nieprawidłowa liczba canonical')
        if page.canonical:
            check(page.canonical == [expected_url], f'{relative}: canonical nie odpowiada adresowi pliku ({page.canonical})')
        robots = page.meta.get('robots', [])
        check(len(robots) == 1, f'{relative}: wymagany dokładnie jeden znacznik robots')
        directives = {part.strip().lower() for value in robots for part in value.split(',')}
        check('follow' in directives and 'nofollow' not in directives, f'{relative}: robots musi pozwalać śledzić odnośniki')
        if error_page or search_page:
            check('noindex' in directives and 'index' not in directives, f'{relative}: wymagane noindex')
        else:
            check('index' in directives and 'noindex' not in directives, f'{relative}: strona docelowa musi być indeksowalna')
            indexable.add(expected_url)
        check(page.meta.get('og:url') == [expected_url], f'{relative}: og:url nie odpowiada adresowi strony')
        for error in page.schema_errors:
            errors.append(f'{relative}: niepoprawny JSON-LD ({error})')
        schemas = [schema for schema in page.schemas if isinstance(schema, dict)]
        web = [schema for schema in schemas if schema.get('@type') == 'WebPage']
        check(len(web) == (0 if error_page else 1), f'{relative}: nieprawidłowa liczba schematów WebPage')
        if web:
            check(web[0].get('url') == expected_url, f'{relative}: WebPage.url nie zgadza się z canonical')
            check(web[0].get('name') == ''.join(page.title), f'{relative}: WebPage.name nie zgadza się z tytułem')
        structured = [schema for schema in schemas if schema.get('@type') == 'BreadcrumbList']
        needs_crumbs = relative != 'index.html' and not error_page
        check(len(structured) == (1 if needs_crumbs else 0), f'{relative}: nieprawidłowa liczba BreadcrumbList')
        check(page.crumb_navs == (1 if needs_crumbs else 0), f'{relative}: nieprawidłowa liczba widocznych ścieżek nawigacji')
        if needs_crumbs:
            check(page.crumb_lists == 1 and len(page.crumbs) >= 2, f'{relative}: ścieżka musi być listą ol z co najmniej dwoma li')
            items = structured[0].get('itemListElement', []) if structured else []
            if not isinstance(items, list):
                errors.append(f'{relative}: itemListElement musi być listą')
                items = []
            check(len(items) == len(page.crumbs), f'{relative}: schema i widoczna ścieżka mają różną długość')
            for index, (item, visible) in enumerate(zip(items, page.crumbs)):
                label = f'{relative}: okruszek {index + 1}'
                if not isinstance(item, dict):
                    errors.append(f'{label}: element schematu nie jest obiektem')
                    continue
                check(item.get('position') == index + 1, f'{label}: błędna pozycja schematu')
                check(visible['in_ol'], f'{label}: li nie należy do ol')
                check(item.get('name') == text(''.join(visible['name'])), f'{label}: schema i widoczna nazwa są różne')
                last = index == len(page.crumbs) - 1
                if last:
                    check(not visible['links'] and visible['current'] == ['page'], f'{label}: ostatni element musi być span z aria-current="page"')
                    target = expected_url
                else:
                    check(len(visible['links']) == 1 and not visible['current'], f'{label}: wymagany jeden odnośnik do rodzica')
                    target = urljoin(expected_url, visible['links'][0]) if visible['links'] else ''
                check(item.get('item') == target, f'{label}: schema i widoczny adres są różne')
                local_target(item.get('item', ''), expected_url, label, required=True)
            if items and isinstance(items[0], dict):
                check(items[0].get('item') == home, f'{relative}: ścieżka nie zaczyna się od strony głównej')
            breadcrumb_count += 1
        for reference in set(page.refs):
            local_target(reference, expected_url, relative)

    namespace = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    try:
        sitemap = ET.fromstring(load('sitemap.xml'))
        locations = [node.text or '' for node in sitemap.findall('s:url/s:loc', namespace)]
        duplicates = [url for url, count in Counter(locations).items() if count > 1]
        check(not duplicates, f'sitemap.xml: powtórzone adresy {duplicates[:3]}')
        check(bool(locations), 'sitemap.xml: mapa nie zawiera adresów')
        for location in locations:
            parsed = urlsplit(location)
            check(not parsed.query and not parsed.fragment, f'sitemap.xml: adres zawiera zapytanie lub fragment ({location})')
            local_target(location, home, 'sitemap.xml', required=True)
        check(set(locations) == indexable,
              f'sitemap.xml: zbiór różni się od indeksowalnych stron (brak: {sorted(indexable - set(locations))[:3]}, nadmiar: {sorted(set(locations) - indexable)[:3]})')
        check(not sitemap.findall('s:url/s:lastmod', namespace), 'sitemap.xml: lastmod wymaga wiarygodnego źródła dat zmian poszczególnych stron')
    except (ET.ParseError, ValueError) as error:
        errors.append(f'sitemap.xml: niepoprawny XML ({error})')

    sitemap_lines = [line.split(':', 1)[1].strip() for line in load('robots.txt').splitlines()
                     if line.lower().startswith('sitemap:')]
    check(sitemap_lines == [urljoin(home, 'sitemap.xml')], 'robots.txt: wymagany jeden poprawny adres Sitemap z prefiksem wdrożenia')
    try:
        search = json.loads(load('search-index.json'))
        check(isinstance(search, list) and bool(search), 'search-index.json: wymagany niepusty indeks')
        targets = []
        for entry in search if isinstance(search, list) else []:
            if not isinstance(entry, dict) or not isinstance(entry.get('u'), str):
                errors.append('search-index.json: pozycja bez tekstowego adresu u')
                continue
            target = local_target(entry['u'], home, 'search-index.json', required=True)
            if target:
                targets.append((unquote(target.path), unquote(target.query), unquote(target.fragment)))
        check(len(targets) == len(set(targets)), 'search-index.json: powtórzone cele wyszukiwania')
    except (ValueError, TypeError) as error:
        errors.append(f'search-index.json: niepoprawny JSON ({error})')
    try:
        manifest = set((output.parent / 'zmienione.txt').read_text(encoding='utf-8').splitlines())
        for required in ('assets/kalkulator.js', '404.html'):
            check(required in manifest, f'zmienione.txt: brak {required}, wdrożenie przyrostowe pominie ten plik')
    except OSError as error:
        errors.append(f'zmienione.txt: nie można odczytać listy wdrożenia ({error})')

    if errors:
        print(f'SEO: znaleziono {len(errors)} problemów:')
        for error in errors[:30]:
            print('  -', error)
        if len(errors) > 30:
            print(f'  ... oraz {len(errors) - 30} kolejnych.')
        raise SystemExit(1)
    print(f'SEO w porządku: {len(files)} stron HTML, {len(indexable)} adresów w mapie, '
          f'{breadcrumb_count} zgodnych ścieżek, poprawne kotwice, unikalne id, indeks i kompletna lista wdrożenia. Prefiks: {address.path}')


if __name__ == '__main__':
    main()
