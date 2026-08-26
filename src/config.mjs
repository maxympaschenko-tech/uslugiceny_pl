import cities from './data/cities.json' with { type: 'json' };
import works from './data/works.json' with { type: 'json' };

// BASE_PATH jest potrzebny, gdy strona stoi w podkatalogu GitHub Pages (np. "/kosztorys-pl/").
// Dla własnej domeny zostaw pusty.
const ROOT = process.env.BASE_PATH || '/';

export const SITE = {
  name: 'uslugiceny.pl',
  base: process.env.SITE_URL || 'https://uslugiceny.pl',
  root: ROOT,
  updated: works.meta.updated,
  cityLinks: cities
    .map((c) => `<a href="${ROOT}ceny/${c.slug}/">${c.name}</a>`)
    .join(''),
};
