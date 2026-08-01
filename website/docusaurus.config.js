// @ts-check
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'ERD Online',
  tagline: '数据库设计的 Git + Figma',
  url: 'https://erdonline.github.io',
  baseUrl: '/erdonline/',
  organizationName: 'erdonline',
  projectName: 'erdonline',
  onBrokenLinks: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: '../docs',
          routeBasePath: 'docs',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/erdonline/erdonline/tree/main/docs/',
          exclude: ['**/releases/**'],
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'ERD Online',
        items: [
          { type: 'docSidebar', sidebarId: 'docs', position: 'left', label: '文档' },
          {
            href: 'https://github.com/erdonline/erdonline/tree/main/docs/releases',
            label: '发版笔记',
            position: 'left',
          },
          { href: 'https://github.com/erdonline/erdonline', label: 'GitHub', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} ERD Online · MIT`,
      },
    }),
};

module.exports = config;
