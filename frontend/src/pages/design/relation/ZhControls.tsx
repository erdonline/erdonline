import React from 'react';
import {
  BorderOuterOutlined,
  LockOutlined,
  MinusOutlined,
  PlusOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import {
  Controls,
  ControlButton,
  useReactFlow,
  useStore,
  useStoreApi,
  FitViewOptions,
} from 'reactflow';

/**
 * ReactFlow Controls 中文可访问名（库默认硬编码 zoom in / fit view 等英文）。
 * RF v11 无 ariaLabels prop → 关掉默认按钮，用 ControlButton 自绘。
 */

type ZhControlsProps = {
  showInteractive?: boolean;
  fitViewOptions?: FitViewOptions;
};

const controlIconStyle: React.CSSProperties = { fontSize: 16 };

const ZhControls: React.FC<ZhControlsProps> = ({
  showInteractive = true,
  fitViewOptions,
}) => {
  const store = useStoreApi();
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const isInteractive = useStore(
    (s) => s.nodesDraggable || s.nodesConnectable || s.elementsSelectable,
  );
  const minZoomReached = useStore((s) => s.transform[2] <= s.minZoom);
  const maxZoomReached = useStore((s) => s.transform[2] >= s.maxZoom);

  return (
    <Controls showZoom={false} showFitView={false} showInteractive={false}>
      <ControlButton
        onClick={() => zoomIn()}
        className="react-flow__controls-zoomin"
        title="放大"
        aria-label="放大"
        disabled={maxZoomReached}
      >
        <PlusOutlined style={controlIconStyle} aria-hidden />
      </ControlButton>
      <ControlButton
        onClick={() => zoomOut()}
        className="react-flow__controls-zoomout"
        title="缩小"
        aria-label="缩小"
        disabled={minZoomReached}
      >
        <MinusOutlined style={controlIconStyle} aria-hidden />
      </ControlButton>
      <ControlButton
        className="react-flow__controls-fitview erd-controls-primary"
        onClick={() => fitView(fitViewOptions)}
        title="适应画布"
        aria-label="适应画布"
      >
        <BorderOuterOutlined style={controlIconStyle} aria-hidden />
      </ControlButton>
      {showInteractive && (
        <ControlButton
          className="react-flow__controls-interactive"
          onClick={() => {
            store.setState({
              nodesDraggable: !isInteractive,
              nodesConnectable: !isInteractive,
              elementsSelectable: !isInteractive,
            });
          }}
          title="切换交互"
          aria-label="切换交互"
        >
          {isInteractive ? (
            <UnlockOutlined style={controlIconStyle} aria-hidden />
          ) : (
            <LockOutlined style={controlIconStyle} aria-hidden />
          )}
        </ControlButton>
      )}
    </Controls>
  );
};

export default ZhControls;
