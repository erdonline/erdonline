import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Avatar, Button, Input, List, message, Space} from 'antd';
import {DEL, GET} from '@/services/crud';
import {useIntl, useSearchParams} from '@@/exports';
import {CONSTANT} from '@/utils/constant';
import AddUser from '@/pages/project/group/component/AddUser';
import {Access, useAccess} from '@@/plugin-access';
import {confirmDestructive} from '@/utils/destructiveConfirm';
import './group-user.scss';

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
  const intl = useIntl();
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
        message.error(
          result?.msg || intl.formatMessage({id: 'groupSetting.user.error.fetchMembersFailed'}),
        );
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

  const onRemoveClick = (row: ProjectUser) => {
    confirmDestructive({
      title: intl.formatMessage({id: 'groupSetting.user.removeTitle'}),
      content: intl.formatMessage(
        {id: 'groupSetting.user.removeContent'},
        {username: row.username},
      ),
      okText: intl.formatMessage({id: 'groupSetting.user.removeOk'}),
      okType: 'danger',
      cancelText: intl.formatMessage({id: 'accountSettings.common.cancel'}),
      onOk: () =>
        DEL('/ncnb/project/group/role/users', {
          projectId: projectId,
          roleId: props.roleId,
          userIds: [row.id],
        }).then((r) => {
          if (r.code === 200) {
            message.success(intl.formatMessage({id: 'groupSetting.user.removeSuccess'}));
            actionRef.current.reload();
          } else {
            message.error(
              r.msg || r.message || intl.formatMessage({id: 'groupSetting.user.removeFailed'}),
            );
          }
        }),
    });
  };

  return (
    <div data-testid="group-user-list">
      <div
        className="group-user-list__toolbar"
        data-testid="group-user-toolbar"
      >
        <Space wrap size={8}>
          {canSearch ? (
            <>
              <Input.Search
                placeholder={intl.formatMessage({id: 'groupSetting.user.searchUsername'})}
                allowClear
                aria-label={intl.formatMessage({id: 'groupSetting.user.searchUsernameAria'})}
                onSearch={(value) => {
                  setPage(1);
                  setUsername(value || undefined);
                }}
                style={{width: 160}}
              />
              <Input.Search
                placeholder={intl.formatMessage({id: 'groupSetting.user.searchEmail'})}
                allowClear
                aria-label={intl.formatMessage({id: 'groupSetting.user.searchEmailAria'})}
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
                      <Button
                        type="link"
                        danger
                        aria-label={intl.formatMessage(
                          {id: 'groupSetting.user.removeAria'},
                          {username: row.username},
                        )}
                        onClick={() => onRemoveClick(row)}
                      >
                        {intl.formatMessage({id: 'groupSetting.user.remove'})}
                      </Button>
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
