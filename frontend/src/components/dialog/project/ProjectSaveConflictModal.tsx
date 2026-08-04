import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Spin, Typography } from 'antd';
import VersionDiffPanel from '@/components/dialog/version/VersionDiffPanel';
import useGlobalStore from '@/store/global/globalStore';
import useProjectStore from '@/store/project/useProjectStore';
import {
  diffLocalAgainstServer,
  fetchServerProjectSnapshot,
  type ServerProjectSnapshotResult,
} from '@/utils/projectSaveConflictPreview';
import {
  forkLocalProjectAsCopy,
  reloadProjectFromServer,
} from '@/utils/projectSaveConflict';

let conflictModalOpen = false;

type PreviewState = {
  loading: boolean;
  snapshot: ServerProjectSnapshotResult | null;
};

const ProjectSaveConflictModalContent: React.FC = () => {
  const localProjectJSON = useProjectStore((s) => s.project?.projectJSON);
  const projectId = useProjectStore((s) => s.project?.id as string | undefined);
  const [preview, setPreview] = useState<PreviewState>({ loading: true, snapshot: null });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!projectId) {
        setPreview({ loading: false, snapshot: { projectJSON: null, source: 'none' } });
        return;
      }
      setPreview({ loading: true, snapshot: null });
      const snapshot = await fetchServerProjectSnapshot(projectId);
      if (!cancelled) {
        setPreview({ loading: false, snapshot });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const diffItems = useMemo(() => {
    if (!preview.snapshot?.projectJSON) {
      return [];
    }
    return diffLocalAgainstServer(localProjectJSON, preview.snapshot.projectJSON);
  }, [localProjectJSON, preview.snapshot]);

  const sourceHint =
    preview.snapshot?.source === 'fetch'
      ? '已拉取服务器最新模型'
      : preview.snapshot?.source === 'lastKnown'
        ? '预览使用上次已知服务器快照（实时拉取失败）'
        : null;

  return (
    <div data-testid="project-save-conflict-modal">
      <Typography.Paragraph style={{ marginBottom: 12 }}>
        项目已被其他窗口或协作者更新，当前改动未能写入服务器。下方为本地工作区相对服务器的差异预览，便于决策后再刷新或另存。
      </Typography.Paragraph>
      {preview.loading ? (
        <div
          data-testid="project-save-conflict-preview-loading"
          style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 120 }}
        >
          <Spin size="small" />
          <Typography.Text type="secondary">正在加载冲突预览…</Typography.Text>
        </div>
      ) : (
        <>
          {sourceHint ? (
            <Typography.Text
              type="secondary"
              style={{ display: 'block', fontSize: 12, marginBottom: 8 }}
              data-testid="project-save-conflict-preview-source"
            >
              {sourceHint}
            </Typography.Text>
          ) : (
            <Typography.Text
              type="warning"
              style={{ display: 'block', fontSize: 12, marginBottom: 8 }}
              data-testid="project-save-conflict-preview-unavailable"
            >
              暂无法加载服务器版本预览，仍可刷新或另存为新项目。
            </Typography.Text>
          )}
          <div
            className="project-save-conflict-preview"
            data-testid="project-save-conflict-preview"
            style={{ ['--project-conflict-preview-h' as string]: '280px' }}
          >
            <VersionDiffPanel
              messages={diffItems}
              summaryHint="本地工作区 vs 服务器"
            />
          </div>
        </>
      )}
    </div>
  );
};

/** 409 可行动 Modal：差异预览 + 刷新 / 另存为新项目 */
export function showProjectSaveConflictModal(): void {
  if (conflictModalOpen) {
    return;
  }
  conflictModalOpen = true;
  useGlobalStore.getState().dispatch.setSaveConflict(true);
  useGlobalStore.getState().dispatch.setSaving(false);
  useGlobalStore.getState().dispatch.setSaved(false);

  Modal.warning({
    title: '保存冲突',
    width: 640,
    content: <ProjectSaveConflictModalContent />,
    okText: '刷新项目',
    okCancel: true,
    cancelText: '另存为新项目',
    closable: true,
    maskClosable: false,
    okButtonProps: { 'data-testid': 'project-save-conflict-refresh' } as React.ComponentProps<'button'>,
    cancelButtonProps: { 'data-testid': 'project-save-conflict-fork' } as React.ComponentProps<'button'>,
    onOk: () => {
      conflictModalOpen = false;
      void reloadProjectFromServer().finally(() => {
        Modal.destroyAll();
      });
    },
    onCancel: () => {
      conflictModalOpen = false;
      void forkLocalProjectAsCopy();
      return Promise.resolve();
    },
    afterClose: () => {
      conflictModalOpen = false;
    },
  });
}
