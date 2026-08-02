import {Avatar, Input, List, message, Space, Tag, Typography} from 'antd';
import {useEffect, useState} from "react";
import {TeamOutlined, UserOutlined} from "@ant-design/icons";
import AddProject from "@/components/dialog/project/AddProject";
import OpenProject from "@/components/dialog/project/OpenProject";
import {searchProjects} from "@/pages/project/recent";
import ConfigProject from "@/components/dialog/project/ConfigProject";
import {ProjectListProps} from "@/pages/project/person";
import {pageGroupProject} from "@/services/group-project";
import * as cache from "@/utils/cache";
import {CONSTANT} from "@/utils/constant";
import {history} from "@@/core/history";


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
          message.error('获取项目信息失败');
        }
      }
    }).finally(() => setListLoading(false));

  }

  useEffect(() => {
    fetchProjects(state);
  }, [state.page, state.order]);

  return (
    <div data-testid="project-group-page">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8}}>
        <Typography.Title level={4} style={{margin: 0}}>团队项目</Typography.Title>
        <Space wrap>
          <Input.Search
            placeholder="项目名"
            allowClear
            onSearch={(value: string) => {
              searchProjects(fetchProjects, state, value);
            }}
            style={{width: 200}}
            aria-label="搜索项目名"
          />
          <AddProject fetchProjects={() => fetchProjects(null)} trigger="ant" type={2}/>
        </Space>
      </div>
      <List<ProjectItem>
        size="large"
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
            actions={[
              <ConfigProject project={row} type={2} key={'ConfigProject' + row.id}/>,
              <OpenProject project={row} key={'OpenProject' + row.id}/>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar src={row.avatar || '/logo.svg'} />}
              title={
                <a
                  href={'/design/table/model?projectId=' + row.id}
                  onClick={(e) => {
                    e.preventDefault();
                    cache.setItem(CONSTANT.PROJECT_ID, row.id);
                    history.push({pathname: '/design/table/model?projectId=' + row.id});
                  }}
                >{row.projectName}</a>
              }
              description={
                <Space direction="vertical" size={4}>
                  <span>{row.description}</span>
                  <Space size={0} wrap>
                    <Tag color={'blue'} key={row.projectName}>
                      {row.type === '1' ? <UserOutlined/> : <TeamOutlined/>}
                    </Tag>
                    {row.tags?.split(",").filter(Boolean).map((m: string, i: number) => {
                      return <Tag color={i % 2 == 0 ? "#5BD8A6" : "blue"} key={m + i}>{m}</Tag>
                    })}
                  </Space>
                  <div style={{color: '#00000073'}}>{row.updateTime}</div>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};
