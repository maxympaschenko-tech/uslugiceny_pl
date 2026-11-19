// Główna: autorskie ilustracje i opcjonalne WebP.
import { photoForGuide } from './photo-guides.mjs';
const GUIDE_SLUGS = ['remont-lazienki-krok-po-kroku','wylewka-cementowa-krok-po-kroku','sufit-podwieszany-z-plyt-gk-krok-po-kroku','montaz-drzwi-wewnetrznych-krok-po-kroku'];
const CAT_IDS = ['walls','floor','tiles','electric','instalacje','dach'];
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

export const homeFeaturedGuides = (guides, root) => {
 const chosen=GUIDE_SLUGS.map(slug=>guides.find(g=>g.slug===slug));
 if(chosen.some(x=>!x)) throw Error('Brak wybranego poradnika na stronie głównej');
 return `<section class="home-editorial-guide"><div class="wrap">
 <div class="home-media-head"><div><p class="eyebrow">Praktyka przed wyceną</p>
 <h2>Zobacz, jak wyglądają prace remontowe</h2>
 <p class="section-note">Ilustrowane instrukcje krok po kroku: kolejność prac, orientacyjne koszty i najczęstsze błędy.</p></div>
 <a class="home-media-more" href="${root}poradnik/">Wszystkie ${guides.length} poradniki →</a></div>
 <div class="home-media-guides">${chosen.map(p=>`<article class="home-media-card">
 <a class="home-media-photo" href="${root}poradnik/${p.slug}/" aria-label="Czytaj poradnik: ${esc(p.h1)}"><img src="${root}${photoForGuide(p.slug) || "assets/media/" + p.slug + ".svg"}" width="1200" height="675" loading="lazy" decoding="async" alt="${esc(p.h1)} — ilustrowana instrukcja"></a>
 <div class="home-media-card-body"><span class="home-media-type">Poradnik • ${p.kroki.length} etapów</span><h3><a href="${root}poradnik/${p.slug}/">${esc(p.h1)}</a></h3><p>${esc(p.lede)}</p></div>
 </article>`).join('')}</div></div></section>`;
};

export const homeFeaturedCategories = (categories, works, root) => {
 const chosen=CAT_IDS.map(id=>categories.find(c=>c.id===id));
 if(chosen.some(x=>!x)) throw Error('Brak wybranej kategorii');
 return `<div class="home-media-categories">${chosen.map(c=>`<article class="home-category-card">
 <a class="home-category-image" href="${root}uslugi/${c.slug}/" aria-label="Cennik kategorii: ${esc(c.name)}"><img src="${root}assets/category/${c.id}.svg" width="1200" height="675" loading="lazy" decoding="async" alt="${esc(c.name)} — schemat prac"></a>
 <div><h3><a href="${root}uslugi/${c.slug}/">${esc(c.name)}</a></h3><p>${works.filter(w=>w.cat===c.id).length} pozycji w cenniku</p></div>
 </article>`).join('')}</div><p class="section-note">Pełny wykaz wszystkich kategorii:</p>`;
};
