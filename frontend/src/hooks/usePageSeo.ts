import {useEffect} from 'react';
import {useIntl, useLocation} from '@umijs/max';
import {resolveAppLocale} from '@/utils/getAntdLocale';
import {getMarketingHreflang} from '@/utils/localePath';

type HeadElementOptions = {
  tagName: 'link' | 'meta';
  selector: string;
  selectorAttribute: 'name' | 'property' | 'rel';
  selectorValue: string;
  valueAttribute: 'content' | 'href';
  value: string;
};

function setHreflangLink(hreflang: string, href: string): () => void {
  const selector = `link[rel="alternate"][hreflang="${hreflang}"]`;
  let element = document.querySelector<HTMLLinkElement>(selector);
  const created = !element;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'alternate');
    element.setAttribute('hreflang', hreflang);
    document.head.appendChild(element);
  }
  const previousHref = element.getAttribute('href');
  element.setAttribute('href', href);
  return () => {
    if (created) {
      element?.remove();
    } else if (previousHref == null) {
      element?.removeAttribute('href');
    } else {
      element?.setAttribute('href', previousHref);
    }
  };
}

function setHeadElement(options: HeadElementOptions): () => void {
  let element = document.querySelector<HTMLElement>(options.selector);
  const created = !element;
  if (!element) {
    element = document.createElement(options.tagName);
    element.setAttribute(options.selectorAttribute, options.selectorValue);
    document.head.appendChild(element);
  }

  const previousValue = element.getAttribute(options.valueAttribute);
  element.setAttribute(options.valueAttribute, options.value);

  return () => {
    if (created) {
      element?.remove();
    } else if (previousValue == null) {
      element?.removeAttribute(options.valueAttribute);
    } else {
      element?.setAttribute(options.valueAttribute, previousValue);
    }
  };
}

/**
 * Sets localized page SEO metadata; restores on unmount.
 */
export function usePageSeo(titleId: string, descriptionId: string) {
  const intl = useIntl();
  const {pathname} = useLocation();

  useEffect(() => {
    const prevTitle = document.title;
    const prevLang = document.documentElement.getAttribute('lang');
    const title = intl.formatMessage({id: titleId});
    const description = intl.formatMessage({id: descriptionId});
    const locale = resolveAppLocale(intl.locale);
    const hreflang = getMarketingHreflang(pathname, window.location.origin);
    const canonicalUrl = hreflang?.canonical ?? `${window.location.origin}${pathname}`;
    document.title = title;
    document.documentElement.lang = locale === 'en-US' ? 'en' : 'zh-CN';

    const restoreHeadElements = [
      setHeadElement({
        tagName: 'meta',
        selector: 'meta[name="description"]',
        selectorAttribute: 'name',
        selectorValue: 'description',
        valueAttribute: 'content',
        value: description,
      }),
      setHeadElement({
        tagName: 'link',
        selector: 'link[rel="canonical"]',
        selectorAttribute: 'rel',
        selectorValue: 'canonical',
        valueAttribute: 'href',
        value: canonicalUrl,
      }),
      ...(hreflang
        ? [
            setHreflangLink('zh-CN', hreflang.zh),
            setHreflangLink('en', hreflang.en),
            setHreflangLink('x-default', hreflang.xDefault),
          ]
        : []),
      ...[
        ['og:title', title],
        ['og:description', description],
        ['og:type', 'website'],
        ['og:url', canonicalUrl],
        ['og:locale', locale === 'en-US' ? 'en_US' : 'zh_CN'],
        ['og:site_name', 'ERD Online'],
      ].map(([property, content]) =>
        setHeadElement({
          tagName: 'meta',
          selector: `meta[property="${property}"]`,
          selectorAttribute: 'property',
          selectorValue: property,
          valueAttribute: 'content',
          value: content,
        }),
      ),
      ...[
        ['twitter:title', title],
        ['twitter:description', description],
      ].map(([name, content]) =>
        setHeadElement({
          tagName: 'meta',
          selector: `meta[name="${name}"]`,
          selectorAttribute: 'name',
          selectorValue: name,
          valueAttribute: 'content',
          value: content,
        }),
      ),
    ];

    return () => {
      document.title = prevTitle;
      if (prevLang == null) {
        document.documentElement.removeAttribute('lang');
      } else {
        document.documentElement.setAttribute('lang', prevLang);
      }
      restoreHeadElements.reverse().forEach((restore) => restore());
    };
  }, [intl, pathname, titleId, descriptionId]);
}
