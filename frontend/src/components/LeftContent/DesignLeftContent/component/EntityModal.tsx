import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import './entity-modal.scss';

interface EntityModalProps {
    visible: boolean;
    title: string;
    onOk: (values: any) => void;
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
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible) {
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
            onOk(values);
        } catch (error) {
            console.error("Form validation failed:", error);
        }
    };

    // 根据modalType和initialValues来决定标题
    const getModalTitle = () => {
        const isNew = !initialValues || Object.keys(initialValues).length === 0 || initialValues.isNew;
        switch (modalType) {
            case 'module':
                return isNew ? '新增模型' : '编辑模型';
            case 'entity':
                // 「编辑表」已改开表设计；本弹层仅新建/重命名
                return isNew ? '新增表' : '重命名表';
            case 'relation':
                // 关系图 = diagrams[] 命名（ADR-0017）；不再走已废弃的空 FK 表单
                return isNew ? '新建关系图' : '重命名关系图';
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
            width={400}
            className="erd-entity-modal"
            rootClassName="erd-entity-modal-root"
            // 小表单无需 zoom 戏剧感；亦避免 E2E 量到 scale 中的 bbox
            transitionName=""
            maskTransitionName=""
            destroyOnHidden
            data-testid="entity-modal"
            okButtonProps={{ 'data-testid': 'entity-modal-ok' } as any}
        >
            <Form form={form} layout="vertical" size="small" className="erd-entity-modal__form">
                {modalType === 'entity' && (
                    <Form.Item
                        name="moduleName"
                        label="所属模型"
                        rules={[{ required: true, message: '请选择所属模型！' }]}
                    >
                        <Select>
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
                    label={isRelation ? '关系图名称' : '名称'}
                    rules={[{ required: true, message: isRelation ? '请输入关系图名称！' : '请输入名称！' }]}
                >
                    <Input
                      aria-label={isRelation ? '关系图名称' : undefined}
                      data-testid="entity-modal-name"
                      placeholder={isRelation ? '例如：鉴权域' : undefined}
                    />
                </Form.Item>
                {!isRelation && (
                    <Form.Item
                        name="chnname"
                        label="中文名"
                        rules={modalType === 'entity' ? [] : [{ required: true, message: '请输入中文名！' }]}
                    >
                        <Input
                          data-testid="entity-modal-chnname"
                          placeholder={modalType === 'entity' ? '可选' : undefined}
                        />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
};

export default EntityModal;
