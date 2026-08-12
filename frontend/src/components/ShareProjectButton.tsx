import React, {useRef, useState} from 'react';
import {Button, Input, Modal, Space, message, type InputRef} from 'antd';
import {useIntl} from '@umijs/max';
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
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const shareUrlInputRef = useRef<InputRef>(null);

  const ensureShare = async (): Promise<string | null> => {
    const projectId = cache.getItem(CONSTANT.PROJECT_ID);
    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'shareModal.noProject' }));
      return null;
    }
    setLoading(true);
    try {
      const res = (await request.post('/ncnb/share/create', {
        data: {projectId},
      })) as ApiResult<ShareCreatePayload>;
      if (res?.code !== 200 || !res?.data?.token) {
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
      await ensureShare();
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success(intl.formatMessage({ id: 'shareModal.copySuccess' }));
    } catch {
      message.success(
        intl.formatMessage({ id: 'shareModal.copyFallback' }, { url: shareUrl }),
      );
    }
  };

  const onRevoke = async () => {
    if (!token) {
      message.warning(intl.formatMessage({ id: 'shareModal.noValidLink' }));
      return;
    }
    setRevoking(true);
    try {
      const res = (await request.post('/ncnb/share/revoke', {
        data: {token},
      })) as ApiResult<boolean>;
      if (res?.code !== 200) {
        return;
      }
      message.success(intl.formatMessage({ id: 'shareModal.revokeSuccess' }));
      setToken(null);
      setShareUrl(null);
      setOpen(false);
    } catch {
      // network/HTTP: errorHandler already toasts
    } finally {
      setRevoking(false);
    }
  };

  const onRevokeClick = () => {
    if (!token) {
      message.warning(intl.formatMessage({ id: 'shareModal.noValidLink' }));
      return;
    }
    confirmDestructive({
      title: intl.formatMessage({ id: 'shareModal.revokeConfirmTitle' }),
      content: intl.formatMessage({ id: 'shareModal.revokeConfirmContent' }),
      okText: intl.formatMessage({ id: 'shareModal.revokeOk' }),
      okType: 'danger',
      cancelText: intl.formatMessage({ id: 'shareModal.cancel' }),
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
        aria-label={intl.formatMessage({ id: 'shareModal.shareAria' })}
      >
        {intl.formatMessage({ id: 'shareModal.shareButton' })}
      </Button>
      <Modal
        title={intl.formatMessage({ id: 'shareModal.title' })}
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
          {intl.formatMessage({ id: 'shareModal.hint' })}
        </p>
        <Space.Compact className="erd-share-modal__link-row">
          <Input
            ref={shareUrlInputRef}
            readOnly
            size="small"
            value={shareUrl || ''}
            placeholder={
              loading
                ? intl.formatMessage({ id: 'shareModal.linkPlaceholderLoading' })
                : intl.formatMessage({ id: 'shareModal.linkPlaceholderEmpty' })
            }
            aria-label={intl.formatMessage({ id: 'shareModal.linkAria' })}
          />
          <Button
            type="primary"
            size="small"
            loading={loading}
            onClick={() => void onPrimary()}
            aria-label={
              shareUrl
                ? intl.formatMessage({ id: 'shareModal.copyLink' })
                : intl.formatMessage({ id: 'shareModal.regenerateAria' })
            }
          >
            {shareUrl
              ? intl.formatMessage({ id: 'shareModal.copyLink' })
              : intl.formatMessage({ id: 'shareModal.regenerateLink' })}
          </Button>
        </Space.Compact>
        <Space className="erd-share-modal__actions" size={8}>
          <Button
            danger
            size="small"
            disabled={!token}
            loading={revoking}
            onClick={onRevokeClick}
            aria-label={intl.formatMessage({ id: 'shareModal.revokeAria' })}
          >
            {intl.formatMessage({ id: 'shareModal.revokeButton' })}
          </Button>
          <Button
            size="small"
            onClick={() => setOpen(false)}
            aria-label={intl.formatMessage({ id: 'shareModal.closeAria' })}
          >
            {intl.formatMessage({ id: 'shareModal.close' })}
          </Button>
        </Space>
      </Modal>
    </>
  );
};

export default ShareProjectButton;
