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
import { docsUrl } from '@/utils/docsUrl';
import {
  buildCursorMcpJson,
  cursorMcpInstallWebHref,
} from '@/utils/mcpJsonSnippet';
import styles from './personalAccessTokens.less';

const PAT_URL = '/auth/personal-access-tokens';

const SCOPE_OPTIONS = [
  { label: 'projects:read', value: 'projects:read' },
  { label: 'versions:read', value: 'versions:read' },
  { label: 'projects:write', value: 'projects:write' },
  { label: 'versions:write', value: 'versions:write' },
];

export type PatSummary = {
  id: string;
  name: string;
  scopes: string[];
  tokenHint?: string;
  expireTime?: string | null;
  lastUsedTime?: string | null;
  createTime?: string;
  revoked: boolean;
};

export type PatCreated = PatSummary & {
  token: string;
};

type CreateFormValues = {
  name: string;
  scopes: string[];
  expiresInDays: number;
};

async function copyText(text: string, okMsg: string) {
  try {
    await navigator.clipboard.writeText(text);
    message.success(okMsg);
  } catch {
    message.info(text);
  }
}

function formatWhen(iso?: string | null): string {
  if (!iso) {
    return '—';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString();
}

const PersonalAccessTokensView: React.FC = () => {
  const intl = useIntl();
  const t = (id: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id }, values);

  const expireOptions = useMemo(
    () => [
      { label: t('accountSettings.pat.expireNever'), value: 0 },
      { label: t('accountSettings.pat.expire30'), value: 30 },
      { label: t('accountSettings.pat.expire90'), value: 90 },
      { label: t('accountSettings.pat.expire365'), value: 365 },
    ],
    [intl],
  );

  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<PatSummary[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tokenReveal, setTokenReveal] = useState<PatCreated | null>(null);
  const [form] = Form.useForm<CreateFormValues>();
  const mcpApiUrl = window._env_?.ERD_API_URL || window._env_?.API_URL;
  const mcpJson = tokenReveal
    ? buildCursorMcpJson(tokenReveal.token, mcpApiUrl)
    : '';
  /** Placeholder PAT only — minted token stays in mcp.json, never in this URL. */
  const mcpInstallHref = cursorMcpInstallWebHref();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GET(PAT_URL, {});
      if (res?.code === 200) {
        setTokens(Array.isArray(res.data) ? res.data : []);
        return;
      }
      if (!res?.msg) {
        message.error(t('accountSettings.pat.loadFailed'));
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
      scopes: ['projects:read', 'versions:read'],
      expiresInDays: 0,
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
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        name: values.name.trim(),
        scopes: values.scopes,
      };
      if (values.expiresInDays > 0) {
        body.expiresInDays = values.expiresInDays;
      }
      const res = await POST(PAT_URL, body);
      if (res?.code === 200 && res.data) {
        setCreateOpen(false);
        form.resetFields();
        setTokenReveal(res.data as PatCreated);
        message.success(t('accountSettings.pat.mintSuccess'));
        await load();
        return;
      }
      if (!res?.msg) {
        message.error(t('accountSettings.pat.mintFailed'));
      }
    } catch {
      // request errorHandler 已 toast
    } finally {
      setCreating(false);
    }
  };

  const onRevoke = (row: PatSummary) => {
    confirmDestructive({
      title: t('accountSettings.pat.revokeTitle'),
      content: t('accountSettings.pat.revokeContent', { name: row.name }),
      okText: t('accountSettings.common.revoke'),
      okType: 'danger',
      cancelText: t('accountSettings.common.cancel'),
      onOk: async () => {
        try {
          const res = await DEL(`${PAT_URL}/${row.id}`, {});
          if (res?.code === 200) {
            message.success(t('accountSettings.pat.revokedSuccess'));
            await load();
            return;
          }
          if (!res?.msg) {
            message.error(t('accountSettings.pat.revokeFailed'));
          }
        } catch {
          // request errorHandler 已 toast
        }
      },
    });
  };

  if (loading && tokens.length === 0) {
    return <PageSkeleton rows={3} />;
  }

  return (
    <div
      className={styles.root}
      data-testid="account-settings-personal-access-tokens"
    >
      <div className={styles.toolbar}>
        <p className={styles.hint}>{t('accountSettings.pat.hint')}</p>
        <Button
          type="primary"
          aria-label={t('accountSettings.pat.mintButtonAria')}
          data-testid="pat-create-trigger"
          onClick={openCreate}
        >
          {t('accountSettings.pat.mintButton')}
        </Button>
      </div>

      {tokens.length === 0 ? (
        <p className={styles.empty} role="status">
          {t('accountSettings.pat.empty')}
        </p>
      ) : (
        <ul className={styles.list} aria-label={t('accountSettings.pat.listAria')}>
          {tokens.map((row) => (
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
                      ? t('accountSettings.pat.statusRevoked')
                      : t('accountSettings.pat.statusActive')}
                  </span>
                </div>
                <div className={styles.hintRow}>
                  <code className={styles.tokenHint}>
                    …{row.tokenHint || '****'}
                  </code>
                </div>
                <p className={styles.detail}>
                  scopes: {(row.scopes || []).join(', ') || '—'}
                  {` · ${t('accountSettings.pat.expiresPrefix')} ${formatWhen(row.expireTime)}`}
                  {row.lastUsedTime
                    ? ` · ${t('accountSettings.pat.lastUsedPrefix')} ${formatWhen(row.lastUsedTime)}`
                    : ''}
                </p>
              </div>
              <div className={styles.actions}>
                {!row.revoked && (
                  <Button
                    type="link"
                    danger
                    size="small"
                    aria-label={t('accountSettings.pat.revokeButtonAria', {
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
        title={t('accountSettings.pat.createModalTitle')}
        open={createOpen}
        onCancel={() => {
          if (!creating) {
            setCreateOpen(false);
          }
        }}
        onOk={() => void onCreate()}
        confirmLoading={creating}
        okText={t('accountSettings.pat.createOk')}
        cancelText={t('accountSettings.common.cancel')}
        destroyOnClose
        width={440}
        className="pat-form"
        okButtonProps={{ 'aria-label': t('accountSettings.pat.createOkAria') }}
        data-testid="pat-create-modal"
      >
        <Form
          form={form}
          layout="vertical"
          size="small"
          requiredMark={false}
          className="pat-form"
          initialValues={{
            scopes: ['projects:read', 'versions:read'],
            expiresInDays: 0,
          }}
        >
          <Form.Item
            name="name"
            label={t('accountSettings.pat.nameLabel')}
            rules={[
              { required: true, message: t('accountSettings.pat.nameRequired') },
              { max: 64, message: t('accountSettings.pat.nameMax') },
            ]}
          >
            <Input
              aria-label={t('accountSettings.pat.nameAria')}
              placeholder={t('accountSettings.pat.namePlaceholder')}
              autoComplete="off"
            />
          </Form.Item>
          <Form.Item
            name="scopes"
            label={t('accountSettings.pat.scopesLabel')}
            rules={[
              {
                required: true,
                type: 'array',
                min: 1,
                message: t('accountSettings.pat.scopesRequired'),
              },
            ]}
          >
            <Checkbox.Group
              options={SCOPE_OPTIONS}
              aria-label={t('accountSettings.pat.scopesAria')}
            />
          </Form.Item>
          <Form.Item
            name="expiresInDays"
            label={t('accountSettings.pat.expiresLabel')}
            rules={[{ required: true }]}
          >
            <Select
              options={expireOptions}
              aria-label={t('accountSettings.pat.expiresAria')}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('accountSettings.pat.revealTitle')}
        open={!!tokenReveal}
        onCancel={() => setTokenReveal(null)}
        onOk={() => setTokenReveal(null)}
        okText={t('accountSettings.common.saved')}
        cancelButtonProps={{ style: { display: 'none' } }}
        className="pat-token-reveal-dialog"
        width={560}
        destroyOnClose
        okButtonProps={{ 'aria-label': t('accountSettings.pat.revealOkAria') }}
        data-testid="pat-reveal-modal"
      >
        {tokenReveal && (
          <div data-testid="pat-token-reveal">
            <p className={styles.secretWarn} role="alert">
              {t('accountSettings.pat.revealWarn')}
            </p>
            <div className={styles.secretBlock}>
              <p className={styles.secretLabel}>{t('accountSettings.pat.tokenLabel')}</p>
              <div className={styles.secretValue}>
                <code className={styles.secretCode}>{tokenReveal.token}</code>
                <Button
                  type="link"
                  size="small"
                  aria-label={t('accountSettings.pat.copyButtonAria')}
                  onClick={() =>
                    void copyText(
                      tokenReveal.token,
                      t('accountSettings.pat.copiedSuccess'),
                    )
                  }
                >
                  {t('accountSettings.common.copy')}
                </Button>
              </div>
            </div>
            <div className={styles.mcpBlock}>
              <div className={styles.mcpHead}>
                <p className={styles.secretLabel}>
                  {t('accountSettings.pat.mcpSnippetLabel')}
                </p>
                <Button
                  type="link"
                  size="small"
                  data-testid="pat-copy-mcp-json"
                  aria-label={t('accountSettings.pat.copyMcpJsonAria')}
                  onClick={() =>
                    void copyText(mcpJson, t('accountSettings.pat.mcpCopiedSuccess'))
                  }
                >
                  {t('accountSettings.common.copy')}
                </Button>
              </div>
              <pre className={styles.mcpJson} data-testid="pat-mcp-json">
                <code>{mcpJson}</code>
              </pre>
              <p className={styles.mcpHint} data-testid="pat-mcp-snippet-hint">
                {t('accountSettings.pat.mcpSnippetHint')}{' '}
                <a
                  href={docsUrl(intl.locale, 'docs/guide/api-and-mcp')}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="pat-mcp-docs"
                  aria-label={t('accountSettings.pat.mcpDocsAria')}
                >
                  {t('accountSettings.pat.mcpDocsLink')}
                </a>
              </p>
              <p className={styles.mcpHint}>
                <a
                  href={mcpInstallHref}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="pat-cursor-install-link"
                  aria-label={t('accountSettings.pat.mcpCursorInstallAria')}
                >
                  {t('accountSettings.pat.mcpCursorInstallLink')}
                </a>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(PersonalAccessTokensView);
