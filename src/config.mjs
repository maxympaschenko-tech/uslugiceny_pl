import cities from './data/cities.json' with { type: 'json' };
import works from './data/works.json' with { type: 'json' };

// SITE_URL może zawierać podkatalog; jawny BASE_PATH ma przed nim pierwszeństwo.
// Adresy stron, mapy witryny i danych strukturalnych muszą mieć ten sam prefiks.
const configuredSite = process.env.SITE_URL?.trim() || 'https://uslugiceny.pl';
if (!/^https?:\/\//i.test(configuredSite) || /[\\?#\u0000-\u0020\u007f]/.test(configuredSite)) {
  throw new Error('SITE_URL musi być adresem HTTP lub HTTPS bez zapytania i fragmentu.');
}
let siteAddress;
try {
  siteAddress = new URL(configuredSite);
} catch {
  throw new Error('SITE_URL nie jest poprawnym adresem HTTP lub HTTPS.');
}
if (siteAddress.username || siteAddress.password) {
  throw new Error('SITE_URL nie może zawierać danych logowania.');
}

const localPath = (value) => {
  if (typeof value !== 'string' || /[\\\u0000-\u001f\u007f]/.test(value) || /%(?![0-9a-f]{2})/i.test(value)) {
    throw new Error('Ścieżka musi być lokalnym adresem bez znaków sterujących.');
  }
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    throw new Error('Ścieżka zawiera niepoprawne kodowanie znaków.');
  }
  if (/[\\\u0000-\u001f\u007f]/.test(decoded) || /%2f/i.test(value)
      || decoded.split('/').some((part) => part === '.' || part === '..')) {
    throw new Error('Ścieżka nie może zawierać przejść do innego katalogu ani zakodowanych separatorów.');
  }
  const path = '/' + value.split('/').filter(Boolean).join('/');
  const trailingSlash = value.endsWith('/') && path !== '/' ? '/' : '';
  return new URL(path + trailingSlash, siteAddress.origin).pathname;
};

// Sprawdzenie surowej ścieżki poprzedza URL(), które samo usuwałoby segmenty ../.
const sitePath = configuredSite.replace(/^https?:\/\/[^/]*/i, '') || '/';
localPath(sitePath);
const configuredRoot = process.env.BASE_PATH?.trim() || sitePath;
if (/[?#]/.test(configuredRoot) || /^[a-z][a-z0-9+.-]*:/i.test(configuredRoot)) {
  throw new Error('BASE_PATH musi być ścieżką bez schematu, zapytania i fragmentu.');
}
const rootPath = localPath(configuredRoot);
const ROOT = rootPath === '/' ? '/' : rootPath.replace(/\/$/, '') + '/';

const absoluteUrl = (route = '/') => {
  if (typeof route !== 'string' || /^[a-z][a-z0-9+.-]*:/i.test(route) || route.startsWith('//')
      || /[\\\u0000-\u001f\u007f]/.test(route)) {
    throw new Error('Adres strony musi być lokalną ścieżką.');
  }
  const suffixIndex = route.search(/[?#]/);
  const pathname = localPath(suffixIndex === -1 ? route : route.slice(0, suffixIndex));
  const suffix = suffixIndex === -1 ? '' : route.slice(suffixIndex);
  // route jest zawsze ścieżką logiczną, bez prefiksu wdrożenia. Próba
  // zgadywania prefiksu zgubiłaby np. /uslugi/ przy BASE_PATH=/uslugi/.
  const prefixedPath = pathname === '/' ? ROOT : ROOT + pathname.slice(1);
  return new URL(prefixedPath + suffix, siteAddress.origin).href;
};

export const SITE = {
  name: 'uslugiceny.pl',
  base: siteAddress.origin,
  root: ROOT,
  url: absoluteUrl,
  updated: works.meta.updated,
  cityLinks: cities
    .map((c) => `<a href="${ROOT}ceny/${c.slug}/">${c.name}</a>`)
    .join(''),
};
