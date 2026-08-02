import React, { useContext } from "react";
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
