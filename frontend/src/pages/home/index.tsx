import type {FC} from 'react';
import {
  Avatar,
  Button,
  Empty,
  Skeleton,
  Space,
  Statistic,
  Typography,
  message,
} from 'antd';
import {PlusOutlined} from '@ant-design/icons';

import moment from 'moment';
import styles from './style.less';
import type {ActivitiesType, CurrentUser} from './data.d';
import {useRequest} from '@umijs/hooks';
import {Link, history} from '@@/exports';
import {GET, POST_ERD} from '@/services/crud';
import React, {useEffect, useMemo, useState} from 'react';
import {createExampleProjectAndOpen} from '@/utils/exampleProject';
import {erdColors} from '@/theme/tokens';

const {Title, Text, Paragraph} = Typography;

/** 公告超过该天数则不占默认 Home（避免三年前条目拖垮产品感） */
const ANNOUNCEMENT_MAX_AGE_DAYS = 90;

type RecentRecord = {
  id: string;
  type: string;
  projectName: string;
  description?: string;
  updateTime?: string;
};

type NavLink = {
  title: string;
  href: string;
  testId: string;
};

const secondaryNav: NavLink[] = [
  {title: '个人项目', href: '/project/person', testId: 'home-link-person'},
  {title: '最近项目', href: '/project/recent', testId: 'home-link-recent'},
  {title: '团队项目', href: '/project/group', testId: 'home-link-group'},
  {title: '导入模型', href: '/project/person', testId: 'home-link-import'},
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
        <Avatar size={56} src={currentUser?.avatar || '/logo.svg'} />
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

const quietStatStyle = {color: erdColors.ink900, fontSize: 20};

const isFreshAnnouncement = (item: ActivitiesType) => {
  if (!item?.createTime) return false;
  return moment().diff(moment(item.createTime), 'days') <= ANNOUNCEMENT_MAX_AGE_DAYS;
};

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

  const records: RecentRecord[] = recentProject?.data?.records || [];
  const latest: RecentRecord | undefined = records[0];

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

  const freshAnnouncements = useMemo(() => {
    const list = (activities?.data?.records || []) as ActivitiesType[];
    return list.filter(isFreshAnnouncement);
  }, [activities]);

  const showAnnouncements = !activitiesLoading && freshAnnouncements.length > 0;

  const {data: r} = useRequest(() => {
    return GET('/syst/user/settings/basic', {});
  });

  return (
    <div data-testid="home-page" className={styles.homePage}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
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
        </div>
        <div className={styles.heroActions}>
          <Button
            type="primary"
            size="large"
            onClick={continueLastProject}
            loading={projectLoading}
            disabled={!projectLoading && !latest?.id}
            data-testid="home-continue-modeling"
          >
            继续上次建模
          </Button>
          <div className={styles.heroSecondary}>
            <Link
              to="/project/person"
              className={styles.heroSecondaryBtn}
              data-testid="home-link-new-project"
            >
              <PlusOutlined /> 新建模型
            </Link>
            <button
              type="button"
              className={styles.heroTextLink}
              data-testid="home-link-example"
              onClick={() => void createExampleProjectAndOpen()}
            >
              从示例开始
            </button>
          </div>
        </div>
      </section>

      <nav className={styles.secondaryNav} aria-label="项目入口">
        {secondaryNav.map((item, i) => (
          <React.Fragment key={item.testId}>
            {i > 0 ? <span className={styles.secondarySep} aria-hidden>·</span> : null}
            <Link to={item.href} data-testid={item.testId} className={styles.secondaryLink}>
              {item.title}
            </Link>
          </React.Fragment>
        ))}
      </nav>

      <section className={styles.projectSection}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>进行中的项目</h2>
          <Link to="/dataModels" className={styles.sectionExtra}>
            查看全部
          </Link>
        </div>
        {projectLoading ? (
          <div className={styles.projectGrid}>
            {[0, 1, 2].map((k) => (
              <div key={k} className={styles.projectCard}>
                <Skeleton active paragraph={{rows: 2}} />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className={styles.emptyState}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="还没有进行中的项目"
            >
              <Space>
                <Button type="primary" onClick={() => history.push('/project/person')}>
                  新建模型
                </Button>
                <Button onClick={() => void createExampleProjectAndOpen()}>从示例开始</Button>
              </Space>
            </Empty>
          </div>
        ) : (
          <div className={styles.projectGrid}>
            {records.map((item) => (
              <Link
                key={item.id}
                to={`/design/table/model?projectId=${item.id}`}
                className={styles.projectCard}
                data-testid="home-project-card"
              >
                <div className={styles.cardTop}>
                  <span
                    className={
                      item.type === '1' ? styles.typePerson : styles.typeTeam
                    }
                  >
                    {item.type === '1' ? '个人' : '团队'}
                  </span>
                  <span className={styles.openHint}>打开</span>
                </div>
                <Text strong className={styles.cardName}>
                  {item.projectName}
                </Text>
                <p className={styles.cardDesc}>{item.description || '无描述'}</p>
                {item.updateTime ? (
                  <Text type="secondary" className={styles.cardMeta} title={item.updateTime}>
                    更新于 {moment(item.updateTime).fromNow()}
                  </Text>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      {showAnnouncements ? (
        <section className={styles.announceSection} aria-label="最新公告">
          <div className={styles.sectionHead}>
            <Title level={5} className={styles.sectionTitleSm}>
              最新公告
            </Title>
            <Link to="/project/notice" className={styles.sectionExtra}>
              更多公告
            </Link>
          </div>
          <ul className={styles.announceList}>
            {freshAnnouncements.map((item) => (
              <li key={item.id}>
                <a href={item?.url} target="_blank" rel="noreferrer" className={styles.announceTitle}>
                  {item?.title}
                </a>
                <span className={styles.announceTime} title={item.createTime}>
                  {moment(item.createTime).fromNow()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};

export default React.memo(Home);
