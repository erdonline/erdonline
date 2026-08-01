import { ProList } from '@ant-design/pro-components';
import { message, Space, Tag, Select } from 'antd';
import { useEffect, useState } from "react";
import { TeamOutlined, UserOutlined } from "@ant-design/icons";
import AddProject from "@/components/dialog/project/AddProject";
import OpenProject from "@/components/dialog/project/OpenProject";
import RenameProject from "@/components/dialog/project/RenameProject";
import RemoveProject from "@/components/dialog/project/RemoveProject";
import ConfigProject from "@/components/dialog/project/ConfigProject";
import { recentProject, pageProject } from "@/services/project";
import { pageGroupProject } from "@/services/group-project";
import * as cache from "@/utils/cache";
import { history } from "@@/core/history";
import { Typography } from 'antd';

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
    });
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
    <ProList<ProjectItem>
      size={'large'}
      toolbar={{
        menu: {
          type: 'inline',
          items: [
            {
              key: 'type',
              label: (
                <Select
                  value={state.type}
                  onChange={handleTypeChange}
                  style={{ width: 150 }}
                >
                  <Option value="">最近项目</Option>
                  <Option value="personal">个人项目</Option>
                  <Option value="team">团队项目</Option>
                </Select>
              ),
            },
          ],
        },
        search: {
          onSearch: searchProjects,
        },
        actions: [
          state.type !== 'recent' && (
            <AddProject 
              fetchProjects={() => fetchProjects(null)} 
              trigger="ant"
            />
          ),
        ],
      }}
      grid={{ gutter: 2, column: 4 }}
      itemLayout="vertical"
      rowKey="id"
      onItem={(record) => ({
        onClick: () => openProject(record),
        style: { cursor: 'pointer' },
      })}
      dataSource={state.projects}
      pagination={{
        pageSize: state.limit,
        total: state.total,
        onChange: (page: number, pageSize: number) => {
          setState({
            ...state,
            page,
            limit: pageSize
          })
        }
      }}
      metas={{
        title: {
          dataIndex: 'projectName',
          title: '项目名称',
          render: (text, row) => (
            <a
              href={'/design/table/model?projectId=' + row.id}
              onClick={(e) => {
                e.preventDefault();
                openProject(row);
              }}
            >{text}</a>
          ),
        },
        avatar: {
          dataIndex: 'avatar',
          search: false,
        },
        subTitle: {
          render: (_, row) => (
            <Space size={0}>
              <Tag color={'blue'} key={row.id}>
                {row.type === '1' ? <UserOutlined /> : <TeamOutlined />}
              </Tag>
              {row.tags?.split(",").map((m: string, i: number) => (
                <Tag color={i % 2 === 0 ? "#5BD8A6" : "blue"} key={m + i}>{m}</Tag>
              ))}
            </Space>
          ),
          dataIndex: 'type',
          search: false,
        },
        content: {
          render: (_, record) => (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Paragraph
                type="secondary"
                ellipsis={{ rows: 1, tooltip: true }}
                style={{ marginBottom: 0 }}
              >
                {record.description}
              </Paragraph>
              <div style={{color: '#00000073'}}>更新时间：{record.updateTime}</div>
            </Space>
          ),
        },
        actions: {
          cardActionProps: 'actions',
          render: (_, record) => [
            record.type === '1' && (
              <RenameProject 
                fetchProjects={() => fetchProjects(null)} 
                trigger={'ant'} 
                project={record} 
                key={'RenameProject' + record.id}
              />
            ),
            record.type === '1' && (
              <RemoveProject 
                fetchProjects={() => fetchProjects(null)} 
                project={record} 
                key={'RemoveProject' + record.id}
              />
            ),
            record.type === '2' && (
              <ConfigProject 
                project={record} 
                type={2} 
                key={'ConfigProject' + record.id}
              />
            ),
          ],
        },
      }}
    />
  );
};
