import {Avatar, Input, List, message, Tag} from 'antd';
import {useEffect, useState} from "react";
import OpenProject from "@/components/dialog/project/OpenProject";
import ProjectTypeBadge from "@/components/ProjectTypeBadge";
import {ProjectListProps} from "@/pages/project/person";
import {recentProject} from "@/services/project";
import ProjectListOpenLink from "@/pages/project/ProjectListOpenLink";
import PublishTemplateAction from '@/components/catalog/PublishTemplateAction';
import {useIntl} from '@@/exports';
import '../project-list.scss';

type ProjectItem = {
  id: number;
  projectName: string;
  description: number;
  type: string;
  tags: any;
  updater: string;
  updateTime: string;
  creator: string;
  createTime: string;
  avatar?: string;
};

export function searchProjects(fetchProjects: (params: any) => void, state: ProjectListProps, value: string) {
  fetchProjects({
    ...state,
    projectName: value
  });
}

export default () => {
  const intl = useIntl();

  const [state, setState] = useState<ProjectListProps>({
    page: 1,
    limit: 6,
    total: 0,
    projects: [],
    order: "updateTime"
  });
  const [listLoading, setListLoading] = useState(true);

  const fetchProjects = (params: any) => {
    setListLoading(true);
    recentProject(params || state).then(res => {
      if (res) {
        if (res.data) {
          setState({
              ...state,
              total: res.data.total,
              projects: res.data.records?.map((m: any) => {
                  return {
                    ...m,
                    avatar: '/logo.svg'
                  }
                }
              )
            }
          );
        } else {
          message.error(intl.formatMessage({id: 'projectList.error.fetchFailed'}));
        }
      }
    }).finally(() => setListLoading(false));

  }

  useEffect(() => {
    fetchProjects(state);
  }, [state.page, state.order]);

  return (
    <div className="project-list-page" data-testid="project-recent-page">
      <div
        className="project-list-page__toolbar"
        data-testid="project-list-toolbar"
      >
        <h2 className="project-list-page__title">
          {intl.formatMessage({id: 'projectList.recent.title'})}
        </h2>
        <Input.Search
          placeholder={intl.formatMessage({id: 'projectList.search.placeholder'})}
          allowClear
          onSearch={(value: string) => {
            searchProjects(fetchProjects, state, value);
          }}
          aria-label={intl.formatMessage({id: 'projectList.search.aria'})}
        />
      </div>
      <List<ProjectItem>
        className="project-list-page__list"
        size="small"
        loading={listLoading}
        itemLayout="horizontal"
        rowKey="id"
        dataSource={state.projects}
        pagination={{
          pageSize: state.limit,
          total: state.total,
          current: state.page,
          onChange: (page: number, pageSize: number) => {
            setState({
              ...state,
              page,
              limit: pageSize
            })
          }
        }}
        renderItem={(row) => (
          <List.Item
            className="project-list-page__row"
            data-testid="project-list-row"
            actions={[
              <PublishTemplateAction
                key={`PublishTemplate${row.id}`}
                projectId={String(row.id)}
                projectName={row.projectName}
              />,
              <OpenProject project={row} key={'OpenProject' + row.id}/>
            ]}
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
                    {row.tags?.split(",").filter(Boolean).map((m: string, i: number) => {
                      return <Tag className="erd-project-tag" key={m + i}>{m}</Tag>
                    })}
                  </div>
                  <div className="project-list-page__time">{row.updateTime}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};
