import React from 'react';

/** 项目下拉打开 Modal 时关闭菜单，避免菜单层挡住弹窗操作 */
export const ProjectMenuCloseContext = React.createContext<() => void>(() => {});
