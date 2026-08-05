import React from 'react';
import { Tag, Tooltip } from 'antd';
import {
  CheckCircleFilled,
  QuestionCircleFilled,
  WarningFilled,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import {
  resolveVersionDirtyState,
  type VersionChangeItem,
} from '@/utils/versionDirtyStatus';
import { versionLayerPresentation } from '@/utils/dualLayerTokens';
import { intlFormat } from '@/utils/messageFormat';
import type { BaselineRecord } from '@/utils/versionBaseline';

export type VersionLayerStatusTagProps = {
  baselineLoaded: boolean;
  versionBaseline: BaselineRecord;
  changes: VersionChangeItem[];
};

/**
 * 版本页 toolbar A 层状态 Tag — 与顶栏 VersionDirtyChip 同源文案/色。
 */
const VersionLayerStatusTag: React.FC<VersionLayerStatusTagProps> = ({
  baselineLoaded,
  versionBaseline,
  changes,
}) => {
  const intl = useIntl();
  const format = intlFormat(intl);
  const state = resolveVersionDirtyState({ baselineLoaded, versionBaseline, changes });
  const pres = versionLayerPresentation(state, changes, format);
  const toolbarTestId = versionLayerToolbarTestId(pres.testId);

  const icon =
    state === 'unknown' ? (
      <QuestionCircleFilled />
    ) : state === 'clean' ? (
      <CheckCircleFilled />
    ) : (
      <WarningFilled />
    );

  return (
    <Tooltip title={pres.title}>
      <Tag color={pres.tagColor} data-testid={toolbarTestId}>
        {icon} {pres.label}
      </Tag>
    </Tooltip>
  );
};

/** Map chip testId → version page toolbar testId (legacy E2E) */
export function versionLayerToolbarTestId(chipTestId: string): string {
  const map: Record<string, string> = {
    'version-dirty-chip-unknown': 'version-baseline-unknown',
    'version-dirty-chip-no-baseline': 'version-no-baseline',
    'version-dirty-chip-dirty': 'version-dirty-tag',
    'version-dirty-chip-clean': 'version-clean-tag',
  };
  return map[chipTestId] ?? chipTestId;
}

export default VersionLayerStatusTag;
