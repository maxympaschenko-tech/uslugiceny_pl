"""Czy ta sama pozycja pokazuje tę samą kwotę na wszystkich stronach.

Cena jednej roboty pojawia się w kilku niezależnie generowanych miejscach:
na stronie pozycji, w pełnym cenniku, w cenniku miasta i na stronie kategorii.
Każde z nich liczy ją osobno, więc pomyłka w jednym miejscu daje serwis, który
sam sobie przeczy. To gorsze niż błędna stawka: podważa zaufanie do całości.

Uruchomienie:  python3 narzedzia/spojnosc-cen.py
"""
import json
import re
import sys
import unicodedata


def slugify(nazwa):
    s = nazwa.lower()
    for a, b in [('ą','a'),('ć','c'),('ę','e'),('ł','l'),('ń','n'),
                 ('ó','o'),('ś','s'),('ź','z'),('ż','z')]:
        s = s.replace(a, b)
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')


def kwota_na_stronie(sciezka, nazwa):
    """Kwota w kolumnie „razem" przy nazwie pozycji.

    Tabele mają różną budowę: pełny cennik ma cztery kolumny i liczby bez
    jednostki, strona kategorii trzy kolumny z „zł". Szukamy więc ostatniej
    komórki wyróżnionej pogrubieniem w wierszu tej pozycji."""
    try:
        h = open(sciezka, encoding='utf-8').read()
    except FileNotFoundError:
        return None
    i = h.find('>' + nazwa + '<')
    if i < 0:
        return None
    koniec = h.find('</tr>', i)
    if koniec < 0:
        return None
    wiersz = h[i:koniec]
    kwoty = re.findall(r'<b>\s*([\d\s\u00a0]+?)\s*(?:zł)?\s*</b>', wiersz)
    if not kwoty:
        return None
    return int(kwoty[-1].replace('\u00a0', '').replace(' ', ''))


def main():
    dane = json.load(open('src/data/works.json', encoding='utf-8'))
    kategorie = {c['id']: c for c in dane['categories']}

    niezgodne = []
    sprawdzonych = 0
    for w in dane['works']:
        cat = kategorie[w['cat']]
        mult = 5 if w.get('perCm') else 1
        oczekiwana = round(w['labour'] + w['material'] * mult)

        zrodla = {
            'pełny cennik': 'dist/cennik/index.html',
            f'kategoria {cat["name"]}': f'dist/uslugi/{cat["slug"]}/index.html',
        }
        for opis, plik in zrodla.items():
            znaleziona = kwota_na_stronie(plik, w['name'])
            if znaleziona is None:
                continue
            sprawdzonych += 1
            if abs(znaleziona - oczekiwana) > 1:
                niezgodne.append(f'{w["name"]}: {opis} pokazuje {znaleziona} zł, '
                                 f'a z danych wychodzi {oczekiwana} zł')

    if niezgodne:
        print('NIEZGODNE KWOTY MIEDZY STRONAMI:')
        for n in niezgodne[:15]:
            print('  -', n)
        print(f'\nRazem: {len(niezgodne)} rozbieznosci na {sprawdzonych} porownan.')
        sys.exit(1)

    print(f'Ceny spojne: {sprawdzonych} porownan, '
          f'kazda pozycja pokazuje te sama kwote we wszystkich miejscach.')


if __name__ == '__main__':
    main()
