"""Kontrola spojnosci danych cennika.

Sprawdza rzeczy, ktorych nie widac na stronie, a ktore psuja wyliczenia:
brakujace pola, pozycje wskazujace na nieistniejace kategorie, stawki zerowe
oraz zgodnosc slownych opisow roznicy cen w porownaniach z rzeczywistymi liczbami.
Uruchamiane w CI razem z audytem stron.
"""
import json, re, sys

works = json.load(open('src/data/works.json'))
cities = json.load(open('src/data/cities.json'))
by = {x['id']: x for x in works['works']}
kat = {c['id'] for c in works['categories']}
jedn = set(works['units'])
scope = works['standardScope']
bledy = []


def sprawdz(warunek, opis):
    if not warunek:
        bledy.append(opis)


# --- struktura pozycji ---
for x in works['works']:
    sprawdz(x['cat'] in kat, f"pozycja {x['id']}: nieznana kategoria {x['cat']}")
    sprawdz(x['unit'] in jedn, f"pozycja {x['id']}: nieznana jednostka {x['unit']}")
    sprawdz(x['labour'] > 0, f"pozycja {x['id']}: robocizna nie jest dodatnia")
    sprawdz(x['material'] >= 0, f"pozycja {x['id']}: ujemny material")
    sprawdz(bool(x.get('name')), f"pozycja {x['id']}: brak nazwy")
    sprawdz(len(x.get('factors', [])) >= 3, f"pozycja {x['id']}: mniej niz trzy czynniki cenowe")

# --- zrodla przypisane do kategorii ---
liczba_zrodel = len(works['meta'].get('sources', []))
for c in works['categories']:
    z = c.get('zrodla')
    sprawdz(bool(z), f"kategoria {c['id']}: brak wskazania zrodel stawek")
    for i in (z or []):
        sprawdz(0 <= i < liczba_zrodel, f"kategoria {c['id']}: zrodlo o numerze {i} nie istnieje")

# --- zakres standardowy ---
for i in scope['items']:
    sprawdz(i in by, f"zakres standardowy wskazuje na nieistniejaca pozycje {i}")
for g, ids in scope['groups'].items():
    for i in ids:
        sprawdz(i in scope['items'], f"grupa {g} wskazuje poza zakres: {i}")
sprawdz(scope['doorsItem'] in by, 'doorsItem wskazuje na nieistniejaca pozycje')

# --- miasta ---
for c in cities:
    for pole in ('slug', 'name', 'loc', 'coef', 'opis'):
        sprawdz(pole in c, f"miasto {c.get('slug')}: brak pola {pole}")
    sprawdz(0.5 < c['coef'] < 2, f"miasto {c['slug']}: podejrzany wspolczynnik {c['coef']}")
naj_tani = min(cities, key=lambda c: c['coef'])
for c in cities:
    tekst = ' '.join(c.get('opis', []))
    if 'najtańszym miastem w tym zestawieniu' in tekst:
        sprawdz(c is naj_tani, f"miasto {c['slug']} nazywa sie najtanszym, a najnizszy wspolczynnik ma {naj_tani['slug']}")

# --- opisy roznicy cen w porownaniach ---
src = open('src/pages-extra.mjs', encoding='utf-8').read()
# Wpisy porownan rozbijamy na bloki i czytamy pola osobno. Poprzednia wersja
# wymagala sztywnej kolejnosci slug, h1, a, b, lede i po dopisaniu pola
# "przyklad" przestala cokolwiek znajdowac: kontrola milczala, zamiast
# zglosic blad. Milczaca kontrola jest gorsza od jej braku.
por = []
for blok in re.split(r"\n  \{\n", src):
    slug = re.search(r"slug: '([^']+)'", blok)
    a = re.search(r"\ba: '([^']+)'", blok)
    b = re.search(r"\bb: '([^']+)'", blok)
    lede = re.search(r"lede: '([^']*)'", blok)
    if not (slug and a and b and lede):
        continue
    cm = re.search(r"\bcm: (\d+)", blok)
    por.append((slug.group(1), a.group(1), b.group(1), cm.group(1) if cm else None, lede.group(1)))
# Jesli parsowanie przestanie dzialac po zmianie formatu wpisow, chcemy o tym
# wiedziec od razu, a nie dowiedziec sie po miesiacach, ze kontrola milczy.
liczba_w_pliku = src.count("    werdykt:")
sprawdz(len(por) == liczba_w_pliku,
        f"kontrola porownan znalazla {len(por)} wpisow, a w pliku jest {liczba_w_pliku}: "
        f"prawdopodobnie zmienil sie format i regula przestala dzialac")

# Miasta musza miec komplet form gramatycznych. Brak ktorejkolwiek konczy sie
# sklejaniem przyimka z mianownikiem, czyli bledem, ktory wracal osiem razy.
for m in cities:
    for pole, opis in [('loc', 'miejscownik'), ('gen', 'dopelniacz')]:
        sprawdz(bool(m.get(pole)), f"miasto {m['name']}: brak formy '{pole}' ({opis})")

progi = {'dwa razy': (1.7, 2.4), 'trzy razy': (2.6, 3.4), 'półtora raza': (1.35, 1.7)}
for slug, a, b, cm, lede in por:
    cm = int(cm) if cm else 1
    def tot(i):
        x = by[i]
        return x['labour'] + x['material'] * (cm if x.get('perCm') else 1)
    r = tot(b) / tot(a)
    for slowo, (lo, hi) in progi.items():
        if slowo in lede:
            sprawdz(lo <= r <= hi,
                    f"porownanie {slug}: opis mowi '{slowo}', a rzeczywisty stosunek to {r:.2f}")

# --- kazda pozycja musi byc powiazana z trescia ---
guides = open('src/pages-guides.mjs', encoding='utf-8').read()
slownik = open('src/pages-slownik.mjs', encoding='utf-8').read()
wskazane = set(re.findall(r"w: '([a-z_]+)'", guides))
wskazane |= set(re.findall(r"a: '([a-z_]+)', b: '([a-z_]+)'", src) and
                [x for para in re.findall(r"a: '([a-z_]+)', b: '([a-z_]+)'", src) for x in para])
wskazane |= set(re.findall(r"',\s*'([a-z_]+)'\],", slownik))
osierocone = [x['id'] for x in works['works'] if x['id'] not in wskazane]
sprawdz(not osierocone,
        f"pozycje bez powiazania z poradnikiem, porownaniem ani slownikiem: {', '.join(osierocone)}")

# --- kazda pozycja opisana w poradniku ---
# Powiazanie z trescia (regula wyzej) moze byc spelnione samym haslem slownika.
# Ta regula idzie dalej: kazda robota ma tez pojawiac sie w ktoryms poradniku
# jako etap prac, bo dopiero to pokazuje, kiedy sie ja wykonuje i po czym.
kroki_poradnikow = set(re.findall(r"w: '([a-z_]+)'", guides))
poza_poradnikami = [x['id'] for x in works['works'] if x['id'] not in kroki_poradnikow]
sprawdz(not poza_poradnikami,
        f"pozycje nieopisane w zadnym poradniku: {', '.join(poza_poradnikami)}")

# --- stan weryfikacji stawek ---
# Pozycja "sprawdzona punktowo" ma w zrodle konkretna liczbe. Reszta pochodzi
# z przedzialu dla calej grupy robot i jest na stronie oznaczona jako orientacyjna.
sprawdzone = [x for x in works['works'] if x.get('sprawdzone')]
niesprawdzone = [x for x in works['works'] if not x.get('sprawdzone')]
print(f"Weryfikacja stawek: {len(sprawdzone)} punktowo, {len(niesprawdzone)} z przedzialu grupy")
if niesprawdzone:
    wg_kat = {}
    for x in niesprawdzone:
        wg_kat.setdefault(x['cat'], []).append(x['name'])
    for kat, lista in sorted(wg_kat.items(), key=lambda t: -len(t[1]))[:4]:
        print(f"  {kat}: {len(lista)} pozycji, np. {lista[0]}")
print()

if bledy:
    print(f"ZNALEZIONO {len(bledy)} problemow:")
    for b in bledy:
        print('  -', b)
    sys.exit(1)
print(f"Dane spojne: {len(works['works'])} pozycji, {len(works['categories'])} kategorii, "
      f"{len(cities)} miast, {len(por)} porownan, wszystkie pozycje powiazane z trescia")
