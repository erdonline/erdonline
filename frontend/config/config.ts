// https://umijs.org/config/
import { defineConfig } from '@umijs/max';
import proxy from './proxy';
import routes from './routes';
const { theme } = require('antd/lib');
const { convertLegacyToken } = require('@ant-design/compatible/lib');

const { defaultAlgorithm, defaultSeed } = theme;

const mapToken = defaultAlgorithm(defaultSeed);
const v4Token = convertLegacyToken(mapToken);


const {REACT_APP_ENV} = process.env;

export default defineConfig({
  hash: true,
  fastRefresh: true,
  // umi routes: https://umijs.org/docs/routing
  routes,
  title:'ERD Online',
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
  analytics: {
    baidu: '46689e26837885690d97c7f5d08b9a0b',
  },
  headScripts:[
    '/js/html2canvas.min.js',
    '/env-config.js?date='+ new Date(),
  ],
  lessLoader: {
    modifyVars: v4Token,
  },

});
