import {
  Audit,
  Column,
  DatabaseDownload,
  DatabaseNetwork,
  DataDisplay,
  DataNull,
  Export,
  FileJpg,
  FileLock,
  History,
  Outbound,
  SettingConfig,
  SettingTwo,
  TransactionOrder,
  Warehousing
} from "@icon-park/react";
import { erdColors } from '@/theme/tokens';

const brandFill = erdColors.brand;

/** 深链 / sider 用；不出现在顶栏主 tabs */
export const secondaryRoutes = [
  {
    name: '导入',
    icon: <Warehousing theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
    path: '/design/table/import',
    access: 'canErdTableImport',
    routes: [
      {
        path: '/design/table/import/reverse',
        name: '数据源逆向解析',
        icon: <DataDisplay theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdConnectorDbreverseparse',
      },
      {
        path: '/design/table/import/pdman',
        name: '解析PdMan文件',
        icon: <FileJpg theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdTableImportPdman',
      },
      {
        path: '/design/table/import/erd',
        name: '解析ERD文件',
        icon: <FileLock theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdTableImportErd',
      },
    ],
  },
  {
    name: '导出',
    icon: <Outbound theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
    path: '/design/table/export',
    access: 'canErdTableExport',
    routes: [
      {
        path: '/design/table/export/common',
        name: '普通导出',
        icon: <Export theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdTableExportCommon',
      },
      {
        path: '/design/table/export/more',
        name: '高级导出',
        icon: <DatabaseDownload theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdTableExportMore',
      },
    ],
  },
  {
    name: '设置',
    icon: <SettingTwo theme="filled" size="15" fill={brandFill} strokeWidth={2}/>,
    path: '/design/table/setting',
    access: 'canErdTableSetting',
    routes: [
      {
        path: '/design/table/setting/defaultField',
        name: '默认字段设置',
        icon: <Column theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdTableSettingDefaultfield',
      },
      {
        path: '/design/table/setting/dataType',
        name: '数据类型字典',
        icon: <DataNull theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        // 复用默认字段权限，避免本轮扩 privileges
        access: 'canErdTableSettingDefaultfield',
      },
      {
        path: '/design/table/setting/default',
        name: '系统默认项设置',
        icon: <SettingConfig theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdTableSettingDefault',
      },
    ],
  },
];

export default {
  route: {
    /** 顶栏主 tabs：仅 模型 | 版本 */
    routes: [
      {
        path: '/design/table/model',
        name: '模型',
        icon: <DatabaseNetwork theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
      },
      {
        path: '/design/table/version',
        name: '版本',
        icon: <History theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdHisprojectLoad',
        routes: [
          {
            path: '/design/table/version/all',
            name: '版本管理',
            icon: <History theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
            access: 'canErdHisprojectAll',
          },
          {
            path: '/design/table/version/order',
            name: '我的工单',
            icon: <TransactionOrder theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
          },
          {
            path: '/design/table/version/approval',
            name: '我的审批',
            icon: <Audit theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
          },
        ],
      },
    ],
  },
};
