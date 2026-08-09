import {
  AuditOutlined,
  BookOutlined,
  CloudDownloadOutlined,
  ColumnHeightOutlined,
  ControlOutlined,
  DatabaseFilled,
  DesktopOutlined,
  ExportOutlined,
  FileImageOutlined,
  FileProtectOutlined,
  HistoryOutlined,
  ImportOutlined,
  OrderedListOutlined,
  SettingFilled,
  TagOutlined,
} from '@ant-design/icons';
import { erdColors } from '@/theme/tokens';

const brandFill = erdColors.brand;
const brandIcon = (size = 18) => ({ fontSize: size, color: brandFill });

/** 深链 / sider 用；不出现在顶栏主 tabs */
export const secondaryRoutes = [
  {
    nameKey: 'designLayout.route.import',
    icon: <ImportOutlined style={brandIcon()} />,
    path: '/design/table/import',
    access: 'canErdTableImport',
    routes: [
      {
        path: '/design/table/import/reverse',
        nameKey: 'designLayout.route.reverseParse',
        icon: <DesktopOutlined style={brandIcon()} />,
        access: 'canErdConnectorDbreverseparse',
      },
      {
        path: '/design/table/import/pdman',
        nameKey: 'designLayout.route.importPdman',
        icon: <FileImageOutlined style={brandIcon()} />,
        access: 'canErdTableImportPdman',
      },
      {
        path: '/design/table/import/erd',
        nameKey: 'designLayout.route.importErd',
        icon: <FileProtectOutlined style={brandIcon()} />,
        access: 'canErdTableImportErd',
      },
    ],
  },
  {
    nameKey: 'designLayout.route.export',
    icon: <ExportOutlined style={brandIcon()} />,
    path: '/design/table/export',
    access: 'canErdTableExport',
    routes: [
      {
        path: '/design/table/export/common',
        nameKey: 'designLayout.route.exportCommon',
        icon: <ExportOutlined style={brandIcon()} />,
        access: 'canErdTableExportCommon',
      },
      {
        path: '/design/table/export/more',
        nameKey: 'designLayout.route.exportMore',
        icon: <CloudDownloadOutlined style={brandIcon()} />,
        access: 'canErdTableExportMore',
      },
    ],
  },
  {
    nameKey: 'designLayout.route.settings',
    icon: <SettingFilled style={brandIcon(15)} />,
    path: '/design/table/setting',
    access: 'canErdTableSetting',
    routes: [
      {
        path: '/design/table/setting/defaultField',
        nameKey: 'designLayout.route.defaultFields',
        icon: <ColumnHeightOutlined style={brandIcon()} />,
        access: 'canErdTableSettingDefaultfield',
      },
      {
        path: '/design/table/setting/dataType',
        nameKey: 'designLayout.route.dataTypeDict',
        icon: <TagOutlined style={brandIcon()} />,
        // 复用默认字段权限，避免本轮扩 privileges
        access: 'canErdTableSettingDefaultfield',
      },
      {
        path: '/design/table/setting/fieldLibrary',
        nameKey: 'designLayout.route.fieldLibrary',
        icon: <BookOutlined style={brandIcon()} />,
        access: 'canErdTableSettingDefaultfield',
      },
      {
        path: '/design/table/setting/default',
        nameKey: 'designLayout.route.systemDefaults',
        icon: <ControlOutlined style={brandIcon()} />,
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
        icon: <DatabaseFilled style={brandIcon()} />,
      },
      {
        path: '/design/table/version',
        nameKey: 'designLayout.route.version',
        icon: <HistoryOutlined style={brandIcon()} />,
        access: 'canErdHisprojectLoad',
        routes: [
          {
            path: '/design/table/version/all',
            nameKey: 'designLayout.route.versionAll',
            icon: <HistoryOutlined style={brandIcon()} />,
            access: 'canErdHisprojectAll',
          },
          {
            path: '/design/table/version/order',
            nameKey: 'designLayout.workflow.myOrders',
            icon: <OrderedListOutlined style={brandIcon()} />,
          },
          {
            path: '/design/table/version/approval',
            nameKey: 'designLayout.route.myApproval',
            icon: <AuditOutlined style={brandIcon()} />,
          },
        ],
      },
    ],
  },
};
