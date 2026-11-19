import { PORADNIKI } from '../src/pages-guides.mjs';
import works from '../src/data/works.json' with { type: 'json' };
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Jeden test bez sieci, uruchamiany: npm run check:guides
const prace = new Set(works.works.map(w => w.id));
const seen = new Set();
const errors = [];
const mediaHashes = new Set();
let nImages = 0;
let nFAQ = 0, nSteps = 0;
for (const p of PORADNIKI) {
  if (!p.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) errors.push('Błędny slug: ' + p.slug);
  if (seen.has(p.slug)) errors.push('Powtórzony slug: ' + p.slug);
  seen.add(p.slug);
  if (!p.h1 || !p.title || !p.desc || !p.lede || !p.wstep) errors.push(p.slug + ': brak wymaganej treści');
  if (p.desc?.length > 190) errors.push(p.slug + ': opis SEO przekracza 190 znaków');
  if (!Array.isArray(p.kroki) || p.kroki.length < 5) errors.push(p.slug + ': zbyt mało kroków');
  for (const k of p.kroki || []) {
    if (!k.t || !k.txt || k.txt.length < 40) errors.push(p.slug + ': niepełny etap');
    if (k.w && !prace.has(k.w)) errors.push(p.slug + ': brak pozycji cennika ' + k.w);
    nSteps++;
  }
  if (!Array.isArray(p.faq) || p.faq.length < 3) errors.push(p.slug + ': zbyt mało FAQ');
  for (const [q, a] of p.faq || []) {
    if (!q || !a) errors.push(p.slug + ': niepełne FAQ');
    nFAQ++;
  }
  if (p.kosztWorkId && !prace.has(p.kosztWorkId)) errors.push(p.slug + ': brak głównej pozycji ceny');
  for (const source of p.zrodla || []) {
    try { if (new URL(source[1]).protocol !== 'https:') throw Error(); }
    catch { errors.push(p.slug + ': błędny adres źródła'); }
  }
  if (p.wideo && !/^[A-Za-z0-9_-]{11}$/.test(p.wideo.id)) errors.push(p.slug + ': błędny identyfikator filmu');
  // Każdy poradnik musi mieć własny obraz. Nie publikujemy pustych kart
  // ani jednego identycznego schematu dla kilku odmiennych prac.
  const picturePath = 'src/assets/media/' + p.slug + '.svg';
  try {
    const picture = readFileSync(picturePath, 'utf8');
    if (!picture.includes('<svg ') || !picture.includes('</svg>') || !picture.includes('<title ')) {
      errors.push(p.slug + ': uszkodzony lub nieopisany SVG');
    }
    if (picture.length > 60_000) errors.push(p.slug + ': SVG jest zbyt duży');
    const fingerprint = createHash('sha256').update(picture).digest('hex');
    if (mediaHashes.has(fingerprint)) errors.push(p.slug + ': powtórzony schemat zamiast własnej ilustracji');
    mediaHashes.add(fingerprint);
    nImages++;
  } catch {
    errors.push(p.slug + ': brak ilustracji ' + picturePath);
  }

}
if (errors.length) {
  errors.forEach(x => console.error('BŁĄD: ' + x));
  process.exitCode = 1;
} else {
  console.log('Poradniki OK: ' + seen.size + ' artykułów, ' + nImages + ' unikatowych ilustracji, ' + nSteps + ' etapów, ' + nFAQ + ' FAQ.');
}
