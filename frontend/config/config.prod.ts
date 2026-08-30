// https://umijs.org/config/
import {defineConfig} from '@umijs/max';

export default defineConfig({
  publicPath: '/',
  define: {
    API_URL: 'https://api.erdonline.com',
    ERD_API_URL: 'https://api.erdonline.com',
    // Socket.IO 仍监听容器内 :9092；公网 api.erdonline.com:8080 未多路复用 9092，留空直至 socket 自定义域就绪
    SOCKETIO_URL: process.env.SOCKETIO_URL || '',
  },
  // 打包时移除 console
  extraBabelPlugins: ['transform-remove-console'],
  esbuildMinifyIIFE: true
});
