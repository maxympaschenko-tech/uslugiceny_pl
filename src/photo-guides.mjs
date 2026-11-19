// WebP opcjonalne: bez pliku nadal pokazujemy unikalny schemat SVG.
import { existsSync } from 'node:fs';
export const PHOTO_GUIDES = new Set(["hydroizolacja-lazienki-pod-plytki-krok-po-kroku","gladz-gipsowa-sciany-krok-po-kroku","montaz-drzwi-wewnetrznych-krok-po-kroku","ukladanie-plytek-podlogowych-krok-po-kroku","cyklinowanie-parkietu-i-lakierowanie-krok-po-kroku","sufit-podwieszany-z-plyt-gk-krok-po-kroku","wylewka-cementowa-krok-po-kroku","malowanie-scian-krok-po-kroku"]);
export const photoForGuide = slug => PHOTO_GUIDES.has(slug) && existsSync(`src/assets/photos/${slug}.webp`) ? `assets/photos/${slug}.webp` : null;
export const guideImage = slug => photoForGuide(slug) || `assets/media/${slug}.svg`;
