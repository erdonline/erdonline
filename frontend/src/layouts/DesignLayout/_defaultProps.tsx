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
    nameKey: 'designLayout.route.import',
    icon: <Warehousing theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
    path: '/design/table/import',
    access: 'canErdTableImport',
    routes: [
      {
        path: '/design/table/import/reverse',
        nameKey: 'designLayout.route.reverseParse',
        icon: <DataDisplay theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdConnectorDbreverseparse',
      },
      {
        path: '/design/table/import/pdman',
        nameKey: 'designLayout.route.importPdman',
        icon: <FileJpg theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdTableImportPdman',
      },
      {
        path: '/design/table/import/erd',
        nameKey: 'designLayout.route.importErd',
        icon: <FileLock theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdTableImportErd',
      },
    ],
  },
  {
    nameKey: 'designLayout.route.export',
    icon: <Outbound theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
    path: '/design/table/export',
    access: 'canErdTableExport',
    routes: [
      {
        path: '/design/table/export/common',
        nameKey: 'designLayout.route.exportCommon',
        icon: <Export theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdTableExportCommon',
      },
      {
        path: '/design/table/export/more',
        nameKey: 'designLayout.route.exportMore',
        icon: <DatabaseDownload theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdTableExportMore',
      },
    ],
  },
  {
    nameKey: 'designLayout.route.settings',
    icon: <SettingTwo theme="filled" size="15" fill={brandFill} strokeWidth={2}/>,
    path: '/design/table/setting',
    access: 'canErdTableSetting',
    routes: [
      {
        path: '/design/table/setting/defaultField',
        nameKey: 'designLayout.route.defaultFields',
        icon: <Column theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdTableSettingDefaultfield',
      },
      {
        path: '/design/table/setting/dataType',
        nameKey: 'designLayout.route.dataTypeDict',
        icon: <DataNull theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        // 复用默认字段权限，避免本轮扩 privileges
        access: 'canErdTableSettingDefaultfield',
      },
      {
        path: '/design/table/setting/default',
        nameKey: 'designLayout.route.systemDefaults',
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
        nameKey: 'designLayout.route.model',
        icon: <DatabaseNetwork theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
      },
      {
        path: '/design/table/version',
        nameKey: 'designLayout.route.version',
        icon: <History theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
        access: 'canErdHisprojectLoad',
        routes: [
          {
            path: '/design/table/version/all',
            nameKey: 'designLayout.route.versionAll',
            icon: <History theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
            access: 'canErdHisprojectAll',
          },
          {
            path: '/design/table/version/order',
            nameKey: 'designLayout.workflow.myOrders',
            icon: <TransactionOrder theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
          },
          {
            path: '/design/table/version/approval',
            nameKey: 'designLayout.route.myApproval',
            icon: <Audit theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
          },
        ],
      },
    ],
  },
};
