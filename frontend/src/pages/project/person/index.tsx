import {Avatar, Button, Empty, Input, List, message, Space, Tag} from 'antd';
import {useEffect, useState} from "react";
import {pageProject} from "@/utils/save";
import AddProject from "@/components/dialog/project/AddProject";
import RenameProject from "@/components/dialog/project/RenameProject";
import RemoveProject from "@/components/dialog/project/RemoveProject";
import OpenProject from "@/components/dialog/project/OpenProject";
import ProjectTypeBadge from "@/components/ProjectTypeBadge";
import {searchProjects} from "@/pages/project/recent";
import ProjectListOpenLink from "@/pages/project/ProjectListOpenLink";
import PublishTemplateAction from '@/components/catalog/PublishTemplateAction';
import {createExampleProjectAndOpen} from "@/utils/exampleProject";
import {useIntl} from '@@/exports';
import {history} from '@@/core/history';
import '../project-list.scss';

export type ProjectListProps = {
  page?: number;
  limit?: number;
  total?: number;
  projects?: any;
  order?: any;
  type?: number;
};


type ProjectItem = {
  id: string;
  projectName: string;
  description: number;
  type: string;
  tags: string;
  updater: string;
  updateTime: string;
  creator: string;
  createTime: string;
  avatar?: string;
};

export default () => {
  const intl = useIntl();

  const [state, setState] = useState<ProjectListProps>({
    page: 1,
    limit: 6,
    total: 0,
    type: 1,
    projects: [],
    order: "createTime"
  });
  const [listLoading, setListLoading] = useState(true);

  const fetchProjects = (params: any) => {
    setListLoading(true);
    pageProject(params || state).then(res => {
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

  const emptyText = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={intl.formatMessage({id: 'projectList.empty.description'})}
    >
      <Space>
        <Button type="primary" data-testid="person-empty-create" onClick={() => {
          history.push('/catalog');
        }}>
          从模板创建
        </Button>
        <Button data-testid="person-empty-example" onClick={() => createExampleProjectAndOpen()}>
          {intl.formatMessage({id: 'projectList.empty.example'})}
        </Button>
      </Space>
    </Empty>
  );

  return (
    <div className="project-list-page" data-testid="project-person-page">
      <div
        className="project-list-page__toolbar"
        data-testid="project-list-toolbar"
      >
        <h2 className="project-list-page__title">
          {intl.formatMessage({id: 'projectList.person.title'})}
        </h2>
        <Space wrap size={8}>
          <Input.Search
            placeholder={intl.formatMessage({id: 'projectList.search.placeholder'})}
            allowClear
            onSearch={(value: string) => {
              searchProjects(fetchProjects, state, value);
            }}
            aria-label={intl.formatMessage({id: 'projectList.search.aria'})}
          />
          <AddProject fetchProjects={() => fetchProjects(null)} trigger="ant" type={1}/>
        </Space>
      </div>
      <List<ProjectItem>
        className="project-list-page__list"
        size="small"
        loading={listLoading}
        itemLayout="horizontal"
        rowKey="id"
        dataSource={state.projects}
        locale={{emptyText}}
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
              <RenameProject fetchProjects={() => fetchProjects(null)} trigger={'ant'} project={row} key={'RenameProject'+row.id}/>,
              <RemoveProject fetchProjects={() => fetchProjects(null)} project={row} key={'RemoveProject'+row.id}/>,
              <PublishTemplateAction
                key={`PublishTemplate${row.id}`}
                projectId={String(row.id)}
                projectName={row.projectName}
              />,
              <OpenProject project={row} key={'OpenProject'+row.id}/>
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
                      return <Tag className="erd-project-tag" key={m+i}>{m}</Tag>
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
