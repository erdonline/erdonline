// https://umijs.org/config/
import { defineConfig } from '@umijs/max';

export default defineConfig({
  publicPath: '/',
  define: {
    // 空 = 前端用同源相对路径，由 config/proxy.ts 代理到后端，避免跨域
    API_URL: '',
    ERD_API_URL: '',
    SOCKETIO_URL: process.env.SOCKETIO_URL || 'http://localhost:9092',
  },
  // Fast Refresh 热更新
  fastRefresh: true,
  title: 'ERD Online — Draw ER Diagrams Online',
  // MFSU eager 在本机偶发卡在 build worker / 送出过期模块；dev 关掉以保证 HMR 与 E2E 一致
  mfsu: false,
});
