import React, {useEffect, useState} from 'react';
import {CheckboxValueType} from 'antd/lib/checkbox/Group';
import {GET, POST} from '@/services/crud';
import {Button, Checkbox, Col, Divider, Empty, Form, List, message, Row, Space} from 'antd';
import _ from 'lodash-es';
import {CONSTANT} from '@/utils/constant';
import {useIntl, useSearchParams} from '@@/exports';
import {useAccess} from '@@/plugin-access';

export type PermissionGroup = {
  defaultValue: CheckboxValueType[];
  menuId: string;
  menuName: string;
  operations: [];
};

export type OperationCheckedGroup = {
  key: number;
  checkedKeys: CheckboxValueType[];
};
export type SecondCheckedGroup = {
  indeterminate: boolean; //是否半选状态，true为是
  checked: boolean;
  disabled?: boolean;
};

export type GroupPermissionProps = {
  defaultRole: number;
  values: any;
  isAdmin: boolean;
};
const GroupPermission: React.FC<GroupPermissionProps> = (props) => {
  const intl = useIntl();
  const access = useAccess();
  const [loginRole, setLoginRole] = useState<number>(3);
  const [operationData, setOperationData] = useState<PermissionGroup[]>([]);
  const [indeterminate, setIndeterminate] = useState<SecondCheckedGroup[]>([]);
  const [allIndeterminate, setAllIndeterminate] = useState<SecondCheckedGroup>({
    indeterminate: false,
    checked: false,
  });
  //各菜单选中的的元素集合
  const [operationCheckedGroup, setOperationCheckedGroup] = useState<OperationCheckedGroup[]>([]);
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);

  const getOperationByCheckedMenus = async () => {
    return await GET('/ncnb/project/group/role/permission', {
      roleId: props.values?.id,
      projectId: searchParams.get(CONSTANT.PROJECT_ID),
    });
  };

  function firstAllConfig(
    data: any,
    tmpAllIndeterminate: SecondCheckedGroup,
    tmpLoginRole: number,
  ) {
    //有部分选中
    const someChecked = _.find(data, function (value) {
      return value?.defaultValue?.length > 0;
    });
    //全选中
    const allChecked = _.filter(data, function (value) {
      return value?.defaultValue?.length === value?.operations?.length;
    });

    if (allChecked.length === data.length) {
      tmpAllIndeterminate = {
        indeterminate: false,
        checked: true,
        disabled: tmpLoginRole === 0 ? false : tmpLoginRole > props.defaultRole || false,
      };
    } else if (someChecked) {
      tmpAllIndeterminate = {
        indeterminate: true,
        checked: true,
        disabled: tmpLoginRole === 0 ? false : tmpLoginRole > props.defaultRole || true,
      };
    } else {
      tmpAllIndeterminate = {
        indeterminate: false,
        checked: false,
        disabled: tmpLoginRole === 0 ? false : tmpLoginRole > props.defaultRole || false,
      };
    }
    setAllIndeterminate(tmpAllIndeterminate);
  }

  function firstCheckConfig(data: any, tmpAllIndeterminate: SecondCheckedGroup) {
    //有部分选中
    const someChecked = _.find(data, function (value) {
      return value?.defaultValue?.length > 0;
    });
    //全选中
    const allChecked = _.filter(data, function (value) {
      return value?.defaultValue?.length === value?.operations?.length;
    });

    if (allChecked.length === data.length) {
      tmpAllIndeterminate = {
        ...allIndeterminate,
        indeterminate: false,
        checked: true,
      };
    } else if (someChecked) {
      tmpAllIndeterminate = {
        ...allIndeterminate,
        indeterminate: true,
        checked: true,
      };
    } else {
      tmpAllIndeterminate = {
        ...allIndeterminate,
        indeterminate: false,
        checked: false,
      };
    }
    setAllIndeterminate(tmpAllIndeterminate);
  }

  useEffect(() => {
    getOperationByCheckedMenus().then((r) => {
      if (!r || r.code !== 200) {
        message.error(intl.formatMessage({id: 'groupSetting.permission.error.fetchPermissionsFailed'}));
        return;
      }
      const data = r?.data?.checkboxes;
      const tmpLoginRole = r?.data?.loginRole;
      setLoginRole(tmpLoginRole);
      const checkedGroups: OperationCheckedGroup[] = [];
      const secondCheckedGroups: SecondCheckedGroup[] = [];
      let tmpAllIndeterminate: SecondCheckedGroup = {
        indeterminate: false,
        checked: false,
      };
      data?.forEach((value: any, index: number) => {
        checkedGroups.push({
          key: index,
          checkedKeys: value.defaultValue,
        });
        const checked = value?.defaultValue?.length > 0;
        const indeterminateSecond =
          checked && value?.defaultValue?.length != value.operations?.length;
        secondCheckedGroups.push({
          indeterminate: indeterminateSecond,
          checked: checked,
          disabled:
            tmpLoginRole === 0
              ? false //超级管理员不控制（全亮）
              : tmpLoginRole > props.defaultRole
                ? true //小角色不控制大角色权限（置灰）
                : indeterminateSecond || value?.defaultValue?.length === 0, //半选或者全不选置灰
        });
      });
      setIndeterminate(_.omit(secondCheckedGroups));
      setOperationCheckedGroup(checkedGroups);
      setOperationData(data);
      firstAllConfig(data, tmpAllIndeterminate, tmpLoginRole);
    });
  }, []);

  /**
   * 全部选中按钮点击事件
   */
  const onFirstChange = (e: any) => {
    operationData.forEach((item, index) => {
      onSecondChange(index, e);
    });
    if (e.target.checked) {
      //全选中
      setAllIndeterminate({
        ...allIndeterminate,
        indeterminate: false,
        checked: true,
      });
    } else {
      //全取消
      setAllIndeterminate({
        ...allIndeterminate,
        indeterminate: false,
        checked: false,
      });
    }
  };

  /**
   * 二级菜单选中点击事件
   * @param key
   * @param e
   */
  const onSecondChange = (key: number, e: any) => {
    if (e.target.checked) {
      //全选二级菜单
      indeterminate[key] = {
        ...indeterminate[key],
        indeterminate: false,
        checked: true,
      };
      setIndeterminate(_.omit(indeterminate));
      const checkedKeys = _.map(operationData[key].operations || [], 'value');
      operationCheckedGroup[key] = {
        key,
        checkedKeys,
      };
      setOperationCheckedGroup(operationCheckedGroup);
    } else {
      //取消全部二级菜单
      operationCheckedGroup[key] = {
        key,
        checkedKeys: [],
      };
      setOperationCheckedGroup(operationCheckedGroup);
      indeterminate[key] = {
        ...indeterminate[key],
        indeterminate: false,
        checked: false,
      };
      setIndeterminate(_.omit(indeterminate));
    }
  };

  const onChange = (key: number, checkedValue: CheckboxValueType[]) => {
    operationCheckedGroup[key] = {
      key,
      checkedKeys: checkedValue,
    };
    setOperationCheckedGroup(operationCheckedGroup);
    indeterminate[key] = {
      ...indeterminate[key],
      indeterminate:
        operationCheckedGroup[key].checkedKeys?.length > 0 &&
        operationCheckedGroup[key]?.checkedKeys?.length !=
          operationData[key]?.operations?.length,
      checked: operationCheckedGroup[key].checkedKeys?.length > 0,
    };
    setIndeterminate(_.omit(indeterminate));
    firstCheckConfig(operationData, _.omit(allIndeterminate));
  };

  const getOperation = (operations: any[], parentIndex: number) => {
    return operations.map((operation: any) => (
      <Col key={operation.value}>
        <Checkbox
          key={operation.value}
          value={operation.value}
          disabled={
            loginRole === 0
              ? false
              : !(
                  loginRole <= props.defaultRole &&
                  operationData[parentIndex]?.defaultValue.indexOf(operation.value) > -1
                )
          }
        >
          {operation.name}
        </Checkbox>
      </Col>
    ));
  };

  const handleSave = async () => {
    let checkedKeys: CheckboxValueType[] = [];
    operationCheckedGroup.forEach((value) => {
      checkedKeys = checkedKeys.concat(value.checkedKeys);
    });
    if (!access.canErdProjectRolePermissionEdit) {
      message.warning(intl.formatMessage({id: 'groupSetting.permission.warning.noEditAccess'}));
      return;
    }
    setSaving(true);
    try {
      const result = await POST('/ncnb/project/group/saveCheckedOperations', {
        checkedKeys,
        roleId: props.values.id,
      });
      if (result.code === 200) {
        message.success(intl.formatMessage({id: 'groupSetting.permission.saveSuccess'}));
      } else {
        message.error(result.msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Form layout="vertical" onFinish={() => void handleSave()}>
        {operationData && operationData.length > 0 ? (
          <List
            header={
              <div>
                <Checkbox
                  indeterminate={allIndeterminate.indeterminate}
                  checked={allIndeterminate.checked}
                  disabled={allIndeterminate.disabled}
                  onChange={onFirstChange.bind(this)}
                >
                  {intl.formatMessage({id: 'groupSetting.permission.selectAll'})}
                </Checkbox>
              </div>
            }
            dataSource={operationData}
            renderItem={(item: any, index: number) => (
              <>
                {index > 0 ? <Divider /> : <></>}
                <Row align="middle">
                  <Col span={6}>
                    <Checkbox
                      key={index}
                      indeterminate={indeterminate[index].indeterminate}
                      checked={indeterminate[index].checked}
                      disabled={indeterminate[index].disabled}
                      onChange={onSecondChange.bind(this, index)}
                    >
                      {item.menuName}
                    </Checkbox>
                  </Col>
                  <Col span={18}>
                    <Checkbox.Group
                      style={{width: '100%', margin: '0 8px'}}
                      defaultValue={item?.defaultValue}
                      value={operationCheckedGroup[index]?.checkedKeys}
                      onChange={onChange.bind(this, index)}
                      key={index}
                    >
                      <Row>
                        {item?.operations?.length > 0 && getOperation(item?.operations, index)}
                      </Row>
                    </Checkbox.Group>
                  </Col>
                </Row>
              </>
            )}
          />
        ) : (
          <Empty
            image="/empty.svg"
            imageStyle={{
              height: 200,
            }}
          />
        )}
        {access.canErdProjectRolePermissionEdit ? (
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              marginTop: 16,
              padding: '12px 0',
              background: 'var(--erd-surface, #fff)',
              borderTop: '1px solid var(--erd-line, #f0f0f0)',
              textAlign: 'right',
            }}
          >
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                aria-label={intl.formatMessage({id: 'groupSetting.permission.saveAria'})}
                data-testid="group-permission-submit"
              >
                {intl.formatMessage({id: 'groupSetting.permission.submit'})}
              </Button>
            </Space>
          </div>
        ) : null}
      </Form>
    </>
  );
};

export default React.memo(GroupPermission);
