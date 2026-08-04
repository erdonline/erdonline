import React, {useCallback, useEffect, useState} from 'react';
import {Button, List, message} from 'antd';
import {DEL, GET} from '@/services/crud';
import PageSkeleton from '@/components/PageSkeleton';
import {confirmDestructive} from '@/utils/destructiveConfirm';

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

const LABELS: Record<FederateProviderKey, string> = {
  github: 'GitHub',
  google: 'Google',
  wechat: '微信（开放平台扫码）',
};

const ORDER: FederateProviderKey[] = ['github', 'google', 'wechat'];

/**
 * ADR-0021：账号设置 — 第三方登录绑定状态（轻量）。
 */
const FederatedAccountsView: React.FC = () => {
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
      message.error(res?.msg || '无法启动绑定');
    } finally {
      setBusy(null);
    }
  };

  const onUnlink = (provider: string) => {
    const label = LABELS[provider as FederateProviderKey] || provider;
    confirmDestructive({
      title: `解除 ${label} 绑定？`,
      content: '解绑后需重新授权才能用该第三方登录。',
      okText: '解除绑定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setBusy(provider);
        try {
          const res = await DEL(`/auth/federate/links/${provider}`, {});
          if (res?.code === 200) {
            message.success('已解除绑定');
            await load();
            return;
          }
          if (!res?.msg) {
            message.error('解绑失败');
          }
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
        ? [meta?.displayName, meta?.email].filter(Boolean).join(' · ') || '已绑定'
        : '未绑定',
    };
  });

  if (rows.length === 0) {
    return (
      <p role="status" data-testid="federate-links-disabled">
        未配置第三方登录（需管理员设置 GitHub / Google / 微信环境变量）。
      </p>
    );
  }

  return (
    <List
      data-testid="federate-links-list"
      itemLayout="horizontal"
      dataSource={rows}
      renderItem={(item) => (
        <List.Item
          actions={[
            item.linked ? (
              <Button
                key="unlink"
                danger
                size="small"
                loading={busy === item.provider}
                onClick={() => onUnlink(item.provider)}
                aria-label={`解除${LABELS[item.provider]}绑定`}
              >
                解除绑定
              </Button>
            ) : (
              <Button
                key="link"
                type="link"
                size="small"
                loading={busy === item.provider}
                onClick={() => void onLink(item.provider)}
                aria-label={`绑定${LABELS[item.provider]}`}
              >
                绑定
              </Button>
            ),
          ]}
        >
          <List.Item.Meta
            title={LABELS[item.provider] || item.provider}
            description={item.description}
          />
        </List.Item>
      )}
    />
  );
};

export default FederatedAccountsView;
