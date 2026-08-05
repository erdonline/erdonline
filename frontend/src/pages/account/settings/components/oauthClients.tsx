import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  message,
} from 'antd';
import { DEL, GET, POST } from '@/services/crud';
import PageSkeleton from '@/components/PageSkeleton';
import { confirmDestructive } from '@/utils/destructiveConfirm';
import { useIntl } from '@umijs/max';
import styles from './oauthClients.less';

const OAUTH_CLIENTS_URL = '/auth/oauth-clients';

const SCOPE_OPTIONS = [
  { label: 'openid', value: 'openid' },
  { label: 'projects:read', value: 'projects:read' },
  { label: 'versions:read', value: 'versions:read' },
  { label: 'projects:write', value: 'projects:write' },
  { label: 'versions:write', value: 'versions:write' },
];

export type OAuthClientSummary = {
  id: string;
  clientId: string;
  name: string;
  clientType: string;
  scopes: string[];
  redirectUris?: string[];
  clientSecretHint?: string;
  createTime?: string;
  revoked: boolean;
};

export type OAuthClientCreated = OAuthClientSummary & {
  clientSecret?: string | null;
};

type CreateFormValues = {
  name: string;
  clientType: 'confidential' | 'public';
  scopes: string[];
  redirectUrisText?: string;
};

async function copyText(text: string, okMsg: string) {
  try {
    await navigator.clipboard.writeText(text);
    message.success(okMsg);
  } catch {
    message.info(text);
  }
}

function parseRedirectUris(raw?: string): string[] | undefined {
  if (!raw?.trim()) {
    return undefined;
  }
  const list = raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

const OAuthClientsView: React.FC = () => {
  const intl = useIntl();
  const t = (id: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id }, values);

  const clientTypeOptions = useMemo(
    () => [
      {
        value: 'confidential' as const,
        label: t('accountSettings.oauthClient.typeConfidential'),
      },
      {
        value: 'public' as const,
        label: t('accountSettings.oauthClient.typePublic'),
      },
    ],
    [intl],
  );

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<OAuthClientSummary[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [secretReveal, setSecretReveal] = useState<OAuthClientCreated | null>(
    null,
  );
  const [form] = Form.useForm<CreateFormValues>();
  const clientType = Form.useWatch('clientType', form);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GET(OAUTH_CLIENTS_URL, {});
      if (res?.code === 200) {
        setClients(Array.isArray(res.data) ? res.data : []);
        return;
      }
      if (!res?.msg) {
        message.error(t('accountSettings.oauthClient.loadFailed'));
      }
    } catch {
      // request errorHandler 已 toast
    } finally {
      setLoading(false);
    }
  }, [intl]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    form.setFieldsValue({
      name: '',
      clientType: 'confidential',
      scopes: ['projects:read', 'versions:read'],
      redirectUrisText: '',
    });
    setCreateOpen(true);
  };

  const onCreate = async () => {
    let values: CreateFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const redirectUris = parseRedirectUris(values.redirectUrisText);
    if (values.clientType === 'public' && (!redirectUris || !redirectUris.length)) {
      message.error(t('accountSettings.oauthClient.publicRedirectRequired'));
      return;
    }
    setCreating(true);
    try {
      const res = await POST(OAUTH_CLIENTS_URL, {
        name: values.name.trim(),
        clientType: values.clientType,
        scopes: values.scopes,
        ...(redirectUris ? { redirectUris } : {}),
      });
      if (res?.code === 200 && res.data) {
        setCreateOpen(false);
        form.resetFields();
        setSecretReveal(res.data as OAuthClientCreated);
        message.success(t('accountSettings.oauthClient.registerSuccess'));
        await load();
        return;
      }
      if (!res?.msg) {
        message.error(t('accountSettings.oauthClient.registerFailed'));
      }
    } catch {
      // request errorHandler 已 toast
    } finally {
      setCreating(false);
    }
  };

  const onRevoke = (row: OAuthClientSummary) => {
    confirmDestructive({
      title: t('accountSettings.oauthClient.revokeTitle'),
      content: t('accountSettings.oauthClient.revokeContent', { name: row.name }),
      okText: t('accountSettings.common.revoke'),
      okType: 'danger',
      cancelText: t('accountSettings.common.cancel'),
      onOk: async () => {
        try {
          const res = await DEL(`${OAUTH_CLIENTS_URL}/${row.id}`, {});
          if (res?.code === 200) {
            message.success(t('accountSettings.oauthClient.revokedSuccess'));
            await load();
            return;
          }
          if (!res?.msg) {
            message.error(t('accountSettings.oauthClient.revokeFailed'));
          }
        } catch {
          // request errorHandler 已 toast
        }
      },
    });
  };

  if (loading && clients.length === 0) {
    return <PageSkeleton rows={3} />;
  }

  return (
    <div className={styles.root} data-testid="account-settings-oauth-clients">
      <div className={styles.toolbar}>
        <p className={styles.hint}>{t('accountSettings.oauthClient.hint')}</p>
        <Button
          type="primary"
          aria-label={t('accountSettings.oauthClient.registerButtonAria')}
          data-testid="oauth-create-trigger"
          onClick={openCreate}
        >
          {t('accountSettings.oauthClient.registerButton')}
        </Button>
      </div>

      {clients.length === 0 ? (
        <p className={styles.empty} role="status">
          {t('accountSettings.oauthClient.empty')}
        </p>
      ) : (
        <ul
          className={styles.list}
          aria-label={t('accountSettings.oauthClient.listAria')}
        >
          {clients.map((row) => (
            <li key={row.id} className={styles.item}>
              <div className={styles.meta}>
                <div className={styles.nameRow}>
                  <h3 className={styles.name}>{row.name}</h3>
                  <span
                    className={`${styles.badge}${
                      row.revoked ? ` ${styles.badgeRevoked}` : ''
                    }`}
                  >
                    {row.revoked
                      ? t('accountSettings.oauthClient.statusRevoked')
                      : row.clientType || 'confidential'}
                  </span>
                </div>
                <div className={styles.idRow}>
                  <code className={styles.clientId}>{row.clientId}</code>
                  <Button
                    type="link"
                    size="small"
                    aria-label={t('accountSettings.oauthClient.copyIdAria', {
                      id: row.clientId,
                    })}
                    onClick={() =>
                      void copyText(
                        row.clientId,
                        t('accountSettings.oauthClient.copyIdSuccess'),
                      )
                    }
                  >
                    {t('accountSettings.oauthClient.copyIdButton')}
                  </Button>
                </div>
                <p className={styles.detail}>
                  scopes: {(row.scopes || []).join(', ') || '—'}
                  {row.clientSecretHint
                    ? ` · secret …${row.clientSecretHint}`
                    : ''}
                  {row.redirectUris?.length
                    ? ` · ${t('accountSettings.oauthClient.redirectCount', {
                        count: row.redirectUris.length,
                      })}`
                    : ''}
                </p>
              </div>
              <div className={styles.actions}>
                {!row.revoked && (
                  <Button
                    type="link"
                    danger
                    size="small"
                    aria-label={t('accountSettings.oauthClient.revokeButtonAria', {
                      name: row.name,
                    })}
                    onClick={() => onRevoke(row)}
                  >
                    {t('accountSettings.common.revoke')}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        title={t('accountSettings.oauthClient.createModalTitle')}
        open={createOpen}
        onCancel={() => {
          if (!creating) {
            setCreateOpen(false);
          }
        }}
        onOk={() => void onCreate()}
        confirmLoading={creating}
        okText={t('accountSettings.oauthClient.createOk')}
        cancelText={t('accountSettings.common.cancel')}
        destroyOnClose
        width={440}
        className="oauth-clients-form"
        okButtonProps={{
          'aria-label': t('accountSettings.oauthClient.createOkAria'),
        }}
        data-testid="oauth-create-modal"
      >
        <Form
          form={form}
          layout="vertical"
          size="small"
          requiredMark={false}
          className="oauth-clients-form"
          initialValues={{
            clientType: 'confidential',
            scopes: ['projects:read', 'versions:read'],
          }}
        >
          <Form.Item
            name="name"
            label={t('accountSettings.oauthClient.nameLabel')}
            rules={[
              {
                required: true,
                message: t('accountSettings.oauthClient.nameRequired'),
              },
              { max: 64, message: t('accountSettings.oauthClient.nameMax') },
            ]}
          >
            <Input
              aria-label={t('accountSettings.oauthClient.nameAria')}
              placeholder={t('accountSettings.oauthClient.namePlaceholder')}
              autoComplete="off"
            />
          </Form.Item>
          <Form.Item
            name="clientType"
            label={t('accountSettings.oauthClient.typeLabel')}
            rules={[{ required: true }]}
          >
            <Select options={clientTypeOptions} />
          </Form.Item>
          <Form.Item
            name="scopes"
            label={t('accountSettings.oauthClient.scopesLabel')}
            rules={[
              {
                required: true,
                type: 'array',
                min: 1,
                message: t('accountSettings.oauthClient.scopesRequired'),
              },
            ]}
          >
            <Checkbox.Group
              options={SCOPE_OPTIONS}
              aria-label={t('accountSettings.oauthClient.scopesAria')}
            />
          </Form.Item>
          <Form.Item
            name="redirectUrisText"
            label={t('accountSettings.oauthClient.redirectLabel')}
            extra={
              clientType === 'public'
                ? t('accountSettings.oauthClient.redirectExtraPublic')
                : t('accountSettings.oauthClient.redirectExtraOptional')
            }
            rules={
              clientType === 'public'
                ? [
                    {
                      required: true,
                      message: t('accountSettings.oauthClient.redirectRequiredPublic'),
                    },
                  ]
                : undefined
            }
          >
            <Input.TextArea
              aria-label={t('accountSettings.oauthClient.redirectLabel')}
              placeholder={t('accountSettings.oauthClient.redirectPlaceholder')}
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('accountSettings.oauthClient.revealTitle')}
        open={!!secretReveal}
        onCancel={() => setSecretReveal(null)}
        onOk={() => setSecretReveal(null)}
        okText={t('accountSettings.common.saved')}
        cancelButtonProps={{ style: { display: 'none' } }}
        className="oauth-clients-secret-dialog"
        width={480}
        destroyOnClose
        okButtonProps={{
          'aria-label': t('accountSettings.oauthClient.revealOkAria'),
        }}
        data-testid="oauth-reveal-modal"
      >
        {secretReveal && (
          <div data-testid="oauth-client-secret-reveal">
            <p className={styles.secretWarn} role="alert">
              {secretReveal.clientSecret
                ? t('accountSettings.oauthClient.revealWarnSecret')
                : t('accountSettings.oauthClient.revealWarnPublic')}
            </p>
            <div className={styles.secretBlock}>
              <p className={styles.secretLabel}>
                {t('accountSettings.oauthClient.clientIdLabel')}
              </p>
              <div className={styles.secretValue}>
                <code className={styles.secretCode}>
                  {secretReveal.clientId}
                </code>
                <Button
                  type="link"
                  size="small"
                  aria-label={t('accountSettings.oauthClient.copyClientIdAria')}
                  onClick={() =>
                    void copyText(
                      secretReveal.clientId,
                      t('accountSettings.oauthClient.copyIdSuccess'),
                    )
                  }
                >
                  {t('accountSettings.common.copy')}
                </Button>
              </div>
            </div>
            {secretReveal.clientSecret ? (
              <div className={styles.secretBlock}>
                <p className={styles.secretLabel}>
                  {t('accountSettings.oauthClient.clientSecretLabel')}
                </p>
                <div className={styles.secretValue}>
                  <code className={styles.secretCode}>
                    {secretReveal.clientSecret}
                  </code>
                  <Button
                    type="link"
                    size="small"
                    aria-label={t(
                      'accountSettings.oauthClient.copyClientSecretAria',
                    )}
                    onClick={() =>
                      void copyText(
                        secretReveal.clientSecret as string,
                        t('accountSettings.oauthClient.copyClientSecretSuccess'),
                      )
                    }
                  >
                    {t('accountSettings.common.copy')}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(OAuthClientsView);
