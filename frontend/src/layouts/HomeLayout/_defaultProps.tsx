import {
  AppstoreFilled,
  DatabaseFilled,
  GlobalOutlined,
  HomeFilled,
  TableOutlined,
} from '@ant-design/icons';
import {erdColors} from '@/theme/tokens';

const brandFill = erdColors.brand;
const brandIcon = (size = 18) => ({ fontSize: size, color: brandFill });

export default {
  route: {
    path: '/',
    routes: [
      {
        path: '/home',
        nameKey: 'homeLayout.route.home',
        icon: <HomeFilled style={brandIcon()} />,
      },
      {
        path: '/catalog',
        nameKey: 'homeLayout.route.catalog',
        icon: <AppstoreFilled style={brandIcon()} />,
      },
      {
        path: '/dataModels',
        nameKey: 'homeLayout.route.dataModels',
        icon: <TableOutlined style={brandIcon()} />,
      },
      {
        path: '/databaseConfig',
        nameKey: 'homeLayout.route.databaseConfig',
        icon: <DatabaseFilled style={brandIcon()} />,
      },
      {

        exact: true,
        path: 'https://github.com/erdonline/erdonline/issues',
        nameKey: 'homeLayout.route.forum',
        icon: <GlobalOutlined style={brandIcon()} />,
      },

    ],
  },
  location: {
    pathname: '/',
  },
  appList: [
    // {
    //   icon: '/logo.svg',
    //   title: 'ERD Online',
    //   desc: '国内第一个开源免费在线建模软件',
    //   url: 'https://portal.zerocode.net.cn/',
    //   target: '_blank',
    // },
    // {
    //   icon: '/zerocode.svg',
    //   title: '零代',
    //   desc: '国内第一个零代码社区',
    //   url: 'https://www.zerocode.net.cn/',
    //   target: '_blank',
    // },
    // {
    //   icon: '/loco.svg',
    //   title: 'LOCO',
    //   desc: '类钉钉宜搭的低代码搭建平台',
    //   url: 'https://loco.zerocode.net.cn/',
    //   target: '_blank',
    // },
    // {
    //   icon: '/zerocode.svg',
    //   title: 'Fast Test',
    //   desc: '接口快速测试平台',
    //   url: 'https://www.zerocode.net.cn/',
    //   target: '_blank',
    // },
    // {
    //   icon: '/zerocode.svg',
    //   title: 'Super BI',
    //   desc: '超级报表、BI引擎',
    //   url: 'https://www.zerocode.net.cn/',
    //   target: '_blank',
    // },
  ],
};
