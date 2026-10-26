import assert from 'node:assert/strict';
import test from 'node:test';
import { createGlossaryLinker } from '../src/linkowanie.mjs';
import { HASLA } from '../src/pages-slownik.mjs';

const forms = HASLA.flatMap(([name, id, , , aliases = []]) => [name, ...aliases].map(form => [form, id]));
const glossary = createGlossaryLinker(forms);

test('odmiana i powtórzone nazwy nie modyfikują wygenerowanego href', () => {
  const html = glossary('Przewód od rozdzielnicy. Rozdzielnica zasila obwody.');
  assert.equal((html.match(/<a\b/g) || []).length, 1);
  assert.match(html, /href="\/slownik\/#rozdzielnica" class="haslo-link">rozdzielnicy<\/a>/);
  assert.doesNotMatch(html, /href="[^">]*<a/);
  assert.match(html, /Rozdzielnica zasila obwody\.$/);
});

test('najdłuższe hasło wygrywa z krótszym w tym samym miejscu', () => {
  const link = createGlossaryLinker([['płytka', 'plytka'], ['płytka mrozoodporna', 'mrozoodporna']]);
  assert.equal(link('PŁYTKA MROZOODPORNA i płytka.'),
    '<a href="/slownik/#mrozoodporna" class="haslo-link">PŁYTKA MROZOODPORNA</a> i <a href="/slownik/#plytka" class="haslo-link">płytka</a>.');
});

test('atrybuty i istniejące odnośniki pozostają nienaruszone', () => {
  const link = createGlossaryLinker([['gładź', 'gladz']]);
  const existing = '<a href="/gładź/" title="gładź > tynk"><strong>Gładź</strong></a>';
  const html = link(existing + '<span title="gładź > tynk">Gładź</span>');
  assert.ok(html.startsWith(existing));
  assert.match(html, /<span title="gładź > tynk"><a href="\/slownik\/#gladz" class="haslo-link">Gładź<\/a><\/span>$/);
});

test('istniejące hasło słownika zużywa swój identyfikator', () => {
  const used = new Set();
  const existing = '<a href="/slownik/#gladz">Gładź</a>';
  assert.equal(glossary(existing + ' oraz gładź.', used), existing + ' oraz gładź.');
  assert.ok(used.has('gladz'));
});

test('wspólny zbiór użytych haseł działa między akapitami i odmianami', () => {
  const link = createGlossaryLinker([['gładź', 'gladz'], ['gładzi', 'gladz']]);
  const used = new Set();
  assert.match(link('Warstwa gładzi.', used), /<a\b/);
  assert.equal(link('Druga gładź i gładzi.', used), 'Druga gładź i gładzi.');
  assert.match(link('Nowa gładź.'), /<a\b/);
});

test('granice polskich słów i oryginalna wielkość liter są zachowane', () => {
  const link = createGlossaryLinker([['gładź', 'gladz']]);
  assert.equal(link('ągładź gładźą GŁADŹ!'), 'ągładź gładźą <a href="/slownik/#gladz" class="haslo-link">GŁADŹ</a>!');
});

test('skrypty, style, kod i komentarze nie dostają odnośników', () => {
  const link = createGlossaryLinker([['gładź', 'gladz']]);
  const protectedHtml = '<!-- gładź --><script>if (x < y) console.log("gładź");</script><style>.gładź{color:red}</style><pre><code>gładź > tynk</code></pre><textarea>gładź</textarea>';
  assert.equal(link(protectedHtml + '<p>gładź</p>'), protectedHtml + '<p><a href="/slownik/#gladz" class="haslo-link">gładź</a></p>');
});

test('pusty słownik i prefiks wdrożenia nie psują adresów', () => {
  assert.equal(createGlossaryLinker([])('<p>Gładź</p>'), '<p>Gładź</p>');
  assert.equal(createGlossaryLinker([['gładź', 'gladz']], '/podglad/')('gładź'),
    '<a href="/podglad/slownik/#gladz" class="haslo-link">gładź</a>');
});
