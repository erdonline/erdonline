import {DatabaseNetwork, HomeTwo, Sphere, Table} from "@icon-park/react";
import {erdColors} from '@/theme/tokens';

const brandFill = erdColors.brand;

export default {
  route: {
    path: '/',
    routes: [
      {
        path: '/home',
        nameKey: 'homeLayout.route.home',
        icon: <HomeTwo theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
      },
      {
        path: '/dataModels',
        nameKey: 'homeLayout.route.dataModels',
        icon: <Table theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
      },
      {
        path: '/databaseConfig',
        nameKey: 'homeLayout.route.databaseConfig',
        icon: <DatabaseNetwork theme="filled" size="18" fill={brandFill} strokeWidth={2}/>,
      },
      {
        
        exact: true,
        path: 'https://github.com/erdonline/erdonline/issues',
        nameKey: 'homeLayout.route.forum',
        icon: <Sphere theme="filled" size="18" fill={brandFill} strokeWidth={2}/>
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
