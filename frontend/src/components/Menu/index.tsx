import React, { useContext, useEffect, useMemo, useState } from "react";
import { Menu } from "antd";
import type { MenuProps } from "antd";
import { createFromIconfontCN } from "@ant-design/icons";
import AddVersion from "@/components/dialog/version/AddVersion";
import SyncConfig from "@/components/dialog/version/SyncConfig";
import InitVersion from "@/components/dialog/version/InitVersion";
import RebuildVersion from "@/components/dialog/version/RebuildVersion";
import ReverseDatabase from "../dialog/import/ReverseDatabase";
import ReversePdMan from "@/components/dialog/import/ReversePdMan";
import ExportDDL from "@/components/dialog/export/ExportDDL";
import ExportJson from "@/components/dialog/export/ExportJson";
import DatabaseSetUp from "@/components/dialog/setup/DatabaseSetUp";
import DefaultSetUp from "@/components/dialog/setup/DefaultSetUp";
import ExportHTML from "@/components/dialog/export/ExportHTML";
import ExportWord from "@/components/dialog/export/ExportWord";
import ExportMarkdown from "@/components/dialog/export/ExportMarkdown";
import ExportDBML from "@/components/dialog/export/ExportDBML";
import ReverseERD from "@/components/dialog/import/ReverseERD";
import ReverseDBML from "@/components/dialog/import/ReverseDBML";
import { history } from "@@/exports";
import { ProjectMenuCloseContext } from "@/components/Menu/projectMenuClose";
import { recentProject } from "@/services/project";
import useProjectStore from "@/store/project/useProjectStore";
import * as cache from "@/utils/cache";
import { CONSTANT } from "@/utils/constant";
import shallow from "zustand/shallow";

type RecentRow = { id: string; projectName: string };
type RecentStatus = 'idle' | 'loading' | 'ok' | 'error';

type DialogKey =
  | 'import-reverse'
  | 'import-pdman'
  | 'import-erd'
  | 'import-dbml'
  | 'export-ddl'
  | 'export-dbml'
  | 'setup-db'
  | 'setup-default';

export const MyIcon = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_1485538_uljgplzg6rm.js', // 在 iconfont.cn 上生成
});

export interface IFileMenuProps {
  className?: string;
  shouldDismissPopover?: boolean;
  /** 设计器 Dropdown 是否打开；为 true 时拉取最近项目 */
  open?: boolean;
}

export const VersionMenu: React.FunctionComponent<IFileMenuProps> = () => (
  <>
    <AddVersion trigger="bp" testId="menu-add-version-btn" />
    <SyncConfig />
    <InitVersion />
    <RebuildVersion />
  </>
);

/** @deprecated Prefer ProjectMenu items; kept for rare standalone mounts */
export const ImportMenu: React.FunctionComponent<IFileMenuProps> = (props) => (
  <Menu className={props.className} mode="vertical">
    <ReverseDatabase />
    <ReversePdMan />
    <ReverseERD />
    <ReverseDBML />
  </Menu>
);

export const ExportMenu: React.FunctionComponent<IFileMenuProps> = (props) => (
  <Menu className={props.className} mode="vertical">
    <ExportHTML />
    <ExportWord />
    <ExportMarkdown />
    <ExportDDL />
    <ExportJson />
    <ExportDBML />
  </Menu>
);

export const SetUpMenu: React.FunctionComponent<IFileMenuProps> = (props) => (
  <Menu className={props.className} mode="vertical">
    <DatabaseSetUp />
    <DefaultSetUp />
  </Menu>
);

export const ProjectMenu: React.FunctionComponent<IFileMenuProps> = (props) => {
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const { projectDispatch } = useProjectStore(
    (s) => ({ projectDispatch: s.dispatch }),
    shallow,
  );
  const currentId =
    useProjectStore((s) => s.project?.id) ||
    cache.getItem(CONSTANT.PROJECT_ID) ||
    '';
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [status, setStatus] = useState<RecentStatus>('idle');
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [dialog, setDialog] = useState<DialogKey | null>(null);

  useEffect(() => {
    if (props.open === false) {
      setOpenKeys([]);
      return;
    }
    let cancelled = false;
    setStatus('loading');
    recentProject({ page: 1, limit: 5, order: 'updateTime' })
      .then((res) => {
        if (cancelled) {
          return;
        }
        const records: RecentRow[] = (res?.data?.records || []).map(
          (r: RecentRow) => ({ id: r.id, projectName: r.projectName }),
        );
        records.sort((a, b) => {
          if (a.id === currentId) return -1;
          if (b.id === currentId) return 1;
          return 0;
        });
        setRecent(records);
        setStatus('ok');
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [props.open, currentId]);

  const openDialog = (key: DialogKey) => {
    closeProjectMenu();
    setOpenKeys([]);
    // 子菜单项随面板卸载；先把焦点交给「项目菜单」，便于 Modal focusTriggerAfterClose
    document
      .querySelector<HTMLElement>('button[aria-label="项目菜单"]')
      ?.focus();
    setDialog(key);
  };

  const closeDialog = () => setDialog(null);

  const openAllProjects = () => {
    closeProjectMenu();
    history.push('/project/recent');
  };

  const switchTo = (id: string) => {
    closeProjectMenu();
    if (!id || id === currentId) {
      return;
    }
    cache.setItem(CONSTANT.PROJECT_ID, id);
    history.push(`/design/table/model?projectId=${id}`);
  };

  const exportFile = (type: 'Html' | 'Word' | 'Markdown' | 'JSON') => {
    closeProjectMenu();
    setOpenKeys([]);
    projectDispatch.exportFile(type);
  };

  const items: MenuProps['items'] = useMemo(() => {
    const recentChildren: MenuProps['items'] =
      status === 'loading' || status === 'idle'
        ? [{ key: 'recent-loading', label: '加载中…', disabled: true }]
        : status === 'error'
          ? [
              {
                key: 'recent-error',
                label: '加载失败，点全部项目查看',
                disabled: true,
              },
            ]
          : recent.length === 0
            ? [{ key: 'recent-empty', label: '暂无最近项目', disabled: true }]
            : recent.map((p) => {
                const isCurrent = p.id === currentId;
                return {
                  key: `recent-${p.id}`,
                  label: isCurrent ? `✓ ${p.projectName}` : p.projectName,
                  title: p.projectName,
                  onClick: () => switchTo(p.id),
                };
              });

    return [
      {
        key: 'all-projects',
        label: '全部项目',
        onClick: openAllProjects,
      },
      { type: 'divider' },
      {
        type: 'group',
        label: '最近项目',
        children: recentChildren,
      },
      { type: 'divider' },
      {
        key: 'import',
        label: '导入',
        children: [
          {
            key: 'import-reverse',
            label: '数据源逆向解析',
            onClick: () => openDialog('import-reverse'),
          },
          {
            key: 'import-pdman',
            label: '解析PdMan文件',
            onClick: () => openDialog('import-pdman'),
          },
          {
            key: 'import-erd',
            label: '解析ERD文件',
            onClick: () => openDialog('import-erd'),
          },
          {
            key: 'import-dbml',
            label: '导入DBML',
            onClick: () => openDialog('import-dbml'),
          },
        ],
      },
      {
        key: 'export',
        label: '导出',
        children: [
          {
            key: 'export-html',
            label: '导出HTML',
            onClick: () => exportFile('Html'),
          },
          {
            key: 'export-word',
            label: '导出Word',
            onClick: () => exportFile('Word'),
          },
          {
            key: 'export-md',
            label: '导出Markdown',
            onClick: () => exportFile('Markdown'),
          },
          {
            key: 'export-ddl',
            label: '导出DDL',
            onClick: () => openDialog('export-ddl'),
          },
          {
            key: 'export-erd',
            label: '导出ERD',
            onClick: () => exportFile('JSON'),
          },
          {
            key: 'export-dbml',
            label: '导出DBML',
            onClick: () => openDialog('export-dbml'),
          },
        ],
      },
      {
        key: 'setup',
        label: '设置',
        children: [
          {
            key: 'setup-db',
            label: '数据源设置',
            onClick: () => openDialog('setup-db'),
          },
          {
            key: 'setup-default',
            label: '默认项设置',
            onClick: () => openDialog('setup-default'),
          },
        ],
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, recent, currentId, projectDispatch]);

  return (
    <>
      <Menu
        mode="vertical"
        selectable={false}
        // click 展开：避免 hover 途经邻项粘住子菜单
        triggerSubMenuAction="click"
        openKeys={openKeys}
        onOpenChange={(keys) => {
          const sub = keys.filter((k) =>
            ['import', 'export', 'setup'].includes(k),
          );
          // 同时只开一个子菜单，杜绝「导出高亮却显示导入项」
          setOpenKeys(sub.length ? [sub[sub.length - 1]] : []);
        }}
        items={items}
        style={{ minWidth: 200 }}
        className="erd-project-menu__list"
      />
      <ReverseDatabase
        hideTrigger
        open={dialog === 'import-reverse'}
        onOpenChange={(o) => {
          if (!o) closeDialog();
        }}
      />
      <ReversePdMan
        hideTrigger
        open={dialog === 'import-pdman'}
        onOpenChange={(o) => {
          if (!o) closeDialog();
        }}
      />
      <ReverseERD
        hideTrigger
        open={dialog === 'import-erd'}
        onOpenChange={(o) => {
          if (!o) closeDialog();
        }}
      />
      <ReverseDBML
        hideTrigger
        open={dialog === 'import-dbml'}
        onOpenChange={(o) => {
          if (!o) closeDialog();
        }}
      />
      <ExportDDL
        hideTrigger
        open={dialog === 'export-ddl'}
        onOpenChange={(o) => {
          if (!o) closeDialog();
        }}
      />
      <ExportDBML
        hideTrigger
        open={dialog === 'export-dbml'}
        onOpenChange={(o) => {
          if (!o) closeDialog();
        }}
      />
      <DatabaseSetUp
        hideTrigger
        open={dialog === 'setup-db'}
        onOpenChange={(o) => {
          if (!o) closeDialog();
        }}
      />
      <DefaultSetUp
        hideTrigger
        open={dialog === 'setup-default'}
        onOpenChange={(o) => {
          if (!o) closeDialog();
        }}
      />
    </>
  );
};
