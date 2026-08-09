import React, {useState} from 'react';
import {Button} from 'antd';
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="link"
        data-testid={testId}
        aria-label={`发布为模板：${projectName || projectId}`}
        onClick={() => setOpen(true)}
        style={variant === 'menu' ? {padding: 0, height: 'auto'} : undefined}
      >
        发布为模板
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
