import React, {useEffect, useState} from 'react';
import {message, Space, Tabs, Typography} from 'antd';
import GroupUser from '@/pages/project/group/component/GroupUser';
import GroupPermission from '@/pages/project/group/component/GroupPermission';
import {GET} from '@/services/crud';
import {CONSTANT} from '@/utils/constant';
import {useSearchParams} from '@@/exports';
import {useAccess} from '@@/plugin-access';

const {Title} = Typography;

type RoleTabItem = {
  label: string;
  key: string;
  children: React.ReactNode;
};

export type GroupSettingProps = {};

const GroupSetting: React.FC<GroupSettingProps> = () => {
  const [tab, setTab] = useState('');
  const [items, setItems] = useState<RoleTabItem[]>([]);
  const access = useAccess();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get(CONSTANT.PROJECT_ID);

  useEffect(() => {
    // GroupLayout 异步写入 permission 后才有 canErd*；过早拉取会得到空嵌套页签
    if (!access.initialized || !projectId) {
      return;
    }
    const canRoles = access.canErdProjectRolesPage;
    const canPerm = access.canErdProjectRolePermission;

    GET('/ncnb/project/group/roles', {projectId}).then((resp) => {
      if (!resp || resp.code !== 200) {
        message.error(resp?.msg || '获取用户组失败');
        return;
      }
      let ownerKey = '';
      const tmpItems: RoleTabItem[] = (resp.data || []).map(
        (d: {roleId: string; roleName: string; roleCode: string}) => {
          const isAdmin = d.roleCode.includes('_0');
          if (isAdmin) {
            ownerKey = d.roleCode;
          }
          const roleDefault = Number(d.roleCode.split('_')[1]);
          const nested: RoleTabItem[] = [];
          if (canRoles) {
            nested.push({
              label: '用户组成员',
              key: '1',
              children: <GroupUser roleId={d.roleId} isAdmin={isAdmin} />,
            });
          }
          if (canPerm) {
            nested.push({
              label: '权限配置',
              key: '3',
              children: (
                <GroupPermission
                  isAdmin={isAdmin}
                  defaultRole={roleDefault}
                  values={{id: d.roleId}}
                />
              ),
            });
          }
          return {
            label: d.roleName,
            key: d.roleCode,
            children: <Tabs defaultActiveKey={nested[0]?.key} items={nested} />,
          };
        },
      );
      setItems(tmpItems);
      if (ownerKey) {
        setTab(ownerKey);
      } else if (tmpItems[0]) {
        setTab(tmpItems[0].key);
      }
    });
  }, [
    access.initialized,
    access.canErdProjectRolesPage,
    access.canErdProjectRolePermission,
    projectId,
  ]);

  return (
    <div>
      <Space size={'large'}>
        <Title level={4}>用户组</Title>
      </Space>
      <br />
      <Tabs
        tabPosition="left"
        activeKey={tab}
        items={items}
        onChange={(key) => {
          setTab(key);
        }}
      />
    </div>
  );
};

export default React.memo(GroupSetting);
