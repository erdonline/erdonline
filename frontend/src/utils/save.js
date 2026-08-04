import * as cache from './cache';

import request from "../utils/request";
import {message} from "antd";
import {CONSTANT} from "@/utils/constant";
import {preferDataSourceIdPayload} from './connectorPayload';
import { isShareGuestContext } from './shareContext';

const updateFieldName = (data) => {
  // 将带下划线的属性转化为驼峰
  return Object.keys(data || {}).reduce((a, b) => {
    const tempA = {...a};
    const tempB = b.replace(/_([\w+])/g, (all, letter) => {
      return letter.toUpperCase();
    });
    tempA[tempB] = data[b];
    return tempA;
  }, {});
};

/** Connector 热路径：有已保存 id 则只传 dataSourceId，剥掉客户端 JDBC 凭证 */
const toConnectorBody = (data) => preferDataSourceIdPayload(updateFieldName(data));

// 新增项目
export const addProject = (data) => {
  return request.post('/ncnb/project/add', {data: data});
};

// 查询项目
export const pageProject = (params) => {
  return request.get('/ncnb/project/page', {
    params: {
      page: params.page,
      limit: params.limit,
      projectName: params.projectName,
      order: params.order,
      type: params.type
    }
  });
};

// 保存项目（ADR-0008：落库前剥掉 profile 内 JDBC 机密）
export const saveProject = (data) => {
  const {sanitizeProfileDataSources} = require('@/utils/projectDataSource');
  const payload = data ? {...data} : data;
  if (payload?.projectJSON?.profile) {
    payload.projectJSON = {
      ...payload.projectJSON,
      profile: sanitizeProfileDataSources(payload.projectJSON.profile),
    };
  }
  if (data.type == 1) {
    return request.post('/ncnb/project/save', {
      data: payload
    });
  } else {
    return request.post('/ncnb/project/group/save', {
      data: payload
    });
  }
};

// 连接数据库

export const ping = (data) => {
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  return request.post('/ncnb/connector/ping', {data: {...toConnectorBody(data), projectId}});
};

export const sqlexec = (data) => {
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  return request.post('/ncnb/connector/sqlexec', {data: {...toConnectorBody(data), projectId}});
};


export const dbsync = (data) => {
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  return request.post('/ncnb/connector/dbsync', {data: {...toConnectorBody(data), projectId}});
};

export const dbReverseParse = (data) => {
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  return request.post('/ncnb/connector/dbReverseParse', {
    data: {
      ...toConnectorBody(data),
      projectId,
    }
  });
};

export const dbReverseMeta = (data) => {
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  return request.post('/ncnb/connector/dbReverseMeta', {
    data: {
      ...toConnectorBody(data),
      projectId,
    }
  });
};

export const updateVersion = (data) => {
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  return request.post('/ncnb/connector/updateVersion', {
    data: {
      ...updateFieldName(data),
      projectId,
    }
  });
};

export const dbversion = (data) => {
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  return request.post('/ncnb/connector/dbversion', {
    data: {
      ...updateFieldName(data),
      projectId,
    }
  });
};


export const checkdbversion = (data) => {
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  return request.post('/ncnb/connector/checkdbversion', {
    data: {
      dbKey: data,
      projectId,
    }
  });
};

export const rebaseline = (data) => {
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  return request.post('/ncnb/connector/rebaseline', {
    data: {
      ...updateFieldName(data),
      projectId,
    }
  });
};

/** B 层实库 schema 指纹探测（只读；须用户显式触发） */
export const schemaProbe = (data) => {
  if (isShareGuestContext()) {
    return Promise.reject(new Error('分享访客不可探测实库'));
  }
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  return request.post('/ncnb/connector/schema/probe', {
    data: {
      ...toConnectorBody(data),
      projectId,
      projectJSON: data?.projectJSON,
    }
  });
};

// json 版本管理接口

export const hisProjectSave = (data) => {
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  return request.post('/ncnb/hisProject/save', {
    data: {
      ...data,
      projectId,
    }
  });
};

export const hisProjectLoad = (data) => {
  console.log('hisProjectLoad data:', data);
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  return request.post('/ncnb/hisProject/load', {
    data: {
      dbKey: data?.key,
      projectId,
    }
  });
};


export const getAllOnlineUser = (id) => {
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  return request.get(`/ncnb/ws/project/erd/getAllOnlineUser/${projectId}`);
};

export const hisProjectDelete = (id) => {
  return request.post(`/ncnb/hisProject/delete/${id}`);
};

export const hisProjectDeleteAll = (dbKey) => {
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  return request.post('/ncnb/hisProject/deleteAll', {
    data: {
      dbKey,
      projectId,
    }
  });
};

