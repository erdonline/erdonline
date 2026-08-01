import React, { useContext } from "react";
import { Button, Menu } from "antd";
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
import useShortcutStore, { PANEL } from "@/store/shortcut/useShortcutStore";
import CompareVersion, { CompareVersionType } from "@/components/dialog/version/CompareVersion";
import RenameVersion from "@/components/dialog/version/RenameVersion";
import RemoveVersion from "@/components/dialog/version/RemoveVersion";
import SyncVersion from "@/components/dialog/version/SyncVersion";
import ExportWord from "@/components/dialog/export/ExportWord";
import ExportMarkdown from "@/components/dialog/export/ExportMarkdown";
import ReverseERD from "@/components/dialog/import/ReverseERD";
import { history } from "@@/exports";
import * as cache from "@/utils/cache";
import { CONSTANT } from "@/utils/constant";
import { ProjectMenuCloseContext } from "@/components/Menu/projectMenuClose";

export const MyIcon = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_1485538_uljgplzg6rm.js', // 在 iconfont.cn 上生成
});

export interface IFileMenuProps {
  className?: string;
  shouldDismissPopover?: boolean;
}

export const VersionMenu: React.FunctionComponent<IFileMenuProps> = () => (
  <>
    <AddVersion trigger="bp" />
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
  </Menu>
);

export const ExportMenu: React.FunctionComponent<IFileMenuProps> = (props) => (
  <Menu className={props.className} mode="vertical">
    <ExportHTML />
    <ExportWord />
    <ExportMarkdown />
    <ExportDDL />
    <ExportJson />
  </Menu>
);

export const SetUpMenu: React.FunctionComponent<IFileMenuProps> = (props) => (
  <Menu className={props.className} mode="vertical">
    <DatabaseSetUp />
    <DefaultSetUp />
  </Menu>
);

const shortcutState = useShortcutStore.getState();

const setShortcut = (shortcut: string) => {
  shortcutState.dispatch.setPanel(shortcut);
};

export const ProjectMenu: React.FunctionComponent<IFileMenuProps> = () => {
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const openVersionManage = () => {
    closeProjectMenu();
    const projectId =
      cache.getItem(CONSTANT.PROJECT_ID) ||
      new URLSearchParams(window.location.search).get("projectId") ||
      "";
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
    history.push(`/design/table/version/all${q}`);
  };

  return (
    <Menu mode="vertical" selectable={false} style={{ minWidth: 160 }}>
      <Menu.Item key="version" onClick={openVersionManage}>
        版本
      </Menu.Item>
      <Menu.SubMenu key="import" title="导入">
        <ReverseDatabase />
        <ReversePdMan />
        <ReverseERD />
      </Menu.SubMenu>
      <Menu.SubMenu key="export" title="导出">
        <ExportHTML />
        <ExportWord />
        <ExportMarkdown />
        <ExportDDL />
        <ExportJson />
      </Menu.SubMenu>
      <Menu.SubMenu key="setup" title="设置">
        <DatabaseSetUp />
        <DefaultSetUp />
      </Menu.SubMenu>
    </Menu>
  );
};

export const ProjectSortMenu: React.FunctionComponent<IFileMenuProps> = () => (
  <Menu mode="vertical">
    <Menu.Item key="time">创建时间</Menu.Item>
    <Menu.Item key="updated">最近修改</Menu.Item>
  </Menu>
);

export const ProjectFilterMenu: React.FunctionComponent<IFileMenuProps> = () => (
  <Menu mode="vertical">
    <Menu.Item key="filter1" onClick={() => setShortcut(PANEL.VERSION)}>
      过滤1
    </Menu.Item>
    <Menu.Item key="filter2" onClick={() => setShortcut(PANEL.DEFAULT)}>
      过滤2
    </Menu.Item>
  </Menu>
);

/** 顶栏导航占位（原 ChatSQL/数据域入口依赖缺失组件，先空菜单避免白屏） */
export const NavigationMenu: React.FC = () => {
  return <Menu mode="horizontal" />;
};

export const VersionHandle: React.FunctionComponent<IFileMenuProps> = () => {
  return (
    <Menu mode="vertical">
      <CompareVersion type={CompareVersionType.DETAIL} />
      <CompareVersion type={CompareVersionType.COMPARE} />
      <RenameVersion />
      <RemoveVersion />
      <SyncVersion />
    </Menu>
  );
};

