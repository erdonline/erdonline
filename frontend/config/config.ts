// https://umijs.org/config/
import { defineConfig } from '@umijs/max';
import proxy from './proxy';
import routes from './routes';
const { theme } = require('antd/lib');
const { convertLegacyToken } = require('@ant-design/compatible/lib');

const { defaultAlgorithm, defaultSeed } = theme;

const mapToken = defaultAlgorithm(defaultSeed);
const v4Token = convertLegacyToken(mapToken);


const {REACT_APP_ENV, UMI_ENV} = process.env;

/** Crawler-visible `/` SERP copy. Per-path shells for /catalog /compare /en/* are written after build by scripts/gen-seo-static.mjs. */
const SEO_TITLE = 'Draw ER Diagram Online — Free Editor | ERD Online';
const SEO_DESCRIPTION =
  'Draw ER diagrams online for free. ERD editor and maker for entity-relationship models in the browser — versions, collaboration, no signup. MCP prompt suggest-erd-version: agents call create_version; humans still diff. Not ChatSQL.';
const SEO_ORIGIN = 'https://www.erdonline.com';
const SEO_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ERD Online',
  alternateName: ['Draw ER diagram online', 'ERD editor', 'ERD diagram online'],
  url: `${SEO_ORIGIN}/`,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: SEO_DESCRIPTION,
});

/** Cloudflare Web Analytics + Baidu Tongji — prod build only; skip localhost / 127.0.0.1 at runtime. */
const CLOUDFLARE_WEB_ANALYTICS_TOKEN = '4df015bf119f48ff9b03f302f6a3e40a';
const BAIDU_TONGJI_ID = 'bd50dd978c8d8d94792f4e987c4a7aaf';
const ANALYTICS_HOST_GUARD = "var h=location.hostname;if(h==='localhost'||h==='127.0.0.1'||h==='[::1]')return;";
const prodAnalyticsHeadScripts =
  UMI_ENV === 'prod'
    ? [
        {
          content: `(function(){${ANALYTICS_HOST_GUARD}var s=document.createElement('script');s.src='https://hm.baidu.com/hm.js?${BAIDU_TONGJI_ID}';document.head.appendChild(s);})();`,
        },
        {
          content: `(function(){${ANALYTICS_HOST_GUARD}var s=document.createElement('script');s.type='module';s.src='https://static.cloudflareinsights.com/beacon.min.js';s.setAttribute('data-cf-beacon','{"token":"${CLOUDFLARE_WEB_ANALYTICS_TOKEN}"}');document.head.appendChild(s);})();`,
        },
      ]
    : [];

export default defineConfig({
  hash: true,
  fastRefresh: true,
  // umi routes: https://umijs.org/docs/routing
  routes,
  title: SEO_TITLE,
  metas: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { name: 'description', content: SEO_DESCRIPTION },
    {
      name: 'keywords',
      content:
        'ERD Online, draw ER diagram online, ERD editor, ER diagram maker, entity relationship model',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'ERD Online' },
    { property: 'og:url', content: `${SEO_ORIGIN}/` },
    { property: 'og:title', content: SEO_TITLE },
    { property: 'og:description', content: SEO_DESCRIPTION },
    { property: 'og:image', content: `${SEO_ORIGIN}/landing-hero.jpg` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: SEO_TITLE },
    { name: 'twitter:description', content: SEO_DESCRIPTION },
  ],
  links: [
    {
      rel: 'preload',
      as: 'image',
      type: 'image/webp',
      href: '/landing-hero-800.webp?v=20260828a',
      imagesrcset:
        '/landing-hero-400.webp?v=20260828a 400w, /landing-hero-800.webp?v=20260828a 800w, /landing-hero-1600.webp?v=20260828a 1600w, /landing-hero.webp?v=20260828a 2100w',
      imagesizes: '100vw',
    },
    { rel: 'preconnect', href: 'https://fonts.bunny.net' },
    { rel: 'preconnect', href: 'https://hm.baidu.com' },
    { rel: 'preconnect', href: 'https://static.cloudflareinsights.com' },
    { rel: 'dns-prefetch', href: 'https://hm.baidu.com' },
    { rel: 'canonical', href: `${SEO_ORIGIN}/` },
    { rel: 'sitemap', type: 'application/xml', title: 'Sitemap', href: '/sitemap.xml' },
  ],
  ignoreMomentLocale: true,
  proxy: proxy[REACT_APP_ENV || 'dev'],
  manifest: {
    basePath: '/',
  },
  model: {},
  access: {},
  // access 插件依赖 initial State 所以需要同时开启
  initialState: {},
  // 提高 Babel targets，减少 core-js 等 polyfill 的打包量
  targets: { chrome: 120, firefox: 120, safari: 17, edge: 120 },
  deadCode: {},
  // i18n MVP（ADR-0023）：
  // antd:false — antd locale 已由 Theme 的 getAntdLocale() 手动管理，避免二次包一层 ConfigProvider 冲掉自定义 token；
  // baseNavigator:true — 首访按浏览器语言匹配；LocaleSwitcher 显式选择 + useLocalStorage 覆盖并持久化；
  // useLocalStorage:true — 用户显式切换持久化（umi_locale key）。
  locale: {
    default: 'zh-CN',
    antd: false,
    baseNavigator: true,
    useLocalStorage: true,
    title: false,
  },
  // 百度 / CF 统计：prod 构建经 headScripts 按 hostname 注入（跳过 localhost）；不用 Umi analytics 插件以免本地 serve prod 产物污染
  headScripts: [
    { type: 'application/ld+json', content: SEO_JSON_LD },
    { src: '/js/html2canvas.min.js?v=20260828a', async: true },
    '/env-config.js?date=' + new Date(),
    ...prodAnalyticsHeadScripts,
  ],
  lessLoader: {
    modifyVars: v4Token,
  },

});
