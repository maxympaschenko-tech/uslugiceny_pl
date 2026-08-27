import glob, re, os, json
from collections import Counter, defaultdict

strony = glob.glob('dist/**/index.html', recursive=True) + ['dist/404.html']
dane = {}
for f in strony:
    h = open(f, encoding='utf-8').read()
    url = '/' + os.path.relpath(f, 'dist').replace('index.html', '').replace('\\', '/')
    dane[url] = {
        'title': (re.search(r'<title>(.*?)</title>', h, re.S) or [None, ''])[1],
        'desc': (re.search(r'name="description" content="(.*?)"', h, re.S) or [None, ''])[1],
        'h1': len(re.findall(r'<h1', h)),
        'linki': set(re.findall(r'href="(/[^"#?]*)', h)),
        'canon': (re.search(r'rel="canonical" href="(.*?)"', h) or [None, ''])[1],
    }

print('=== stron przeanalizowanych:', len(dane))

t = Counter(d['title'] for d in dane.values())
dupT = {k: v for k, v in t.items() if v > 1}
print('\n--- powtorzone tytuly:', len(dupT))
for k, v in list(dupT.items())[:5]: print('   ', v, 'x', k[:70])

d_ = Counter(d['desc'] for d in dane.values())
dupD = {k: v for k, v in d_.items() if v > 1 and k}
print('--- powtorzone opisy:', len(dupD))
for k, v in list(dupD.items())[:5]: print('   ', v, 'x', k[:70])

dlugie = [(u, len(x['title'])) for u, x in dane.items() if len(x['title']) > 65]
print('--- tytuly dluzsze niz 65 znakow:', len(dlugie))
for u, n in sorted(dlugie, key=lambda x: -x[1])[:5]: print('   ', n, u)

zleH1 = [u for u, x in dane.items() if x['h1'] != 1]
print('--- strony bez dokladnie jednego H1:', len(zleH1), zleH1[:5])

# martwe odnosniki wewnetrzne
wszystkie = set(dane.keys())
pliki = {'/' + os.path.relpath(p, 'dist').replace('\\','/') for p in glob.glob('dist/**/*.*', recursive=True)}
martwe = defaultdict(list)
for u, x in dane.items():
    for l in x['linki']:
        if l in wszystkie or l in pliki or l.rstrip('/') + '/' in wszystkie:
            continue
        martwe[l].append(u)
print('--- martwe odnosniki wewnetrzne:', len(martwe))
for l, gdzie in list(martwe.items())[:8]: print('   ', l, '<-', len(gdzie), 'stron')

# waga stron: budzet pilnuje, zeby kolejne sekcje nie rozdely dokumentu
import os
ciezkie = [(u, round(os.path.getsize(f)/1024)) for f, u in
           ((f, '/' + os.path.relpath(f, 'dist').replace('index.html', '').replace('\\','/')) for f in strony)
           if os.path.getsize(f) > 120 * 1024]
print('--- strony ciezsze niz 120 kB:', len(ciezkie))
for u, kb in sorted(ciezkie, key=lambda x: -x[1])[:5]: print('   ', kb, 'kB', u)
css_kb = round(os.path.getsize('dist/assets/style.css')/1024)
print('--- arkusz stylow kB:', css_kb, '(budzet 45)')

# strony bez zadnego linku przychodzacego
przychodzace = Counter()
for x in dane.values():
    for l in x['linki']:
        przychodzace[l if l.endswith('/') else l + '/'] += 1
sieroty = [u for u in wszystkie if przychodzace.get(u, 0) == 0 and u != '/']
print('--- strony bez linkow przychodzacych:', len(sieroty))
for u in sieroty[:10]: print('   ', u)
