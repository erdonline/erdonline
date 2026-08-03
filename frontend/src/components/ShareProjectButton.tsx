import React, {useRef, useState} from 'react';
import {Button, Input, Modal, Space, message, type InputRef} from 'antd';
import {ShareAltOutlined} from '@ant-design/icons';
import request from '@/utils/request';
import * as cache from '@/utils/cache';
import {CONSTANT} from '@/utils/constant';
import {confirmDestructive} from '@/utils/destructiveConfirm';
import './dialog/io-modal.scss';

type ApiResult<T> = {
  code?: number;
  msg?: string;
  data?: T;
};

type ShareCreatePayload = {
  token?: string;
  path?: string;
};

/**
 * 设计器顶栏：只读分享管理（创建/复制/吊销）。
 */
const ShareProjectButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const shareUrlInputRef = useRef<InputRef>(null);

  const ensureShare = async (): Promise<string | null> => {
    const projectId = cache.getItem(CONSTANT.PROJECT_ID);
    if (!projectId) {
      message.warning('未打开项目');
      return null;
    }
    setLoading(true);
    try {
      const res = (await request.post('/ncnb/share/create', {
        data: {projectId},
      })) as ApiResult<ShareCreatePayload>;
      if (res?.code !== 200 || !res?.data?.token) {
        // 业务失败：request 已 toast；失败不叠弹；窗保持开 + 「重新生成」可重试
        setToken(null);
        setShareUrl(null);
        return null;
      }
      const nextToken = res.data.token;
      const url = `${window.location.origin}/s/${nextToken}`;
      setToken(nextToken);
      setShareUrl(url);
      return nextToken;
    } catch {
      // 网络/HTTP：errorHandler 已 toast；失败不叠弹；「重新生成」可重试
      setToken(null);
      setShareUrl(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const onOpen = async () => {
    setOpen(true);
    await ensureShare();
  };

  const onPrimary = async () => {
    if (!shareUrl) {
      // 创建失败或首开：主钮「重新生成」可重试（勿禁用死 affordance）
      await ensureShare();
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success('只读链接已复制');
    } catch {
      message.success(`分享链接：${shareUrl}`);
    }
  };

  const onRevoke = async () => {
    if (!token) {
      message.warning('当前无有效分享链接');
      return;
    }
    setRevoking(true);
    try {
      const res = (await request.post('/ncnb/share/revoke', {
        data: {token},
      })) as ApiResult<boolean>;
      if (res?.code !== 200) {
        // request 已 toast；失败不叠弹、不关窗
        return;
      }
      message.success('分享已吊销');
      setToken(null);
      setShareUrl(null);
      setOpen(false);
    } catch {
      // 网络/HTTP：errorHandler 已 toast
    } finally {
      setRevoking(false);
    }
  };

  const onRevokeClick = () => {
    if (!token) {
      message.warning('当前无有效分享链接');
      return;
    }
    confirmDestructive({
      title: '确认吊销分享？',
      content: '吊销后链接将立即失效，他人将无法再打开。',
      okText: '吊销',
      okType: 'danger',
      cancelText: '取消',
      onOk: onRevoke,
    });
  };

  return (
    <>
      <Button
        type="text"
        size="small"
        icon={<ShareAltOutlined/>}
        loading={loading && !open}
        onClick={onOpen}
        aria-label="只读分享"
      >
        分享
      </Button>
      <Modal
        title="只读分享"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnClose
        width={480}
        className="erd-io-modal"
        rootClassName="erd-io-modal-root"
        keyboard
        focusTriggerAfterClose
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          // 首焦「分享链接」只读输入；挂载后经 ref.focus
          const tryFocus = (attempt = 0) => {
            if (shareUrlInputRef.current) {
              shareUrlInputRef.current.focus();
              return;
            }
            if (attempt >= 20) {
              return;
            }
            window.setTimeout(() => tryFocus(attempt + 1), 50);
          };
          window.setTimeout(() => tryFocus(), 0);
        }}
      >
        <p className="erd-share-modal__hint">
          获得链接的人可匿名查看模型；吊销后链接立即失效。仅项目创建人可管理。
        </p>
        <Space.Compact className="erd-share-modal__link-row">
          <Input
            ref={shareUrlInputRef}
            readOnly
            size="small"
            value={shareUrl || ''}
            placeholder={loading ? '正在生成链接…' : '暂无分享链接'}
            aria-label="分享链接"
          />
          <Button
            type="primary"
            size="small"
            loading={loading}
            onClick={() => void onPrimary()}
            aria-label={shareUrl ? '复制链接' : '重新生成链接'}
          >
            {shareUrl ? '复制链接' : '重新生成'}
          </Button>
        </Space.Compact>
        <Space className="erd-share-modal__actions" size={8}>
          <Button
            danger
            size="small"
            disabled={!token}
            loading={revoking}
            onClick={onRevokeClick}
            aria-label="吊销分享"
          >
            吊销分享
          </Button>
          <Button size="small" onClick={() => setOpen(false)} aria-label="关闭分享">
            关闭
          </Button>
        </Space>
      </Modal>
    </>
  );
};

export default ShareProjectButton;
