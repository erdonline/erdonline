// @ts-nocheck
import {compareStringVersionForSort} from './string';
export { checkVersionStructuralDiff as checkVersionData } from './versionStructuralDiff';
import { checkVersionStructuralDiff as checkVersionData } from './versionStructuralDiff';

export const getCurrentVersionData = (dataSource, versions, cb) => {
  // 保存当前版本信息
  // 1.计算当前版本变化
  const checkVersion = versions.sort((a, b) => compareStringVersionForSort(b.version, a.version, true))[0];
  // 读取当前版本的内容
  const currentDataSource = {...dataSource};
  // 组装需要比较的版本内容
  const changes = checkVersionData(currentDataSource, checkVersion?.projectJSON || currentDataSource);
  cb && cb(changes, checkVersion);
};

