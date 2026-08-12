import React, {useState} from 'react';
import {Button} from 'antd';
import {useIntl} from '@umijs/max';
import PublishTemplateModal from './PublishTemplateModal';

export type PublishTemplateActionProps = {
  projectId: string;
  projectName?: string;
  /** link 用于列表行 actions；menu 用于菜单项样式 */
  variant?: 'link' | 'menu';
  testId?: string;
};

const PublishTemplateAction: React.FC<PublishTemplateActionProps> = ({
  projectId,
  projectName,
  variant = 'link',
  testId = 'project-publish-template',
}) => {
  const intl = useIntl();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="link"
        data-testid={testId}
        aria-label={intl.formatMessage(
          { id: 'catalogPublish.actionAria' },
          { name: projectName || projectId },
        )}
        onClick={() => setOpen(true)}
        style={variant === 'menu' ? {padding: 0, height: 'auto'} : undefined}
      >
        {intl.formatMessage({ id: 'catalogPublish.action' })}
      </Button>
      <PublishTemplateModal
        projectId={projectId}
        projectName={projectName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
};

export default PublishTemplateAction;
