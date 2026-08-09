import { Avatar, Empty, Input, List, message, Select, Space, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useIntl } from '@umijs/max';
import AddProject from '@/components/dialog/project/AddProject';
import RenameProject from '@/components/dialog/project/RenameProject';
import RemoveProject from '@/components/dialog/project/RemoveProject';
import ConfigProject from '@/components/dialog/project/ConfigProject';
import OpenProject from '@/components/dialog/project/OpenProject';
import ProjectTypeBadge from '@/components/ProjectTypeBadge';
import ProjectListOpenLink from '@/pages/project/ProjectListOpenLink';
import { recentProject, pageProject } from '@/services/project';
import { pageGroupProject } from '@/services/group-project';
import '../project/project-list.scss';

const { Option } = Select;

export type ProjectListProps = {
  page: number;
  limit: number;
  total: number;
  projects: any[];
  order: string;
  type: string;
};

type ProjectItem = {
  id: string;
  projectName: string;
  description: string;
  type: string;
  tags: string;
  updater: string;
  updateTime: string;
  creator: string;
  createTime: string;
  avatar?: string;
};

/**
 * 数据模型聚合浏览：与 /project/* 同密度、同徽章（精密 IA M1）。
 */
export default () => {
  const intl = useIntl();
  const [state, setState] = useState<ProjectListProps>({
    page: 1,
    limit: 8,
    total: 0,
    projects: [],
    order: 'updateTime',
    type: '',
  });
  const [listLoading, setListLoading] = useState(true);

  const fetchProjects = (params: any) => {
    const fetchFunction = {
      '': recentProject,
      recent: recentProject,
      personal: pageProject,
      team: pageGroupProject,
    }[state.type];

    if (!fetchFunction) {
      message.error(intl.formatMessage({ id: 'projectList.error.fetchFailed' }));
      return;
    }

    setListLoading(true);
    fetchFunction(params || state)
      .then((res) => {
        if (res && res.data) {
          setState({
            ...state,
            total: res.data.total,
            projects: res.data.records?.map((m: any) => ({
              ...m,
              avatar: '/logo.svg',
            })),
          });
        } else {
          message.error(intl.formatMessage({ id: 'projectList.error.fetchFailed' }));
        }
      })
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    fetchProjects(state);
  }, [state.page, state.order, state.type]);

  const handleTypeChange = (value: string) => {
    setState({ ...state, type: value, page: 1 });
  };

  const searchProjects = (value: string) => {
    fetchProjects({
      ...state,
      projectName: value,
      page: 1,
    });
  };

  const emptyText = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={intl.formatMessage({ id: 'projectList.empty.description' })}
    />
  );

  return (
    <div className="project-list-page" data-testid="data-models-page">
      <div className="project-list-page__toolbar" data-testid="project-list-toolbar">
        <h2 className="project-list-page__title">
          {intl.formatMessage({ id: 'homeLayout.route.dataModels' })}
        </h2>
        <Space wrap size={8}>
          <Select
            value={state.type}
            onChange={handleTypeChange}
            style={{ width: 140 }}
            aria-label={intl.formatMessage({ id: 'dataModels.typeFilter.aria' })}
            data-testid="data-models-type-filter"
          >
            <Option value="">{intl.formatMessage({ id: 'dataModels.type.recent' })}</Option>
            <Option value="personal">
              {intl.formatMessage({ id: 'dataModels.type.personal' })}
            </Option>
            <Option value="team">{intl.formatMessage({ id: 'dataModels.type.team' })}</Option>
          </Select>
          <Input.Search
            allowClear
            onSearch={searchProjects}
            placeholder={intl.formatMessage({ id: 'projectList.search.placeholder' })}
            aria-label={intl.formatMessage({ id: 'projectList.search.aria' })}
          />
          {state.type === 'personal' || state.type === '' ? (
            <AddProject fetchProjects={() => fetchProjects(null)} trigger="ant" type={1} />
          ) : null}
        </Space>
      </div>
      <List<ProjectItem>
        className="project-list-page__list"
        size="small"
        loading={listLoading}
        itemLayout="horizontal"
        rowKey="id"
        dataSource={state.projects}
        locale={{ emptyText }}
        pagination={{
          pageSize: state.limit,
          total: state.total,
          current: state.page,
          onChange: (page: number, pageSize: number) => {
            setState({
              ...state,
              page,
              limit: pageSize,
            });
          },
        }}
        renderItem={(row) => {
          const actions =
            String(row.type) === '1'
              ? [
                  <RenameProject
                    fetchProjects={() => fetchProjects(null)}
                    trigger="ant"
                    project={row}
                    key={`RenameProject${row.id}`}
                  />,
                  <RemoveProject
                    fetchProjects={() => fetchProjects(null)}
                    project={row}
                    key={`RemoveProject${row.id}`}
                  />,
                  <OpenProject project={row} key={`OpenProject${row.id}`} />,
                ]
              : [
                  <ConfigProject project={row} type={2} key={`ConfigProject${row.id}`} />,
                  <OpenProject project={row} key={`OpenProject${row.id}`} />,
                ];
          return (
            <List.Item
              className="project-list-page__row"
              data-testid="project-list-row"
              actions={actions}
            >
              <List.Item.Meta
                avatar={<Avatar size={28} src={row.avatar || '/logo.svg'} />}
                title={
                  <ProjectListOpenLink projectId={row.id} projectName={row.projectName} />
                }
                description={
                  <div className="project-list-page__meta">
                    <span>{row.description}</span>
                    <div className="project-list-page__tags">
                      <ProjectTypeBadge type={row.type} />
                      {row.tags
                        ?.split(',')
                        .filter(Boolean)
                        .map((m: string, i: number) => (
                          <Tag key={m + i} className="erd-project-tag">
                            {m}
                          </Tag>
                        ))}
                    </div>
                    <div className="project-list-page__time">{row.updateTime}</div>
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    </div>
  );
};
