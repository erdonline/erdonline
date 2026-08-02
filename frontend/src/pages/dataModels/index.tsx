import type { ReactNode } from 'react';
import { Avatar, Input, List, message, Space, Tag, Select, Typography } from 'antd';
import { useEffect, useState } from "react";
import { TeamOutlined, UserOutlined } from "@ant-design/icons";
import AddProject from "@/components/dialog/project/AddProject";
import RenameProject from "@/components/dialog/project/RenameProject";
import RemoveProject from "@/components/dialog/project/RemoveProject";
import ConfigProject from "@/components/dialog/project/ConfigProject";
import { recentProject, pageProject } from "@/services/project";
import { pageGroupProject } from "@/services/group-project";
import * as cache from "@/utils/cache";
import { history } from "@@/core/history";

const { Option } = Select;
const { Paragraph } = Typography;

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

export default () => {
  const [state, setState] = useState<ProjectListProps>({
    page: 1,
    limit: 8,
    total: 0,
    projects: [],
    order: "updateTime",
    type: ""
  });
  const [listLoading, setListLoading] = useState(true);

  const fetchProjects = (params: any) => {
    const fetchFunction = {
      "": recentProject,
      recent: recentProject,
      personal: pageProject,
      team: pageGroupProject
    }[state.type];

    if (!fetchFunction) {
      message.error('无效的项目类型');
      return;
    }

    setListLoading(true);
    fetchFunction(params || state).then(res => {
      if (res && res.data) {
        setState({
          ...state,
          total: res.data.total,
          projects: res.data.records?.map((m: any) => ({
            ...m,
            avatar: '/logo.svg',
          }))
        });
      } else {
        message.error('获取项目信息失败');
      }
    }).finally(() => setListLoading(false));
  }

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
      page: 1
    });
  };

  const openProject = (project: ProjectItem) => {
    cache.setItem("projectId", project.id);
    history.push({
      pathname: '/design/table/model',
      search: `?projectId=${project.id}`
    });
  };

  return (
    <div data-testid="data-models-page">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8}}>
        <Space wrap>
          <Select
            value={state.type}
            onChange={handleTypeChange}
            style={{ width: 150 }}
            aria-label="项目类型"
          >
            <Option value="">最近项目</Option>
            <Option value="personal">个人项目</Option>
            <Option value="team">团队项目</Option>
          </Select>
          <Input.Search
            allowClear
            onSearch={searchProjects}
            style={{ width: 200 }}
            placeholder="项目名"
            aria-label="搜索项目名"
          />
        </Space>
        {state.type !== 'recent' && (
          <AddProject
            fetchProjects={() => fetchProjects(null)}
            trigger="ant"
          />
        )}
      </div>
      <List<ProjectItem>
        size="large"
        loading={listLoading}
        grid={{ gutter: 16, column: 4 }}
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
        renderItem={(record) => {
          const actions: ReactNode[] = [];
          if (record.type === '1') {
            actions.push(
              <RenameProject
                fetchProjects={() => fetchProjects(null)}
                trigger={'ant'}
                project={record}
                key={'RenameProject' + record.id}
              />,
              <RemoveProject
                fetchProjects={() => fetchProjects(null)}
                project={record}
                key={'RemoveProject' + record.id}
              />,
            );
          }
          if (record.type === '2') {
            actions.push(
              <ConfigProject
                project={record}
                type={2}
                key={'ConfigProject' + record.id}
              />,
            );
          }
          return (
          <List.Item actions={actions}>
            <div
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer', width: '100%' }}
              onClick={() => openProject(record)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openProject(record);
                }
              }}
            >
              <List.Item.Meta
                avatar={<Avatar src={record.avatar || '/logo.svg'} />}
                title={
                  <a
                    href={'/design/table/model?projectId=' + record.id}
                    onClick={(e) => {
                      e.preventDefault();
                      openProject(record);
                    }}
                  >{record.projectName}</a>
                }
                description={
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space size={0} wrap>
                      <Tag color={'blue'} key={record.id}>
                        {record.type === '1' ? <UserOutlined /> : <TeamOutlined />}
                      </Tag>
                      {record.tags?.split(",").filter(Boolean).map((m: string, i: number) => (
                        <Tag color={i % 2 === 0 ? "#5BD8A6" : "blue"} key={m + i}>{m}</Tag>
                      ))}
                    </Space>
                    <Paragraph
                      type="secondary"
                      ellipsis={{ rows: 1, tooltip: true }}
                      style={{ marginBottom: 0 }}
                    >
                      {record.description}
                    </Paragraph>
                    <div style={{color: '#00000073'}}>更新时间：{record.updateTime}</div>
                  </Space>
                }
              />
            </div>
          </List.Item>
          );
        }}
      />
    </div>
  );
};
