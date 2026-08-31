"""Kontrola usterek językowych w wygenerowanym serwisie.

Sprawdza rzeczy, których nie wychwyci ani audyt stron, ani kontrola danych:
literówki typu „i i", spacje przed interpunkcją, zły zapis waluty, sklejanie
przyimka z nazwą miasta w mianowniku oraz błędne formy liczby mnogiej.

Tekst czytamy tak, jak widzi go czytelnik: znaczniki liniowe (a, span, b) nie
dodają spacji, blokowe tak. Bez tego każdy odnośnik w zdaniu wygląda jak
podwójna spacja i narzędzie tonie w fałszywych trafieniach.

Uruchomienie:  python3 narzedzia/jezyk.py
"""
import collections
import glob
import re
import sys

LINIOWE = r'</?(?:a|span|b|strong|em|i|small|sup|sub|abbr|code)\b[^>]*>'
BLOKOWE = (r'</?(?:p|div|li|ul|ol|h[1-6]|section|table|tr|td|th|br|thead|tbody|'
           r'nav|main|header|footer|form|label|option|select|button|details|summary)\b[^>]*>')

MIASTA = 'Warszawa|Kraków|Wrocław|Poznań|Gdańsk|Łódź|Katowice|Lublin|Bydgoszcz|Białystok'

WZORCE = [
    (r'\b(i i|w w|na na|do do|to to)\b', 'powtórzone słowo'),
    (r'\S +[.,;:](?!\d)', 'spacja przed interpunkcją'),
    (r'\bzl\b', 'zapis „zl" zamiast „zł"'),
    (rf'\bw ({MIASTA})\b', 'przyimek z mianownikiem nazwy miasta'),
    (r'\(\s+|\s+\)', 'spacja wewnątrz nawiasu'),
    (r'\b\d*[2-4] (pozycji|stron|haseł|źródeł)\b', 'zła forma liczby mnogiej'),
]


def tekst(html):
    html = re.sub(r'<script.*?</script>', ' ', html, flags=re.S)
    html = re.sub(r'<style.*?</style>', ' ', html, flags=re.S)
    html = re.sub(LINIOWE, '', html)
    html = re.sub(BLOKOWE, ' | ', html)
    return re.sub(r'<[^>]+>', ' ', html)


def main():
    strony = glob.glob('dist/**/index.html', recursive=True)
    if not strony:
        raise SystemExit('BLAD: brak stron w dist/. Uruchom najpierw node build.mjs.')

    znaleziska = collections.Counter()
    przyklady = {}
    for f in strony:
        t = tekst(open(f, encoding='utf-8').read())
        for wzor, opis in WZORCE:
            for m in re.finditer(wzor, t):
                # wyjątek: 12-14 mają formę dopełniacza i to jest poprawne
                if opis.startswith('zła forma'):
                    liczba = int(re.match(r'\d+', m.group(0)).group(0))
                    if 12 <= liczba % 100 <= 14:
                        continue
                znaleziska[opis] += 1
                przyklady.setdefault(opis, (f[5:], ' '.join(t[max(0, m.start() - 45):m.end() + 25].split())))

    if not znaleziska:
        print(f'Język w porządku: {len(strony)} stron, zero usterek z listy.')
        return

    print(f'ZNALEZIONO USTERKI na {len(strony)} sprawdzonych stronach:')
    for opis, n in znaleziska.most_common():
        plik, kontekst = przyklady[opis]
        print(f'  {opis:42} {n:5}x')
        print(f'    {plik}: ...{kontekst[:80]}')
    sys.exit(1)


if __name__ == '__main__':
    main()
