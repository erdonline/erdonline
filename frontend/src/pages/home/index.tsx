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
import {Link, history, useIntl} from '@@/exports';
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

const PageHeaderContent: FC<{
  currentUser: Partial<CurrentUser>;
  latest?: RecentRecord;
}> = ({currentUser, latest}) => {
  const intl = useIntl();
  const loading = currentUser && Object.keys(currentUser).length;
  if (!loading) {
    return <Skeleton avatar paragraph={{rows: 2}} active />;
  }

  const timeSuffix =
    latest?.updateTime ? ` · ${moment(latest.updateTime).fromNow()}` : '';
  const context = latest
    ? intl.formatMessage(
        {id: 'homePage.context.latestEdit'},
        {projectName: latest.projectName, timeSuffix},
      )
    : intl.formatMessage({id: 'homePage.context.noRecent'});

  return (
    <div className={styles.pageHeaderContent}>
      <div className={styles.avatar}>
        <Avatar size={56} src={currentUser?.avatar || '/logo.svg'} />
      </div>
      <div className={styles.content}>
        <Title level={2} className={styles.heroTitle}>
          {intl.formatMessage(
            {id: 'homePage.welcome'},
            {username: currentUser.username},
          )}
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
  const intl = useIntl();

  const secondaryNav: NavLink[] = useMemo(
    () => [
      {
        title: intl.formatMessage({id: 'homePage.nav.personProjects'}),
        href: '/project/person',
        testId: 'home-link-person',
      },
      {
        title: intl.formatMessage({id: 'homePage.nav.recentProjects'}),
        href: '/project/recent',
        testId: 'home-link-recent',
      },
      {
        title: intl.formatMessage({id: 'homePage.nav.teamProjects'}),
        href: '/project/group',
        testId: 'home-link-group',
      },
      {
        title: intl.formatMessage({id: 'homePage.nav.importModel'}),
        href: '/project/person',
        testId: 'home-link-import',
      },
    ],
    [intl],
  );

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
      message.info(intl.formatMessage({id: 'homePage.noRecentProject'}));
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
            <Statistic
              title={intl.formatMessage({id: 'homePage.stat.activeModels'})}
              value={statisticInfo.today}
              valueStyle={quietStatStyle}
            />
            <Statistic
              title={intl.formatMessage({id: 'homePage.stat.totalModels'})}
              value={statisticInfo.total}
              valueStyle={quietStatStyle}
            />
            <Statistic
              title={intl.formatMessage({id: 'homePage.stat.teamProjects'})}
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
            {intl.formatMessage({id: 'homePage.continueModeling'})}
          </Button>
          <div className={styles.heroSecondary}>
            <Link
              to="/project/person"
              className={styles.heroSecondaryBtn}
              data-testid="home-link-new-project"
            >
              <PlusOutlined /> {intl.formatMessage({id: 'homePage.newModel'})}
            </Link>
            <button
              type="button"
              className={styles.heroTextLink}
              data-testid="home-link-example"
              onClick={() => void createExampleProjectAndOpen()}
            >
              {intl.formatMessage({id: 'homePage.startFromExample'})}
            </button>
          </div>
        </div>
      </section>

      <nav
        className={styles.secondaryNav}
        aria-label={intl.formatMessage({id: 'homePage.nav.aria'})}
      >
        {secondaryNav.map((item, i) => (
          <React.Fragment key={item.testId}>
            {i > 0 ? <span className={styles.secondarySep} aria-hidden>·</span> : null}
            <Link to={item.href} data-testid={item.testId} className={styles.secondaryLink}>
              {item.title}
            </Link>
          </React.Fragment>
        ))}
      </nav>

      <section className={styles.projectSection} data-testid="home-project-section">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            {intl.formatMessage({id: 'homePage.section.inProgress'})}
          </h2>
          <Link to="/dataModels" className={styles.sectionExtra}>
            {intl.formatMessage({id: 'homePage.section.viewAll'})}
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
          <div className={styles.emptyState} data-testid="home-empty-state">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={intl.formatMessage({id: 'homePage.empty.noProjects'})}
            >
              <Space>
                <Button type="primary" onClick={() => history.push('/project/person')}>
                  {intl.formatMessage({id: 'homePage.newModel'})}
                </Button>
                <Button onClick={() => void createExampleProjectAndOpen()}>
                  {intl.formatMessage({id: 'homePage.startFromExample'})}
                </Button>
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
                    {item.type === '1'
                      ? intl.formatMessage({id: 'homePage.card.typePerson'})
                      : intl.formatMessage({id: 'homePage.card.typeTeam'})}
                  </span>
                  <span className={styles.openHint}>
                    {intl.formatMessage({id: 'homePage.card.open'})}
                  </span>
                </div>
                <Text strong className={styles.cardName}>
                  {item.projectName}
                </Text>
                <p className={styles.cardDesc}>
                  {item.description ||
                    intl.formatMessage({id: 'homePage.card.noDescription'})}
                </p>
                {item.updateTime ? (
                  <Text type="secondary" className={styles.cardMeta} title={item.updateTime}>
                    {intl.formatMessage(
                      {id: 'homePage.card.updatedAt'},
                      {time: moment(item.updateTime).fromNow()},
                    )}
                  </Text>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      {showAnnouncements ? (
        <section
          className={styles.announceSection}
          aria-label={intl.formatMessage({id: 'homePage.announce.sectionAria'})}
          data-testid="home-announce"
        >
          <div className={styles.sectionHead}>
            <Title level={5} className={styles.sectionTitleSm}>
              {intl.formatMessage({id: 'homePage.announce.title'})}
            </Title>
            <Link to="/project/notice" className={styles.sectionExtra}>
              {intl.formatMessage({id: 'homePage.announce.more'})}
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
