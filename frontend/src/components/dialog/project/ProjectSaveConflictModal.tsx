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
import { appFormat } from '@/utils/messageFormat';
import { useIntl } from '@@/exports';

let conflictModalOpen = false;

type PreviewState = {
  loading: boolean;
  snapshot: ServerProjectSnapshotResult | null;
};

const ProjectSaveConflictModalContent: React.FC = () => {
  const intl = useIntl();
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
      ? intl.formatMessage({ id: 'versionModal.conflict.sourceFetch' })
      : preview.snapshot?.source === 'lastKnown'
        ? intl.formatMessage({ id: 'versionModal.conflict.sourceLastKnown' })
        : null;

  return (
    <div data-testid="project-save-conflict-modal">
      <Typography.Paragraph style={{ marginBottom: 12 }}>
        {intl.formatMessage({ id: 'versionModal.conflict.description' })}
      </Typography.Paragraph>
      {preview.loading ? (
        <div
          data-testid="project-save-conflict-preview-loading"
          style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 120 }}
        >
          <Spin size="small" />
          <Typography.Text type="secondary">
            {intl.formatMessage({ id: 'versionModal.conflict.loading' })}
          </Typography.Text>
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
              {intl.formatMessage({ id: 'versionModal.conflict.previewUnavailable' })}
            </Typography.Text>
          )}
          <div
            className="project-save-conflict-preview"
            data-testid="project-save-conflict-preview"
            style={{ ['--project-conflict-preview-h' as string]: '280px' }}
          >
            <VersionDiffPanel
              messages={diffItems}
              summaryHintId="versionModal.diff.summaryHintConflict"
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

  const format = appFormat();

  Modal.warning({
    title: format('versionModal.conflict.title'),
    width: 640,
    content: <ProjectSaveConflictModalContent />,
    okText: format('versionModal.conflict.refresh'),
    okCancel: true,
    cancelText: format('versionModal.conflict.fork'),
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
