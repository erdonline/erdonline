/**
 * request 网络请求工具
 * 更详细的api文档: https://bigfish.alipay.com/doc/api#request
 */
import {extend} from 'umi-request';
import {message} from 'antd';
import {getIntl} from '@umijs/max';
import * as cache from "./cache";
import {CONSTANT} from "@/utils/constant";
import {history} from '@@/exports';


const HTTP_STATUS_KEYS = {
  200: 'utils.request.http.200',
  201: 'utils.request.http.201',
  202: 'utils.request.http.202',
  204: 'utils.request.http.204',
  400: 'utils.request.http.400',
  401: 'utils.request.http.401',
  403: 'utils.request.http.403',
  404: 'utils.request.http.404',
  406: 'utils.request.http.406',
  409: 'utils.request.http.409',
  410: 'utils.request.http.410',
  422: 'utils.request.http.422',
  500: 'utils.request.http.500',
  502: 'utils.request.http.502',
  503: 'utils.request.http.503',
  504: 'utils.request.http.504',
};

function formatHttpStatus(code) {
  const key = HTTP_STATUS_KEYS[code];
  return key ? getIntl().formatMessage({ id: key }) : '';
}

/**
 * 异常处理程序：所有 HTTP 错误必须有用户可见反馈（设计原则：零静默失败）
 */
const errorHandler = error => {
  const {response, data} = error;
  if (!response) {
    message.error(getIntl().formatMessage({ id: 'utils.request.networkError' }));
    return;
  }
  const {status, url} = response;
  // 优先展示后端返回的业务错误信息（R.msg / OAuth error_description），其次状态码通用文案
  const serverMsg = (data && (data.msg || data.message || data.error_description)) || '';
  const errorText = serverMsg || formatHttpStatus(status) || response.statusText;

  if (status === 401) {
    const isLoginAttempt =
      url && (url.indexOf('/auth/login') >= 0 || url.indexOf('/login') >= 0);
    if (isLoginAttempt) {
      message.error(serverMsg || getIntl().formatMessage({ id: 'utils.request.badCredentials' }));
    } else {
      cache.removeItem('Authorization');
      if (history.location.pathname !== '/login') {
        message.error(getIntl().formatMessage({ id: 'utils.request.sessionExpired' }));
        history.push('/login');
      }
    }
    return;
  }
  message.error(errorText);
};

export const BASE_URL = window._env_.API_URL || API_URL;
export const ERD_BASE_URL = window._env_.ERD_API_URL || API_URL;

/** permitAll 鉴权端点：勿带过期 JWT，否则 Resource Server 401 阻断匿名访问 */
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/federate/providers',
  '/auth/federate/session',
  '/auth/federate/github',
  '/auth/federate/google',
  '/auth/federate/wechat',
];

function isPublicAuthUrl(url) {
  return PUBLIC_AUTH_PATHS.some((path) => url.indexOf(path) >= 0);
}

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
  const skipAuth = isPublicAuthUrl(url) || url.endsWith('/login');
  if (!skipAuth) {
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
      message.error(getIntl().formatMessage({ id: 'utils.request.nonJsonResponse' }));
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
    message.error(getIntl().formatMessage({ id: 'utils.request.parseFailed' }));
    const err = e instanceof Error ? e : new Error('JSON parse failed');
    err.response = response;
    throw err;
  }
  if (data) {
    const {code, msg} = data;
    const url = response.url || '';
    const isProjectSave =
      url.includes('/ncnb/project/save') || url.includes('/ncnb/project/group/save');
    const isVersionSave = url.includes('/ncnb/hisProject/save');
    if (code === 409 && isProjectSave) {
      // 乐观锁冲突由 persist 层弹可行动 Modal，勿重复 toast
    } else if (code === 409001 && isVersionSave) {
      // 版本号唯一冲突由 version store 弹 Modal，勿重复 toast
    } else if (code && code !== 200) {
      const errorText = msg || formatHttpStatus(code);
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
