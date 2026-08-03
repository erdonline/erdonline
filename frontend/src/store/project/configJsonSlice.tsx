import type { GetState, SetState } from 'zustand';
import type { ProjectState } from '@/store/project/useProjectStore';
import produce from 'immer';
import _ from 'lodash';
import { message } from 'antd';
import * as Save from '@/utils/save';

export type IConfigJsonSlice = Record<string, never>;

export type UpgradeTypePayload = {
  upgradeType?: string;
};

export interface IConfigJsonDispatchSlice {
  setConfigJson: (value: any) => void;
  /** 落库同步升级方式；仅 code===200 写 store，由调用方 toast/关窗 */
  setUpgradeType: (value: UpgradeTypePayload) => Promise<boolean>;
}

const ConfigJsonSlice = (
  set: SetState<ProjectState>,
  get: GetState<ProjectState>,
) => ({
  setConfigJson: (value: any) =>
    set(
      produce((state) => {
        state.project.configJSON = value;
      }),
    ),
  setUpgradeType: async (value: UpgradeTypePayload): Promise<boolean> => {
    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return false;
    }
    const next = produce(project, (draft) => {
      _.set(draft, 'configJSON.synchronous.upgradeType', value.upgradeType);
    });
    try {
      const res: { code?: number; msg?: string } = await Save.saveProject({
        ...next,
        type: next?.type ?? 1,
      });
      if (res?.code === 200) {
        set(
          produce((state) => {
            _.set(
              state.project,
              'configJSON.synchronous.upgradeType',
              value.upgradeType,
            );
          }),
        );
        return true;
      }
      // 业务失败：request 已 toast；失败不写 store（勿伪装成功）
      if (!res?.msg) {
        message.error('设置失败');
      }
      return false;
    } catch {
      // 网络/HTTP：errorHandler 已 toast
      return false;
    }
  },
});

export default ConfigJsonSlice;
