import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  openRelationFromEmpty,
  uniqueProjectName,
} from './helpers';

/** 打开项目菜单面板（与顶栏水平 Menu 同名 menuitem 消歧） */
async function openProjectMenu(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '项目菜单' }).click();
  return page.getByTestId('project-menu-panel');
}

/** 展开项目菜单 SubMenu（产品侧 triggerSubMenuAction=click） */
async function revealProjectSubmenu(
  page: import('@playwright/test').Page,
  submenu: string,
) {
  const panel = await openProjectMenu(page);
  await panel.getByRole('menuitem', { name: submenu }).click();
  return panel;
}

async function openProjectSubEntry(
  page: import('@playwright/test').Page,
  submenu: string,
  entry: string,
) {
  await revealProjectSubmenu(page, submenu);
  // items API：叶子为 menuitem（不再嵌 Button）
  const entryItem = page.getByRole('menuitem', { name: entry });
  await expect(entryItem).toBeVisible({ timeout: 10_000 });
  await entryItem.click();
}

test.describe('设计器项目菜单', () => {
  test('项目 → 设置 → 数据源设置 可打开', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('menu');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await openProjectSubEntry(page, '设置', '数据源设置');

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByText('数据源连接配置')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('项目 → 导入 → 四项入口可开弹窗', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('import');

    const openImport = async (entry: string) => {
      await openProjectSubEntry(page, '导入', entry);
    };
    const closeDialog = async () => {
      const dialog = page.getByRole('dialog');
      // 逆向弹窗无「取消」，仅有 antd Close；勿对缺失按钮硬等 actionTimeout
      const dismiss = dialog
        .getByRole('button', { name: /取\s*消|关\s*闭|^Close$/i })
        .first();
      if (await dismiss.count()) {
        await dismiss.click();
      } else {
        await page.keyboard.press('Escape');
      }
      // 残留导入 SubMenu 再 Esc 一层
      if (await dialog.isVisible().catch(() => false)) {
        await page.keyboard.press('Escape');
      }
      await expect(dialog).toBeHidden({ timeout: 10_000 });
    };

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await openImport('数据源逆向解析');
      await expect(page.getByRole('dialog').getByText(/解析已有数据源/)).toBeVisible({
        timeout: 10_000,
      });
      await closeDialog();

      await openImport('解析PdMan文件');
      const pdman = page.getByRole('dialog');
      await expect(pdman.getByText('解析已有PdMan文件')).toBeVisible();
      // 下拉已关：无需 force 即可点到弹窗内文案
      await pdman.getByText(/点击或者拖拽PdMand导出的json文件/).click();
      await closeDialog();

      await openImport('解析ERD文件');
      const erd = page.getByRole('dialog');
      await expect(erd.getByText('解析已有ERD文件')).toBeVisible();
      await erd.getByText(/点击或者拖拽ERD导出的json文件/).click();
      await closeDialog();

      await openImport('导入DBML');
      const dbml = page.getByRole('dialog');
      await expect(dbml.getByText('导入 DBML')).toBeVisible();
      await expect(dbml.getByLabel('DBML文本')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('项目菜单：全部项目可达；面板无「版本」；顶栏版本进版本管理', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('vermenu');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);
      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();

      const panel = await openProjectMenu(page);
      await expect(panel.getByRole('menuitem', { name: '全部项目' })).toBeVisible();
      await expect(panel.getByText('最近项目')).toBeVisible();
      await expect(
        panel.getByRole('menuitem', { name: new RegExp(`✓\\s*${projectName}`) }),
      ).toBeVisible({ timeout: 10_000 });
      await expect(panel.getByRole('menuitem', { name: '版本' })).toHaveCount(0);
      await panel.getByRole('menuitem', { name: '全部项目' }).click();
      await expect(page).toHaveURL(/\/project\/recent/, { timeout: 15_000 });

      await page.goto(`/design/table/model?projectId=${projectId}`);
      await expect(page.getByRole('button', { name: '项目菜单' })).toBeVisible({
        timeout: 15_000,
      });
      await page.getByTestId('design-top-tabs').getByRole('menuitem', { name: '版本' }).click();
      await expect(page).toHaveURL(
        new RegExp(`/design/table/version/all\\?projectId=${projectId}`),
        { timeout: 15_000 },
      );
      await expect(page.getByTestId('add-version-btn')).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('项目菜单：最近项目可切换到另一项目', async ({ page }) => {
    test.setTimeout(120_000);
    const nameA = uniqueProjectName('swA');
    const nameB = uniqueProjectName('swB');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, nameA);
      const idA = new URL(page.url()).searchParams.get('projectId');
      expect(idA).toBeTruthy();

      await page.goto('/project/person');
      await createAndOpenPersonProject(page, nameB);
      const idB = new URL(page.url()).searchParams.get('projectId');
      expect(idB).toBeTruthy();
      expect(idB).not.toBe(idA);

      const panel = await openProjectMenu(page);
      await expect(panel.getByText('最近项目')).toBeVisible();
      await expect(
        panel.getByRole('menuitem', { name: new RegExp(`✓\\s*${nameB}`) }),
      ).toBeVisible({ timeout: 10_000 });
      await panel.getByRole('menuitem', { name: nameA, exact: true }).click();
      await expect(page).toHaveURL(
        new RegExp(`/design/table/model\\?projectId=${idA}`),
        { timeout: 15_000 },
      );
      await expect(page.getByTestId('project-menu-panel')).toBeHidden({
        timeout: 5_000,
      });
      await expect(page.getByRole('button', { name: '项目菜单' })).toContainText(
        nameA,
        { timeout: 15_000 },
      );
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('项目 → 设置 → 默认项设置 可打开', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('default');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await openProjectSubEntry(page, '设置', '默认项设置');

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByText('默认项设置')).toBeVisible();
      await expect(dialog.getByRole('tab', { name: '默认字段' })).toBeVisible();
      await expect(dialog.getByRole('tab', { name: '默认配置' })).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('项目 → 设置 → 默认项设置 保存有成功提示', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('defsave');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await openProjectSubEntry(page, '设置', '默认项设置');

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      // SubMenu 遮挡时 pointer 点不进；DOM click 仍触发 ModalForm 提交
      await dialog.getByRole('button', { name: /确\s*定/ }).evaluate((el: HTMLElement) => {
        el.click();
      });
      await expectToast(page, '设置成功');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('项目 → 导出 → 六项入口可见且 DDL 可开弹窗（不串导入项）', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('export');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await revealProjectSubmenu(page, '导出');
      await expect(page.getByRole('menuitem', { name: '导出HTML' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: '导出Word' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: '导出Markdown' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: '导出ERD' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: '导出DBML' })).toBeVisible();
      // P0：导出子菜单不得出现导入项
      await expect(page.getByRole('menuitem', { name: '数据源逆向解析' })).toHaveCount(0);
      await expect(page.getByRole('menuitem', { name: '导入DBML' })).toHaveCount(0);
      await page.getByRole('menuitem', { name: '导出DDL' }).click();
      const dlg = page.getByRole('dialog');
      await expect(dlg.getByText('SQL导出配置')).toBeVisible({
        timeout: 10_000,
      });
      await expect(dlg.getByRole('button', { name: '下一步' })).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('导出 DDL：有数据源与表时可进入第二步', async ({ page, request }) => {
    test.setTimeout(120_000);
    const API = process.env.API_URL || 'http://localhost:9502';
    const projectName = uniqueProjectName('exportddl');
    let dsId = '';
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(page.getByText('T_TABLE_1').first()).toBeVisible({ timeout: 15_000 });

      const token = await page.evaluate(() => localStorage.getItem('Authorization'));
      expect(token).toBeTruthy();
      dsId = crypto.randomUUID();
      const createDs = await request.post(`${API}/ncnb/dataSources`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          id: dsId,
          name: `e2e-ddl-${Date.now().toString(36)}`,
          type: 'MYSQL',
          url: 'jdbc:mysql://127.0.0.1:3306/e2e',
          username: 'e2e',
          password: 'e2e',
          driverClassName: 'com.mysql.cj.jdbc.Driver',
        },
      });
      expect(createDs.status()).toBe(200);

      await openProjectSubEntry(page, '导出', '导出DDL');
      const dlg = page.getByRole('dialog');
      await expect(dlg.getByText('SQL导出配置')).toBeVisible({ timeout: 10_000 });
      // 打开弹窗会 refreshDataSources；默认选中刚创建的数据源
      await expect(dlg.getByTitle(/e2e-ddl-/)).toBeVisible({ timeout: 10_000 });

      // antd Form 必填星号会进 accessible name（"* 导出数据表"）
      await dlg.getByRole('combobox', { name: /导出数据表/ }).click();
      const exportTree = page.getByRole('tree').filter({ hasText: /SHOP/ });
      await expect(exportTree).toBeVisible({ timeout: 10_000 });
      // 勿用裸 getByText('T_TABLE_1')：会命中画布节点
      const tableOpt = exportTree.getByText('T_TABLE_1', { exact: true });
      await expect(tableOpt).toBeVisible({ timeout: 10_000 });
      await tableOpt.click();
      // TreeSelect 多选下拉会挡住 Modal footer；点标题收起（勿 Escape，会关 Modal）
      await dlg.getByText('SQL导出配置').click();
      await expect(exportTree).toBeHidden({ timeout: 5_000 });

      await dlg.getByRole('button', { name: '下一步' }).click({ force: true });
      await expect(dlg.getByRole('button', { name: '上一步' })).toBeVisible({ timeout: 10_000 });
      await expect(dlg.getByRole('button', { name: '导出' })).toBeVisible();
      await expect(dlg.getByText('导出配置', { exact: true })).toBeVisible();

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30_000 }),
        dlg.getByRole('button', { name: '导出' }).click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.sql$/i);
      expect(await download.path()).toBeTruthy();
      await expectToast(page, /导出成功/);
    } finally {
      if (dsId) {
        const token = await page.evaluate(() => localStorage.getItem('Authorization')).catch(() => null);
        if (token) {
          await request
            .delete(`${API}/ncnb/dataSources/${dsId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => {});
        }
      }
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('项目菜单发布为模板：无需填写项目 ID', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('publish');
    let capturedBody: {projectId?: string; title?: string} | null = null;

    await page.route('**/ncnb/catalog/v1/submissions', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBody = route.request().postDataJSON() as {projectId?: string; title?: string};
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, data: { id: 'e2e-submission' } }),
        });
        return;
      }
      await route.continue();
    });

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);
      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page.getByTestId('project-menu-panel').getByRole('menuitem', { name: '发布为模板' }).click();
      const publishDialog = page.getByRole('dialog', { name: '发布为模板' });
      await expect(publishDialog).toBeVisible();
      await expect(publishDialog.getByText(/须为项目创建人/)).toBeVisible();
      await expect(publishDialog.getByText(/GitHub/)).toHaveCount(0);
      await expect(page.getByTestId('catalog-publish-project-id')).toHaveCount(0);
      await expect(publishDialog.getByTestId('catalog-publish-title')).toHaveValue(projectName);

      await publishDialog.getByRole('button', { name: '提交审核' }).click();
      await expectToast(page, /已提交审核/);

      expect(capturedBody?.projectId).toBe(projectId);
      expect(capturedBody?.title).toBe(projectName);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
