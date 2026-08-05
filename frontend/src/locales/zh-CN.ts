/**
 * i18n MVP 起步语料（ADR-0023）。首访 locale 由浏览器/umi 决定，回退 zh-CN；
 * 本文件是产品母语真相源，新 key 必须同时在 en-US.ts 补上翻译。
 * 只登记已被组件消费的 key；未消费的 key 视为死代码，随功能一起删。
 */
export default {
  'common.skipNav': '跳过导航',
  'locale.switcher.label': '语言',
  'locale.option.zh-CN': '中文',
  'locale.option.en-US': 'English',

  // AuthBrandShell 品牌面板（登录/注册/403/404/分享失效共用）
  'auth.brand.title': '数据库设计的 Git + Figma',
  'auth.brand.lead': '免登录打开示例模型，再决定是否注册。版本与协作是壁垒，画布体验是门面。',
  'auth.brand.cta': '打开演示',
  'auth.brand.homeAria': 'ERD Online 首页',
  'auth.brand.panelAria': '产品介绍',
  'auth.brand.demoAria': '打开演示',
  'auth.subtitle.default': '开源数据库建模：版本与协作，像 Git + Figma',
  'auth.skip.default': '跳到表单',

  // 登录页
  'login.title': '登录 ERD Online',
  'login.skipLabel': '跳到登录表单',
  'login.username.label': '用户名',
  'login.username.placeholder': '用户名',
  'login.username.required': '请输入用户名!',
  'login.password.label': '密码',
  'login.password.placeholder': '密码',
  'login.password.required': '请输入密码！',
  'login.submit': '登录',
  'login.error': '登录失败，请检查用户名和密码',
  'login.footer.register': '没有账号？去注册',
  'login.footer.registerAria': '去注册',
  'login.footer.demo': '先看演示（免登录）',
  'login.footer.demoAria': '先看演示',
  'login.footer.landing': '了解产品',
  'login.footer.landingAria': '了解产品',
  'login.federate.divider': '或使用第三方登录',
  'login.federate.github': '使用 GitHub 登录',
  'login.federate.google': '使用 Google 登录',
  'login.federate.wechat': '使用微信扫码登录',
  'login.federate.unconfigured': '第三方登录未配置',

  // 联邦登录回调页
  'federate.title': '第三方登录',
  'federate.skipLabel': '跳到状态区',
  'federate.status.processing': '正在完成第三方登录…',
  'federate.status.failed': '第三方登录未完成',
  'federate.status.missingTicket': '缺少登录凭证',
  'federate.error.missingTicket': '第三方登录失败：缺少 ticket',
  'federate.error.failed': '第三方登录失败',
  'federate.failure.intro': '你可以：',
  'federate.failure.step1': '若已有账号：先用用户名密码登录，再在「账号设置 → 安全」绑定 Google / GitHub',
  'federate.failure.step2': '若需新建账号：联系管理员开通，或（自托管）由管理员设置开放注册',
  'federate.backToLogin': '返回登录',
};
