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
import ExportDBML from "@/components/dialog/export/ExportDBML";
import ReverseERD from "@/components/dialog/import/ReverseERD";
import ReverseDBML from "@/components/dialog/import/ReverseDBML";
import { history } from "@@/exports";
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

export const ProjectMenu: React.FunctionComponent<IFileMenuProps> = () => {
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const openAllProjects = () => {
    closeProjectMenu();
    history.push('/project/recent');
  };

  return (
    <Menu
      mode="vertical"
      selectable={false}
      // click 展开：避免 hover 途经邻项粘住子菜单（设计器 Dropdown 内）
      triggerSubMenuAction="click"
      style={{ minWidth: 160 }}
    >
      <Menu.Item key="all-projects" onClick={openAllProjects}>
        全部项目
      </Menu.Item>
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
