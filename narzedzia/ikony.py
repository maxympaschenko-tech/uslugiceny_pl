"""Generowanie kompletu ikon ze znaku marki.

Znak: trzy słupki jako poziomy standardu (ekonomiczny, standardowy, premium),
środkowy w kolorze sygnałowym. Ten sam kształt jest w nagłówku strony jako SVG
w src/templates.mjs, więc przy zmianie geometrii trzeba poprawić oba miejsca.

Uruchomienie:  python3 narzedzia/ikony.py
Wynik:         pliki w src/assets/, gotowe do skopiowania przez build.mjs
"""
from PIL import Image, ImageDraw, ImageFont
import glob
import os

INK = (12, 20, 32)
ZOLTY = (255, 201, 61)
BIALY = (255, 255, 255)
SZARY = (141, 154, 172)

# geometria z SVG: viewBox 48x48, słupki x=11/20.5/30 o szerokości 7
SLUPKI = [(11, 27, 11, BIALY), (20.5, 20, 18, ZOLTY), (30, 13, 25, BIALY)]
KATALOG = 'src/assets'


def znak(rozmiar, promien_frac=0.1875, tlo=INK):
    """Znak na zaokrąglonym kwadracie. Rysujemy w ośmiokrotnej skali
    i zmniejszamy, bo Pillow nie ma wygładzania krawędzi przy rysowaniu."""
    S = rozmiar * 8
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * promien_frac), fill=tlo)
    sk = S / 48
    for x, y, h, kolor in SLUPKI:
        d.rounded_rectangle(
            [x * sk, y * sk, (x + 7) * sk, (y + h) * sk],
            radius=max(1, int(2 * sk)), fill=kolor)
    return img.resize((rozmiar, rozmiar), Image.LANCZOS)


def maskowalna(rozmiar=512, udzial=0.72):
    """Wersja dla launcherów, które przycinają ikonę do koła.
    Znak centrowany według własnych krawędzi, a nie środka viewBoxa:
    słupki zajmują x 11..37 i y 13..38, więc centrowanie płótna
    dawałoby przesunięcie w prawo i w dół."""
    S = rozmiar * 4
    img = Image.new('RGB', (S, S), INK)
    d = ImageDraw.Draw(img)
    x0 = min(x for x, *_ in SLUPKI)
    x1 = max(x + 7 for x, *_ in SLUPKI)
    y0 = min(y for _, y, *_ in SLUPKI)
    y1 = max(y + h for _, y, h, _ in SLUPKI)
    sk = S * udzial / max(x1 - x0, y1 - y0)
    ox = (S - (x1 - x0) * sk) / 2 - x0 * sk
    oy = (S - (y1 - y0) * sk) / 2 - y0 * sk
    for x, y, h, kolor in SLUPKI:
        d.rounded_rectangle(
            [ox + x * sk, oy + y * sk, ox + (x + 7) * sk, oy + (y + h) * sk],
            radius=max(1, int(2 * sk)), fill=kolor)
    return img.resize((rozmiar, rozmiar), Image.LANCZOS)


def font(rozm, waga='Bold'):
    for wzor in (f'/usr/share/fonts/**/*Archivo*{waga}*.ttf',
                 f'/usr/share/fonts/**/DejaVuSans-{waga}.ttf',
                 '/usr/share/fonts/**/DejaVuSans.ttf'):
        znalezione = glob.glob(wzor, recursive=True)
        if znalezione:
            return ImageFont.truetype(znalezione[0], rozm)
    return ImageFont.load_default()


def obraz_udostepnien(naglowek, podtytul, stopka):
    """Obraz 1200x630 pokazywany przy udostępnianiu linku."""
    img = Image.new('RGB', (1200, 630), INK)
    d = ImageDraw.Draw(img)
    sk, ox, oy = 2.4, 80, 70
    d.rounded_rectangle([ox, oy, ox + 48 * sk, oy + 48 * sk], radius=int(9 * sk), fill=BIALY)
    for x, y, h, kolor in SLUPKI:
        d.rounded_rectangle(
            [ox + x * sk, oy + y * sk, ox + (x + 7) * sk, oy + (y + h) * sk],
            radius=int(2 * sk), fill=INK if kolor == BIALY else kolor)
    f = font(48)
    tx, ty = ox + 48 * sk + 26, oy + 38
    d.text((tx, ty), 'uslugiceny', font=f, fill=BIALY)
    d.text((tx + d.textlength('uslugiceny', font=f), ty), '.pl', font=f, fill=SZARY)
    d.text((80, 300), naglowek, font=font(78), fill=BIALY)
    d.text((80, 392), podtytul, font=font(78), fill=ZOLTY)
    d.rectangle([80, 500, 190, 504], fill=ZOLTY)
    d.text((80, 524), stopka, font=font(30, 'Regular'), fill=SZARY)
    return img


# Warianty obrazu udostępnień dla głównych działów. Jeden obraz na cały serwis
# sprawia, że kalkulator łazienki udostępnia się z hasłem o dziesięciu miastach.
WARIANTY = {
    'og-image.png': ('Ile kosztuje remont', 'w dziesięciu miastach',
                     '105 pozycji cennika · robocizna i materiał osobno · 2026'),
    'og-kalkulatory.png': ('Policz kosztorys', 'pozycja po pozycji',
                           '18 kalkulatorów · robocizna i materiał osobno · 2026'),
    'og-poradniki.png': ('Kolejność prac', 'krok po kroku',
                         '14 poradników · co po czym i dlaczego · 2026'),
    'og-miasta.png': ('Stawki lokalne', 'w dziesięciu miastach',
                      'Cennik robót remontowych · aktualizacja 2026'),
}


if __name__ == '__main__':
    os.makedirs(KATALOG, exist_ok=True)
    znak(32).save(f'{KATALOG}/favicon-32.png')
    znak(96).save(f'{KATALOG}/favicon-96.png')
    znak(180, promien_frac=0.0).save(f'{KATALOG}/apple-touch-icon.png')  # iOS zaokrągla sam
    znak(192).save(f'{KATALOG}/icon-192.png')
    znak(512).save(f'{KATALOG}/icon-512.png')
    znak(48).save(f'{KATALOG}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    maskowalna().save(f'{KATALOG}/icon-maskable-512.png', optimize=True)

    with open(f'{KATALOG}/favicon.svg', 'w', encoding='utf-8') as f:
        f.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">\n'
                '<rect width="48" height="48" rx="9" fill="#0C1420"/>\n'
                '<rect x="11" y="27" width="7" height="11" rx="2" fill="#fff"/>\n'
                '<rect x="20.5" y="20" width="7" height="18" rx="2" fill="#FFC93D"/>\n'
                '<rect x="30" y="13" width="7" height="25" rx="2" fill="#fff"/>\n'
                '</svg>\n')

    for plik, (naglowek, podtytul, stopka) in WARIANTY.items():
        obraz_udostepnien(naglowek, podtytul, stopka).save(f'{KATALOG}/{plik}', optimize=True)

    print(f'Gotowe: ikony i {len(WARIANTY)} obrazy udostępnień w', KATALOG)
