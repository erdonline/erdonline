import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Button, List, message} from 'antd';
import {DEL, GET} from '@/services/crud';
import PageSkeleton from '@/components/PageSkeleton';
import {confirmDestructive} from '@/utils/destructiveConfirm';
import {useIntl} from '@umijs/max';

type FederateProviderKey = 'github' | 'google' | 'wechat';
type Providers = Partial<Record<FederateProviderKey, boolean>>;
type LinkRow = {
  provider: string;
  email?: string;
  displayName?: string;
  linked?: boolean;
};

type LinksPayload = {
  providers?: Providers;
  links?: LinkRow[];
};

const ORDER: FederateProviderKey[] = ['github', 'google', 'wechat'];

const PROVIDER_LABEL_KEYS: Record<FederateProviderKey, string> = {
  github: 'accountSettings.federate.provider.github',
  google: 'accountSettings.federate.provider.google',
  wechat: 'accountSettings.federate.provider.wechat',
};

/**
 * ADR-0021：账号设置 — 第三方登录绑定状态（轻量）。
 */
const FederatedAccountsView: React.FC = () => {
  const intl = useIntl();
  const t = (id: string, values?: Record<string, string>) =>
    intl.formatMessage({id}, values);

  const providerLabels = useMemo(
    () =>
      Object.fromEntries(
        ORDER.map((key) => [key, t(PROVIDER_LABEL_KEYS[key])]),
      ) as Record<FederateProviderKey, string>,
    [intl],
  );

  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Providers>({});
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GET('/auth/federate/links', {});
      if (res?.code === 200 && res.data) {
        const data = res.data as LinksPayload;
        setProviders(data.providers || {});
        setLinks(Array.isArray(data.links) ? data.links : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const linkedSet = new Set(links.map((l) => l.provider));

  const onLink = async (provider: string) => {
    setBusy(provider);
    try {
      const res = await GET(`/auth/federate/links/${provider}/start`, {});
      const url = (res?.data as {authorizeUrl?: string} | undefined)?.authorizeUrl;
      if (res?.code === 200 && url) {
        window.location.assign(url);
        return;
      }
      message.error(res?.msg || t('accountSettings.federate.linkStartFailed'));
    } finally {
      setBusy(null);
    }
  };

  const onUnlink = (provider: string) => {
    const label =
      providerLabels[provider as FederateProviderKey] || provider;
    confirmDestructive({
      title: t('accountSettings.federate.unlinkTitle', {label}),
      content: t('accountSettings.federate.unlinkContent'),
      okText: t('accountSettings.federate.unlinkOk'),
      okType: 'danger',
      cancelText: t('accountSettings.common.cancel'),
      onOk: async () => {
        setBusy(provider);
        try {
          const res = await DEL(`/auth/federate/links/${provider}`, {});
          if (res?.code === 200) {
            message.success(t('accountSettings.federate.unlinkSuccess'));
            await load();
          }
          // 失败时不再补 message.error：request.js 的响应/错误拦截器已按后端 msg 统一弹过一次，
          // 这里再弹只会造成同一失败重复两条 toast（见 e2e-locators/playwright-ux-audit「重复反馈」）。
        } finally {
          setBusy(null);
        }
      },
    });
  };

  if (loading) {
    return <PageSkeleton rows={3} />;
  }

  const rows = ORDER.filter((p) => providers[p]).map((provider) => {
    const linked = linkedSet.has(provider);
    const meta = links.find((l) => l.provider === provider);
    return {
      provider,
      linked,
      description: linked
        ? [meta?.displayName, meta?.email].filter(Boolean).join(' · ') ||
          t('accountSettings.federate.statusLinked')
        : t('accountSettings.federate.statusNotLinked'),
    };
  });

  if (rows.length === 0) {
    return (
      <p role="status" data-testid="federate-links-disabled">
        {t('accountSettings.federate.disabled')}
      </p>
    );
  }

  return (
    <List
      data-testid="federate-links-list"
      itemLayout="horizontal"
      dataSource={rows}
      renderItem={(item) => {
        const label =
          providerLabels[item.provider as FederateProviderKey] ||
          item.provider;
        return (
          <List.Item
            actions={[
              item.linked ? (
                <Button
                  key="unlink"
                  danger
                  size="small"
                  loading={busy === item.provider}
                  onClick={() => onUnlink(item.provider)}
                  aria-label={t('accountSettings.federate.unlinkButtonAria', {
                    label,
                  })}
                  data-testid={`federate-unlink-${item.provider}`}
                >
                  {t('accountSettings.federate.unlinkButton')}
                </Button>
              ) : (
                <Button
                  key="link"
                  type="link"
                  size="small"
                  loading={busy === item.provider}
                  onClick={() => void onLink(item.provider)}
                  aria-label={t('accountSettings.federate.linkButtonAria', {
                    label,
                  })}
                  data-testid={`federate-link-${item.provider}`}
                >
                  {t('accountSettings.federate.linkButton')}
                </Button>
              ),
            ]}
          >
            <List.Item.Meta title={label} description={item.description} />
          </List.Item>
        );
      }}
    />
  );
};

export default FederatedAccountsView;
