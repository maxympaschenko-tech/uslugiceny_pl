"""Pomiar powtarzalności treści w wygenerowanym serwisie.

Przy generowaniu tysiąca stron z jednego szablonu łatwo nie zauważyć, że jakieś
zdanie stoi identycznie na kilkuset z nich. Taki tekst przestaje być odpowiedzią,
a staje się wypełniaczem: widać to i po stronie czytelnika, i po stronie
wyszukiwarki.

Nie każde powtórzenie jest błędem. Rada jest z natury taka sama dla wszystkich
pozycji, więc może się powtarzać. Opis konkretnej pozycji powtarzać się nie
powinien: jeśli to samo zdanie pasuje do wylewki i do montażu wanny, to znaczy,
że nie mówi nic o żadnej z nich.

Uruchomienie:  python3 narzedzia/powtorzenia.py [ile]
"""
import collections
import glob
import re
import sys

ILE = int(sys.argv[1]) if len(sys.argv) > 1 else 12
MIN_DL, MAX_DL = 60, 220


def tresc_strony(html):
    """Sam tekst treści, bez nawigacji, stopki i danych strukturalnych."""
    srodek = html.split('<main')[1].split('</main>')[0] if '<main' in html else html
    srodek = re.sub(r'<script.*?</script>', ' ', srodek, flags=re.S)
    srodek = re.sub(r'<style.*?</style>', ' ', srodek, flags=re.S)
    return re.sub(r'<[^>]+>', ' ', srodek)


def main():
    strony = glob.glob('dist/**/index.html', recursive=True)
    if not strony:
        raise SystemExit('BLAD: brak stron w dist/. Uruchom najpierw node build.mjs.')

    zdania = collections.Counter()
    gdzie = collections.defaultdict(set)
    for f in strony:
        tekst = tresc_strony(open(f, encoding='utf-8').read())
        for z in re.split(r'(?<=[.!?])\s+', tekst):
            z = ' '.join(z.split())
            if MIN_DL < len(z) < MAX_DL:
                zdania[z] += 1
                gdzie[z].add(f.split('/')[1] if '/' in f[5:] else 'root')

    print(f'Przeanalizowano {len(strony)} stron, {len(zdania)} różnych zdań.\n')
    print(f'{ILE} najczęściej powtarzanych:')
    for z, n in zdania.most_common(ILE):
        udzial = round(n / len(strony) * 100)
        sekcje = ', '.join(sorted(gdzie[z])[:3])
        print(f'  {n:5}x ({udzial:2}% stron)  {z[:76]}')
        print(f'          w: {sekcje}')

    powyzej_100 = sum(1 for _, n in zdania.items() if n > 100)
    print(f'\nZdań powtórzonych na ponad stu stronach: {powyzej_100}')
    print('Sprawdź, czy każde z nich jest radą (może się powtarzać), '
          'czy opisem pozycji (powinno być liczone z danych).')


if __name__ == '__main__':
    main()
