import type {FC} from 'react';
import {Avatar, Button, Card, Col, List, Skeleton, Row, Space, Statistic, Tag, Typography, message} from 'antd';
import {
  RocketOutlined,
  NotificationOutlined,
  CompassOutlined,
  PlusOutlined,
  ImportOutlined,
  HistoryOutlined,
  BranchesOutlined,
  DatabaseOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';

import moment from 'moment';
import EditableLinkGroup from './components/EditableLinkGroup';
import styles from './style.less';
import type {ActivitiesType, CurrentUser} from './data.d';
import {useRequest} from '@umijs/hooks';
import {Link, history} from '@@/exports';
import {GET, POST_ERD} from '@/services/crud';
import React, {useEffect, useState} from 'react';
import {createExampleProjectAndOpen} from '@/utils/exampleProject';
import {erdColors} from '@/theme/tokens';

const {Title, Text, Paragraph} = Typography;

type RecentRecord = {
  id: string;
  type: string;
  projectName: string;
  description?: string;
  updateTime?: string;
};

const quickLinks = [
  {
    title: '新建模型',
    icon: <PlusOutlined />,
    href: '/project/person',
    description: '前往个人项目列表新建空模型',
    type: 'primary' as const,
    testId: 'home-link-new-project',
  },
  {
    title: '示例项目',
    icon: <DatabaseOutlined />,
    description: '一键创建含用户/订单表的示例，打开即可建模与保存版本',
    type: 'success' as const,
    testId: 'home-link-example',
    onClick: () => createExampleProjectAndOpen(),
  },
  {
    title: '导入模型',
    icon: <ImportOutlined />,
    href: '/project/person',
    description: '打开项目后可在设计器「导入」菜单做逆向解析',
    type: 'secondary' as const,
    testId: 'home-link-import',
  },
  {
    title: '最近项目',
    icon: <HistoryOutlined />,
    href: '/project/recent',
    description: '继续上次未完成的建模',
    type: 'secondary' as const,
    testId: 'home-link-recent',
  },
  {
    title: '个人项目',
    icon: <BranchesOutlined />,
    href: '/project/person',
    description: '管理个人模型与版本入口',
    type: 'secondary' as const,
    testId: 'home-link-person',
  },
  {
    title: '团队项目',
    icon: <TeamOutlined />,
    href: '/project/group',
    description: '协作建模与成员权限',
    type: 'secondary' as const,
    testId: 'home-link-group',
  },
];

const PageHeaderContent: FC<{
  currentUser: Partial<CurrentUser>;
  latest?: RecentRecord;
}> = ({currentUser, latest}) => {
  const loading = currentUser && Object.keys(currentUser).length;
  if (!loading) {
    return <Skeleton avatar paragraph={{rows: 2}} active />;
  }

  const context = latest
    ? `最近编辑「${latest.projectName}」${
        latest.updateTime ? ` · ${moment(latest.updateTime).fromNow()}` : ''
      }`
    : '从最近项目继续，或新建模型开始建模';

  return (
    <div className={styles.pageHeaderContent}>
      <div className={styles.avatar}>
        <Avatar size="large" src={currentUser?.avatar || '/logo.svg'} />
      </div>
      <div className={styles.content}>
        <Title level={2} className={styles.heroTitle}>
          欢迎回来，{currentUser.username}
        </Title>
        <Paragraph type="secondary" className={styles.heroContext}>
          {context}
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
              <a className={styles.username} href={item?.url} target={'_blank'}>
                {item?.title}
              </a>
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

const quietStatStyle = {color: erdColors.ink900, fontSize: 20};

const Home: React.FC<HomeProps> = () => {
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
    GET('/ncnb/project/statistic', {}).then((r) => {
      if (r?.code === 200) {
        setStatisticInfo(r.data);
      }
    });
  };

  useEffect(() => {
    fetchStatistic();
  }, [statisticInfo.total]);

  const {loading: projectLoading, data: recentProject = []} = useRequest(() => {
    return GET('/ncnb/project/recent', {
      page: 1,
      limit: 6,
    });
  });

  const latest: RecentRecord | undefined = recentProject?.data?.records?.[0];

  const continueLastProject = () => {
    if (!latest?.id) {
      message.info('暂无最近项目，请新建模型或从示例开始');
      return;
    }
    history.push(`/design/table/model?projectId=${latest.id}`);
  };

  const {loading: activitiesLoading, data: activities = []} = useRequest(() => {
    return POST_ERD('/syst/sysAnnouncement', {
      current: 1,
      size: 4,
      orders: [
        {
          column: 'createTime',
          asc: false,
        },
      ],
    });
  });

  const {data: r} = useRequest(() => {
    return GET('/syst/user/settings/basic', {});
  });

  return (
    <div data-testid="home-page">
      <Row gutter={24} align="middle" style={{marginBottom: 16}}>
        <Col xs={24} md={14} lg={15}>
          <PageHeaderContent currentUser={r?.data} latest={latest} />
          <div className={styles.heroStats} data-testid="home-quiet-stats">
            <Statistic title="活跃模型" value={statisticInfo.today} valueStyle={quietStatStyle} />
            <Statistic title="模型总数" value={statisticInfo.total} valueStyle={quietStatStyle} />
            <Statistic
              title="团队项目"
              value={statisticInfo.groupTotal}
              valueStyle={quietStatStyle}
            />
          </div>
        </Col>
        <Col xs={24} md={10} lg={9}>
          <Space direction="vertical" size={12} style={{width: '100%'}} className={styles.heroActions}>
            <Button
              type="primary"
              size="large"
              block
              onClick={continueLastProject}
              loading={projectLoading}
              disabled={!projectLoading && !latest?.id}
              data-testid="home-continue-modeling"
            >
              继续上次建模
            </Button>
            <Space wrap>
              <Button onClick={() => history.push('/project/person')}>新建模型</Button>
              <Button type="link" onClick={() => createExampleProjectAndOpen()}>
                从示例开始
              </Button>
            </Space>
          </Space>
        </Col>
      </Row>
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
            {recentProject?.data?.records?.map((item: RecentRecord) => (
              <Card.Grid key={item.id}>
                <Link to={'/design/table/model?projectId=' + item.id}>
                  <Card key={item.id} bordered={false} style={{boxShadow: 'none'}}>
                    <Card.Meta
                      title={
                        <div className={styles.cardTitle}>
                          <Tag
                            key={item.id}
                            className={
                              item.type === '1' ? styles.tagPerson : styles.tagTeam
                            }
                          >
                            {item.type === '1' ? <UserOutlined /> : <TeamOutlined />}
                            {item.type === '1' ? '个人' : '团队'}
                          </Tag>
                          <Text strong>{item.projectName}</Text>
                        </div>
                      }
                      description={
                        <Typography.Paragraph
                          type="secondary"
                          ellipsis={{rows: 2, expandable: false, symbol: '...'}}
                        >
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
            <EditableLinkGroup links={quickLinks} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(Home);
