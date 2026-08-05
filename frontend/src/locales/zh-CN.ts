/**
 * i18n MVP 起步语料（ADR-0023）。首访 locale 由浏览器/umi 决定，回退 zh-CN；
 * 本文件是产品母语真相源，新 key 必须同时在 en-US.ts 补上翻译。
 * 只登记已被组件消费的 key；未消费的 key 视为死代码，随功能一起删。
 */
export default {
  'common.skipNav': '跳过导航',
};
