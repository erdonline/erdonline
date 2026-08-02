import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ErdEmptyDiagram from '@/components/ErdEmptyDiagram';
import './index.less';

interface EmptyStateAnimationProps {
  title?: string;
  description?: string | ReactNode;
  children?: ReactNode;
  show?: boolean;
}

/**
 * 设计器欢迎空态（无 tab / 无模型）：品牌构图，非粉红插画。
 * 内容态必须参与 flex 高度链，否则子级 height:100%（画布）塌成 0。
 */
const EmptyStateAnimation: React.FC<EmptyStateAnimationProps> = ({
  title = '还没有打开的表',
  description,
  children,
  show = true,
}) => {
  const fillStyle: React.CSSProperties = {
    height: '100%',
    minHeight: 0,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={fillStyle}>
      <AnimatePresence mode="wait">
        {show ? (
          <motion.div
            key="empty"
            className="erd-welcome-empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={fillStyle}
            data-testid="designer-welcome-empty"
          >
            <div className="erd-welcome-empty__inner">
              <ErdEmptyDiagram size="hero" />
              <h2 className="erd-welcome-empty__title">{title}</h2>
              {description ? (
                <p className="erd-welcome-empty__desc">{description}</p>
              ) : null}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={fillStyle}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmptyStateAnimation;
