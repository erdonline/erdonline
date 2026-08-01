import defaultData from '@/utils/defaultData.json';
import { addProject } from '@/services/project';
import { history } from '@@/core/history';
import { message } from 'antd';
import * as cache from '@/utils/cache';
import { CONSTANT } from '@/utils/constant';

/** 示例商城模型：2 表 + 1 关联，打开关系图即有画布内容 */
export function buildExampleProjectJSON() {
  const base = JSON.parse(JSON.stringify(defaultData));
  base.modules = [
    {
      name: 'SHOP',
      chnname: '示例商城',
      entities: [
        {
          title: 'T_USER',
          chnname: '用户',
          fields: [
            {
              name: 'ID',
              chnname: '主键',
              type: 'IdOrKey',
              pk: true,
              notNull: true,
            },
            {
              name: 'NAME',
              chnname: '用户名',
              type: 'String',
              pk: false,
              notNull: true,
            },
          ],
        },
        {
          title: 'T_ORDER',
          chnname: '订单',
          fields: [
            {
              name: 'ID',
              chnname: '主键',
              type: 'IdOrKey',
              pk: true,
              notNull: true,
            },
            {
              name: 'USER_ID',
              chnname: '用户ID',
              type: 'IdOrKey',
              pk: false,
              notNull: true,
            },
            {
              name: 'AMOUNT',
              chnname: '金额',
              type: 'Decimal',
              pk: false,
              notNull: false,
            },
          ],
        },
      ],
      graphCanvas: {
        nodes: [
          { id: 'T_USER', x: 80, y: 80 },
          { id: 'T_ORDER', x: 420, y: 80 },
        ],
        edges: [],
      },
      associations: [
        {
          relation: '1:n',
          from: { entity: 'T_ORDER', field: 'USER_ID' },
          to: { entity: 'T_USER', field: 'ID' },
        },
      ],
    },
  ];
  return base;
}

/**
 * 创建示例项目并进入设计器（服务 30s 激活与「存版本」北极星入口）。
 * 免费版仅 1 个个人项目：若配额满，提示先到个人项目清理。
 */
export async function createExampleProjectAndOpen(): Promise<boolean> {
  const hide = message.loading('正在创建示例项目…', 0);
  try {
    const res: any = await addProject({
      projectName: `示例商城-${Date.now().toString().slice(-6)}`,
      description: '开箱即用的示例模型：用户/订单与关联，可直接改表并保存版本',
      tags: '示例,入门',
      projectJSON: buildExampleProjectJSON(),
      configJSON: { synchronous: { upgradeType: 'increment' } },
    });
    hide();
    if (res?.code !== 200 || !res?.data) {
      const msg = res?.msg || res?.message || '创建失败';
      if (/VIP|限额|上限|免费|一个/i.test(String(msg))) {
        message.error('个人项目名额已满，请先到「个人项目」删除后再试示例');
        history.push('/project/person');
        return false;
      }
      message.error(msg);
      return false;
    }
    const projectId = String(res.data);
    cache.setItem(CONSTANT.PROJECT_ID, projectId);
    message.success('示例项目已就绪，开始探索吧');
    history.push(`/design/table/model?projectId=${projectId}`);
    return true;
  } catch (e: any) {
    hide();
    message.error(e?.message || '创建示例项目失败');
    return false;
  }
}
