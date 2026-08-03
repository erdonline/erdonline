// @ts-nocheck
import _ from 'lodash';
import doT from 'dot';
import {message} from "antd";

/** 方言码 → 字段物理类型（datatypeDomains.apply[code].type） */
const getFieldType = (datatype: unknown[], type: string, code: string): string => {
  const data = (datatype || []).filter((dt: { code?: string }) => dt.code === type)[0];
  if (data) {
    return _.get(data, `apply.${code}.type`, '');
  }
  return type;
};

/** 规范化方言码（去空白/下划线/连字符，小写） */
export function normalizeDialectCode(code: string | undefined | null): string {
  return String(code || '')
    .toLowerCase()
    .replace(/[\s_-]/g, '');
}

/** PG / SQL Server 支持部分·过滤索引 WHERE；MySQL / Oracle 无对等物 */
export function dialectSupportsIndexFilter(code: string | undefined | null): boolean {
  const c = normalizeDialectCode(code);
  return (
    c === 'postgresql' ||
    c === 'postgres' ||
    c === 'pg' ||
    c === 'sqlserver' ||
    c === 'mssql'
  );
}

/** P0 四库：MySQL/MariaDB / PG / SQL Server / Oracle 可导出 CREATE TRIGGER */
export function dialectSupportsTrigger(code: string | undefined | null): boolean {
  const c = normalizeDialectCode(code);
  return (
    c === 'mysql' ||
    c === 'mariadb' ||
    c === 'postgresql' ||
    c === 'postgres' ||
    c === 'pg' ||
    c === 'sqlserver' ||
    c === 'mssql' ||
    c === 'oracle'
  );
}

export type TriggerLike = {
  name?: string;
  timing?: string;
  event?: string;
  orientation?: string;
  statement?: string;
  ddl?: string;
};

const quoteMysqlIdent = (ident: string) => ident.replace(/`/g, '``');
const quoteDoubleIdent = (ident: string) => ident.replace(/"/g, '""');
const quoteSqlServerIdent = (ident: string) => ident.replace(/]/g, ']]');

/**
 * 按方言重建 CREATE TRIGGER（与后端 TriggerResultSetMapper 对齐；非字节级克隆）。
 * 有 `ddl` 时原样返回（调用方负责分号/separator）。
 */
export function rebuildTriggerDdl(
  trigger: TriggerLike,
  tableTitle: string,
  dialectCode?: string | null,
): string {
  const name = String(trigger?.name || '').trim() || 'trg';
  const table = String(tableTitle || '').trim();
  const timing = String(trigger?.timing || '').trim().toUpperCase() || 'BEFORE';
  const event = String(trigger?.event || '').trim().toUpperCase() || 'UPDATE';
  const orient = String(trigger?.orientation || '').trim().toUpperCase() || 'ROW';
  const body = String(trigger?.statement || '').trim();
  const c = normalizeDialectCode(dialectCode);

  if (c === 'sqlserver' || c === 'mssql') {
    const t = timing === 'INSTEAD OF' || timing === 'INSTEADOF' ? 'INSTEAD OF' : timing || 'AFTER';
    return (
      `CREATE TRIGGER [${quoteSqlServerIdent(name)}] ` +
      `ON [${quoteSqlServerIdent(table)}] ${t} ${event || 'INSERT'}\nAS\n${body}`
    );
  }
  if (c === 'oracle') {
    return (
      `CREATE OR REPLACE TRIGGER "${quoteDoubleIdent(name)}" ` +
      `${timing} ${event} ON "${quoteDoubleIdent(table)}" FOR EACH ${orient}\n${body}`
    );
  }
  if (c === 'postgresql' || c === 'postgres' || c === 'pg') {
    return (
      `CREATE TRIGGER "${quoteDoubleIdent(name)}" ` +
      `${timing} ${event} ON "${quoteDoubleIdent(table)}" FOR EACH ${orient}\n${body}`
    );
  }
  // MySQL / MariaDB（默认）
  return (
    `CREATE TRIGGER \`${quoteMysqlIdent(name)}\` ` +
    `${timing} ${event} ON \`${quoteMysqlIdent(table)}\` FOR EACH ${orient}\n${body}`
  );
}

/**
 * 导出触发器 DDL：优先 `ddl` 原样；否则按方言重建；非支持方言跳过。
 */
export function renderCreateTriggerSql(
  trigger: TriggerLike,
  tableTitle: string,
  separator: string,
  dialectCode?: string | null,
): string {
  if (!dialectSupportsTrigger(dialectCode)) {
    return '';
  }
  const existing = String(trigger?.ddl || '').trim();
  const name = String(trigger?.name || '').trim();
  const statement = String(trigger?.statement || '').trim();
  if (!existing && !name && !statement) {
    return '';
  }
  const ddl = existing || rebuildTriggerDdl(trigger, tableTitle, dialectCode);
  if (!ddl.trim()) {
    return '';
  }
  const stmt = /;\s*$/.test(ddl) ? ddl : `${ddl};`;
  return `${stmt}${separator || ''}`;
}

export function formatIndexFilterPredicate(
  filter: string | undefined | null,
): string | undefined {
  const f = String(filter || '').trim();
  return f || undefined;
}

/**
 * 建索引 SQL：有 filter 且方言支持时输出规范
 * `CREATE [UNIQUE] INDEX name ON table(cols) WHERE pred;`
 * （覆盖存量 MySQL 风 ALTER ADD INDEX 模板，避免 WHERE 语法非法）
 */
export function renderCreateIndexSql(
  template: string,
  templateData: {
    entity?: { title?: string; name?: string };
    index?: {
      name?: string;
      isUnique?: boolean;
      fields?: string[];
      filter?: string;
    };
    separator?: string;
    module?: unknown;
  },
  dialectCode?: string | null,
): string {
  const pred = formatIndexFilterPredicate(templateData?.index?.filter);
  if (pred && dialectSupportsIndexFilter(dialectCode)) {
    const index = templateData.index || {};
    const entity = templateData.entity || {};
    const sep = templateData.separator ?? '';
    const uniq = index.isUnique ? ' UNIQUE' : '';
    const name = String(index.name || '').trim();
    const table = String(entity.title || entity.name || '').trim();
    const cols = (Array.isArray(index.fields) ? index.fields : [])
      .map((f) => String(f || '').trim())
      .filter(Boolean)
      .join(',');
    return `CREATE${uniq} INDEX ${name} ON ${table}(${cols}) WHERE ${pred};${sep}`;
  }
  return getTemplateString(template, templateData);
}

/** 按方言 code 取 database 模板行；回落 defaultDatabase → 首项 */
export function pickDatabaseDialect(
  databases: Array<{ code?: string; defaultDatabase?: boolean }> | undefined,
  code?: string | null,
) {
  const list = databases || [];
  if (code) {
    const hit = list.find((db) => db.code === code);
    if (hit) return hit;
  }
  return list.find((db) => db.defaultDatabase) || list[0];
}

const getTemplateString = (template, templateData) => {
  const camel = (str, firstUpper) => {
    let ret = str.toLowerCase();
    ret = ret.replace(/_([\w+])/g, function (all, letter) {
      return letter.toUpperCase();
    });
    if (firstUpper) {
      ret = ret.replace(/\b(\w)(\w*)/g, function ($0, $1, $2) {
        return $1.toUpperCase() + $2;
      });
    }
    return ret;
  };
  const underline = (str, upper) => {
    const ret = str.replace(/([A-Z])/g, "_$1");
    if (upper) {
      return ret.toUpperCase();
    } else {
      return ret.toLowerCase();
    }
  };
  const upperCase = (str) => {
    return str.toLocaleUpperCase();
  };
  const lowerCase = (str) => {
    return str.toLocaleLowerCase();
  };
  const join = (...args) => {
    if (args.length <= 2) return args[0];
    const datas = [];
    const delimter = args[args.length - 1];
    for (let i = 0; i < args.length - 1; i++) {
      if (/^\s*$/.test(args[i])) continue;
      datas.push(args[i]);
    }
    return datas.join(delimter);
  };
  const objectkit = {
    isJSON: function (obj) {
      var isjson = typeof (obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
      return isjson;
    },
    deepClone: function (obj) {
      return JSON.parse(JSON.stringify(obj));
    },
    equals: function (v1, v2) {
      if (typeof (v1) === "object" && objectkit.isJSON(v1) && typeof (v2) === "object" && objectkit.isJSON(v2)) {
        return JSON.stringify(v1) == JSON.stringify(v2);
      } else {
        return v1 == v2;
      }

    }
  };
  const getIndex = (array, arg, n) => {
    var i = isNaN(n) || n < 0 ? 0 : n;
    for (; i < array.length; i++) {
      if (array[i] == arg) {
        return i;
      } else if (typeof (array[i]) === "object" && objectkit.equals(array[i], arg)) {
        return i;
      }
    }
    return -1;
  };
  const contains = (array, obj) => {
    return getIndex(array, obj) >= 0;
  };
  const uniquelize = (array) => {
    var copy = clone(array);
    const temp = [];
    for (var i = 0; i < copy.length; i++) {
      if (!contains(temp, copy[i])) {
        temp.push(copy[i]);
      }
    }
    return temp;
  };
  const clone = (array) => {
    var cloneList = Array();
    for (var i = 0, a = 0; i < array.length; i++) {
      cloneList.push(array[i]);
    }
    return cloneList;
  };
  const each = (array, fn) => {
    fn = fn || Function.K;
    var a = [];
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < array.length; i++) {
      var res = fn.apply(array, [array[i], i].concat(args));
      if (res != null) a.push(res);
    }
    return a;
  };
  const intersect = (array1, array2) => {
    // 交集
    const copy = clone(array1);
    const r = each(uniquelize(copy), function (o) {
      return contains(array2, o) ? o : null
    });
    return [].concat(r);
  };
  const union = (array1, array2) => {
    var copy = clone(array1);
    var r = uniquelize(copy.concat(array2));
    return [].concat(r);
  };
  const minus = (array1, array2) => {
    var copy = clone(array1);
    var r = each(uniquelize(copy), function (o) {
      return contains(array2, o) ? null : o
    });
    return [].concat(r);
  };
  const tplText = template.replace(/(^\s*)|(\s*$)/g, "");
  const conf = {
    evaluate: /\{\{([\s\S]+?)\}\}/g,
    interpolate: /\{\{=([\s\S]+?)\}\}/g,
    encode: /\{\{!([\s\S]+?)\}\}/g,
    use: /\{\{#([\s\S]+?)\}\}/g,
    define: /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
    conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
    iterate: /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
    varname: 'it',
    strip: false,
    append: true,
    doNotSkipEncoded: false,
    selfcontained: false
  };
  let resultText = doT.template(tplText, conf)({
    ...templateData,
    func: {
      camel: camel,
      underline: underline,
      upperCase: upperCase,
      lowerCase: lowerCase,
      join: join,
      intersect: intersect,
      union: union,
      minus: minus,
    }
  });
  resultText = resultText.replace(/\n(\n)*( )*(\n)*\n/g, "\n");  //删除空行
  resultText = resultText.replace(/\$blankline/g, '');              //单独处理需要空行的情况
  return resultText;
};

const generateIncreaseSql = (dataSource, module, dataTable, code, templateShow) => {
  const datatype = _.get(dataSource, 'dataTypeDomains.datatype', []);
  const database = _.get(dataSource, 'dataTypeDomains.database', []).filter(db => db.code===code)[0];
  const template = templateShow ? ((database && database[templateShow]) || '') : ((database && database.template) || '');
  const separator = _.get(dataSource, 'profile.sqlConfig', '/*SQL@Run*/') + '\n';
  // 构造新的数据表传递给模板
  const tempDataTable = {
    ...dataTable,
    fields: (dataTable.fields || []).map(field => {
      return {
        ...field,
        type: getFieldType(datatype, field.type, code),
      }
    })
  };
  if (templateShow === 'createIndexTemplate') {
    return (dataTable.indexs || []).map(i => {
      return `${renderCreateIndexSql(template, {
        module: {name: module},
        entity: tempDataTable,
        index: i,
        separator
      }, code)}`;
    }).join('');
  } else {
    return getTemplateString(template, {
      entity: tempDataTable,
      module: {name: module},
      separator
    });
  }
};

const getAllTable = (dataSource, name) => {
  return (dataSource.modules || []).reduce((a, b) => {
    return a.concat((b.entities || []).map(e => ({...e, [name]: b[name]})));
  }, []);
};

const generateUpdateSql = (dataSource, changesData = [], code, oldDataSource) => {
  const datatype = _.get(dataSource, 'dataTypeDomains.datatype', []);
  const database = _.get(dataSource, 'dataTypeDomains.database', [])
    .filter(db => db.defaultDatabase)[0];
  // 合并字段其他变化，只留一个
  const fieldsChanges = [];
  const changes = changesData.filter(c => {
    if (c.type === 'field' && c.opt === 'update') {
      const name = c.name.split('.');
      const fieldName = name[0] + name[1];
      if (fieldsChanges.includes(fieldName)) {
        return false;
      } else {
        fieldsChanges.push(fieldName);
        return true;
      }
    }
    return true;
  });
  let templateResult = '';
  const getTemplate = (templateShow) => {
    return `${(database && database[templateShow]) || ''}`;
  };
  const separator = _.get(dataSource, 'profile.sqlConfig', '/*SQL@Run*/') + '\n';
  // 构造新的数据表传递给模板
  const tempEntities = getAllTable(dataSource, 'name').map((entity) => {
    return {
      ...entity,
      fields: (entity.fields || []).map(field => {
        return {
          ...field,
          type: getFieldType(datatype, field.type, code),
        }
      })
    }
  });

  // 上个版本的数据表信息，用于重建数据表
  const oldEntities = getAllTable(oldDataSource, 'name').map((entity) => {
    return {
      ...entity,
      fields: (entity.fields || []).map(field => {
        return {
          ...field,
          type: getFieldType(datatype, field.type, code),
        }
      })
    }
  });

  // 将不同类型的模板组装到一起生成一个sql文件
  // 1.生成实体的sql
  templateResult += changes
    .filter(c => c.type === 'entity')
    .map((c) => {
      if (c.opt === 'add') {
        const change = c.name;
        const dataTable = tempEntities.filter(t => t.title === change)[0] || {};
        return getTemplateString(getTemplate('createTableTemplate'), {
          module: {name: dataTable.name},
          entity: dataTable,
          separator
        });
      } else if (c.opt === 'rebuild') {
        // 重建数据表
        const change = c.name;
        const dataTable = tempEntities.filter(t => t.title === change)[0] || {};
        const oldDataTable = oldEntities.filter(t => t.title === change)[0] || {};
        return getTemplateString(getTemplate('rebuildTableTemplate'), {
          module: {name: dataTable.name},
          oldEntity: oldDataTable,
          newEntity: dataTable,
          separator
        });
      } else if (c.opt === 'update') {
        const tmpChange = (c.name || '').split('.');
        const changeData = (c.changeData || '').split('=>');

        //表注释修改
        if(tmpChange && tmpChange[1]==='chnname'){
          return getTemplateString(getTemplate('updateTableComment'), {
            entity: {
              title: tmpChange[0],
              chnname:changeData[1]
            },
            separator
          });
        }
      } else {
        const change = c.name;
        return getTemplateString(getTemplate('deleteTableTemplate'), {
          entity: {
            title: change
          },
          separator
        });
      }
    }).join('');

  templateResult += '\r\n';

  // 2.生成索引的sql
  templateResult += changes
    .filter(c => c.type === 'index')
    .map((c) => {
      const change = c.name.split('.');
      const dataTable = tempEntities.filter(t => t.title === change[0])[0] || {};
      const indexName = change[1];
      const indexData = _.get(dataTable, 'indexs', []);
      const index = indexData.filter(i => i.name === indexName)[0] || {name: indexName};
      if (c.opt === 'add') {
        // 根据数据表中的内容获取索引
        return renderCreateIndexSql(getTemplate('createIndexTemplate'), {
          module: {name: dataTable.name},
          entity: dataTable,
          index,
          separator
        }, database && database.code);
      } else if (c.opt === 'update') {
        // 1.先删除再重建
        let deleteString = getTemplateString(getTemplate('deleteIndexTemplate'), {
          module: {name: dataTable.name},
          entity: dataTable,
          index,
          separator
        });
        let createString = getTemplateString(getTemplate('createTableTemplate'), {
          module: {name: dataTable.name},
          entity: dataTable,
          index,
          separator
        });
        return `${deleteString}${separator}\n${createString}`;
      }
      return getTemplateString(getTemplate('deleteIndexTemplate'), {
        module: {name: dataTable.name},
        entity: dataTable,
        index,
        separator
      });
    }).join('');

  templateResult += '\r\n';

  // 3.生成属性的sql
  templateResult += changes
    .filter(c => c.type === 'field')
    .map((c) => {
      if (c.opt === 'update') {
        const change = c.name.split('.');
        const dataTable = tempEntities.filter(t => t.title === change[0])[0] || {};
        const field = (dataTable.fields || []).filter(f => f.name === change[1])[0] || {};
        const changeData = (c.changeData || '').split('=>');
        const updateFieldStr = getTemplateString(getTemplate('updateFieldTemplate'), {
          module: {name: dataTable.name},
          entity: dataTable,
          field: {
            ...field,
            updateName: change[2],
            update: changeData[1],
          },
          separator
        });
        let pkStr = '';
        // 如果改动的是主键属性，则响应的增减主键的修改语句
        if (change[change?.length - 1] === 'pk') {
          if (changeData[1] === 'true') {
            pkStr = getTemplateString(getTemplate('createPkTemplate'), {
              module: {name: dataTable.name},
              entity: dataTable,
              field: {
                ...field,
                updateName: change[2],
                update: changeData[1],
              },
              separator
            });
          } else if (changeData[1] === 'false') {
            pkStr = getTemplateString(getTemplate('deletePkTemplate'), {
              module: {name: dataTable.name},
              entity: dataTable,
              field: {
                ...field,
                updateName: change[2],
                update: changeData[1],
              },
              separator
            });
          }
          return pkStr;
        }
        return updateFieldStr;
      } else if (c.opt === 'add') {
        const change = c.name.split('.');
        const dataTable = tempEntities.filter(t => t.title === change[0])[0] || {};
        const field = (dataTable.fields || []).filter(f => f.name === change[1])[0] || {};
        // 从当前的属性中获取该位置之前的属性位置
        let addAfter = undefined;
        const position = (dataTable.fields || []).findIndex(f => field.name === f.name);
        if (position > 0) {
          addAfter = (dataTable.fields || [])[position - 1] && (dataTable.fields || [])[position - 1].name || undefined;
        }
        return getTemplateString(getTemplate('createFieldTemplate'), {
          module: {name: dataTable.name},
          entity: dataTable,
          field: {
            ...field,
            addAfter,
          },
          separator
        });
      } else {
        const change = c.name.split('.');
        const dataTable = tempEntities.filter(t => t.title === change[0])[0] || {};
        return getTemplateString(getTemplate('deleteFieldTemplate'), {
          module: {name: dataTable.name},
          entity: dataTable,
          field: {
            name: change[1],
          },
          separator
        });
      }
    }).join('');

  templateResult += '\r\n';

  return templateResult;
};

const getCodeByRebuildTableTemplate = (dataSource, changes, code, oldDataSource) => {
  let sqlString = '';
  try {
    const datatype = _.get(dataSource, 'dataTypeDomains.datatype', []);
    const database = _.get(dataSource, 'dataTypeDomains.database', [])
      .filter(db => db.defaultDatabase)[0];
    const separator = _.get(dataSource, 'profile.sqlConfig', '/*SQL@Run*/');
    const getTemplate = (templateShow) => {
      return `${(database && database[templateShow]) || ''}`;
    };
    // 构造新的数据表传递给模板
    const tempEntities = getAllTable(dataSource, 'name').map((entity) => {
      return {
        ...entity,
        fields: (entity.fields || []).map(field => {
          return {
            ...field,
            type: getFieldType(datatype, field.type, code),
          }
        })
      }
    });
    // 上个版本的数据表信息，用于重建数据表
    const oldEntities = getAllTable(oldDataSource, 'name').map((entity) => {
      return {
        ...entity,
        fields: (entity.fields || []).map(field => {
          return {
            ...field,
            type: getFieldType(datatype, field.type, code),
          }
        })
      }
    });
    const entities = changes
      .filter(c => c.type === 'field')
      .map(c => c.name.split('.')[0]);
    [...new Set(entities)].forEach(e => {
      const dataTable = tempEntities.filter(t => t.title === e)[0] || {};
      const oldDataTable = tempEntities.filter(t => t.title === e)[0] || {};
      sqlString += getTemplateString(getTemplate('rebuildTableTemplate'), {
        module: {name: dataTable.name},
        oldEntity: oldDataTable,
        newEntity: dataTable,
        separator
      })
    });
  } catch (e) {
    message.error('数据库模板出错，请参考Dot.js配置模板信息');
    sqlString = JSON.stringify(e.message);
  }
  return sqlString;
};

export const getCodeByChanges = (dataSource, changes, code, oldDataSource = {}) => {
  let sqlString = '';
  try {
    sqlString = generateUpdateSql(dataSource, changes, code, oldDataSource)
  } catch (e) {
    message.error('数据库模板出错，请参考Dot.js配置模板信息');
    sqlString = JSON.stringify(e.message);
  }
  return sqlString;
};

export const getCodeByDataTable = (dataSource, module, dataTable, code, templateShow, changes = [], oldDataSource = {}) => {
  let sqlString = '';
  try {
    // 除了数据表的增删，其余的模板都是用变化模板
    if (templateShow === 'createTableTemplate' || templateShow === 'deleteTableTemplate'
      || templateShow === 'createIndexTemplate') {
      sqlString = generateIncreaseSql(dataSource, module, dataTable, code, templateShow);
    } else if (templateShow === 'rebuildTableTemplate') {
      sqlString = getCodeByRebuildTableTemplate(dataSource, changes, code, oldDataSource);
    } else {
      sqlString = getCodeByChanges(dataSource, changes, code, oldDataSource);
    }
  } catch (e) {
    message.error('数据库模板出错，请参考Dot.js配置模板信息');
    sqlString = JSON.stringify(e.message);
  }
  return sqlString;
};

export const getDemoTemplateData = (templateShow) => {
  let data = '';
  const demoTable = {
    "module": {
      "name": "AUTH-用户安全",
    },
    "entity": {
      "title": "AUTH_USER",
      "fields": [
        {
          "name": "ID",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "用户ID",
          "pk": true,
          "notNull": true,
          "autoIncrement": true,
          "defaultValue": "1",
        },
        {
          "name": "CODE",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "用户代码",
          "pk": false,
          "notNull": true,
          "autoIncrement": false,
          "defaultValue": "1",
        },
        {
          "name": "NAME",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "用户名"
        },
        {
          "name": "PASSWORD",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "密码"
        },
        {
          "name": "SALT",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "密码盐值"
        },
        {
          "name": "AVATAR",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "头像"
        },
        {
          "name": "ORG_ID",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "机构"
        },
        {
          "name": "EMAIL",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "邮件"
        },
        {
          "name": "PHONE",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "手机号"
        },
        {
          "name": "STATUS",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "状态"
        },
        {
          "name": "REVISION",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "乐观锁",
          "relationNoShow": false
        },
        {
          "name": "CREATED_BY",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "创建人",
          "relationNoShow": false
        },
        {
          "name": "CREATED_TIME",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "创建时间",
          "relationNoShow": false
        },
        {
          "name": "UPDATED_BY",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "更新人",
          "relationNoShow": false
        },
        {
          "name": "UPDATED_TIME",
          "dataType": "VARCHAR(32)",
          "remark": "",
          "chnname": "更新时间",
          "relationNoShow": false
        }
      ],
      "chnname": "用户信息",
      "indexs": [
        {
          "name": "AUTH_USER_INDEX1",
          "isUnique": true,
          "fields": [
            "ID",
            "CODE"
          ]
        },
        {
          "name": "AUTH_USER_INDEX2",
          "isUnique": false,
          "fields": [
            "NAME",
            "PASSWORD"
          ]
        }
      ]
    }
  };
  const demoField = {
    "name": "ID",
    "dataType": "VARCHAR(32)",
    "remark": "",
    "chnname": "用户ID",
    "pk": true,
    "notNull": true,
    "autoIncrement": true,
    "defaultValue": "1",
  };
  const demoIndex = {
    "name": "AUTH_USER_INDEX1",
    "isUnique": true,
    "fields": [
      "ID",
      "CODE"
    ]
  };
  switch (templateShow) {
    case 'createTableTemplate':
      data = JSON.stringify({...demoTable, separator: '/*SQL@Run*/'}, null, 2);
      break;
    case 'deleteTableTemplate':
      data = JSON.stringify({...demoTable, separator: '/*SQL@Run*/'}, null, 2);
      break;
    case 'rebuildTableTemplate':
      data = JSON.stringify({
        oldEntity: _.get(demoTable, 'entity'),
        newEntity: _.get(demoTable, 'entity'),
        ..._.omit(demoTable, 'entity'),
        separator: '/*SQL@Run*/'
      }, null, 2);
      break;
    case 'createFieldTemplate':
      data = JSON.stringify({
        field: {
          ...demoField,
          addAfter: 'DEMO_NAME'
        },
        ...demoTable,
        separator: '/*SQL@Run*/'
      }, null, 2);
      break;
    case 'updateFieldTemplate':
      data = JSON.stringify({
        field: {
          ...demoField,
          updateName: 'chnname',
          update: '用户编号',
        },
        ...demoTable,
        separator: '/*SQL@Run*/'
      }, null, 2);
      break;
    case 'deleteFieldTemplate':
      data = JSON.stringify({
        field: {
          name: demoField.name,
        },
        ...demoTable,
        separator: '/*SQL@Run*/'
      }, null, 2);
      break;
    case 'createPkTemplate':
      data = JSON.stringify({
        field: {
          name: demoField.name,
        },
        ...demoTable,
        separator: '/*SQL@Run*/'
      }, null, 2);
      break;
    case 'deletePkTemplate':
      data = JSON.stringify({
        field: {
          name: demoField.name,
        },
        ...demoTable,
        separator: '/*SQL@Run*/'
      }, null, 2);
      break;
    case 'deleteIndexTemplate':
      data = JSON.stringify({
        index: {
          name: demoIndex.name,
        },
        ...demoTable,
        separator: '/*SQL@Run*/'
      }, null, 2);
      break;
    case 'createIndexTemplate':
      data = JSON.stringify({
        index: demoIndex,
        ...demoTable,
        separator: '/*SQL@Run*/'
      }, null, 2);
      break;
    case 'updateTableComment':
      data = JSON.stringify({
        ...demoTable,
        separator: '/*SQL@Run*/'
      }, null, 2);
      break;
    default:
      break;
  }
  return data;
};

export const getDataByTemplate = (data, template) => {
  let sqlString = '';
  try {
    sqlString = getTemplateString(template, data);
  } catch (e) {
    message.error('数据库模板出错，请参考Dot.js配置模板信息');
    sqlString = JSON.stringify(e.message);
  }
  return sqlString;
};

export const getAllDataSQL = (dataSource, code) => {
  // 获取全量脚本（删表，建表，建索引）
  const datatype = _.get(dataSource, 'dataTypeDomains.datatype', []);
  const database = pickDatabaseDialect(
    _.get(dataSource, 'dataTypeDomains.database', []),
    code,
  );
  const separator = _.get(dataSource, 'profile.sqlConfig', '/*SQL@Run*/') + '\n';
  const getTemplate = (templateShow) => {
    return `${(database && database[templateShow]) || ''}`;
  };
  let sqlString = '';
  // 1.获取所有的表
  let allTable = getAllTable(dataSource, 'name');
  const tempEntities = allTable.map((entity) => {
    return {
      ...entity,
      fields: (entity.fields || []).map(field => {
        return {
          ...field,
          type: getFieldType(datatype, field.type, code),
        }
      })
    }
  });
  sqlString += tempEntities.map(e => {
    // 1.1.删除表
    // 1.2.新建表
    // 1.3.新建索引

    // 循环创建该表下所有的索引 + 触发器
    let indexData = (e.indexs || []).map(i => {
      return `${renderCreateIndexSql(getTemplate('createIndexTemplate'), {
        module: {name: e.name},
        entity: e,
        index: i,
        separator
      }, code)}`;
    }).join('');
    const triggerData = (e.triggers || [])
      .map((t) => renderCreateTriggerSql(t, e.title || e.name, separator, code))
      .join('');
    //全量脚本去除删除语句
    return `${getTemplateString(getTemplate('createTableTemplate'), {
      module: {name: e.name},
      entity: e,
      separator
    })}${indexData}${triggerData}`
  }).join('');
  return sqlString.endsWith(separator) ? sqlString : sqlString + separator;
};

/**
 * 按过滤器拼全量 DDL（删表/建表/索引/触发器/注释）。
 * @param dataSource projectJSON 形态
 * @param code 方言码，如 MYSQL
 * @param filter 片段键：deleteTable | createTable | createIndex | createTrigger | updateComment
 */
export const getAllDataSQLByFilter = (
  dataSource: Record<string, unknown>,
  code: string,
  filter: string[] = [],
): string => {
  // 获取全量脚本（删表，建表，建索引，触发器，表注释）；模板按所选方言 code，非仅 defaultDatabase
  const datatype = _.get(dataSource, 'dataTypeDomains.datatype', []);
  const database = pickDatabaseDialect(
    _.get(dataSource, 'dataTypeDomains.database', []) as Array<{
      code?: string;
      defaultDatabase?: boolean;
    }>,
    code,
  );
  const getTemplate = (templateShow: string) => {
    return `${(database && database[templateShow]) || ''}`;
  };
  const separator = _.get(dataSource, 'profile.sqlConfig', '/*SQL@Run*/') + '\n';
  let sqlString = '';
  // 1.获取所有的表
  const tempEntities = getAllTable(dataSource, 'name').map((entity) => {
    return {
      ...entity,
      fields: (entity.fields || []).map(field => {
        return {
          ...field,
          type: getFieldType(datatype, field.type, code),
        }
      })
    }
  });
  sqlString += tempEntities.map(e => {
    // 1.1.删除表
    // 1.2.新建表
    // 1.3.新建索引
    // 1.4.新建触发器
    // 表注释

    // 循环创建该表下所有的索引
    let tempData = '';
    let allData = {};
    allData.createIndex = (e.indexs || []).map(i => {
      return `${renderCreateIndexSql(getTemplate('createIndexTemplate'), {
        module: {name: e.name},
        entity: e,
        index: i,
        separator
      }, code)}`;
    }).join('');
    allData.createTrigger = (e.triggers || [])
      .map((t) => renderCreateTriggerSql(t, e.title || e.name, separator, code))
      .join('');
    allData.deleteTable = `${getTemplateString(getTemplate('deleteTableTemplate'), {
      module: {name: e.name},
      entity: e,
      separator
    })}`;
    allData.createTable = `${getTemplateString(getTemplate('createTableTemplate'), {
      module: {name: e.name},
      entity: e,
      separator
    })}`;
    allData.updateComment = `${getTemplateString(getTemplate('updateTableComment'), {
      module: {name: e.name},
      entity: e,
      separator
    })}`;
    filter.forEach(f => {
      tempData += allData[f] ? `${allData[f]}\n` : '';
    });
    return tempData;
  }).join('');
  return sqlString;
};
