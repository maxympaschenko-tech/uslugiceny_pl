import { SITE } from './config.mjs';

export const money = (n) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: n < 100 ? 2 : 0 }).format(n);

// Tytul dluzszy niz mniej wiecej 62 znaki wyszukiwarka i tak utnie w polowie zdania.
// Doklejamy wiec ogon tylko wtedy, gdy sie miesci, a jesli nie, zostaje sam rdzen.
export const tytul = (rdzen, ...ogony) => {
  let out = rdzen;
  for (const o of ogony) {
    if ((out + o).length <= 62) out += o;
  }
  return out;
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- szkielet strony ---------- */

export let CSS_V = '';
export const ustawWersjeStylow = (v) => { CSS_V = v; };

export function layout({ title, description, path, body, jsonLd = null, script = '', breadcrumb = null }) {
  const url = SITE.base + path;
  const R = SITE.root;
  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#0C1420">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pl_PL">
<meta property="og:site_name" content="uslugiceny.pl">
<meta property="og:image" content="${SITE.base}${R}og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="uslugiceny.pl - ceny robót remontowych w Polsce">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://www.googletagmanager.com">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700&family=Inter:wght@400;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700&family=Inter:wght@400;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet"></noscript>
<link rel="icon" href="${R}favicon.ico" sizes="32x32">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${R}apple-touch-icon.png">
<link rel="manifest" href="${R}site.webmanifest">
<link rel="stylesheet" href="${R}assets/style.css?v=${CSS_V}">
${jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n') : ''}
<!-- Zgoda: stan domyslny musi byc ustawiony przed kontenerem GTM -->
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
(function(){
  var zapisana = null;
  try { zapisana = JSON.parse(localStorage.getItem('zgoda-cookies') || 'null'); } catch (e) {}
  var stan = {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  };
  if (zapisana && zapisana.analytics === true) {
    stan.analytics_storage = 'granted';
    stan.ad_storage = zapisana.reklama ? 'granted' : 'denied';
    stan.ad_user_data = zapisana.reklama ? 'granted' : 'denied';
    stan.ad_personalization = zapisana.reklama ? 'granted' : 'denied';
  }
  gtag('consent', 'default', stan);
})();
</script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K6J2NCM9');</script>
<!-- End Google Tag Manager -->
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-K6J2NCM9"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="${R}">uslugiceny<span>.pl</span></a>
    <details class="menu">
      <summary aria-label="Menu"><span class="menu-kreski"></span><span class="menu-napis">Menu</span></summary>
      <nav class="nav">
        <a href="${R}"${path === '/' ? ' aria-current="page"' : ''}>Cennik</a>
        <a href="${R}uslugi/"${path.startsWith('/uslugi') ? ' aria-current="page"' : ''}>Usługi</a>
        <a href="${R}kalkulatory/"${path.startsWith('/kalkulator') ? ' aria-current="page"' : ''}>Kalkulatory</a>
        <a href="${R}poradnik/"${path.startsWith('/poradnik') ? ' aria-current="page"' : ''}>Poradniki</a>
        <a href="${R}sprawdz-oferte/"${path.startsWith('/sprawdz-oferte') ? ' aria-current="page"' : ''}>Sprawdź ofertę</a>
        <a href="${R}szukaj/"${path.startsWith('/szukaj') ? ' aria-current="page"' : ''}>Szukaj</a>
      </nav>
    </details>
  </div>
</header>
${breadcrumb ? `<div class="wrap"><nav class="crumbs">${breadcrumb}</nav></div>` : ''}
<main>
${body}
</main>
<footer class="site-foot">
  <div class="wrap">
    <div class="foot-siatka">
      <div class="foot-marka">
        <a class="brand" href="${R}">uslugiceny<span>.pl</span></a>
        <p>Stawki robót remontowych i budowlanych z podziałem na robociznę i materiał. Bez pośrednictwa w zleceniach i bez płatnych miejsc w rankingach.</p>
      </div>
      <div>
        <p class="foot-h">Kalkulatory</p>
        <ul>
          <li><a href="${R}kalkulator/remont-mieszkania/">Remont mieszkania</a></li>
          <li><a href="${R}kalkulator/wykonczenie-pod-klucz/">Wykończenie od dewelopera</a></li>
          <li><a href="${R}kalkulator/pokoj/">Pokój</a></li>
          <li><a href="${R}kalkulator/materialy/">Ile materiału kupić</a></li>
          <li><a href="${R}kalkulator/lazienka/">Łazienka</a></li>
          <li><a href="${R}kalkulator/kuchnia/">Kuchnia</a></li>
          <li><a href="${R}kalkulator/poddasze/">Poddasze</a></li>
          <li><a href="${R}kalkulator/ocieplenie-elewacji/">Ocieplenie elewacji</a></li>
          <li><a href="${R}kalkulator/dach/">Pokrycie dachu</a></li>
          <li><a href="${R}koszty/">Gotowe wyliczenia</a></li>
          <li><a href="${R}kalkulator/wymiana-okien/">Wymiana okien</a></li>
        </ul>
      </div>
      <div>
        <p class="foot-h">Przydatne</p>
        <ul>
          <li><a href="${R}sprawdz-oferte/">Sprawdź ofertę wykonawcy</a></li>
          <li><a href="${R}wybor-ekipy/">Jak wybrać ekipę</a></li>
          <li><a href="${R}jak-czytac-kosztorys/">Jak czytać kosztorys</a></li>
          <li><a href="${R}umowa-z-ekipa/">Umowa z ekipą</a></li>
          <li><a href="${R}odbior-prac/">Odbiór prac</a></li>
          <li><a href="${R}cennik/">Pełny cennik</a></li>
          <li><a href="${R}porownaj-miasta/">Porównaj dwa miasta</a></li>
          <li><a href="${R}struktura-kosztow/">Robocizna czy materiał</a></li>
          <li><a href="${R}kiedy-remontowac/">Kiedy remontować taniej</a></li>
          <li><a href="${R}poradnik/">Poradniki krok po kroku</a></li>
          <li><a href="${R}porownanie/">Porównania rozwiązań</a></li>
          <li><a href="${R}slownik/">Słownik pojęć</a></li>
        </ul>
      </div>
      <div>
        <p class="foot-h">Serwis</p>
        <ul>
          <li><a href="${R}o-nas/">O serwisie</a></li>
          <li><a href="${R}jak-liczymy/">Jak liczymy</a></li>
          <li><a href="${R}aktualizacje/">Historia zmian</a></li>
          <li><a href="${R}kontakt/">Kontakt</a></li>
          <li><a href="${R}polityka-prywatnosci/">Polityka prywatności</a></li>
          <li><a href="#" id="zmien-zgode">Zmień zgodę na cookies</a></li>
        </ul>
      </div>
    </div>

    <details class="foot-miasta">
      <summary>Cenniki robót w miastach</summary>
      <div class="city-links">${SITE.cityLinks}</div>
    </details>

    <p class="foot-dol">Ceny w złotych z VAT, aktualizacja ${SITE.updated}. Wyliczenia mają charakter orientacyjny i nie są ofertą handlową: ostateczną cenę podaje wykonawca po obejrzeniu obiektu.</p>
  </div>
</footer>
<div class="zgoda" id="zgoda" hidden>
  <div class="zgoda-tresc">
    <p><strong>Pliki cookies</strong></p>
    <p>Używamy narzędzi analitycznych Google, żeby zobaczyć, które cenniki i kalkulatory są przydatne. Bez Twojej zgody nie zapisujemy żadnych plików cookies, a strona działa wtedy tak samo: kalkulatory liczą, cenniki się otwierają. Szczegóły w <a href="${R}polityka-prywatnosci/">polityce prywatności</a>.</p>
  </div>
  <div class="zgoda-akcje">
    <button type="button" data-zgoda="tylko-niezbedne">Tylko niezbędne</button>
    <button type="button" data-zgoda="wszystkie" class="glowny">Akceptuję</button>
  </div>
</div>
<script>
(function(){
  var box = document.getElementById('zgoda');
  var KLUCZ = 'zgoda-cookies';
  function zapisz(analytics){
    var v = { analytics: analytics, reklama: false, data: new Date().toISOString() };
    try { localStorage.setItem(KLUCZ, JSON.stringify(v)); } catch (e) {}
    gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    box.hidden = true;
  }
  var juz = null;
  try { juz = localStorage.getItem(KLUCZ); } catch (e) {}
  if (!juz) box.hidden = false;
  box.querySelector('[data-zgoda="wszystkie"]').addEventListener('click', function(){ zapisz(true); });
  box.querySelector('[data-zgoda="tylko-niezbedne"]').addEventListener('click', function(){ zapisz(false); });
  var zmien = document.getElementById('zmien-zgode');
  if (zmien) zmien.addEventListener('click', function(e){
    e.preventDefault();
    try { localStorage.removeItem(KLUCZ); } catch (err) {}
    box.hidden = false;
    box.scrollIntoView({ block: 'end' });
  });
})();
</script>
${script ? `<script>${script}</script>` : ''}
</body>
</html>`;
}

/* ---------- silnik kosztorysu po stronie przeglądarki ---------- */

export const calcScript = `
const F = (n) => new Intl.NumberFormat('pl-PL',{maximumFractionDigits: n < 100 ? 2 : 0}).format(n);
const R = (n) => Math.round(n);

function unitPrice(W, id, coef, levelK, cm){
  const w = W.byId[id];
  if (!w) return { labour: 0, material: 0 };
  const mult = w.perCm && cm ? cm : 1;
  return {
    labour: w.labour * coef * (1 + (levelK - 1) * 0.35),
    material: w.material * mult * (1 + (coef - 1) * 0.2) * levelK,
  };
}

function estimate(W, lines, coef, levelK){
  const out = [];
  let labour = 0, material = 0;
  for (const l of lines){
    if (!l.qty) continue;
    const w = W.byId[l.id];
    const p = unitPrice(W, l.id, coef, levelK, l.cm);
    const lb = p.labour * l.qty, mt = p.material * l.qty;
    labour += lb; material += mt;
    out.push({ id: l.id, cat: w.cat, name: w.name, unit: W.units[w.unit].name, qty: l.qty, labour: lb, material: mt });
  }
  return { lines: out, labour, material, total: labour + material };
}

function drawEstimate(root, W, est, opts){
  opts = opts || {};
  let html = '';
  for (const cat of W.categories){
    const rows = est.lines.filter(l => l.cat === cat.id);
    if (!rows.length) continue;
    html += '<li class="cat-head"><span>' + cat.name + '</span><span></span></li>';
    for (const l of rows){
      html += '<li><span class="label"><span>' + l.name +
        ' <span class="qty">' + F(l.qty) + ' ' + l.unit + '</span></span></span>' +
        '<span class="val">' + F(R(l.labour + l.material)) + '</span></li>';
    }
  }
  root.querySelector('[data-rows]').innerHTML = html ||
    '<li class="empty">Zaznacz przynajmniej jedną pozycję, a pojawi się tu kosztorys.</li>';
  root.querySelector('[data-total]').innerHTML = F(R(est.total)) + ' <small>PLN</small>';
  const split = root.querySelector('[data-split]');
  if (split) split.innerHTML =
    '<span>Robocizna <b>' + F(R(est.labour)) + '</b></span><span>Materiały <b>' + F(R(est.material)) + '</b></span>' +
    (opts.perM2 ? '<span>Za m² <b>' + F(R(est.total / opts.perM2)) + '</b></span>' : '');
}

function bindSort(table){
  if (!table) return;
  const heads = table.querySelectorAll('thead th');
  heads.forEach((th, i) => {
    if (th.dataset.sort === 'off') return;
    th.setAttribute('tabindex','0');
    const run = () => {
      const dir = th.getAttribute('aria-sort') === 'ascending' ? -1 : 1;
      heads.forEach(h => h.removeAttribute('aria-sort'));
      th.setAttribute('aria-sort', dir === 1 ? 'ascending' : 'descending');
      const body = table.tBodies[0];
      [...body.rows].sort((a, b) => {
        const av = a.cells[i].dataset.v ?? a.cells[i].textContent;
        const bv = b.cells[i].dataset.v ?? b.cells[i].textContent;
        const an = parseFloat(av), bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
        return String(av).localeCompare(String(bv), 'pl') * dir;
      }).forEach(r => body.appendChild(r));
    };
    th.addEventListener('click', run);
    th.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); } });
  });
}

function readForm(form){
  const v = {};
  form.querySelectorAll('[name]').forEach(el => {
    if (el.type === 'checkbox') v[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) v[el.name] = el.value; }
    else v[el.name] = el.type === 'number' ? parseFloat(el.value || 0) : el.value;
  });
  return v;
}
// Parametry formularza ladują w adresie strony, dzięki czemu wyliczenie da się
// wysłać wykonawcy albo zapisać w zakładkach i wrócić do niego później.
function syncUrl(form){
  const p = new URLSearchParams();
  form.querySelectorAll('[name]').forEach(el => {
    if (el.type === 'checkbox') p.set(el.name, el.checked ? '1' : '0');
    else if (el.type === 'radio') { if (el.checked) p.set(el.name, el.value); }
    else p.set(el.name, el.value);
  });
  history.replaceState(null, '', location.pathname + '?' + p.toString());
}
function restoreForm(form){
  const p = new URLSearchParams(location.search);
  if (![...p.keys()].length) return;
  form.querySelectorAll('[name]').forEach(el => {
    if (!p.has(el.name)) return;
    if (el.type === 'checkbox') el.checked = p.get(el.name) === '1';
    else if (el.type === 'radio') el.checked = (el.value === p.get(el.name));
    else el.value = p.get(el.name);
  });
}
function bindForm(form, run){
  const runAndSync = () => { run(); syncUrl(form); };
  form.addEventListener('input', runAndSync);
  form.addEventListener('change', runAndSync);
  restoreForm(form);
  run();
}
function bindSheetActions(sheet){
  const btnPrint = sheet.querySelector('[data-print]');
  const btnCopy = sheet.querySelector('[data-copy]');
  if (btnPrint) btnPrint.addEventListener('click', () => window.print());
  if (btnCopy) btnCopy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      const t = btnCopy.textContent;
      btnCopy.textContent = 'Skopiowano';
      setTimeout(() => { btnCopy.textContent = t; }, 2000);
    } catch (e) {
      btnCopy.textContent = 'Skopiuj adres z paska przeglądarki';
    }
  });
}
`;

/* ---------- blankiet kosztorysu ---------- */

export function estimateSheet({ title, sub = '', id = 'sheet' }) {
  return `<div class="receipt" id="${id}">
  <div class="receipt-head">
    Kosztorys
    <strong data-sheet-title>${title}</strong>
    <span data-sheet-sub>${sub}</span>
  </div>
  <ul class="rows" data-rows></ul>
  <div class="total">
    <span class="t-label">Razem</span>
    <span class="t-val" data-total>0 <small>PLN</small></span>
  </div>
  <div class="split" data-split></div>
  <div class="sheet-actions">
    <button type="button" data-print>Drukuj lub zapisz PDF</button>
    <button type="button" data-copy>Kopiuj link do wyceny</button>
  </div>
  <p class="receipt-foot">Materiały ze średniej półki. Ekipa może podzielić robociznę i materiał inaczej. Link zawiera wpisane parametry, więc możesz wysłać to wyliczenie wykonawcy.</p>
</div>`;
}

/* ---------- pola formularza ---------- */

export const field = ({ name, label, type = 'number', value = '', min, max, step, suffix = '', hint = '' }) => `
<label class="field">
  <span class="f-label">${label}</span>
  <span class="f-input">
    <input type="${type}" name="${name}" value="${value}"${min !== undefined ? ` min="${min}"` : ''}${max !== undefined ? ` max="${max}"` : ''}${step !== undefined ? ` step="${step}"` : ''} inputmode="decimal">
    ${suffix ? `<span class="f-suffix">${suffix}</span>` : ''}
  </span>
  ${hint ? `<span class="f-hint">${hint}</span>` : ''}
</label>`;

export const select = ({ name, label, options }) => `
<label class="field">
  <span class="f-label">${label}</span>
  <span class="f-input">
    <select name="${name}">${options.map((o) => `<option value="${o.v}"${o.sel ? ' selected' : ''}>${o.t}</option>`).join('')}</select>
  </span>
</label>`;

export const check = ({ name, label, checked = false, qty = null }) => `
<label class="check">
  <input type="checkbox" name="${name}"${checked ? ' checked' : ''}>
  <span>${label}</span>
  ${qty ? `<input class="qty-in" type="number" name="${name}_qty" value="${qty}" min="0" max="20" step="1" aria-label="ilość">` : ''}
</label>`;
