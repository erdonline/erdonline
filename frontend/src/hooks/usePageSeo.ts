import {useEffect} from 'react';
import {useIntl} from '@umijs/max';

/**
 * Sets document.title and meta description from locale keys; restores on unmount.
 */
export function usePageSeo(titleId: string, descriptionId: string) {
  const intl = useIntl();

  useEffect(() => {
    const prevTitle = document.title;
    const title = intl.formatMessage({id: titleId});
    const description = intl.formatMessage({id: descriptionId});
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    const prevDescription = meta.getAttribute('content');
    meta.setAttribute('content', description);

    return () => {
      document.title = prevTitle;
      if (meta) {
        if (created) {
          meta.remove();
        } else if (prevDescription != null) {
          meta.setAttribute('content', prevDescription);
        }
      }
    };
  }, [intl, titleId, descriptionId]);
}
