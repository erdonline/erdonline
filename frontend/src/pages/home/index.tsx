import type {FC} from 'react';
import {Avatar, Card, Col, List, Skeleton, Row, Statistic, Tag, Space, Typography, Progress} from 'antd';
import {Radar, Pie} from '@ant-design/charts';
import { RocketOutlined, BarChartOutlined, ProjectOutlined, GlobalOutlined, NotificationOutlined, CompassOutlined, PieChartOutlined, PlusOutlined, ImportOutlined, HistoryOutlined, BookOutlined, BranchesOutlined, ExportOutlined, SafetyOutlined, ReadOutlined, CustomerServiceOutlined, CrownOutlined, DatabaseOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';

import moment from 'moment';
import EditableLinkGroup from './components/EditableLinkGroup';
import styles from './style.less';
import type {ActivitiesType, CurrentUser} from './data.d';
import {queryProjectNotice, queryActivities, fakeChartData} from './service';
import {useRequest} from "@umijs/hooks";
import {Link} from "@@/exports";
import {GET, GET_ERD, POST_ERD} from "@/services/crud";
import React, {useEffect, useState} from "react";
import {PageContainer} from "@ant-design/pro-components";
import {VipOne} from "@icon-park/react";
import * as cache from "@/utils/cache";
import { createExampleProjectAndOpen } from '@/utils/exampleProject';

const { Title, Text, Paragraph } = Typography;

const quickLinks = [
  {
    title: '新建模型',
    icon: <PlusOutlined />,
    href: '/project/person',
    description: '前往个人项目列表新建空模型',
    type: 'primary',
    testId: 'home-link-new-project',
  },
  {
    title: '示例项目',
    icon: <DatabaseOutlined />,
    description: '一键创建含用户/订单表的示例，打开即可建模与保存版本',
    type: 'success',
    testId: 'home-link-example',
    onClick: () => createExampleProjectAndOpen(),
  },
  {
    title: '导入模型',
    icon: <ImportOutlined />,
    href: '/project/person',
    description: '打开项目后可在设计器「导入」菜单做逆向解析',
    type: 'secondary',
    testId: 'home-link-import',
  },
  {
    title: '最近项目',
    icon: <HistoryOutlined />,
    href: '/project/recent',
    description: '继续上次未完成的建模',
    type: 'secondary',
    testId: 'home-link-recent',
  },
  {
    title: '个人项目',
    icon: <BranchesOutlined />,
    href: '/project/person',
    description: '管理个人模型与版本入口',
    type: 'secondary',
    testId: 'home-link-person',
  },
  {
    title: '升级专业',
    icon: <CrownOutlined />,
    href: '/account/settings',
    description: '查看授权与账号设置',
    type: 'premium',
    hidden: !!cache.getItem2object('licence').licensedStartTime,
    testId: 'home-link-upgrade',
  },
];

const PageHeaderContent: FC<{ currentUser: Partial<CurrentUser> }> = ({currentUser}) => {
  const loading = currentUser && Object.keys(currentUser).length;
  if (!loading) {
    return <Skeleton avatar paragraph={{rows: 1}} active/>;
  }
  const licence = cache.getItem2object('licence');

  let vip;
  if (!licence.licensedStartTime) {
    vip = <VipOne theme="outline" size="20" fill="#333" strokeWidth={2} strokeLinejoin="miter" strokeLinecap="butt"/>
  } else {
    vip = <VipOne theme="filled" size="18" fill="#DE2910" strokeWidth={2} strokeLinejoin="miter"/>
  }


  return (
    <div className={styles.pageHeaderContent}>
      <div className={styles.avatar}>
        <Avatar size="large" src={currentUser?.avatar || '/logo.svg'}/>
      </div>
      <div className={styles.content}>
        <Title level={4}>
          欢迎回来，{currentUser.username}
          <a href={"/account/settings?selectKey=identification"}
             title={licence.licensedStartTime ? '已授权' : '未授权'}> {vip}</a>
        </Title>
        <Paragraph>
          <GlobalOutlined /> {currentUser?.title || '全球领先的开源数据库建模平台'}
        </Paragraph>
      </div>
    </div>
  );
};

export type HomeProps = {};

export const renderActivities = (item: ActivitiesType) => {

  return (
    <List.Item key={item.id}>
      <List.Item.Meta
        title={
          <Row>
            <Col span={20}>
              <a className={styles.username} href={item?.url} target={"_blank"}>{item?.title}</a>
            </Col>
            <Col span={4}>
              <span className={styles.datetime} title={item.createTime}>
                {moment(item.createTime).fromNow()}
              </span>
            </Col>
          </Row>
        }
      />
    </List.Item>
  );
};

const Home: React.FC<HomeProps> = (props) => {

  const [statisticInfo, setStatisticInfo] = useState({
    yesterday: 0,
    today: 0,
    month: 0,
    total: 0,
    userCount: 0,
    personTotal: 0,
    groupTotal: 0,
  });

  const fetchStatistic = () => {
    GET("/ncnb/project/statistic", {}).then(r => {
      if (r?.code === 200) {
        setStatisticInfo(r.data);
      }
    })
  }

  useEffect(() => {
    fetchStatistic();
  }, [statisticInfo.total])

  const ExtraContent: FC<Record<string, any>> = () => (
    <div className={styles.extraContent}>
      <Row gutter={24} justify="end">
        <Col span={8} >
          <Statistic 
            title="活跃模型" 
            value={statisticInfo.today} 
            prefix={<ProjectOutlined />} 
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={8}>
          <Statistic 
            title="模型总数" 
            value={statisticInfo.total} 
            prefix={<BarChartOutlined />} 
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={8}>
          <Statistic 
            title="用户总数" 
            value={statisticInfo.userCount} 
            prefix={<UserOutlined />} 
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
      </Row>
    </div>
  );


  const {loading: projectLoading, data: recentProject = []} = useRequest(() => {
    return GET('/ncnb/project/recent', {
      page: 1,
      limit: 6
    })
  });
  const {loading: activitiesLoading, data: activities = []} = useRequest(() => {
    return POST_ERD('/syst/sysAnnouncement', {
      "current": 1,
      "size": 4,
      "orders": [
        {
          "column": "createTime",
          "asc": false
        }
      ]
    })
  });

  const {data: r, userInfoLoading} = useRequest(() => {
    return GET('/syst/user/settings/basic', {});
  });

  const data = [
    {
      type: '个人',
      value: statisticInfo.personTotal,
    },
    {
      type: '团队',
      value: statisticInfo.groupTotal,
    },

  ];
  const config = {
    appendPadding: 10,
    data,
    angleField: 'value',
    colorField: 'type',
    radius: 0.9,
    label: {
      type: 'inner',
      offset: '-30%',
      content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
      style: {
        fontSize: 16,
        textAlign: 'center',
      },
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
  };


  return (
    <PageContainer
      title={false}
      content={
        <Row gutter={24} align="middle">
          <Col xs={24} sm={24} md={12} lg={12} xl={10}>
            <PageHeaderContent
              currentUser={r?.data}
            />
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={14}>
            <ExtraContent />
          </Col>
        </Row>
      }
    >
      <Row gutter={16}>
        <Col xl={16} lg={24} md={24} sm={24} xs={24}>
          <Card
            className={styles.projectList}
            style={{marginBottom: 24}}
            title={
              <Space>
                <RocketOutlined />
                <Title level={4}>进行中的项目</Title>
              </Space>
            }
            bordered={false}
            extra={<Link to="/dataModels">查看全部</Link>}
            loading={projectLoading}
            bodyStyle={{padding: 0}}
          >
            {recentProject?.data?.records?.map((item: any) => (
              <Card.Grid key={item.id}>
                <Link to={'/design/table/model?projectId=' + item.id}>
                  <Card key={item.id} bordered={false} style={{boxShadow: 'none'}}>
                    <Card.Meta
                      title={
                        <div className={styles.cardTitle}>
                          <Tag color={item.type === '1' ? 'blue' : 'green'} key={item.id}>
                            {item.type === '1' ? <UserOutlined /> : <TeamOutlined />}
                            {item.type === '1' ? '个人' : '团队'}
                          </Tag>
                          <Text strong>{item.projectName}</Text>
                        </div>
                      }
                      description={
                        <Typography.Paragraph type='secondary' ellipsis={{ rows: 2, expandable: false, symbol: '...' }}>
                          {item.description || '无描述'}
                        </Typography.Paragraph>
                      }
                    />
                    <div className={styles.projectItemContent}>
                      {item.updateTime && (
                        <Text type="secondary" title={item.updateTime}>
                          更新于 {moment(item.updateTime).fromNow()}
                        </Text>
                      )}
                    </div>
                  </Card>
                </Link>
              </Card.Grid>
            ))}
          </Card>
          <Card
            bodyStyle={{padding: 0}}
            bordered={false}
            className={styles.activeCard}
            title={
              <Space>
                <NotificationOutlined />
                <Title level={4}>最新公告</Title>
              </Space>
            }
            loading={activitiesLoading}
            extra={<Link to="/project/notice">更多公告</Link>}
          >
            <List<ActivitiesType>
              size="small"
              loading={activitiesLoading}
              renderItem={(item) => renderActivities(item)}
              dataSource={activities?.data?.records}
              className={styles.activitiesList}
            />
          </Card>
        </Col>
        <Col xl={8} lg={24} md={24} sm={24} xs={24}>
          <Card
            style={{marginBottom: 16}}
            title={
              <Space>
                <CompassOutlined />
                <Title level={4}>快速操作</Title>
              </Space>
            }
            bordered={false}
            bodyStyle={{padding: 16}}
          >
            <EditableLinkGroup links={quickLinks}/>
          </Card>
          <Card
            bordered={false}
            title={
              <Space>
                <PieChartOutlined />
                <Title level={4}>项目概览</Title>
              </Space>
            }
            bodyStyle={{padding: 16}}
          >
            <Row gutter={[8, 16]}>
              <Col span={12}>
                <Statistic 
                  title="个人项目" 
                  value={statisticInfo.personTotal} 
                  prefix={<UserOutlined />} 
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="团队项目" 
                  value={statisticInfo.groupTotal} 
                  prefix={<TeamOutlined />} 
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={18}>
                <Progress 
                  percent={statisticInfo.personTotal / (statisticInfo.personTotal + statisticInfo.groupTotal) * 100} 
                  strokeColor={{
                    '0%': '#1890ff',
                    '100%': '#52c41a',
                  }}
                  format={(percent) => `${percent?.toFixed(1)}% 个人项目`}
                />
              </Col>
              <Col span={24}>
                <Text type="secondary">
                  总项目数: {statisticInfo.personTotal + statisticInfo.groupTotal}
                </Text>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}


export default React.memo(Home)
