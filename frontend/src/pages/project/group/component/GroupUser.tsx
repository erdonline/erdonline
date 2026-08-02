import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Avatar, Input, List, message, Popconfirm, Space} from 'antd';
import {DEL, GET} from '@/services/crud';
import {useSearchParams} from '@@/exports';
import {CONSTANT} from '@/utils/constant';
import AddUser from '@/pages/project/group/component/AddUser';
import {Access, useAccess} from '@@/plugin-access';

type ProjectUser = {
  id: string;
  username: string;
  title: string;
  avatar: string;
  email: string;
};

export type GroupUserProps = {
  roleId: string;
  isAdmin: boolean;
};

const GroupUser: React.FC<GroupUserProps> = (props) => {
  const access = useAccess();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get(CONSTANT.PROJECT_ID) || '';

  const [users, setUsers] = useState<ProjectUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();

  const reloadRef = useRef<() => void>(() => {});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await GET('/ncnb/project/group/role/users', {
        current: page,
        pageSize,
        projectId,
        roleId: props.roleId,
        username,
        email,
      });
      if (result?.code === 200) {
        setUsers(
          (result?.data?.records || []).map((m: ProjectUser) => ({
            ...m,
            avatar: m.avatar ? m.avatar : '/logo.svg',
          })),
        );
        setTotal(result?.data?.total || 0);
      } else {
        message.error(result?.msg || '获取成员失败');
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, projectId, props.roleId, username, email]);

  reloadRef.current = fetchUsers;

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const actionRef = useRef({
    reload: () => {
      void reloadRef.current();
    },
  });

  const canSearch = access.canErdProjectRolesSearch && !props.isAdmin;
  const showAdd = !(access.canErdProjectUsersAdd && props.isAdmin);

  return (
    <div data-testid="group-user-list">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Space wrap>
          {canSearch ? (
            <>
              <Input.Search
                placeholder="用户名"
                allowClear
                aria-label="搜索用户名"
                onSearch={(value) => {
                  setPage(1);
                  setUsername(value || undefined);
                }}
                style={{width: 160}}
              />
              <Input.Search
                placeholder="邮箱"
                allowClear
                aria-label="搜索邮箱"
                onSearch={(value) => {
                  setPage(1);
                  setEmail(value || undefined);
                }}
                style={{width: 200}}
              />
            </>
          ) : null}
        </Space>
        {showAdd ? (
          <AddUser projectId={projectId} roleId={props.roleId} actionRef={actionRef} />
        ) : null}
      </div>
      <List<ProjectUser>
        loading={loading}
        itemLayout="horizontal"
        rowKey="id"
        dataSource={users}
        pagination={{
          pageSize,
          total,
          current: page,
          onChange: (next) => setPage(next),
        }}
        renderItem={(row) => (
          <List.Item
            actions={
              props.isAdmin
                ? []
                : [
                    <Access
                      key="remove"
                      accessible={access.canErdProjectRoleUsersDel}
                      fallback={<></>}
                    >
                      <Popconfirm
                        placement="right"
                        title={'是否将『' + row.username + '』移除'}
                        onConfirm={() =>
                          DEL('/ncnb/project/group/role/users', {
                            projectId: projectId,
                            roleId: props.roleId,
                            userIds: [row.id],
                          }).then((r) => {
                            if (r.code === 200) {
                              message.success('移除成功');
                              actionRef.current.reload();
                            }
                          })
                        }
                        okText="是"
                        cancelText="否"
                      >
                        <a key="link" aria-label={`移除 ${row.username}`}>
                          移除
                        </a>
                      </Popconfirm>
                    </Access>,
                  ]
            }
          >
            <List.Item.Meta
              avatar={<Avatar src={row.avatar || '/logo.svg'} />}
              title={row.username}
              description={
                <Space direction="vertical" size={2}>
                  <span>{row.title}</span>
                  <span>{row.email}</span>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default React.memo(GroupUser);
