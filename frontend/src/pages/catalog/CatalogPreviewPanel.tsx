import React, {useEffect, useMemo, useState} from 'react';
import {Segmented, Tag} from 'antd';
import ShareRelationCanvas from '@/pages/share/ShareRelationCanvas';
import ShareEmptyState from '@/pages/share/ShareEmptyState';
import {listDiagrams} from '@/utils/diagram';
import '@/pages/share/index.less';

type ModuleData = {
  name?: string;
  chnname?: string;
  entities?: unknown[];
  associations?: unknown[];
  graphCanvas?: {nodes?: {id: string; x?: number; y?: number}[]};
  diagrams?: Array<{
    id: string;
    name: string;
    layout?: {nodes?: {id: string; x?: number; y?: number}[]};
    groups?: unknown[];
  }>;
};

export type CatalogPreviewPanelProps = {
  projectJSON?: {modules?: ModuleData[]};
};

const moduleKeyOf = (mod?: ModuleData) => mod?.name || mod?.chnname || '';

/**
 * 模板详情只读预览：复用分享页 ShareRelationCanvas（ReactFlow），数据来自 catalog API projectJSON。
 */
const CatalogPreviewPanel: React.FC<CatalogPreviewPanelProps> = ({projectJSON}) => {
  const modules = projectJSON?.modules ?? [];

  const [moduleKey, setModuleKey] = useState(() => moduleKeyOf(modules[0]));
  const [diagramId, setDiagramId] = useState(() => listDiagrams(modules[0])[0]?.id ?? '');

  useEffect(() => {
    const first = modules[0];
    setModuleKey(moduleKeyOf(first));
    setDiagramId(listDiagrams(first)[0]?.id ?? '');
  }, [projectJSON]);

  const currentModule = useMemo(
    () => modules.find((m) => moduleKeyOf(m) === moduleKey) || modules[0],
    [modules, moduleKey],
  );

  const diagrams = useMemo(() => listDiagrams(currentModule), [currentModule]);

  const activeDiagramId = useMemo(() => {
    if (diagramId && diagrams.some((d) => d.id === diagramId)) {
      return diagramId;
    }
    return diagrams[0]?.id ?? '';
  }, [diagramId, diagrams]);

  const onModuleChange = (value: string) => {
    setModuleKey(value);
    const next = modules.find((m) => moduleKeyOf(m) === value) || modules[0];
    setDiagramId(listDiagrams(next)[0]?.id ?? '');
  };

  if (modules.length === 0) {
    return (
      <div className="catalog-preview" data-testid="catalog-preview-panel">
        <Tag data-testid="catalog-preview-readonly-tag">只读预览</Tag>
        <div className="catalog-preview__stage" data-testid="catalog-preview-stage">
          <ShareEmptyState message="此模板暂无表结构，安装后从空白画布开始" />
        </div>
      </div>
    );
  }

  if (!currentModule) {
    return null;
  }

  return (
    <div className="catalog-preview" data-testid="catalog-preview-panel">
      <div className="catalog-preview__toolbar">
        <Tag data-testid="catalog-preview-readonly-tag">只读预览</Tag>
        {modules.length > 1 ? (
          <Segmented
            size="small"
            className="share-page__module-switch"
            value={moduleKey}
            options={modules.map((m) => ({
              label: m.chnname || m.name || '-',
              value: moduleKeyOf(m),
            }))}
            onChange={(v) => onModuleChange(String(v))}
            aria-label="切换模块"
            data-testid="catalog-preview-module-switch"
          />
        ) : null}
        {diagrams.length > 1 ? (
          <div className="share-page__diagram-bar" data-testid="catalog-preview-diagram-switch">
            <Segmented
              size="small"
              value={activeDiagramId}
              options={diagrams.map((d) => ({label: d.name, value: d.id}))}
              onChange={(v) => setDiagramId(String(v))}
              aria-label="切换关系图"
            />
          </div>
        ) : null}
      </div>
      <div className="catalog-preview__stage" data-testid="catalog-preview-stage">
        <ShareRelationCanvas module={currentModule} diagramId={activeDiagramId} />
      </div>
    </div>
  );
};

export default CatalogPreviewPanel;
