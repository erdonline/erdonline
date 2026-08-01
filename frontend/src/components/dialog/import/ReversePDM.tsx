import React from 'react';
import { Button, message } from "antd";
import {MyIcon} from "@/components/Menu";

export type ReversePDMProps = {};

const ReversePDM: React.FC<ReversePDMProps> = () => {
  const readPDMfile = () => {
    message.warning('此功能正在玩命开发中，敬请期待...');
  };
  return (
    <Button
      type="text"
      size="small"
      block
      icon={<MyIcon type="icon-PDM"/>}
      onClick={readPDMfile}
      style={{ textAlign: 'left' }}
    >解析PDM文件</Button>
  );
};

export default React.memo(ReversePDM);
