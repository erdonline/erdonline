import React, { useContext, useEffect, useState } from "react";
import { Menu } from "antd";
import { createFromIconfontCN } from "@ant-design/icons";
import AddVersion from "@/components/dialog/version/AddVersion";
import SyncConfig from "@/components/dialog/version/SyncConfig";
import InitVersion from "@/components/dialog/version/InitVersion";
import RebuildVersion from "@/components/dialog/version/RebuildVersion";
import ReverseDatabase from "../dialog/import/ReverseDatabase";
import ReversePdMan from "@/components/dialog/import/ReversePdMan";
import ExportHTML from "@/components/dialog/export/ExportHTML";
import ExportDDL from "@/components/dialog/export/ExportDDL";
import ExportJson from "@/components/dialog/export/ExportJson";
import DatabaseSetUp from "@/components/dialog/setup/DatabaseSetUp";
import DefaultSetUp from "@/components/dialog/setup/DefaultSetUp";
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

type RecentRow = { id: string; projectName: string };
type RecentStatus = 'idle' | 'loading' | 'ok' | 'error';

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
  const currentId =
    useProjectStore((s) => s.project?.id) ||
    cache.getItem(CONSTANT.PROJECT_ID) ||
    '';
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [status, setStatus] = useState<RecentStatus>('idle');

  useEffect(() => {
    if (props.open === false) {
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

  return (
    <Menu
      mode="vertical"
      selectable={false}
      // click 展开：避免 hover 途经邻项粘住子菜单（设计器 Dropdown 内）
      triggerSubMenuAction="click"
      style={{ minWidth: 200 }}
    >
      <Menu.Item key="all-projects" onClick={openAllProjects}>
        全部项目
      </Menu.Item>
      <Menu.Divider />
      <Menu.ItemGroup key="recent" title="最近项目">
        {status === 'loading' || status === 'idle' ? (
          <Menu.Item key="recent-loading" disabled>
            加载中…
          </Menu.Item>
        ) : null}
        {status === 'error' ? (
          <Menu.Item key="recent-error" disabled>
            加载失败，点全部项目查看
          </Menu.Item>
        ) : null}
        {status === 'ok' && recent.length === 0 ? (
          <Menu.Item key="recent-empty" disabled>
            暂无最近项目
          </Menu.Item>
        ) : null}
        {status === 'ok'
          ? recent.map((p) => {
              const isCurrent = p.id === currentId;
              const label = isCurrent ? `✓ ${p.projectName}` : p.projectName;
              return (
                <Menu.Item
                  key={`recent-${p.id}`}
                  onClick={() => switchTo(p.id)}
                  title={p.projectName}
                  style={{
                    maxWidth: 280,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Menu.Item>
              );
            })
          : null}
      </Menu.ItemGroup>
      <Menu.Divider />
      <Menu.SubMenu key="import" title="导入">
        <ReverseDatabase />
        <ReversePdMan />
        <ReverseERD />
        <ReverseDBML />
      </Menu.SubMenu>
      <Menu.SubMenu key="export" title="导出">
        <ExportHTML />
        <ExportWord />
        <ExportMarkdown />
        <ExportDDL />
        <ExportJson />
        <ExportDBML />
      </Menu.SubMenu>
      <Menu.SubMenu key="setup" title="设置">
        <DatabaseSetUp />
        <DefaultSetUp />
      </Menu.SubMenu>
    </Menu>
  );
};
