import React, {useState} from 'react';
import {Button, Modal, message} from 'antd';
import {deleteProject} from '@/services/project';

export type RemoveProjectProps = {
  fetchProjects?: () => void;
  project?: {id: string};
};

const REMOVE_WRAP = 'project-remove-modal-wrap';

const RemoveProject: React.FC<RemoveProjectProps> = (props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    if (!props.project?.id) {
      message.error('删除失败');
      return;
    }
    setLoading(true);
    try {
      const res = await deleteProject({id: props.project.id});
      if (res?.code === 200) {
        message.success('删除成功');
        props.fetchProjects?.();
        setOpen(false);
        return;
      }
      message.error(res?.message || res?.msg || '删除失败');
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
        aria-label="删除项目"
        onClick={() => setOpen(true)}
      >
        删除
      </Button>
      <Modal
        title="删除项目"
        open={open}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        okText="是"
        cancelText="否"
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
        确定删除该项目吗？此操作不可逆。
      </Modal>
    </>
  );
};

export default React.memo(RemoveProject);
