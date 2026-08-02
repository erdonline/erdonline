/**
 * request 网络请求工具
 * 更详细的api文档: https://bigfish.alipay.com/doc/api#request
 */
import {extend} from 'umi-request';
import {message} from 'antd';
import * as cache from "./cache";
import {CONSTANT} from "@/utils/constant";
import {history} from '@@/exports';


const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '当前用户权限不够，无法操作此功能。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请联系管理员。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

/**
 * 异常处理程序：所有 HTTP 错误必须有用户可见反馈（设计原则：零静默失败）
 */
const errorHandler = error => {
  const {response, data} = error;
  if (!response) {
    message.error('网络异常，请检查网络连接');
    return;
  }
  const {status, url} = response;
  // 优先展示后端返回的业务错误信息（R.msg / OAuth error_description），其次状态码通用文案
  const serverMsg = (data && (data.msg || data.message || data.error_description)) || '';
  const errorText = serverMsg || codeMessage[status] || response.statusText;

    if (status === 401) {
        if (url && (url.indexOf('/auth/login') >= 0 || url.indexOf('/login') >= 0)) {
            message.error(serverMsg || '用户名或密码错误');
        } else if (history.location.pathname !== '/login') {
      message.error('登录已失效，请重新登录');
      history.push('/login');
    }
    return;
  }
  message.error(errorText);
};

export const BASE_URL = window._env_.API_URL || API_URL;
export const ERD_BASE_URL = window._env_.ERD_API_URL || API_URL;

/**
 * 配置request请求时的默认参数
 */
const request = extend({
  prefix: BASE_URL,
  errorHandler, // 默认错误处理
});
/**
 * 配置request请求时的默认参数
 */
const request_erd = extend({
  prefix: ERD_BASE_URL,
  errorHandler, // 默认错误处理
});


request.interceptors.request.use((url, options) => {
  const isLogin = url.indexOf('/auth/login') >= 0 || url.endsWith('/login');
  if (!isLogin) {
    const authorization = cache.getItem('Authorization');
    const projectId = cache.getItem(CONSTANT.PROJECT_ID);
    if (authorization) {
      options.headers = {
        ...options.headers,
        projectId: projectId,
        Authorization: `Bearer ${authorization}`,
      };
    }
  }
  return { options: { ...options, interceptors: true } };
});


// clone response in response interceptor
request.interceptors.response.use(async (response, options) => {
  if (options.responseType === 'blob') {
    return response;
  }
  // HTTP 层错误统一由 errorHandler 提示，此处跳过避免同一条错误弹两次
  if (!response.ok) {
    return response;
  }
  // 代理/historyApiFallback 偶发把 SPA HTML 当 200 返回；.json() 会炸死后续旅程
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const peek = (await response.clone().text()).trimStart();
    if (peek.startsWith('<!') || peek.startsWith('<html') || peek.startsWith('<HTML')) {
      message.error('接口返回了页面而非 JSON，请确认后端已启动且代理指向 9502');
      const err = new Error('Non-JSON API response');
      err.name = 'NonJsonApiError';
      err.response = response;
      throw err;
    }
  }
  let data;
  try {
    data = await response.clone().json();
  } catch (e) {
    message.error('接口响应解析失败（非 JSON）');
    const err = e instanceof Error ? e : new Error('JSON parse failed');
    err.response = response;
    throw err;
  }
  if (data) {
    const {code, msg} = data;
    if (code && code !== 200) {
      const errorText = msg || codeMessage[code];
      message.error(errorText);
    }
  }
  return response;
});


export const logout = () => {
  request("/auth/exit", {
    method: 'POST',
  }).catch(() => {
    /* 退出接口失败仍清本地会话 */
  });
  // 必须清掉 JWT / 用户名，否则刷新后仍像已登录
  cache.clear();
  history.push('/login');
};

export {request_erd};
export default request;
