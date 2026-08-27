// @ts-check
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'ERD Online',
  tagline: '数据库设计的 Git + Figma',
  // 公开文档站只有 https://doc.erdonline.com（base /）。
  // CI 灾备 GH Pages 用环境变量覆盖为 github.io + /erdonline/，不作为产品入口。
  url: process.env.DOCUSAURUS_URL || 'https://doc.erdonline.com',
  baseUrl: process.env.DOCUSAURUS_BASE_URL || '/',
  organizationName: 'erdonline',
  projectName: 'erdonline',
  // CI / Pages：死链应失败；本地改文档时可临时改为 warn
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans', 'en'],
    localeConfigs: {
      'zh-Hans': { label: '简体中文' },
      en: { label: 'English' },
    },
  },
  clientModules: [require.resolve('./src/clientModules/baiduAnalytics.js')],
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
        blog: {
          path: 'blog',
          routeBasePath: 'blog',
          showReadingTime: true,
          blogTitle: '指南与文章',
          blogDescription: '使用指南索引与深度文章入口',
          editUrl: 'https://github.com/erdonline/erdonline/tree/main/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      ({
        hashed: true,
        language: ['en', 'zh'],
        docsDir: '../docs',
        docsRouteBasePath: 'docs',
        indexBlog: true,
        highlightSearchTermsOnTargetPage: true,
      }),
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'ERD Online',
        items: [
          {
            type: 'doc',
            docId: 'guide/intro',
            position: 'left',
            label: '文档',
          },
          { to: '/blog', label: '指南索引', position: 'left' },
          {
            href: 'https://www.erdonline.com/demo',
            label: '试用 Demo',
            position: 'left',
          },
          {
            href: 'https://github.com/erdonline/erdonline/tree/main/docs/releases',
            label: '发版笔记',
            position: 'left',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
          { href: 'https://github.com/erdonline/erdonline', label: 'GitHub', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: '使用',
            items: [
              { label: '从这里开始', to: '/docs/guide/intro' },
              { label: '试用 Demo', href: 'https://www.erdonline.com/demo' },
              { label: '工具对照', href: 'https://www.erdonline.com/compare' },
            ],
          },
          {
            title: '更多',
            items: [
              { label: '指南索引', to: '/blog' },
              {
                label: '发版笔记',
                href: 'https://github.com/erdonline/erdonline/tree/main/docs/releases',
              },
              { label: 'GitHub', href: 'https://github.com/erdonline/erdonline' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} ERD Online · MIT`,
      },
    }),
};

module.exports = config;
