import React, {useState} from 'react';
import {Button, Modal, message} from 'antd';
import {useIntl} from '@umijs/max';
import {deleteProject} from '@/services/project';

export type RemoveProjectProps = {
  fetchProjects?: () => void;
  project?: {id: string};
};

const REMOVE_WRAP = 'project-remove-modal-wrap';

const RemoveProject: React.FC<RemoveProjectProps> = (props) => {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    if (!props.project?.id) {
      message.error(intl.formatMessage({ id: 'projectModal.removeFailed' }));
      return;
    }
    setLoading(true);
    try {
      const res = await deleteProject({id: props.project.id});
      if (res?.code === 200) {
        message.success(intl.formatMessage({ id: 'projectModal.removeSuccess' }));
        props.fetchProjects?.();
        setOpen(false);
        return;
      }
      message.error(res?.message || res?.msg || intl.formatMessage({ id: 'projectModal.removeFailed' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="link"
        danger
        data-testid="project-remove-trigger"
        aria-label={intl.formatMessage({ id: 'projectModal.removeAria' })}
        onClick={() => setOpen(true)}
      >
        {intl.formatMessage({ id: 'projectModal.removeTrigger' })}
      </Button>
      <Modal
        title={intl.formatMessage({ id: 'projectModal.removeTitle' })}
        open={open}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        okText={intl.formatMessage({ id: 'versionModal.confirm.yes' })}
        cancelText={intl.formatMessage({ id: 'versionModal.confirm.no' })}
        okButtonProps={{danger: true, loading}}
        destroyOnClose
        keyboard
        focusTriggerAfterClose
        wrapClassName={REMOVE_WRAP}
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          window.setTimeout(() => {
            document
              .querySelector<HTMLButtonElement>(
                `.${REMOVE_WRAP} .ant-modal-footer .ant-btn-primary`,
              )
              ?.focus();
          }, 0);
        }}
      >
        {intl.formatMessage({ id: 'projectModal.removeBody' })}
      </Modal>
    </>
  );
};

export default React.memo(RemoveProject);
