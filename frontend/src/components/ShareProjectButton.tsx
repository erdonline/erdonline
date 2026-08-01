import React, {useState} from 'react';
import {Button, message} from 'antd';
import {ShareAltOutlined} from '@ant-design/icons';
import request from '@/utils/request';
import * as cache from '@/utils/cache';
import {CONSTANT} from '@/utils/constant';

/**
 * 设计器顶栏：创建只读分享链接并复制。
 */
const ShareProjectButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const onShare = async () => {
    const projectId = cache.getItem(CONSTANT.PROJECT_ID);
    if (!projectId) {
      message.warning('未打开项目');
      return;
    }
    setLoading(true);
    try {
      const res: any = await request.post('/ncnb/share/create', {data: {projectId}});
      if (res?.code !== 200 || !res?.data?.token) {
        message.error(res?.msg || '创建分享失败');
        return;
      }
      const url = `${window.location.origin}/s/${res.data.token}`;
      try {
        await navigator.clipboard.writeText(url);
        message.success('只读链接已复制');
      } catch {
        // 无权限/非安全上下文时仍给出可复制链接，避免创建成功却报失败
        message.success(`分享链接：${url}`);
      }
    } catch (e: any) {
      message.error(e?.message || '创建分享失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="text"
      size="small"
      icon={<ShareAltOutlined/>}
      loading={loading}
      onClick={onShare}
      aria-label="只读分享"
    >
      分享
    </Button>
  );
};

export default ShareProjectButton;
