import React, { useCallback, useEffect, useState } from 'react';
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
import styles from './oauthClients.less';

const OAUTH_CLIENTS_URL = '/auth/oauth-clients';

const SCOPE_OPTIONS = [
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
        message.error('加载 OAuth 客户端失败');
      }
    } catch {
      // request errorHandler 已 toast
    } finally {
      setLoading(false);
    }
  }, []);

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
      message.error('public 客户端须至少一条 redirect URI');
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
        message.success('OAuth 客户端已注册');
        await load();
        return;
      }
      if (!res?.msg) {
        message.error('注册 OAuth 客户端失败');
      }
    } catch {
      // request errorHandler 已 toast
    } finally {
      setCreating(false);
    }
  };

  const onRevoke = (row: OAuthClientSummary) => {
    confirmDestructive({
      title: '吊销 OAuth 客户端？',
      content: `将吊销「${row.name}」。未过期的 access_token 与未消费的授权码会立即失效，且无法恢复。`,
      okText: '吊销',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await DEL(`${OAUTH_CLIENTS_URL}/${row.id}`, {});
          if (res?.code === 200) {
            message.success('已吊销');
            await load();
            return;
          }
          if (!res?.msg) {
            message.error('吊销失败');
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
        <p className={styles.hint}>
          注册后用于 MCP / 脚本的 OAuth（client_credentials 或 Authorization
          Code + PKCE）。client_secret 明文仅创建时可见一次，之后无法再查看。
        </p>
        <Button
          type="primary"
          aria-label="注册 OAuth 客户端"
          onClick={openCreate}
        >
          注册客户端
        </Button>
      </div>

      {clients.length === 0 ? (
        <p className={styles.empty} role="status">
          暂无 OAuth 客户端。点击「注册客户端」创建。
        </p>
      ) : (
        <ul className={styles.list} aria-label="OAuth 客户端列表">
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
                    {row.revoked ? '已吊销' : row.clientType || 'confidential'}
                  </span>
                </div>
                <div className={styles.idRow}>
                  <code className={styles.clientId}>{row.clientId}</code>
                  <Button
                    type="link"
                    size="small"
                    aria-label={`复制 client_id ${row.clientId}`}
                    onClick={() =>
                      void copyText(row.clientId, 'client_id 已复制')
                    }
                  >
                    复制 ID
                  </Button>
                </div>
                <p className={styles.detail}>
                  scopes: {(row.scopes || []).join(', ') || '—'}
                  {row.clientSecretHint
                    ? ` · secret …${row.clientSecretHint}`
                    : ''}
                  {row.redirectUris?.length
                    ? ` · redirect ${row.redirectUris.length} 条`
                    : ''}
                </p>
              </div>
              <div className={styles.actions}>
                {!row.revoked && (
                  <Button
                    type="link"
                    danger
                    size="small"
                    aria-label={`吊销 OAuth 客户端 ${row.name}`}
                    onClick={() => onRevoke(row)}
                  >
                    吊销
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        title="注册 OAuth 客户端"
        open={createOpen}
        onCancel={() => {
          if (!creating) {
            setCreateOpen(false);
          }
        }}
        onOk={() => void onCreate()}
        confirmLoading={creating}
        okText="注册"
        cancelText="取消"
        destroyOnClose
        width={440}
        className="oauth-clients-form"
        okButtonProps={{ 'aria-label': '确认注册 OAuth 客户端' }}
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
            label="名称"
            rules={[
              { required: true, message: '请输入名称' },
              { max: 64, message: '最多 64 字' },
            ]}
          >
            <Input
              aria-label="OAuth 客户端名称"
              placeholder="例如 ci-bot / spa-app"
              autoComplete="off"
            />
          </Form.Item>
          <Form.Item name="clientType" label="类型" rules={[{ required: true }]}>
            <Select
              options={[
                {
                  value: 'confidential',
                  label: 'confidential（有 secret，可 M2M）',
                },
                {
                  value: 'public',
                  label: 'public（无 secret，须 PKCE + redirect）',
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="scopes"
            label="Scopes"
            rules={[
              { required: true, type: 'array', min: 1, message: '至少选一个 scope' },
            ]}
          >
            <Checkbox.Group
              options={SCOPE_OPTIONS}
              aria-label="OAuth 客户端 scopes"
            />
          </Form.Item>
          <Form.Item
            name="redirectUrisText"
            label="Redirect URIs"
            extra={
              clientType === 'public'
                ? 'public 必填；每行一条；仅 https 或 localhost'
                : '可选；Authorization Code 流程需要时填写'
            }
            rules={
              clientType === 'public'
                ? [{ required: true, message: 'public 须至少一条 redirect URI' }]
                : undefined
            }
          >
            <Input.TextArea
              aria-label="OAuth redirect URIs"
              placeholder="http://127.0.0.1:3000/cb"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="请立即保存凭证"
        open={!!secretReveal}
        onCancel={() => setSecretReveal(null)}
        onOk={() => setSecretReveal(null)}
        okText="我已保存"
        cancelButtonProps={{ style: { display: 'none' } }}
        className="oauth-clients-secret-dialog"
        width={480}
        destroyOnClose
        okButtonProps={{ 'aria-label': '确认已保存 OAuth 凭证' }}
      >
        {secretReveal && (
          <div data-testid="oauth-client-secret-reveal">
            <p className={styles.secretWarn} role="alert">
              {secretReveal.clientSecret
                ? 'client_secret 仅此一次显示，关闭后无法再查看，请立即复制到安全位置。'
                : 'public 客户端无 client_secret。请保存 client_id；换票须走 Authorization Code + PKCE。'}
            </p>
            <div className={styles.secretBlock}>
              <p className={styles.secretLabel}>client_id</p>
              <div className={styles.secretValue}>
                <code className={styles.secretCode}>
                  {secretReveal.clientId}
                </code>
                <Button
                  type="link"
                  size="small"
                  aria-label="复制新建 client_id"
                  onClick={() =>
                    void copyText(secretReveal.clientId, 'client_id 已复制')
                  }
                >
                  复制
                </Button>
              </div>
            </div>
            {secretReveal.clientSecret ? (
              <div className={styles.secretBlock}>
                <p className={styles.secretLabel}>client_secret</p>
                <div className={styles.secretValue}>
                  <code className={styles.secretCode}>
                    {secretReveal.clientSecret}
                  </code>
                  <Button
                    type="link"
                    size="small"
                    aria-label="复制新建 client_secret"
                    onClick={() =>
                      void copyText(
                        secretReveal.clientSecret as string,
                        'client_secret 已复制',
                      )
                    }
                  >
                    复制
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
