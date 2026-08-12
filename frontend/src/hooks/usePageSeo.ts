import {useEffect} from 'react';
import {useIntl} from '@umijs/max';
import {resolveAppLocale} from '@/utils/getAntdLocale';

type HeadElementOptions = {
  tagName: 'link' | 'meta';
  selector: string;
  selectorAttribute: 'name' | 'property' | 'rel';
  selectorValue: string;
  valueAttribute: 'content' | 'href';
  value: string;
};

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

  useEffect(() => {
    const prevTitle = document.title;
    const prevLang = document.documentElement.getAttribute('lang');
    const title = intl.formatMessage({id: titleId});
    const description = intl.formatMessage({id: descriptionId});
    const locale = resolveAppLocale(intl.locale);
    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
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
  }, [intl, titleId, descriptionId]);
}
