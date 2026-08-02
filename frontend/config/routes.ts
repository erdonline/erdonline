export default [
  {
    path: '/',
    layout: false,
    component: './landing',
  },
  {
    path: '/s/:token',
    layout: false,
    component: './share',
  },
  /** 免登录在线演示 → 固定只读分享 token（见 db/init/08_public_demo.sql） */
  {
    path: '/demo',
    layout: false,
    redirect: '/s/public-demo',
  },
  {
    path: '/login',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/login',
        component: './login',
      },
      {
        component: './404',
      },
    ],
  },
  {
    path: '/register',
    layout: false,
    routes: [
      {
        name: 'register',
        path: '/register',
        component: './register',
      },
      {
        component: './404',
      },
    ],
  },

  {
    path: '/project',
    component: '../layouts/HomeLayout',
    routes: [
      {
        path: '/project/notice',
        component: './project/notice',
      },
      {
        path: '/project/recent',
        component: './project/recent',
      },
      {
        path: '/project/person',
        component: './project/person',
      },
      {
        path: '/project/group',
        component: './project/group',
      },
      {
        path: '/project/new',
        redirect: '/project/person',
      },
      {
        component: './404',
      },
    ],
  },

  {
    path: '/project/group/setting',
    component: '../layouts/GroupLayout',
    routes: [
      {
        path: '/project/group/setting',
        redirect: '/project/group/setting/basic',
      },
      {
        path: '/project/group/setting/basic',
        component: './project/group/component/BasicSetting',
      },
      {
        path: '/project/group/setting/permission',
        component: './project/group/component/GroupSetting',
      },
      {
        component: './404',
      },
    ],
  },
  {
    path: '/design',
    component: '../layouts/DesignLayout',
    routes: [
      {
        path: '/design/table/model',
        component: './design/table',
      },
      // W2：dataDomain / query / chatsql 实验空壳已下线路由（深链 → 404）；页面文件待清死代码切片删除
      {
        path: '/design/table/version',
        routes: [
          {
            path: '/design/table/version',
            redirect: '/design/table/version/all',
          },
          {
            path: '/design/table/version/all',
            component: './design/version',
          },
          {
            path: '/design/table/version/order',
            component: './design/version/order',
          },
          {
            path: '/design/table/version/approval',
            component: './design/version/approval',
          },
        ]
      },
      {
        path: '/design/table/import',
        routes: [
          {
            path: '/design/table/import',
            redirect: '/design/table/import/reverse',
          },
          {
            path: '/design/table/import/reverse',
            component: './design/import/component/ReverseDatabase',
          },
          {
            path: '/design/table/import/pdman',
            component: './design/import/component/ReversePdMan',
          },
          {
            path: '/design/table/import/erd',
            component: './design/import/component/ReverseERD',
          },
        ]
      },
      {
        path: '/design/table/export',
        routes: [
          {
            path: '/design/table/export',
            redirect: '/design/table/export/common',
          },
          {
            path: '/design/table/export/common',
            component: './design/export/component/ExportCommon',
          },
          {
            path: '/design/table/export/more',
            component: './design/export/component/ExportDDL',
          },
        ]
      },
      {
        path: '/design/table/setting',
        routes: [
          {
            path: '/design/table/setting',
            redirect: '/design/table/setting/defaultField',
          },
          {
            path: '/design/table/setting/defaultField',
            component: './design/setting/component/DefaultField',
          },
          {
            path: '/design/table/setting/default',
            component: './design/setting/component/DefaultSetUp',
          },
        ]
      },

      {
        component: './404',
      },
    ],
  },
  {
    path: '/dataModels',
    component: '../layouts/HomeLayout',
    routes: [
      {
        path: '/dataModels',
        component: './dataModels',
      },
    ]
  },
  // W2：/dataQuery 实验空壳下线路由（深链 → 404）
  {
    path: '/home',
    component: '../layouts/HomeLayout',
    routes: [
      {
        path: '/home',
        component: './home',
      },
    ]
  },
  {
    path: '/databaseConfig',
    component: '../layouts/HomeLayout',
    routes: [
      {
        path: '/databaseConfig',
        component: './databaseConfig',
      },
    ]
  },
  {
    name: 'account',
    icon: 'user',
    path: '/account',
    routes: [
      {
        path: '/account',
        redirect: '/account/settings',
      },
      {
        name: 'settings',
        icon: 'smile',
        path: '/account/settings',
        component: './account/settings',
      },
    ],
  },
  {path: '/*', component: './404',},
  {
    component: './404',
  },
];
