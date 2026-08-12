import defaultData from '@/utils/defaultData.json';
import demoProjectJSON from '@/utils/demo.projectjson.json';
import { addProject } from '@/services/project';
import { history } from '@@/core/history';
import { Button, message, notification } from 'antd';
import { getIntl } from '@umijs/max';
import * as cache from '@/utils/cache';
import { CONSTANT } from '@/utils/constant';

/**
 * 功能鉴权示例：RBAC（用户/角色/权限/中间表）+ 会话/审计 + 业务订单。
 * 模块真相源：schema/examples/demo.projectjson.json（同步见 scripts/sync-demo-projectjson.mjs）
 */
export function buildExampleProjectJSON() {
  const base = JSON.parse(JSON.stringify(defaultData));
  base.modules = JSON.parse(JSON.stringify(demoProjectJSON.modules));
  if (base.profile) {
    base.profile.dbs = [];
  }
  return base;
}

/**
 * 创建示例项目并进入设计器（服务 30s 激活与「存版本」北极星入口）。
 * 开源版不限项目数；若自部署重新开启配额，仍给出清理引导。
 */
function isQuotaExceeded(code: unknown, msg: unknown): boolean {
  const c = Number(code);
  const m = String(msg || '');
  return c === 888801 || /VIP|限额|上限|免费|超过|名额|\d+\s*个/i.test(m);
}

function goQuotaFull() {
  message.destroy();
  message.error(getIntl().formatMessage({ id: 'utils.example.quotaFull' }));
  history.push('/project/person');
}

export async function createExampleProjectAndOpen(
  projectName?: string,
): Promise<boolean> {
  const hide = message.loading(getIntl().formatMessage({ id: 'utils.example.creating' }), 0);
  try {
    const res: any = await addProject({
      projectName: projectName || `功能鉴权示例-${Date.now().toString().slice(-6)}`,
      description:
        'RBAC 功能鉴权示例：用户/角色/权限/会话/审计与业务订单，可直接改表并保存版本',
      tags: '示例,鉴权,RBAC',
      projectJSON: buildExampleProjectJSON(),
      configJSON: { synchronous: { upgradeType: 'increment' } },
    });
    hide();
    const code = res?.code;
    const msg = res?.msg || res?.message || '';
    const id = res?.data;
    if (code === 200 && id) {
      cache.setItem(CONSTANT.PROJECT_ID, String(id));
      history.push(`/design/table/model?projectId=${id}`);
      // 激活漏斗关键一跳：给出「保存第一个版本」直达 CTA，消除进设计器后的找路成本
      const key = `example-ready-${id}`;
      notification.open({
        key,
        message: getIntl().formatMessage({ id: 'utils.example.readyTitle' }),
        description: getIntl().formatMessage({ id: 'utils.example.readyDescription' }),
        duration: 0,
        placement: 'bottomRight',
        closeIcon: (
          <span data-testid="example-ready-dismiss" aria-label={getIntl().formatMessage({ id: 'utils.example.dismissAria' })}>
            ×
          </span>
        ),
        btn: (
          <Button
            type="primary"
            data-testid="example-save-version-cta"
            onClick={() => {
              notification.destroy(key);
              history.push(`/design/table/version/all?projectId=${id}`);
            }}
          >
            {getIntl().formatMessage({ id: 'utils.example.saveFirstVersion' })}
          </Button>
        ),
      });
      return true;
    }
    if (isQuotaExceeded(code, msg)) {
      goQuotaFull();
      return false;
    }
    // request 拦截器可能已弹过后端 msg；无文案时再补一条
    if (!msg) {
      message.error(getIntl().formatMessage({ id: 'utils.example.createFailed' }));
    }
    return false;
  } catch (e: any) {
    hide();
    const code = e?.data?.code ?? e?.code;
    const msg = e?.data?.msg || e?.message || '';
    if (isQuotaExceeded(code, msg)) {
      goQuotaFull();
      return false;
    }
    message.error(msg || getIntl().formatMessage({ id: 'utils.example.createFailed' }));
    return false;
  }
}
