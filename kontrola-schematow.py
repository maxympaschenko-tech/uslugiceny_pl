"""Kontrola danych strukturalnych na wygenerowanych stronach.

Blad w schemacie nie psuje strony, tylko po cichu odbiera rozszerzone wyniki
w wyszukiwarce. Nie widac go ani w przegladarce, ani w audycie stron, dlatego
sprawdzamy go osobno: poprawnosc JSON, obecnosc wymaganych pol i sensownosc
wartosci, na przyklad czy dolna cena nie jest wyzsza od gornej.
"""
import glob, re, json, sys
from collections import Counter

bledy = []
typy = Counter()
strony = glob.glob('dist/**/index.html', recursive=True) + ['dist/404.html']

for f in strony:
    h = open(f, encoding='utf-8').read()
    for raw in re.findall(r'application/ld\+json">(.*?)</script>', h, re.S):
        try:
            d = json.loads(raw)
        except Exception as e:
            bledy.append(f"{f}: niepoprawny JSON ({str(e)[:40]})")
            continue
        t = d.get('@type')
        typy[t] += 1
        if not d.get('@context'):
            bledy.append(f"{f}: {t} bez @context")
        if t == 'FAQPage':
            if not d.get('mainEntity'):
                bledy.append(f"{f}: FAQPage bez pytan")
            for q in d.get('mainEntity', []):
                if not q.get('name'):
                    bledy.append(f"{f}: pytanie bez tresci")
                odp = (q.get('acceptedAnswer') or {}).get('text', '')
                if len(odp) < 20:
                    bledy.append(f"{f}: odpowiedz krotsza niz 20 znakow")
        if t == 'HowTo':
            if not d.get('step'):
                bledy.append(f"{f}: HowTo bez krokow")
            for k in d.get('step', []):
                if not k.get('text'):
                    bledy.append(f"{f}: krok HowTo bez opisu")
        if t == 'BreadcrumbList':
            for it in d.get('itemListElement', []):
                if 'position' not in it or not it.get('item'):
                    bledy.append(f"{f}: okruszek bez pozycji lub adresu")
        if t == 'Service':
            o = d.get('offers') or {}
            if o:
                lo, hi = o.get('lowPrice'), o.get('highPrice')
                if lo is None or hi is None:
                    bledy.append(f"{f}: Service bez zakresu cen")
                elif lo > hi:
                    bledy.append(f"{f}: dolna cena wyzsza od gornej")

if bledy:
    print(f"ZNALEZIONO {len(bledy)} problemow:")
    for b in bledy[:15]:
        print('  -', b)
    sys.exit(1)
print('Schematy poprawne: ' + ', '.join(f'{t} {n}' for t, n in sorted(typy.items(), key=lambda x: -x[1])))
