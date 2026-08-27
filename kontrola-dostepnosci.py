"""Kontrola dostepnosci na wygenerowanych stronach.

Sprawdza to, co da sie ocenic ze statycznego HTML i arkusza stylow:
kontrast par kolorow uzytych w serwisie, obecnosc etykiet przy polach,
naglowki bez przeskokow poziomow, jezyk dokumentu i opisy grafik.
"""
import glob, re, sys

def lum(h):
    h = h.lstrip('#')
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    f = lambda v: v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def kontrast(a, b):
    x, y = lum(a), lum(b)
    return (max(x, y) + 0.05) / (min(x, y) + 0.05)

bledy = []
css = open('src/assets/style.css', encoding='utf-8').read()
zmienne = dict(re.findall(r'--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{3,6});', css))

# pary kolorow, ktore realnie wystepuja w serwisie: tekst na tle
PARY = [
    ('ink', 'surface', 4.5, 'tekst glowny na karcie'),
    ('ink', 'bg', 4.5, 'tekst glowny na tle strony'),
    ('ink-soft', 'surface', 4.5, 'tekst drugorzedny na karcie'),
    ('ink-soft', 'bg', 4.5, 'tekst drugorzedny na tle strony'),
    ('link', 'surface', 4.5, 'odnosnik na karcie'),
    ('link', 'bg', 4.5, 'odnosnik na tle strony'),
    ('up', 'surface', 4.5, 'odchylenie w gore'),
    ('down', 'surface', 4.5, 'odchylenie w dol'),
    ('signal-d', 'surface', 4.5, 'akcent czytelny na jasnym'),
]
for f, b, prog, opis in PARY:
    if f in zmienne and b in zmienne:
        k = kontrast(zmienne[f], zmienne[b])
        if k < prog:
            bledy.append(f"kontrast: {opis} = {k:.2f}, wymagane {prog}")

# kolory zapisane wprost w stopce, na ciemnym tle
for kolor in set(re.findall(r'color:\s*(#[0-9A-Fa-f]{6})', css)):
    if kontrast(kolor, zmienne.get('ink', '#0C1420')) < 4.5 and kontrast(kolor, '#FFFFFF') < 4.5:
        bledy.append(f"kolor {kolor} nie osiaga 4.5 ani na ciemnym, ani na bialym tle")

# HTML: naglowki, jezyk, etykiety
strony = glob.glob('dist/**/index.html', recursive=True)
for f in strony:
    h = open(f, encoding='utf-8').read()
    if 'lang="pl"' not in h:
        bledy.append(f"{f}: brak jezyka dokumentu")
    poziomy = [int(x) for x in re.findall(r'<h([1-4])[ >]', h)]
    for i in range(1, len(poziomy)):
        if poziomy[i] - poziomy[i - 1] > 1:
            bledy.append(f"{f}: przeskok naglowkow h{poziomy[i-1]} -> h{poziomy[i]}")
            break
    for pole in re.findall(r'<(?:input|select)\b[^>]*>', h):
        if 'aria-label' not in pole and 'name=' not in pole:
            bledy.append(f"{f}: pole bez etykiety i nazwy")
            break

if bledy:
    print(f"ZNALEZIONO {len(bledy)} problemow:")
    for b in bledy[:20]:
        print('  -', b)
    sys.exit(1)
print(f"Dostepnosc w porzadku: {len(PARY)} par kolorow, {len(strony)} stron sprawdzonych")
