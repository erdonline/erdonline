import {useEffect} from 'react';
import {useIntl} from '@umijs/max';

const CANONICAL_ORIGIN = 'https://www.erdonline.com';

function upsertMeta(attr: 'name' | 'property', key: string, content: string): () => void {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  const created = !el;
  const prev = el?.getAttribute('content') ?? null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return () => {
    if (!el) {
      return;
    }
    if (created) {
      el.remove();
    } else if (prev != null) {
      el.setAttribute('content', prev);
    }
  };
}

function upsertCanonical(href: string): () => void {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  const created = !el;
  const prev = el?.getAttribute('href') ?? null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  return () => {
    if (!el) {
      return;
    }
    if (created) {
      el.remove();
    } else if (prev != null) {
      el.setAttribute('href', prev);
    }
  };
}

/**
 * Sets document.title, description, OG/Twitter, and canonical from locale keys; restores on unmount.
 */
export function usePageSeo(titleId: string, descriptionId: string) {
  const intl = useIntl();

  useEffect(() => {
    const prevTitle = document.title;
    const title = intl.formatMessage({id: titleId});
    const description = intl.formatMessage({id: descriptionId});
    document.title = title;

    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    const canonical = `${CANONICAL_ORIGIN}${path === '/' ? '/' : path}`;

    const restores = [
      upsertMeta('name', 'description', description),
      upsertMeta('property', 'og:title', title),
      upsertMeta('property', 'og:description', description),
      upsertMeta('name', 'twitter:title', title),
      upsertMeta('name', 'twitter:description', description),
      upsertCanonical(canonical),
    ];

    return () => {
      document.title = prevTitle;
      restores.forEach((fn) => fn());
    };
  }, [intl, titleId, descriptionId]);
}
