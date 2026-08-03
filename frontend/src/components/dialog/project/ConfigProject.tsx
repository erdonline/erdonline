import React from 'react';
import {Button} from "antd";
import * as cache from "@/utils/cache";
import {history} from "@@/core/history";

export type ConfigProjectProps = {
  project: any;
  type: number;
};

const ConfigProject: React.FC<ConfigProjectProps> = (props) => {

  return (<>
    <Button
      type="link"
      ghost
      data-testid="project-config-trigger"
      aria-label="管理项目"
      onClick={() => {
        cache.setItem('projectId', props.project.id);
        history.push({
          pathname: '/project/group/setting/basic?projectId=' + props.project.id,
        });
      }}
    >
      管理
    </Button>
  </>);
}

export default React.memo(ConfigProject)
