import React from 'react';
import {Button} from "antd";
import {useIntl} from '@umijs/max';
import * as cache from "@/utils/cache";
import {history} from "@@/core/history";

export type ConfigProjectProps = {
  project: any;
  type: number;
};

const ConfigProject: React.FC<ConfigProjectProps> = (props) => {
  const intl = useIntl();

  return (<>
    <Button
      type="link"
      ghost
      data-testid="project-config-trigger"
      aria-label={intl.formatMessage({ id: 'projectModal.configAria' })}
      onClick={() => {
        cache.setItem('projectId', props.project.id);
        history.push({
          pathname: '/project/group/setting/basic?projectId=' + props.project.id,
        });
      }}
    >
      {intl.formatMessage({ id: 'projectModal.configTrigger' })}
    </Button>
  </>);
}

export default React.memo(ConfigProject)
