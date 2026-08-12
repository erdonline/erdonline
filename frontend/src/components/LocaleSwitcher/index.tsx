import React, { useCallback, useMemo } from 'react';
import { Select } from 'antd';
import { history, setLocale, useIntl, useLocation } from '@umijs/max';
import { isMarketingLocalePath, stripLocalePrefix, toLocalePath } from '@/utils/localePath';
import './index.less';

const LOCALE_OPTIONS = ['zh-CN', 'en-US'] as const;
type AppLocale = (typeof LOCALE_OPTIONS)[number];

export type LocaleSwitcherProps = {
  /** chrome = 顶栏紧凑；auth = 登录/注册壳 */
  variant?: 'chrome' | 'auth';
  className?: string;
};

/**
 * 手动语言切换：setLocale + umi useLocalStorage（umi_locale）持久化，覆盖 baseNavigator。
 */
const LocaleSwitcher: React.FC<LocaleSwitcherProps> = ({ variant = 'chrome', className }) => {
  const intl = useIntl();
  const location = useLocation();
  const current = (intl.locale || 'zh-CN') as AppLocale;
  const marketingPath = isMarketingLocalePath(location.pathname);

  const handleChange = useCallback(
    (value: AppLocale) => {
      setLocale(value, false);
      if (marketingPath) {
        const target = toLocalePath(stripLocalePrefix(location.pathname), value);
        if (target !== location.pathname) {
          history.push(target);
        }
      }
    },
    [location.pathname, marketingPath],
  );

  const options = useMemo(
    () =>
      LOCALE_OPTIONS.map((loc) => ({
        value: loc,
        label: intl.formatMessage({ id: `locale.option.${loc}` }),
      })),
    [intl],
  );

  return (
    <Select<AppLocale>
      className={`locale-switcher locale-switcher--${variant}${className ? ` ${className}` : ''}`}
      data-testid="locale-switcher"
      aria-label={intl.formatMessage({ id: 'locale.switcher.label' })}
      value={current}
      onChange={handleChange}
      options={options}
      size={variant === 'chrome' ? 'small' : 'middle'}
      popupMatchSelectWidth={false}
    />
  );
};

export default React.memo(LocaleSwitcher);
