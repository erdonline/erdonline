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

/** Crawler-visible SERP copy (GSC: erd online / erd diagram online / draw|create ERD). */
const SEO_TITLE = 'ERD Online — Draw ER Diagrams Online';
const SEO_DESCRIPTION =
  'Free online ERD diagram maker. Create, draw, and view entity-relationship diagrams in the browser — versions, collaboration, no signup.';
const SEO_ORIGIN = 'https://www.erdonline.com';
const SEO_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ERD Online',
  alternateName: 'ERD diagram online',
  url: `${SEO_ORIGIN}/`,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description:
    'Free online ERD diagram maker. Create, draw, and view entity-relationship diagrams in the browser.',
});

/** Cloudflare Web Analytics — prod build only (CF Pages demo / Docker frontend). */
const CLOUDFLARE_WEB_ANALYTICS_TOKEN = '4df015bf119f48ff9b03f302f6a3e40a';
const cloudflareAnalyticsHeadScripts =
  UMI_ENV === 'prod'
    ? [
        {
          content: `(function(){var s=document.createElement('script');s.type='module';s.src='https://static.cloudflareinsights.com/beacon.min.js';s.setAttribute('data-cf-beacon','{"token":"${CLOUDFLARE_WEB_ANALYTICS_TOKEN}"}');document.head.appendChild(s);})();`,
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
    { name: 'description', content: SEO_DESCRIPTION },
    {
      name: 'keywords',
      content:
        'ERD Online, ERD diagram online, draw ERD online, create ERD online, ER diagram maker, entity relationship diagram, online ERD tool',
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
  // Umi analytics 插件：非 development 构建时注入 hm.baidu.com/hm.js
  analytics: { baidu: 'bd50dd978c8d8d94792f4e987c4a7aaf' },
  headScripts: [
    { type: 'application/ld+json', content: SEO_JSON_LD },
    '/js/html2canvas.min.js',
    '/env-config.js?date=' + new Date(),
    ...cloudflareAnalyticsHeadScripts,
  ],
  lessLoader: {
    modifyVars: v4Token,
  },

});
