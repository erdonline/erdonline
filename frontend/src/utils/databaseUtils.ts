import { ADD, DEL, EDIT, PAGE, POST } from '@/services/crud';

const TEST_CONNECTION_URL = '/ncnb/connector/ping';
const DATABASE_CONFIG_URL = '/ncnb/dataSources';

interface PingParams {
  driverClassName?: string;
  url?: string;
  username?: string;
  password?: string;
  /** 已保存数据源：优先 id，后端 ACL 填凭证 */
  dataSourceId?: string;
}

export const pingDatabase = async (params: PingParams) => {
  try {
    const body = params.dataSourceId
      ? {dataSourceId: params.dataSourceId}
      : {
          driverClassName: params.driverClassName,
          url: params.url,
          username: params.username,
          password: params.password,
        };
    const res = await POST(TEST_CONNECTION_URL, body);
    return res.code === 200;
  } catch (error) {
    console.error('Ping error:', error);
    return false;
  }
};

export const getDriverClassName = (type: string) => {
  switch (type.toLowerCase()) {
    case 'mysql':
      return 'com.mysql.cj.jdbc.Driver';
    case 'postgresql':
      return 'org.postgresql.Driver';
    case 'oracle':
      return 'oracle.jdbc.OracleDriver';
    case 'sqlserver':
      return 'com.microsoft.sqlserver.jdbc.SQLServerDriver';
    default:
      return '';
  }
};

export const generateJdbcUrl = (type: string, host: string, port: number, databaseName: string) => {
  switch (type.toLowerCase()) {
    case 'mysql':
      return `jdbc:mysql://${host}:${port}/${databaseName}`;
    case 'postgresql':
      return `jdbc:postgresql://${host}:${port}/${databaseName}`;
    case 'oracle':
      return `jdbc:oracle:thin:@${host}:${port}:${databaseName}`;
    case 'sqlserver':
      return `jdbc:sqlserver://${host}:${port};databaseName=${databaseName}`;
    default:
      return '';
  }
};

/** UI/项目 profile.dbs 形态 → DataSources 实体 */
const toDataSourceEntity = (db: any) => {
  const props = db.properties || {};
  return {
    id: db.key || db.id,
    name: db.name,
    type: db.select || db.type,
    url: props.url || db.url,
    username: props.username ?? db.username,
    password: props.password ?? db.password,
    driverClassName: props.driver_class_name || props.driverClassName || db.driverClassName,
    host: db.host,
    port: db.port,
    databaseName: db.databaseName,
    connectionType: db.connectionType,
  };
};

export const fetchDatabaseConfigs = async (name?: string) => {
  try {
    const params: { pageSize: number; current: number; name?: string } = {
      pageSize: 100,
      current: 1,
    };
    if (name && name.trim() !== '') {
      params.name = name.trim();
    }

    const res = await PAGE(DATABASE_CONFIG_URL, params, {});
    if (res.code === 200 && res.data) {
      return (res.data.records || []).map((record: any) => ({
        key: record.id,
        name: record.name,
        select: record.type,
        defaultDB: record.isDefault,
        properties: {
          url: record.url,
          password: record.password,
          username: record.username,
          driver_class_name: record.driverClassName,
        },
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching database configs:', error);
    return [];
  }
};

/** 新增一条数据源（id 可用客户端 key） */
export const createDatabaseConfig = async (db: any) => {
  const body = toDataSourceEntity(db);
  const res = await ADD(DATABASE_CONFIG_URL, body);
  return res?.code === 200;
};

export const updateDatabaseConfig = async (db: any) => {
  const body = toDataSourceEntity(db);
  if (!body.id) {
    return false;
  }
  const res = await EDIT(`${DATABASE_CONFIG_URL}/${body.id}`, body);
  return res?.code === 200;
};

export const deleteDatabaseConfig = async (id: string) => {
  const res = await DEL(`${DATABASE_CONFIG_URL}/${id}`, {});
  return res?.code === 200;
};

/**
 * 将完整列表同步到 /ncnb/dataSources（按 id 增删改，禁止无 id 的批量 PUT）。
 */
export const updateDatabaseConfigs = async (databases: any[]) => {
  try {
    const existing = await fetchDatabaseConfigs();
    const existingKeys = new Set(existing.map((d: any) => d.key));
    const nextKeys = new Set(databases.map((d: any) => d.key).filter(Boolean));

    for (const d of existing) {
      if (!nextKeys.has(d.key)) {
        if (!(await deleteDatabaseConfig(d.key))) {
          return false;
        }
      }
    }

    for (const d of databases) {
      const body = toDataSourceEntity(d);
      if (!body.id || !existingKeys.has(body.id)) {
        if (!(await createDatabaseConfig(d))) {
          return false;
        }
      } else if (!(await updateDatabaseConfig(d))) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error updating database configs:', error);
    return false;
  }
};
