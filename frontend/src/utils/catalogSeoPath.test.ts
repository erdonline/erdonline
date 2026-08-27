/**
 * 运行：cd frontend && npx tsx src/utils/catalogSeoPath.test.ts
 */
import {isCatalogDetailPath, normalizeCatalogPathname} from './catalogSeoPath';
import {getMarketingHreflang} from './localePath';

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

run('list and reserved paths are not detail', () => {
  for (const p of [
    '/catalog',
    '/catalog/',
    '/en/catalog',
    '/catalog/creator/alice',
    '/catalog/publish',
    '/catalog/review',
    '/catalog/_item',
    '/catalog/_item/',
    '/',
  ]) {
    if (isCatalogDetailPath(p)) throw new Error(p);
  }
});

run('official and community ids are detail', () => {
  for (const p of [
    '/catalog/demo-authz',
    '/catalog/demo-authz/',
    '/catalog/blank',
    '/catalog/a-community-id',
  ]) {
    if (!isCatalogDetailPath(p)) throw new Error(p);
  }
});

run('detail canonical is the item URL not the list', () => {
  const origin = 'https://www.erdonline.com';
  const h = getMarketingHreflang('/catalog/demo-authz', origin);
  if (!h) throw new Error('missing hreflang');
  if (h.canonical !== `${origin}/catalog/demo-authz`) throw new Error(h.canonical);
  if (h.canonical === `${origin}/catalog`) throw new Error('list canonical');
  if (h.en !== `${origin}/en/catalog`) throw new Error(h.en);
  const slashed = getMarketingHreflang('/catalog/demo-authz/', origin);
  if (slashed?.canonical !== `${origin}/catalog/demo-authz`) {
    throw new Error(slashed?.canonical ?? 'missing');
  }
});

run('list canonical stays /catalog', () => {
  const origin = 'https://www.erdonline.com';
  const h = getMarketingHreflang('/catalog', origin);
  if (h?.canonical !== `${origin}/catalog`) throw new Error(h?.canonical ?? 'missing');
});

run('normalize strips trailing slash except root', () => {
  if (normalizeCatalogPathname('/catalog/demo-authz/') !== '/catalog/demo-authz') {
    throw new Error('strip');
  }
  if (normalizeCatalogPathname('/') !== '/') throw new Error('root');
});
