import {Avatar, Input, List, message, Space, Tag} from 'antd';
import {useEffect, useState} from "react";
import {useIntl} from '@@/exports';
import {TeamOutlined, UserOutlined} from "@ant-design/icons";
import AddProject from "@/components/dialog/project/AddProject";
import OpenProject from "@/components/dialog/project/OpenProject";
import {searchProjects} from "@/pages/project/recent";
import ConfigProject from "@/components/dialog/project/ConfigProject";
import {ProjectListProps} from "@/pages/project/person";
import {pageGroupProject} from "@/services/group-project";
import ProjectListOpenLink from "@/pages/project/ProjectListOpenLink";
import '../project-list.scss';


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
    type: 2,
    projects: [],
    order: "createTime"
  });
  const [listLoading, setListLoading] = useState(true);

  const fetchProjects = (params: any) => {
    setListLoading(true);
    pageGroupProject(params || state).then(res => {
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
    <div className="project-list-page" data-testid="project-group-page">
      <div
        className="project-list-page__toolbar"
        data-testid="project-list-toolbar"
      >
        <h2 className="project-list-page__title">
          {intl.formatMessage({id: 'projectList.group.title'})}
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
          <AddProject fetchProjects={() => fetchProjects(null)} trigger="ant" type={2}/>
        </Space>
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
              <ConfigProject project={row} type={2} key={'ConfigProject' + row.id}/>,
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
                    <Tag color={'blue'} key={row.projectName}>
                      {row.type === '1' ? <UserOutlined/> : <TeamOutlined/>}
                    </Tag>
                    {row.tags?.split(",").filter(Boolean).map((m: string, i: number) => {
                      return <Tag color={i % 2 == 0 ? "#5BD8A6" : "blue"} key={m + i}>{m}</Tag>
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
