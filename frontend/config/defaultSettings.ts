/** 全局轻量设置（原 ProLayout Settings 类型已移除，见 ADR-0014） */
const Settings: {
  pwa?: boolean;
  logo?: string;
  title?: string;
  iconfontUrl?: string;
} = {
  title: 'ERD Online',
  pwa: false,
  iconfontUrl: '//at.alicdn.com/t/font_2750460_b2lnxw12jxe.js',
};

export default Settings;
