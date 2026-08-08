import { captureAttribution } from '@/utils/analytics';

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{}> {
  // 推广链路度量：首触 UTM/referrer 归因（幂等、不覆盖）
  captureAttribution();
  return {}
}
