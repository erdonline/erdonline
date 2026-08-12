import React, { useContext, useEffect, useMemo, useState } from "react";
import { Menu } from "antd";
import type { MenuProps } from "antd";
import { useIntl } from '@umijs/max';
import ReverseDatabase from "../dialog/import/ReverseDatabase";
import ReversePdMan from "@/components/dialog/import/ReversePdMan";
import ExportDDL from "@/components/dialog/export/ExportDDL";
import ExportJson from "@/components/dialog/export/ExportJson";
import DatabaseSetUp from "@/components/dialog/setup/DatabaseSetUp";
import DatabaseTemplatesModal from "@/components/dialog/setup/DatabaseTemplatesModal";
import DefaultSetUp from "@/components/dialog/setup/DefaultSetUp";
import ExportHTML from "@/components/dialog/export/ExportHTML";
import ExportWord from "@/components/dialog/export/ExportWord";
import ExportMarkdown from "@/components/dialog/export/ExportMarkdown";
import ExportDBML from "@/components/dialog/export/ExportDBML";
import ReverseERD from "@/components/dialog/import/ReverseERD";
import ReverseDBML from "@/components/dialog/import/ReverseDBML";
import PublishTemplateModal from '@/components/catalog/PublishTemplateModal';
import RenameProject from '@/components/dialog/project/RenameProject';
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
  | 'rename-project'
  | 'import-reverse'
  | 'import-pdman'
  | 'import-erd'
  | 'import-dbml'
  | 'export-ddl'
  | 'export-dbml'
  | 'setup-db'
  | 'setup-ddl-templates'
  | 'setup-default'
  | 'publish-template';

export interface IFileMenuProps {
  className?: string;
  shouldDismissPopover?: boolean;
  /** 设计器 Dropdown 是否打开；为 true 时拉取最近项目 */
  open?: boolean;
}

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
  const intl = useIntl();
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const project = useProjectStore((s) => s.project, shallow);
  const { projectDispatch } = useProjectStore(
    (s) => ({ projectDispatch: s.dispatch }),
    shallow,
  );
  const currentId =
    project?.id ||
    cache.getItem(CONSTANT.PROJECT_ID) ||
    '';
  const currentName = project?.projectName || '';
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
      .querySelector<HTMLElement>(`button[aria-label="${intl.formatMessage({ id: 'designLayout.project.menuAria' })}"]`)
      ?.focus();
    setDialog(key);
  };

  const closeDialog = () => setDialog(null);

  const openAllProjects = () => {
    closeProjectMenu();
    history.push('/project/recent');
  };

  const openSettingPage = (path: string) => {
    closeProjectMenu();
    setOpenKeys([]);
    const q = currentId ? `?projectId=${currentId}` : '';
    history.push(`${path}${q}`);
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
        ? [{ key: 'recent-loading', label: intl.formatMessage({ id: 'menu.loading' }), disabled: true }]
        : status === 'error'
          ? [
              {
                key: 'recent-error',
                label: intl.formatMessage({ id: 'menu.loadError' }),
                disabled: true,
              },
            ]
          : recent.length === 0
            ? [{ key: 'recent-empty', label: intl.formatMessage({ id: 'menu.recentEmpty' }), disabled: true }]
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
        label: intl.formatMessage({ id: 'menu.allProjects' }),
        onClick: openAllProjects,
      },
      { type: 'divider' },
      {
        type: 'group',
        label: intl.formatMessage({ id: 'menu.recentProjects' }),
        children: recentChildren,
      },
      { type: 'divider' },
      {
        key: 'rename-project',
        label: <span data-testid="project-menu-rename">{intl.formatMessage({ id: 'menu.renameProject' })}</span>,
        onClick: () => openDialog('rename-project'),
      },
      { type: 'divider' },
      {
        key: 'import',
        label: intl.formatMessage({ id: 'designLayout.route.import' }),
        popupClassName: 'erd-dense-menu',
        children: [
          {
            key: 'import-reverse',
            label: intl.formatMessage({ id: 'designLayout.route.reverseParse' }),
            onClick: () => openDialog('import-reverse'),
          },
          {
            key: 'import-pdman',
            label: intl.formatMessage({ id: 'designLayout.route.importPdman' }),
            onClick: () => openDialog('import-pdman'),
          },
          {
            key: 'import-erd',
            label: intl.formatMessage({ id: 'designLayout.route.importErd' }),
            onClick: () => openDialog('import-erd'),
          },
          {
            key: 'import-dbml',
            label: intl.formatMessage({ id: 'menu.importDbml' }),
            onClick: () => openDialog('import-dbml'),
          },
        ],
      },
      {
        key: 'export',
        label: intl.formatMessage({ id: 'designLayout.route.export' }),
        popupClassName: 'erd-dense-menu',
        children: [
          {
            key: 'export-html',
            label: intl.formatMessage({ id: 'menu.exportHtml' }),
            onClick: () => exportFile('Html'),
          },
          {
            key: 'export-word',
            label: intl.formatMessage({ id: 'menu.exportWord' }),
            onClick: () => exportFile('Word'),
          },
          {
            key: 'export-md',
            label: intl.formatMessage({ id: 'menu.exportMarkdown' }),
            onClick: () => exportFile('Markdown'),
          },
          {
            key: 'export-ddl',
            label: intl.formatMessage({ id: 'menu.exportDdl' }),
            onClick: () => openDialog('export-ddl'),
          },
          {
            key: 'export-erd',
            label: intl.formatMessage({ id: 'menu.exportErd' }),
            onClick: () => exportFile('JSON'),
          },
          {
            key: 'export-dbml',
            label: intl.formatMessage({ id: 'menu.exportDbml' }),
            onClick: () => openDialog('export-dbml'),
          },
        ],
      },
      {
        key: 'setup',
        label: intl.formatMessage({ id: 'designLayout.route.settings' }),
        popupClassName: 'erd-dense-menu',
        children: [
          {
            key: 'setup-datatype',
            label: (
              <span data-testid="project-menu-datatype-dict">{intl.formatMessage({ id: 'designLayout.route.dataTypeDict' })}</span>
            ),
            onClick: () =>
              openSettingPage('/design/table/setting/dataType'),
          },
          {
            key: 'setup-field-library',
            label: <span data-testid="project-menu-field-library">{intl.formatMessage({ id: 'designLayout.route.fieldLibrary' })}</span>,
            onClick: () =>
              openSettingPage('/design/table/setting/fieldLibrary'),
          },
          {
            key: 'setup-default-fields',
            label: (
              <span data-testid="project-menu-default-fields">{intl.formatMessage({ id: 'designLayout.route.defaultFields' })}</span>
            ),
            onClick: () =>
              openSettingPage('/design/table/setting/defaultField'),
          },
          {
            key: 'setup-db',
            label: intl.formatMessage({ id: 'menu.setupDb' }),
            onClick: () => openDialog('setup-db'),
          },
          {
            key: 'setup-ddl-templates',
            label: <span data-testid="project-menu-ddl-templates">{intl.formatMessage({ id: 'designLayout.route.databaseTemplates' })}</span>,
            onClick: () => openDialog('setup-ddl-templates'),
          },
          {
            key: 'setup-default',
            label: intl.formatMessage({ id: 'menu.setupDefault' }),
            onClick: () => openDialog('setup-default'),
          },
        ],
      },
      { type: 'divider' },
      {
        key: 'publish-template',
        label: intl.formatMessage({ id: 'menu.publishTemplate' }),
        onClick: () => openDialog('publish-template'),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, recent, currentId, projectDispatch, intl]);

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
        className="erd-project-menu__list erd-dense-menu"
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
      <DatabaseTemplatesModal
        hideTrigger
        open={dialog === 'setup-ddl-templates'}
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
      <PublishTemplateModal
        projectId={currentId}
        projectName={currentName}
        open={dialog === 'publish-template'}
        onOpenChange={(o) => {
          if (!o) closeDialog();
        }}
      />
      {currentId ? (
        <RenameProject
          hideTrigger
          open={dialog === 'rename-project'}
          onOpenChange={(o) => {
            if (!o) closeDialog();
          }}
          project={{
            id: currentId,
            projectName: project?.projectName,
            description: project?.description,
            tags: project?.tags,
          }}
          onSuccess={(values) => {
            const current = useProjectStore.getState().project;
            if (!current) {
              return;
            }
            useProjectStore.setState({
              project: {
                ...current,
                projectName: values.projectName,
                description: values.description,
                tags: values.tags,
              },
            });
          }}
        />
      ) : null}
    </>
  );
};
