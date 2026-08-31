"""Wykrywanie elementów, które mogą rozpychać stronę na wąskim ekranie.

Poziome przewijanie na telefonie to poważna wada wygody, a żadna z pozostałych
kontroli go nie widzi: znaczniki są poprawne, kontrast w normie, schematy ważne.
Wychodzi dopiero przy pomiarze szerokości dokumentu w przeglądarce.

To narzędzie działa statycznie, więc nie zastąpi pomiaru, ale wyłapuje typowe
przyczyny: elementy o sztywnej szerokości w pikselach, tabele bez opakowania
z przewijaniem, długie słowa bez możliwości złamania oraz siatki, których dzieci
nie mogą się skurczyć.

Uruchomienie:  python3 narzedzia/szerokosc.py
"""
import collections
import glob
import re
import sys

PROG_PX = 360          # najwęższy ekran, jaki bierzemy pod uwagę
DLUGIE_SLOWO = 28      # znaków bez spacji i dywizu


def sprawdz_strone(html):
    problemy = []

    # sztywne szerokości w pikselach przekraczające próg
    for m in re.finditer(r'(?:width|min-width)\s*:\s*(\d{3,})px', html):
        if int(m.group(1)) > PROG_PX:
            problemy.append(f'sztywna szerokość {m.group(1)}px')

    # tabele bez opakowania umożliwiającego przewijanie
    for m in re.finditer(r'<table[^>]*>', html):
        przed = html[max(0, m.start() - 220):m.start()]
        if 'board-wrap' not in przed and 'overflow' not in przed:
            problemy.append('tabela bez opakowania z przewijaniem')

    # bardzo długie ciągi bez spacji: adresy, identyfikatory, nazwy plików
    tekst = re.sub(r'<[^>]+>', ' ', re.sub(r'<script.*?</script>', ' ', html, flags=re.S))
    for slowo in tekst.split():
        czyste = slowo.strip('.,;:()„”"')
        if len(czyste) > DLUGIE_SLOWO and '-' not in czyste and '/' not in czyste:
            problemy.append(f'długie słowo bez złamania: {czyste[:34]}')

    return problemy


def main():
    strony = glob.glob('dist/**/index.html', recursive=True)
    if not strony:
        raise SystemExit('BLAD: brak stron w dist/. Uruchom najpierw node build.mjs.')

    # arkusz stylów musi pozwalać dzieciom siatek kurczyć się poniżej zawartości,
    # inaczej overflow-x na opakowaniu tabeli nie zadziała
    css = open('dist/assets/style.css', encoding='utf-8').read()
    braki = []
    if 'min-width: 0' not in css:
        braki.append('brak reguły min-width: 0 dla dzieci siatek')

    znaleziska = collections.Counter()
    przyklady = {}
    for f in strony:
        for p in sprawdz_strone(open(f, encoding='utf-8').read()):
            klucz = p.split(':')[0]
            znaleziska[klucz] += 1
            przyklady.setdefault(klucz, (f[5:], p))

    if not znaleziska and not braki:
        print(f'Szerokość w porządku: {len(strony)} stron, brak typowych przyczyn '
              f'poziomego przewijania.')
        return

    print('MOŻLIWE PRZYCZYNY POZIOMEGO PRZEWIJANIA:')
    for b in braki:
        print(f'  {b}')
    for klucz, n in znaleziska.most_common():
        plik, pelny = przyklady[klucz]
        print(f'  {klucz:44} {n:5}x')
        print(f'    {plik}: {pelny[:70]}')
    sys.exit(1)


if __name__ == '__main__':
    main()
