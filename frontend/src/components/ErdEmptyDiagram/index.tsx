import React from 'react';

type ErdEmptyDiagramProps = {
  /** compact = 画布空态；hero = 设计器欢迎空态 */
  size?: 'compact' | 'hero';
  className?: string;
};

/**
 * 空态 ER 剪影（ADR-0016）：两张幽灵表 + 关联边，走 --erd-* tokens。
 * 禁止粉红卡通 / 默认 Ant 蓝插画。
 */
const ErdEmptyDiagram: React.FC<ErdEmptyDiagramProps> = ({
  size = 'compact',
  className,
}) => {
  // compact：画布空态再收；hero：欢迎空态次密（介于 220 松剪影与 compact 132）
  const dim = size === 'hero' ? 176 : 132;
  return (
    <svg
      className={className}
      width={dim}
      height={Math.round(dim * 0.72)}
      viewBox="0 0 220 158"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      data-testid="erd-empty-diagram"
    >
      {/* soft frame hint (behind tables) */}
      <rect
        x="4"
        y="16"
        width="212"
        height="126"
        rx="12"
        fill="var(--erd-frame-fill)"
        opacity="0.35"
        stroke="var(--erd-success-border)"
        strokeWidth="1"
        strokeDasharray="5 4"
      />

      {/* left ghost table */}
      <rect
        x="12"
        y="28"
        width="88"
        height="102"
        rx="8"
        fill="var(--erd-surface)"
        stroke="var(--erd-line)"
        strokeWidth="1.5"
      />
      <rect
        x="12"
        y="28"
        width="88"
        height="26"
        rx="8"
        fill="var(--erd-surface-muted)"
      />
      <rect x="12" y="46" width="88" height="8" fill="var(--erd-surface-muted)" />
      <rect x="12" y="28" width="3" height="26" fill="var(--erd-brand)" opacity="0.85" />
      <rect x="24" y="36" width="48" height="6" rx="2" fill="var(--erd-ink-900)" opacity="0.35" />
      <rect x="24" y="66" width="56" height="5" rx="1.5" fill="var(--erd-ink-400)" opacity="0.45" />
      <rect x="24" y="80" width="40" height="5" rx="1.5" fill="var(--erd-ink-400)" opacity="0.35" />
      <rect x="24" y="94" width="50" height="5" rx="1.5" fill="var(--erd-ink-400)" opacity="0.28" />
      <rect x="22" y="64" width="2" height="9" rx="1" fill="var(--erd-warning)" opacity="0.7" />

      {/* right ghost table */}
      <rect
        x="120"
        y="40"
        width="88"
        height="90"
        rx="8"
        fill="var(--erd-surface)"
        stroke="var(--erd-line)"
        strokeWidth="1.5"
      />
      <rect
        x="120"
        y="40"
        width="88"
        height="26"
        rx="8"
        fill="var(--erd-surface-muted)"
      />
      <rect x="120" y="58" width="88" height="8" fill="var(--erd-surface-muted)" />
      <rect x="120" y="40" width="3" height="26" fill="var(--erd-brand)" opacity="0.55" />
      <rect x="132" y="48" width="44" height="6" rx="2" fill="var(--erd-ink-900)" opacity="0.28" />
      <rect x="132" y="78" width="52" height="5" rx="1.5" fill="var(--erd-ink-400)" opacity="0.4" />
      <rect x="132" y="92" width="36" height="5" rx="1.5" fill="var(--erd-ink-400)" opacity="0.3" />
      <rect
        x="176"
        y="76"
        width="18"
        height="10"
        rx="3"
        fill="var(--erd-success-bg)"
        stroke="var(--erd-success-border)"
        strokeWidth="1"
        opacity="0.9"
      />

      {/* association edge */}
      <path
        d="M100 86 C110 86, 110 86, 120 86"
        stroke="var(--erd-ink-600)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 3"
        opacity="0.55"
      />
      <path
        d="M116 82 L122 86 L116 90"
        stroke="var(--erd-ink-600)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.55"
      />
    </svg>
  );
};

export default ErdEmptyDiagram;
