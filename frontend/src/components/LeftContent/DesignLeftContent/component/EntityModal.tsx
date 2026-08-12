import React, { useEffect, useRef, useState } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { useIntl } from '@umijs/max';
import type { InputRef } from 'antd/es/input';
import type { RefSelectProps } from 'antd/es/select';
import './entity-modal.scss';

interface EntityModalProps {
    visible: boolean;
    title: string;
    onOk: (values: Record<string, unknown>) => void | boolean | Promise<void | boolean>;
    onCancel: () => void;
    initialValues?: any;
    modules?: any[];
    modalType: 'module' | 'entity' | 'relation';
}

const EntityModal: React.FC<EntityModalProps> = ({
    visible,
    title,
    onOk,
    onCancel,
    initialValues,
    modules,
    modalType,
}) => {
    const intl = useIntl();
    const [form] = Form.useForm();
    const nameInputRef = useRef<InputRef>(null);
    const moduleSelectRef = useRef<RefSelectProps>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (visible) {
            setSubmitting(false);
            if (modalType === 'entity') {
                form.setFieldsValue({
                    moduleName: initialValues?.module || (modules && modules.length > 0 ? modules[0].name : ''),
                    name: initialValues?.title || initialValues?.name,
                    chnname: initialValues?.chnname || ''
                });
            } else if (initialValues) {
                form.setFieldsValue({
                    name: initialValues?.name || '',
                    chnname: initialValues?.chnname || ''
                });
            } else {
                form.resetFields();
            }
        }
    }, [visible, initialValues, form, modalType, modules]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            try {
                const result = await onOk(values);
                if (result === false) {
                    return;
                }
            } finally {
                setSubmitting(false);
            }
        } catch (error) {
            console.error("Form validation failed:", error);
        }
    };

    const getModalTitle = () => {
        const isNew = !initialValues || Object.keys(initialValues).length === 0 || initialValues.isNew;
        switch (modalType) {
            case 'module':
                return isNew
                  ? intl.formatMessage({ id: 'entityModal.addModule' })
                  : intl.formatMessage({ id: 'entityModal.editModule' });
            case 'entity':
                return isNew
                  ? intl.formatMessage({ id: 'entityModal.addTable' })
                  : intl.formatMessage({ id: 'entityModal.renameTable' });
            case 'relation':
                return isNew
                  ? intl.formatMessage({ id: 'entityModal.addDiagram' })
                  : intl.formatMessage({ id: 'entityModal.renameDiagram' });
            default:
                return title;
        }
    };

    const isRelation = modalType === 'relation';

    return (
        <Modal
            title={getModalTitle()}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            confirmLoading={submitting}
            width={400}
            className="erd-entity-modal"
            rootClassName="erd-entity-modal-root"
            transitionName=""
            maskTransitionName=""
            destroyOnHidden
            keyboard
            focusTriggerAfterClose
            afterOpenChange={(opened) => {
                if (!opened) {
                    return;
                }
                const tryFocus = (attempt = 0) => {
                    if (modalType === 'entity') {
                        if (moduleSelectRef.current) {
                            moduleSelectRef.current.focus();
                            return;
                        }
                    } else if (nameInputRef.current) {
                        nameInputRef.current.focus();
                        return;
                    }
                    if (attempt >= 20) {
                        return;
                    }
                    window.setTimeout(() => tryFocus(attempt + 1), 50);
                };
                window.setTimeout(() => tryFocus(), 0);
            }}
            data-testid="entity-modal"
            okButtonProps={{ 'data-testid': 'entity-modal-ok' } as any}
        >
            <Form form={form} layout="vertical" size="small" className="erd-entity-modal__form">
                {modalType === 'entity' && (
                    <Form.Item
                        name="moduleName"
                        label={intl.formatMessage({ id: 'entityModal.moduleLabel' })}
                        rules={[{ required: true, message: intl.formatMessage({ id: 'entityModal.moduleRequired' }) }]}
                    >
                        <Select ref={moduleSelectRef} aria-label={intl.formatMessage({ id: 'entityModal.moduleAria' })}>
                            {modules?.map(module => (
                                <Select.Option key={module.name} value={module.name}>
                                    {module.chnname || module.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}
                <Form.Item
                    name="name"
                    label={
                      isRelation
                        ? intl.formatMessage({ id: 'entityModal.diagramNameLabel' })
                        : intl.formatMessage({ id: 'entityModal.nameLabel' })
                    }
                    rules={[{
                      required: true,
                      message: isRelation
                        ? intl.formatMessage({ id: 'entityModal.diagramNameRequired' })
                        : intl.formatMessage({ id: 'entityModal.nameRequired' }),
                    }]}
                >
                    <Input
                      ref={nameInputRef}
                      aria-label={
                        isRelation
                          ? intl.formatMessage({ id: 'entityModal.diagramNameAria' })
                          : intl.formatMessage({ id: 'entityModal.nameAria' })
                      }
                      data-testid="entity-modal-name"
                      placeholder={
                        isRelation
                          ? intl.formatMessage({ id: 'entityModal.diagramNamePlaceholder' })
                          : undefined
                      }
                    />
                </Form.Item>
                {!isRelation && (
                    <Form.Item
                        name="chnname"
                        label={intl.formatMessage({ id: 'entityModal.chnnameLabel' })}
                        rules={
                          modalType === 'entity'
                            ? []
                            : [{ required: true, message: intl.formatMessage({ id: 'entityModal.chnnameRequired' }) }]
                        }
                    >
                        <Input
                          aria-label={intl.formatMessage({ id: 'entityModal.chnnameAria' })}
                          data-testid="entity-modal-chnname"
                          placeholder={
                            modalType === 'entity'
                              ? intl.formatMessage({ id: 'entityModal.chnnameOptional' })
                              : undefined
                          }
                        />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
};

export default EntityModal;
