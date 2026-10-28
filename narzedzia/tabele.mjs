// Sprawdzamy kolejność widocznych polskich cen, nie tylko wartości data-v.
import assert from 'node:assert/strict';
import { calcScript } from '../src/templates.mjs';

const { sortNumber, sortTable, bindSort } = new Function(
  calcScript + '\nreturn { sortNumber, sortTable, bindSort };'
)();

for (const [text, expected] of [
  ['1 200', 1200], ['10\u00a0250 zł', 10250], ['1\u202f234,50 PLN', 1234.5],
  ['24,05', 24.05], ['24,50', 24.5], ['−12,5%', -12.5], ['+24%', 24],
  ['0', 0], ['18.345', 18.345],
]) assert.equal(sortNumber(text), expected, text);
for (const text of ['', 'własny', 'm²', '2 etapy', '20–40 zł', 'Infinity', 'NaN']) {
  assert.equal(sortNumber(text), null, text);
}

const cell = (textContent, value) => ({ textContent, dataset: value === undefined ? {} : { v: value } });
const rows = [
  { id: 'tysiac', cells: [cell('1 200')] },
  { id: 'setki', cells: [cell('999')] },
  { id: 'dziesiec-tysiecy', cells: [cell('10\u00a0250 zł')] },
  { id: 'dziesietna-wieksza', cells: [cell('24,50')] },
  { id: 'dziesietna-mniejsza', cells: [cell('24,05')] },
  { id: 'wlasny', cells: [cell('własny')] },
];
const body = { rows, appendChild(row) {
  this.rows.splice(this.rows.indexOf(row), 1);
  this.rows.push(row);
} };
const attributes = new Map();
const events = new Map();
const head = {
  dataset: {},
  setAttribute: (name, value) => attributes.set(name, value),
  getAttribute: name => attributes.get(name),
  removeAttribute: name => attributes.delete(name),
  addEventListener: (name, handler) => events.set(name, handler),
};
const table = { tBodies: [body], querySelectorAll: () => [head] };
const order = () => body.rows.map(row => row.id);
bindSort(table);
events.get('click')();
assert.deepEqual(order(), ['dziesietna-mniejsza', 'dziesietna-wieksza', 'setki', 'tysiac', 'dziesiec-tysiecy', 'wlasny']);
assert.equal(head.getAttribute('aria-sort'), 'ascending');
let prevented = false;
events.get('keydown')({ key: 'Enter', preventDefault() { prevented = true; } });
assert.equal(prevented, true);
assert.equal(head.getAttribute('aria-sort'), 'descending');
assert.deepEqual(order(), ['dziesiec-tysiecy', 'tysiac', 'setki', 'dziesietna-wieksza', 'dziesietna-mniejsza', 'wlasny']);

// Przeliczenie miasta zmienia ceny, więc ten sam kierunek wymaga nowego porządku.
body.rows.find(row => row.id === 'setki').cells[0].textContent = '12 000';
sortTable(table, 0, -1);
assert.equal(body.rows[0].id, 'setki');
assert.equal(head.getAttribute('aria-sort'), 'descending');

// Surowe metadane mają pierwszeństwo przed zaokrąglonym tekstem ceny.
body.rows.splice(0, body.rows.length,
  { id: 'wyzsza', cells: [cell('25 zł', '25.49')] },
  { id: 'nizsza', cells: [cell('25 zł', '25.01')] });
sortTable(table, 0, 1);
assert.deepEqual(order(), ['nizsza', 'wyzsza']);

// Jednostki i etykiety pozostają tekstem; liczbowy początek nie jest ceną.
body.rows.splice(0, body.rows.length,
  { id: 'szt.', cells: [cell('szt.')] },
  { id: 'm²', cells: [cell('m²')] },
  { id: 'mb', cells: [cell('mb')] });
sortTable(table, 0, 1);
assert.deepEqual(order(), ['m²', 'mb', 'szt.']);

console.log('Tabele: polskie ceny, przecinki, tysiące, metadane, klawiatura i zachowanie kierunku po zmianie cen poprawne.');
