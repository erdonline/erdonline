// https://umijs.org/config/
import {defineConfig} from '@umijs/max';

export default defineConfig({
  publicPath: '/',
  define: {
    API_URL: 'https://erdonline-production.up.railway.app',
    ERD_API_URL: 'https://erdonline-production.up.railway.app',
    SOCKETIO_URL: process.env.SOCKETIO_URL || 'https://erdonline-production.up.railway.app',
  },
  // 打包时移除 console
  extraBabelPlugins: ['transform-remove-console'],
  esbuildMinifyIIFE: true
});
