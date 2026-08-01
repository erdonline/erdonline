// https://umijs.org/config/
import { defineConfig } from '@umijs/max';

export default defineConfig({
  publicPath: '/',
  define: {
    // 空 = 前端用同源相对路径，由 config/proxy.ts 代理到后端，避免跨域
    API_URL: '',
    ERD_API_URL: ''
  },
  // Fast Refresh 热更新
  fastRefresh: true,
  title:'ERD Online',
  mfsu: {
    exclude :['@playwright/test']
  },
});
