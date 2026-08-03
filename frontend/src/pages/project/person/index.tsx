import {Avatar, Button, Empty, Input, List, message, Space, Tag} from 'antd';
import {useEffect, useState} from "react";
import {pageProject} from "@/utils/save";
import {TeamOutlined, UserOutlined} from "@ant-design/icons";
import AddProject from "@/components/dialog/project/AddProject";
import RenameProject from "@/components/dialog/project/RenameProject";
import RemoveProject from "@/components/dialog/project/RemoveProject";
import OpenProject from "@/components/dialog/project/OpenProject";
import {searchProjects} from "@/pages/project/recent";
import ProjectListOpenLink from "@/pages/project/ProjectListOpenLink";
import {createExampleProjectAndOpen} from "@/utils/exampleProject";
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
          message.error('获取项目信息失败');
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
      description="还没有项目，立即创建或体验示例"
    >
      <Space>
        <Button type="primary" data-testid="person-empty-create" onClick={() => {
          (document.querySelector('[data-testid=project-create-trigger]') as HTMLElement)?.click();
        }}>
          立即创建
        </Button>
        <Button data-testid="person-empty-example" onClick={() => createExampleProjectAndOpen()}>
          一键示例
        </Button>
      </Space>
    </Empty>
  );

  return (
    <div className="project-list-page" data-testid="project-person-page">
      <div className="project-list-page__toolbar">
        <h2 className="project-list-page__title">个人项目</h2>
        <Space wrap>
          <Input.Search
            placeholder="项目名"
            allowClear
            onSearch={(value: string) => {
              searchProjects(fetchProjects, state, value);
            }}
            aria-label="搜索项目名"
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
                    <Tag color={'blue'} key={row.projectName}>
                      {row.type === '1' ? <UserOutlined/> : <TeamOutlined/>}
                    </Tag>
                    {row.tags?.split(",").filter(Boolean).map((m: string, i: number) => {
                      return <Tag color={i % 2 == 0 ? "#5BD8A6" : "blue"} key={m+i}>{m}</Tag>
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
