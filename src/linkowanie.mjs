// Dopasowujemy wyłącznie oryginalny tekst, nigdy HTML wstawiony przez linker.
const regexLiteral = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const attribute = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const protectedTags = new Set(['a', 'script', 'style', 'code', 'pre', 'textarea', 'kbd', 'samp']);

export function createGlossaryLinker(forms, root = '/') {
  const terms = new Map();
  for (const [name, id] of [...forms].sort((a, b) => b[0].length - a[0].length)) {
    const key = name.toLocaleLowerCase('pl');
    if (key && !terms.has(key)) terms.set(key, id);
  }
  const alternatives = [...terms.keys()].map(regexLiteral).join('|');
  const pattern = alternatives
    ? new RegExp(`(?<![\\p{L}\\p{M}])(?:${alternatives})(?![\\p{L}\\p{M}])`, 'giu')
    : null;
  const knownIds = new Set(terms.values());
  const glossary = `${root}slownik/#`;

  return function linkGlossary(html, used = new Set()) {
    if (!pattern) return html;
    const linkText = (value) => value.replace(pattern, (name) => {
      const id = terms.get(name.toLocaleLowerCase('pl'));
      if (used.has(id)) return name;
      used.add(id);
      return `<a href="${attribute(glossary + id)}" class="haslo-link">${name}</a>`;
    });
    // Znaki > w cytowanych atrybutach nie kończą znacznika. Treść bloków
    // chronionych kopiujemy w całości, również gdy zawiera znaki < albo >.
    const tags = /<!--[\s\S]*?-->|<\/?[a-z][\w:-]*(?=\s|\/?>)(?:[^>"']|"[^"]*"|'[^']*')*>|<![^>]*>/giu;
    let cursor = 0;
    let output = '';
    let match;
    while ((match = tags.exec(html))) {
      output += linkText(html.slice(cursor, match.index));
      const token = match[0];
      const opening = token.match(/^<([a-z][\w:-]*)\b/i);
      let end = tags.lastIndex;
      if (opening && protectedTags.has(opening[1].toLowerCase()) && !/\/\s*>$/.test(token)) {
        const name = opening[1].toLowerCase();
        if (name === 'a') {
          const href = token.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
          const target = href && (href[1] ?? href[2] ?? href[3]);
          if (target?.startsWith(glossary)) {
            const id = target.slice(glossary.length);
            if (knownIds.has(id)) used.add(id);
          }
        }
        const closing = new RegExp(`</${name}\\s*>`, 'gi');
        closing.lastIndex = end;
        const close = closing.exec(html);
        end = close ? closing.lastIndex : html.length;
      }
      output += html.slice(match.index, end);
      cursor = end;
      tags.lastIndex = end;
    }
    return output + linkText(html.slice(cursor));
  };
}
