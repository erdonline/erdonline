import React from 'react';
import { Button, message } from "antd";
import {MyIcon} from "@/components/Menu";

export type ReverseERWinProps = {};

const ReverseERWin: React.FC<ReverseERWinProps> = () => {
  const readPDMfile = () => {
    message.warning('此功能正在玩命开发中，敬请期待...');
  };
  return (
    <Button
      type="text"
      size="small"
      block
      icon={<MyIcon type="icon-other_win"/>}
      onClick={readPDMfile}
      style={{ textAlign: 'left' }}
    >解析ERWin文件</Button>
  );
};

export default React.memo(ReverseERWin);
