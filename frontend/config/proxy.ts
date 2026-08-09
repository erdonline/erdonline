/**
 * 开发环境代理：前端请求走同源相对路径（API_URL 为空），
 * 由 Umi dev server 代理到后端单体（默认 http://localhost:9502），避免跨域。
 * 生产环境由 nginx 反代同源，proxy 不生效。
 */
const BACKEND = process.env.BACKEND_URL || 'http://localhost:9502';

const backendProxy = {
  target: BACKEND,
  changeOrigin: true,
};

export default {
  dev: {
    '/auth/': backendProxy,
    '/syst/': backendProxy,
    '/ncnb/': backendProxy,
    '/dataDict/': backendProxy,
    '/.well-known/': backendProxy,
  },
  test: {
    '/auth/': backendProxy,
    '/syst/': backendProxy,
    '/ncnb/': backendProxy,
    '/dataDict/': backendProxy,
    '/.well-known/': backendProxy,
  },
};

