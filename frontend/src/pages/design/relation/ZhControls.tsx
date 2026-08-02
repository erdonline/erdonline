import React from 'react';
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

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden>
      <path d="M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 5" aria-hidden>
      <path d="M0 0h32v4.2H0z" />
    </svg>
  );
}

function FitViewIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 30" aria-hidden>
      <path d="M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 32" aria-hidden>
      <path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 32" aria-hidden>
      <path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z" />
    </svg>
  );
}

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
        <PlusIcon />
      </ControlButton>
      <ControlButton
        onClick={() => zoomOut()}
        className="react-flow__controls-zoomout"
        title="缩小"
        aria-label="缩小"
        disabled={minZoomReached}
      >
        <MinusIcon />
      </ControlButton>
      <ControlButton
        className="react-flow__controls-fitview"
        onClick={() => fitView(fitViewOptions)}
        title="适应画布"
        aria-label="适应画布"
      >
        <FitViewIcon />
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
          {isInteractive ? <UnlockIcon /> : <LockIcon />}
        </ControlButton>
      )}
    </Controls>
  );
};

export default ZhControls;
