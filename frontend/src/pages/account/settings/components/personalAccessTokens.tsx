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
import styles from './personalAccessTokens.less';

const PAT_URL = '/auth/personal-access-tokens';

const SCOPE_OPTIONS = [
  { label: 'projects:read', value: 'projects:read' },
  { label: 'versions:read', value: 'versions:read' },
  { label: 'projects:write', value: 'projects:write' },
  { label: 'versions:write', value: 'versions:write' },
];

/** 0 = 不过期；其余写入 expiresInDays */
const EXPIRE_OPTIONS = [
  { label: '不过期', value: 0 },
  { label: '30 天', value: 30 },
  { label: '90 天', value: 90 },
  { label: '365 天', value: 365 },
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
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<PatSummary[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tokenReveal, setTokenReveal] = useState<PatCreated | null>(null);
  const [form] = Form.useForm<CreateFormValues>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GET(PAT_URL, {});
      if (res?.code === 200) {
        setTokens(Array.isArray(res.data) ? res.data : []);
        return;
      }
      if (!res?.msg) {
        message.error('加载访问令牌失败');
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
        message.success('访问令牌已铸造');
        await load();
        return;
      }
      if (!res?.msg) {
        message.error('铸造访问令牌失败');
      }
    } catch {
      // request errorHandler 已 toast
    } finally {
      setCreating(false);
    }
  };

  const onRevoke = (row: PatSummary) => {
    confirmDestructive({
      title: '吊销访问令牌？',
      content: `将吊销「${row.name}」。使用该令牌的脚本与 MCP 会立即失败，且无法恢复。`,
      okText: '吊销',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await DEL(`${PAT_URL}/${row.id}`, {});
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

  if (loading && tokens.length === 0) {
    return <PageSkeleton rows={3} />;
  }

  return (
    <div
      className={styles.root}
      data-testid="account-settings-personal-access-tokens"
    >
      <div className={styles.toolbar}>
        <p className={styles.hint}>
          用于 MCP / 脚本调用公开 API（Bearer
          erd_pat_…）。明文仅铸造时可见一次，之后无法再查看。
        </p>
        <Button
          type="primary"
          aria-label="铸造访问令牌"
          onClick={openCreate}
        >
          铸造令牌
        </Button>
      </div>

      {tokens.length === 0 ? (
        <p className={styles.empty} role="status">
          暂无访问令牌。点击「铸造令牌」创建。
        </p>
      ) : (
        <ul className={styles.list} aria-label="访问令牌列表">
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
                    {row.revoked ? '已吊销' : '有效'}
                  </span>
                </div>
                <div className={styles.hintRow}>
                  <code className={styles.tokenHint}>
                    …{row.tokenHint || '****'}
                  </code>
                </div>
                <p className={styles.detail}>
                  scopes: {(row.scopes || []).join(', ') || '—'}
                  {` · 过期 ${formatWhen(row.expireTime)}`}
                  {row.lastUsedTime
                    ? ` · 最近使用 ${formatWhen(row.lastUsedTime)}`
                    : ''}
                </p>
              </div>
              <div className={styles.actions}>
                {!row.revoked && (
                  <Button
                    type="link"
                    danger
                    size="small"
                    aria-label={`吊销访问令牌 ${row.name}`}
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
        title="铸造访问令牌"
        open={createOpen}
        onCancel={() => {
          if (!creating) {
            setCreateOpen(false);
          }
        }}
        onOk={() => void onCreate()}
        confirmLoading={creating}
        okText="铸造"
        cancelText="取消"
        destroyOnClose
        width={440}
        className="pat-form"
        okButtonProps={{ 'aria-label': '确认铸造访问令牌' }}
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
            label="名称"
            rules={[
              { required: true, message: '请输入名称' },
              { max: 64, message: '最多 64 字' },
            ]}
          >
            <Input
              aria-label="访问令牌名称"
              placeholder="例如 mcp-local / ci-script"
              autoComplete="off"
            />
          </Form.Item>
          <Form.Item
            name="scopes"
            label="Scopes"
            rules={[
              {
                required: true,
                type: 'array',
                min: 1,
                message: '至少选一个 scope',
              },
            ]}
          >
            <Checkbox.Group
              options={SCOPE_OPTIONS}
              aria-label="访问令牌 scopes"
            />
          </Form.Item>
          <Form.Item name="expiresInDays" label="有效期" rules={[{ required: true }]}>
            <Select
              options={EXPIRE_OPTIONS}
              aria-label="访问令牌有效期"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="请立即保存令牌"
        open={!!tokenReveal}
        onCancel={() => setTokenReveal(null)}
        onOk={() => setTokenReveal(null)}
        okText="我已保存"
        cancelButtonProps={{ style: { display: 'none' } }}
        className="pat-token-reveal-dialog"
        width={480}
        destroyOnClose
        okButtonProps={{ 'aria-label': '确认已保存访问令牌' }}
      >
        {tokenReveal && (
          <div data-testid="pat-token-reveal">
            <p className={styles.secretWarn} role="alert">
              令牌明文仅此一次显示，关闭后无法再查看，请立即复制到安全位置。
            </p>
            <div className={styles.secretBlock}>
              <p className={styles.secretLabel}>token</p>
              <div className={styles.secretValue}>
                <code className={styles.secretCode}>{tokenReveal.token}</code>
                <Button
                  type="link"
                  size="small"
                  aria-label="复制新建访问令牌"
                  onClick={() =>
                    void copyText(tokenReveal.token, '访问令牌已复制')
                  }
                >
                  复制
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(PersonalAccessTokensView);
