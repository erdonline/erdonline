import { POST, PAGE } from '@/services/crud';

const TEST_CONNECTION_URL = '/ncnb/connector/ping';

interface PingParams {
  driverClassName: string;
  url: string;
  username: string;
  password: string;
}

export const pingDatabase = async (params: PingParams) => {
  try {
    const res = await POST(TEST_CONNECTION_URL, params);
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

const DATABASE_CONFIG_URL = '/ncnb/dataSources';

export const fetchDatabaseConfigs = async (name?: string) => {
  try {
    const params: { page: number; limit: number; name?: string } = { page: 1, limit: 10 };
    if (name && name.trim() !== '') {
      params.name = name.trim();
    }

    const res = await PAGE(DATABASE_CONFIG_URL, params);
    if (res.code === 200 && res.data) {
      return res.data.records.map((record: any) => ({
        key: record.id,
        name: record.name,
        select: record.type,
        defaultDB: record.isDefault,
        properties: {
          url: record.url,
          password: record.password,
          username: record.username,
          driver_class_name: record.driverClassName,
        }
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching database configs:', error);
    return [];
  }
};

export const updateDatabaseConfigs = async (databases: any[]) => {
  try {
    const res = await EDIT(DATABASE_CONFIG_URL, databases);
    if (res.code === 200) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating database configs:', error);
    return false;
  }
};