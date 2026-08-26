// Piktogramy kategorii. Rysowane jedną grubością kreski, w kwadracie 24x24,
// żeby wszystkie miały tę samą wagę optyczną. Kolor dziedziczą po tekście
// (currentColor), więc działają i na jasnym tle, i w ciemnej stopce.
const P = {
  // młot: prace rozbiórkowe
  demont: '<path d="M3 21l7-7"/><path d="M13 3l8 8-3 3-8-8z"/><path d="M11 5l3 3"/>',
  // wałek i ściana
  walls: '<rect x="3" y="4" width="12" height="5" rx="1"/><path d="M15 6.5h4v4h-4"/><path d="M17 10.5V21"/>',
  // warstwy podłogi
  floor: '<path d="M3 8h18"/><path d="M3 13h18"/><path d="M3 18h18"/><path d="M8 8v10"/><path d="M15 13v5"/>',
  // siatka płytek
  tiles: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
  // kran z kroplą
  plumbing: '<path d="M4 8h6a4 4 0 0 1 4 4v2"/><path d="M4 5v6"/><path d="M18 12c0 0-2.5 3-2.5 4.6A2.5 2.5 0 0 0 20 17c0-1.6-2-5-2-5z"/>',
  // gniazdo z błyskawicą
  electric: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M13 7l-4 6h3l-1 4 4-6h-3z"/>',
  // drzwi
  finish: '<rect x="5" y="3" width="14" height="18" rx="1"/><circle cx="15" cy="12" r="1"/>',
  // ściana w przekroju z warstwą ocieplenia
  elewacja: '<path d="M4 3v18"/><path d="M8 3v18"/><path d="M12 3v18"/><path d="M12 7h8"/><path d="M12 12h8"/><path d="M12 17h8"/>',
  // kostka brukowa w rzucie
  teren: '<path d="M3 6h7v5H3z"/><path d="M14 6h7v5h-7z"/><path d="M7 15h7v5H7z"/>',
  // dach
  dach: '<path d="M2 12L12 4l10 8"/><path d="M5 11v9h14v-9"/><path d="M9 20v-5h6v5"/>',
};

export function ikona(id, klasa = 'ikona') {
  const d = P[id];
  if (!d) return '';
  return `<svg class="${klasa}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

// Pasek podziału robocizna / materiał. Nie ozdoba: szerokość odpowiada udziałowi,
// więc jednym spojrzeniem widać, czy w danej pozycji płaci się za pracę, czy za towar.
export function pasekPodzialu(labour, material) {
  const suma = labour + material;
  if (!suma) return '';
  const pr = Math.round((labour / suma) * 100);
  return `<div class="podzial" role="img" aria-label="Robocizna ${pr} procent, materiał ${100 - pr} procent">
  <div class="podzial-pasek">
    <span class="pr-robocizna" style="width:${pr}%"></span>
    <span class="pr-material" style="width:${100 - pr}%"></span>
  </div>
  <div class="podzial-legenda">
    <span><i class="kropka kropka-r"></i>Robocizna ${pr}%</span>
    <span><i class="kropka kropka-m"></i>Materiał ${100 - pr}%</span>
  </div>
</div>`;
}

// Słupki cen w miastach. Prosty wykres z danych, które i tak są w tabeli:
// tabela odpowiada na pytanie ile, wykres na pytanie gdzie taniej.
export function slupkiMiast(dane, jednostka) {
  const max = Math.max(...dane.map((d) => d.v));
  return `<div class="slupki">
  ${dane
    .map(
      (d) => `<div class="slupek">
    <span class="s-miasto">${d.name}</span>
    <span class="s-tor"><span class="s-wypelnienie" style="width:${(d.v / max) * 100}%"></span></span>
    <span class="s-wartosc">${d.label}</span>
  </div>`
    )
    .join('')}
  <p class="s-stopka">Stawka za ${jednostka}, od najtańszego miasta</p>
</div>`;
}
