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

  // Register page
  'register.title': 'Register for ERD Online',
  'register.skipLabel': 'Skip to registration form',
  'register.username.label': 'Username',
  'register.username.placeholder': 'Enter username',
  'register.username.tooltip': 'Up to 18 characters',
  'register.username.required': 'Required',
  'register.username.max': 'Must be 18 characters or fewer',
  'register.password.label': 'Password',
  'register.password.placeholder': 'Enter password',
  'register.password.tooltip': '6–20 characters with letters and numbers',
  'register.password.required': 'Password is required',
  'register.password.pattern': '6–20 characters with letters and numbers',
  'register.passwordConfirm.label': 'Confirm password',
  'register.passwordConfirm.placeholder': 'Enter password again',
  'register.passwordConfirm.tooltip': '6–20 characters with letters and numbers',
  'register.passwordConfirm.required': 'Password is required',
  'register.passwordConfirm.pattern': '6–20 characters with letters and numbers',
  'register.email.label': 'Email',
  'register.email.placeholder': 'Enter email',
  'register.email.tooltip': 'Standard email address',
  'register.email.required': 'Email is required',
  'register.email.pattern': 'Enter a valid email address',
  'register.phone.label': 'Mobile number',
  'register.phone.placeholder': 'Enter mobile number',
  'register.phone.tooltip': 'Standard mobile number',
  'register.phone.required': 'Mobile number is required',
  'register.phone.pattern': 'Enter a valid mobile number',
  'register.submit': 'Register',
  'register.error.passwordMismatch': 'Passwords do not match',
  'register.success': 'Registration successful!',
  'register.footer.login': 'Already have an account? Sign in',
  'register.footer.loginAria': 'Go to sign in',

  // Designer top-bar chrome (SaveStatus / VersionDirtyChip / SchemaProbe / DualLayerLegend)
  'designer.saveStatus.saving': 'Saving…',
  'designer.saveStatus.saved': 'Saved to server',
  'designer.saveStatus.failed': 'Save failed — click to retry',
  'designer.saveStatus.conflict': 'Save conflict — click for options',
  'designer.saveStatus.conflictTitle':
    'Project was updated elsewhere. Click to refresh or save as copy.',
  'designer.saveStatus.failedTitle':
    'Changes kept locally. Click to retry syncing to the server.',
  'designer.saveStatus.autoSaveTitle': 'Model changes autosave to the server.',
  'designer.saveStatus.autoSaveAria': 'Autosave: {label}',
  'designer.saveStatus.failedAria': 'Autosave failed; changes kept locally. Click to retry.',

  'designer.layer.a.name': 'Version',
  'designer.layer.a.compareHint': 'Workspace ↔ saved version',
  'designer.layer.b.name': 'Live DB',
  'designer.layer.b.compareHint': 'Model ↔ live DB schema',

  'designer.parity.synced': 'in sync',
  'designer.parity.ahead': 'ahead',
  'designer.parity.behind': 'behind',
  'designer.parity.diverged': 'diverged',
  'designer.parity.unknown': 'unknown',

  'designer.versionDirty.unknown.label': '{layer} {parity}',
  'designer.versionDirty.unknown.title':
    'Latest version baseline not loaded yet. Click to retry; cannot tell if there are unsaved changes.',
  'designer.versionDirty.noBaseline.label': 'No version yet{summary}',
  'designer.versionDirty.noBaseline.title':
    'This project has no saved version yet. Click to save the first version.',
  'designer.versionDirty.dirty.label': 'Unsaved changes{summary}',
  'designer.versionDirty.dirty.title':
    'Model differs from the latest saved version (model ahead). Click to save a version.',
  'designer.versionDirty.clean.label': '{layer} {parity}',
  'designer.versionDirty.clean.title':
    'Model matches the latest saved version. Click to view version history.',
  'designer.versionDirty.aria': 'Version status: {label}',

  'designer.schemaProbe.btn': 'Probe live DB',
  'designer.schemaProbe.btnAria': 'Probe live DB schema',
  'designer.schemaProbe.btnTooltip':
    'Probe live DB schema (explicit action; does not auto-sync)',
  'designer.schemaProbe.probing': 'Probing…',
  'designer.schemaProbe.probingTooltip': 'Connecting and reverse-engineering live DB…',
  'designer.schemaProbe.failedDefault': 'Live DB probe failed',
  'designer.schemaProbe.status.synced': '{layer} {parity}',
  'designer.schemaProbe.status.ahead': 'Model {parity}',
  'designer.schemaProbe.status.behind': '{layer} {parity}',
  'designer.schemaProbe.status.diverged': 'Both sides {parity}',
  'designer.schemaProbe.status.unknown': '{layer} {parity}',
  'designer.schemaProbe.hint.syncedWithFingerprint':
    'Fingerprint {fingerprint}… · {tableCount} tables · model {parity}',
  'designer.schemaProbe.hint.synced': 'Model {parity}',
  'designer.schemaProbe.hint.ahead':
    'Model has structures not yet applied to the live DB (future: push DDL).',
  'designer.schemaProbe.hint.behind':
    'Live DB has structures not in the model (future: pull to save a version).',
  'designer.schemaProbe.hint.diverged':
    'Each side has unique or conflicting changes; decide whether to pull or push.',
  'designer.schemaProbe.unknown.noDatasource.title': 'No datasource configured',
  'designer.schemaProbe.unknown.noDatasource.hint':
    'Select a JDBC datasource on the left before probing live DB schema.',
  'designer.schemaProbe.unknown.noDatasource.cta': 'Select datasource',
  'designer.schemaProbe.unknown.notProbed.title': 'Not probed yet',
  'designer.schemaProbe.unknown.notProbed.hint':
    '{layer} status is {parity}. Click “Probe live DB” to compare against the live schema.',
  'designer.schemaProbe.unknown.connectionFailed.title': 'Cannot connect to live DB',
  'designer.schemaProbe.unknown.connectionFailed.hint':
    'JDBC connection or reverse-engineering failed. Check network, host, and credentials.',
  'designer.schemaProbe.unknown.noPermission.title': 'No read permission',
  'designer.schemaProbe.unknown.noPermission.hint':
    'Account cannot introspect target schema. Use an account with SHOW/METADATA privileges.',
  'designer.schemaProbe.unknown.indeterminate.title': 'Cannot determine',
  'designer.schemaProbe.unknown.indeterminate.hint': 'Probe result incomplete. Try again.',
  'designer.schemaProbe.unknown.fallback.hint': 'No reliable live DB comparison yet.',
  'designer.schemaProbe.unknown.retryCta': 'Retry probe',

  'designer.legend.aria': 'Dual-layer consistency legend',
  'designer.legend.title': 'Dual comparison (kept separate)',
  'designer.legend.layerA': 'A · {name}: {hint}',
  'designer.legend.layerB': 'B · {name}: {hint} (explicit probe required)',
  'designer.legend.signalsTitle': 'Top bar signals',
  'designer.legend.signal.persist': 'Persist',
  'designer.legend.signal.persistHint': 'Model autosaves to server (project table)',
  'designer.legend.signal.version': 'Unsaved version',
  'designer.legend.signal.versionHint': 'Workspace ↔ saved version',
  'designer.legend.signal.schema': 'vs DB',
  'designer.legend.signal.schemaHint':
    'Model ↔ live DB schema; probe via radar button in top bar',
  'designer.legend.parityTitle': 'Shared parity colors',
  'designer.legend.parityColors':
    '{synced}·green / ahead·blue / behind·orange / diverged·red / unknown·gray',

  // DesignLayout: skip-nav + workflow top-bar buttons
  'designLayout.skip.tree': 'Skip to model tree',
  'designLayout.skip.workspace': 'Skip to main workspace',
  'designLayout.workflow.myOrders': 'My orders',
  'designLayout.workflow.pendingApproval': 'Pending',
  'designLayout.workflow.pendingApprovalAria': 'Orders pending approval',
  'designLayout.workflow.notifications': 'Notifications',
  'designLayout.project.fallback': 'Project',
  'designLayout.project.menuAria': 'Project menu',
  'designLayout.overflow.moreAria': 'More',
  'designLayout.user.menuAria': 'User menu',
  'designLayout.sider.navAria': 'Designer sidebar navigation',
  'designLayout.workspace.aria': 'Main workspace',

  // HomeLayout / GroupLayout top-bar aria
  'homeLayout.mainNavAria': 'Main navigation',
  'groupLayout.siderNavAria': 'Team settings navigation',
};
