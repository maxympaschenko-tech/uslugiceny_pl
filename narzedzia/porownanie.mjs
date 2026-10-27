// Wynik porównania miast ma dotyczyć całego remontu, a nie samej robocizny.
// Wykonujemy skrypt prawdziwej strony z prostym adapterem jej trzech elementów.
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import cities from '../src/data/cities.json' with { type: 'json' };
import data from '../src/data/works.json' with { type: 'json' };
import { porownajMiastaPage } from '../src/pages-tools.mjs';

const byId = Object.fromEntries(data.works.map(work => [work.id, work]));
const unitPrice = (id, coef, standard, cm) => {
  const work = byId[id];
  return {
    labour: work.labour * coef * (1 + (standard - 1) * .35),
    material: work.material * (work.perCm ? cm : 1) * (1 + (coef - 1) * .2) * standard,
  };
};
const turnkeyPerM2 = (coef, standard) => Object.entries(data.standardScope.items)
  .reduce((sum, [id, quantity]) => {
    const price = unitPrice(id, coef, standard, 5);
    return sum + (price.labour + price.material) * quantity;
  }, 0);
const F = number => new Intl.NumberFormat('pl-PL', {
  maximumFractionDigits: number < 100 ? 2 : 0,
}).format(number);

function pageScript(priceFunction = turnkeyPerM2) {
  const html = porownajMiastaPage({ ...data, cities, unitPrice, turnkeyPerM2: priceFunction });
  const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).find(value => value.includes('const POD_KLUCZ ='));
  assert.ok(script, 'Nie znaleziono skryptu porównania miast');
  return script;
}

function compare(script, first, second) {
  const nodes = { calc: {}, tabela: {}, '[data-roznica]': {}, '[data-podsumowanie]': {} };
  const document = {
    getElementById: id => nodes[id] || null,
    querySelector: selector => nodes[selector],
    addEventListener: (_event, handler) => handler(),
  };
  runInNewContext(script, {
    document, bindForm: (_form, handler) => handler(),
    readForm: () => ({ a: first, b: second }), F, R: Math.round,
  });
  return { result: nodes['[data-roznica]'].textContent, detail: nodes['[data-podsumowanie]'].textContent };
}

const script = pageScript();
let cases = 0;
for (const first of cities) {
  for (const second of cities) {
    const costA = Math.round(turnkeyPerM2(first.coef, 1)) * 50;
    const costB = Math.round(turnkeyPerM2(second.coef, 1)) * 50;
    const percent = Math.round((costB / costA - 1) * 100);
    const output = compare(script, first.slug, second.slug);
    assert.equal(output.result, `${percent > 0 ? '+' : ''}${percent}%`, `${first.name} → ${second.name}`);
    if (first.coef !== second.coef) {
      const labour = Math.abs(Math.round((second.coef / first.coef - 1) * 100));
      assert.ok(output.detail.includes(`${labour}% w robociźnie`));
      assert.ok(output.detail.includes(`${F(costA)} zł`) && output.detail.includes(`${F(costB)} zł`));
    }
    cases++;
  }
}
const defaultPair = compare(script, 'warszawa', 'lodz');
assert.equal(defaultPair.result, '-19%');
assert.ok(defaultPair.detail.includes('24% w robociźnie'));
const missingPrices = compare(pageScript(() => 0), 'warszawa', 'lodz');
assert.equal(missingPrices.result, '—');
assert.match(missingPrices.detail, /Brak danych/);
assert.doesNotMatch(missingPrices.detail, /NaN|Infinity|0 zł/);
console.log(`Porównanie miast poprawne: ${cases} par, osobne udziały robocizny i brak pozornych procentów bez danych.`);
