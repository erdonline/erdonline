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
import { designIntl } from '@/pages/design/locales/intl';

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

  const zoomInLabel = designIntl('design.relation.controls.zoomIn');
  const zoomOutLabel = designIntl('design.relation.controls.zoomOut');
  const fitViewLabel = designIntl('design.relation.controls.fitView');
  const toggleLabel = designIntl('design.relation.controls.toggleInteractive');

  return (
    <Controls showZoom={false} showFitView={false} showInteractive={false}>
      <ControlButton
        onClick={() => zoomIn()}
        className="react-flow__controls-zoomin"
        title={zoomInLabel}
        aria-label={zoomInLabel}
        disabled={maxZoomReached}
      >
        <PlusOutlined style={controlIconStyle} aria-hidden />
      </ControlButton>
      <ControlButton
        onClick={() => zoomOut()}
        className="react-flow__controls-zoomout"
        title={zoomOutLabel}
        aria-label={zoomOutLabel}
        disabled={minZoomReached}
      >
        <MinusOutlined style={controlIconStyle} aria-hidden />
      </ControlButton>
      <ControlButton
        className="react-flow__controls-fitview erd-controls-primary"
        onClick={() => fitView(fitViewOptions)}
        title={fitViewLabel}
        aria-label={fitViewLabel}
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
          title={toggleLabel}
          aria-label={toggleLabel}
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
