/**
 * i18n MVP 起步语料（ADR-0023）。与 zh-CN.ts 一一对应；key 集合必须保持同步。
 */
export default {
  'common.skipNav': 'Skip navigation',
  'locale.switcher.label': 'Language',
  'locale.option.zh-CN': '中文',
  'locale.option.en-US': 'English',

  // AuthBrandShell brand panel (login / register / 403 / 404 / share expired)
  'auth.brand.title': 'Git + Figma for database design',
  'auth.brand.lead':
    'Open the demo model without signing in, then decide whether to register. Versioning and collaboration are the moat; the canvas is the storefront.',
  'auth.brand.cta': 'Open demo',
  'auth.brand.homeAria': 'ERD Online home',
  'auth.brand.panelAria': 'Product overview',
  'auth.brand.demoAria': 'Open demo',
  'auth.subtitle.default': 'Open-source database modeling: versioning and collaboration, like Git + Figma',
  'auth.skip.default': 'Skip to form',

  // Login page
  'login.title': 'Sign in to ERD Online',
  'login.skipLabel': 'Skip to sign-in form',
  'login.username.label': 'Username',
  'login.username.placeholder': 'Username',
  'login.username.required': 'Please enter your username',
  'login.password.label': 'Password',
  'login.password.placeholder': 'Password',
  'login.password.required': 'Please enter your password',
  'login.submit': 'Sign in',
  'login.error': 'Sign-in failed. Check your username and password.',
  'login.footer.register': 'No account? Register',
  'login.footer.registerAria': 'Go to register',
  'login.footer.demo': 'Try demo (no sign-in)',
  'login.footer.demoAria': 'Try demo',
  'login.footer.landing': 'Learn more',
  'login.footer.landingAria': 'Learn about the product',
  'login.federate.divider': 'Or sign in with',
  'login.federate.github': 'Sign in with GitHub',
  'login.federate.google': 'Sign in with Google',
  'login.federate.wechat': 'Sign in with WeChat',
  'login.federate.unconfigured': 'Third-party sign-in is not configured',

  // Federated login callback page
  'federate.title': 'Third-party sign-in',
  'federate.skipLabel': 'Skip to status',
  'federate.status.processing': 'Completing third-party sign-in…',
  'federate.status.failed': 'Third-party sign-in did not complete',
  'federate.status.missingTicket': 'Missing sign-in credential',
  'federate.error.missingTicket': 'Third-party sign-in failed: missing ticket',
  'federate.error.failed': 'Third-party sign-in failed',
  'federate.failure.intro': 'You can:',
  'federate.failure.step1':
    'If you already have an account: sign in with username and password, then link Google / GitHub under Account settings → Security',
  'federate.failure.step2':
    'To create a new account: ask an admin to enable access, or (self-hosted) enable open registration',
  'federate.backToLogin': 'Back to sign in',
};
