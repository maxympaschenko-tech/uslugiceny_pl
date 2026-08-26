import { SITE } from './config.mjs';

export const money = (n) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: n < 100 ? 2 : 0 }).format(n);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- szkielet strony ---------- */

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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${R}assets/style.css">
${jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n') : ''}
</head>
<body>
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="${R}">uslugiceny<span>.pl</span></a>
    <nav class="nav">
      <a href="${R}"${path === '/' ? ' aria-current="page"' : ''}>Cennik</a>
      <a href="${R}uslugi/"${path.startsWith('/uslugi') ? ' aria-current="page"' : ''}>Usługi</a>
      <a href="${R}kalkulator/remont-mieszkania/"${path.startsWith('/kalkulator') ? ' aria-current="page"' : ''}>Kalkulatory</a>
      <a href="${R}jak-liczymy/"${path.startsWith('/jak-liczymy') ? ' aria-current="page"' : ''}>Jak liczymy</a>
    </nav>
  </div>
</header>
${breadcrumb ? `<div class="wrap"><nav class="crumbs">${breadcrumb}</nav></div>` : ''}
<main>
${body}
</main>
<footer class="site-foot">
  <div class="wrap">
    <p class="foot-h">Ceny robót w miastach</p>
    <div class="city-links">${SITE.cityLinks}</div>
    <p class="foot-h">Kalkulatory</p>
    <div class="city-links">
      <a href="${R}kalkulator/remont-mieszkania/">Remont mieszkania pod klucz</a>
      <a href="${R}kalkulator/lazienka/">Remont łazienki</a>
      <a href="${R}kalkulator/wylewka/">Wylewka podłogowa</a>
      <a href="${R}kalkulator/malowanie/">Malowanie</a>
      <a href="${R}kalkulator/plytki/">Układanie płytek</a>
      <a href="${R}kalkulator/gladzie-i-tynki/">Gładzie i tynki</a>
    </div>
    <p class="foot-h">Serwis</p>
    <div class="city-links">
      <a href="${R}o-nas/">O serwisie</a>
      <a href="${R}jak-liczymy/">Jak liczymy</a>
      <a href="${R}kontakt/">Kontakt</a>
      <a href="${R}polityka-prywatnosci/">Polityka prywatności</a>
    </div>
    <p>Ceny w złotych z VAT, aktualizacja: ${SITE.updated}. To punkt odniesienia do rozmowy z wykonawcą, a nie oferta handlowa: ostateczną cenę podaje ekipa po obejrzeniu lokalu.</p>
  </div>
</footer>
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
function bindForm(form, run){
  form.addEventListener('input', run);
  form.addEventListener('change', run);
  run();
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
  <p class="receipt-foot">Materiały ze średniej półki. Ekipa może podzielić robociznę i materiał inaczej.</p>
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
