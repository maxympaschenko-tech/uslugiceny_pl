"""Zgodność odpowiedzi o materiale z tabelą ceny oraz skrótów na stronie usługi.

Uruchom po budowaniu: python3 narzedzia/odpowiedzi.py [katalog-dist]
"""
import argparse
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path


def tekst(value):
    return ' '.join(value.split())


class Strona(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.ids = Counter()
        self.schematy = []
        self.script = None
        self.tabele = []
        self.tabela = self.wiersz = self.komorka = None
        self.naglowek = self.akapit = None
        self.pytanie = None
        self.odpowiedzi = {}
        self.nav = False
        self.nav_count = 0
        self.skroty = []
        self.feed(source)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get('id'):
            self.ids[attrs['id']] += 1
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.script = []
        if tag == 'nav' and 'service-nav' in attrs.get('class', '').split():
            self.nav = True
            self.nav_count += 1
        if self.nav and tag == 'a':
            self.skroty.append(attrs.get('href', ''))
        if tag == 'table':
            self.tabela = []
        if tag == 'tr' and self.tabela is not None:
            self.wiersz = []
        if tag in ('th', 'td') and self.wiersz is not None:
            self.komorka = []
        if tag == 'h3':
            self.naglowek = []
        if tag == 'p':
            self.akapit = []

    def handle_data(self, value):
        for target in (self.script, self.komorka, self.naglowek, self.akapit):
            if target is not None:
                target.append(value)

    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.schematy.append(json.loads(''.join(self.script)))
            self.script = None
        if tag == 'nav':
            self.nav = False
        if tag in ('th', 'td') and self.komorka is not None:
            self.wiersz.append(tekst(''.join(self.komorka)))
            self.komorka = None
        if tag == 'tr' and self.wiersz is not None:
            self.tabela.append(self.wiersz)
            self.wiersz = None
        if tag == 'table' and self.tabela is not None:
            self.tabele.append(self.tabela)
            self.tabela = None
        if tag == 'h3' and self.naglowek is not None:
            self.pytanie = tekst(''.join(self.naglowek))
            self.naglowek = None
        if tag == 'p' and self.akapit is not None:
            if self.pytanie:
                self.odpowiedzi.setdefault(self.pytanie, []).append(tekst(''.join(self.akapit)))
            self.pytanie = self.akapit = None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', nargs='?', default='dist')
    output = Path(parser.parse_args().output)
    bledy = []
    sprawdzone = material = bez_materialu = 0

    def sprawdz(condition, file, message):
        if not condition:
            bledy.append(f'{file}: {message}')

    for file in sorted(output.rglob('index.html')):
        try:
            strona = Strona(file.read_text(encoding='utf-8'))
        except (OSError, ValueError) as error:
            bledy.append(f'{file}: nie można odczytać HTML/JSON ({error})')
            continue
        if not any(schema.get('@type') == 'Service' for schema in strona.schematy):
            continue
        sprawdzone += 1
        faq = [q for schema in strona.schematy if schema.get('@type') == 'FAQPage'
               for q in schema.get('mainEntity', [])]
        for question in faq:
            name = tekst(question.get('name', ''))
            answer = tekst(question.get('acceptedAnswer', {}).get('text', ''))
            sprawdz(strona.odpowiedzi.get(name) == [answer], file,
                    f'widoczna odpowiedź różni się od JSON-LD: {name}')
        material_faq = [q for q in faq if q.get('name') == 'Czy w tej cenie jest materiał?']
        tables = [table for table in strona.tabele if table and table[0] and table[0][0] == 'Składnik ceny']
        sprawdz(len(material_faq) == 1 and len(tables) == 1, file,
                'wymagana jedna odpowiedź o materiale i jedna tabela składników')
        if len(material_faq) == len(tables) == 1:
            table = tables[0]
            sprawdz(len(table) >= 3 and len(table[2]) == 3, file, 'brak wiersza materiału z udziałem ceny')
            if len(table) >= 3 and len(table[2]) == 3:
                answer = material_faq[0]['acceptedAnswer']['text']
                share = re.fullmatch(r'(\d+)%', table[2][2])
                sprawdz(bool(share), file, 'udział materiału nie jest procentem')
                if table[2][1] == 'własny':
                    bez_materialu += 1
                    sprawdz(table[2][2] == '0%' and answer.startswith('Nie,')
                            and not re.search(r'\d+%', answer), file,
                            'pozycja bez materiału sugeruje wliczenie go w cenę')
                else:
                    material += 1
                    shares = re.findall(r'(\d+)%', answer)
                    sprawdz(bool(share) and shares == [share.group(1)] and answer.startswith('Tak,'),
                            file, f'udział materiału w FAQ {shares} nie zgadza się z tabelą {table[2][2]}')
        required = {'#cena', '#policz-koszt', '#pytania'}
        allowed = required | {'#ceny-w-miastach'}
        sprawdz(strona.nav_count == 1 and required <= set(strona.skroty) <= allowed
                and len(strona.skroty) == len(set(strona.skroty)), file,
                'brak kompletnej, unikalnej nawigacji po stronie usługi')
        for href in strona.skroty:
            sprawdz(href.startswith('#') and strona.ids[href[1:]] == 1, file,
                    f'skrót {href} nie wskazuje jednego istniejącego elementu')

    if not sprawdzone:
        bledy.append('Nie znaleziono żadnej strony usługi. Uruchom najpierw node build.mjs.')
    if bledy:
        print(f'ODPOWIEDZI: {len(bledy)} problemów na {sprawdzone} stronach:')
        for error in bledy[:15]:
            print('  -', error)
        raise SystemExit(1)
    print(f'Odpowiedzi zgodne z tabelami i JSON-LD: {sprawdzone} stron '
          f'({material} z materiałem, {bez_materialu} bez materiału); skróty prowadzą do istniejących sekcji.')


if __name__ == '__main__':
    main()
