import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';

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
        console.log(47, 'initialValues', initialValues)
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
                return isNew ? '新增表' : '编辑表';
            case 'relation':
                return '新增关系';
            default:
                return title;
        }
    };

    return (
        <Modal
            title={getModalTitle()}
            visible={visible}
            onOk={handleOk}
            onCancel={onCancel}
        >
            <Form form={form} layout="vertical">
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
                    label="名称"
                    rules={[{ required: true, message: '请输入名称！' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="chnname"
                    label="中文名"
                    rules={[{ required: true, message: '请输入中文名！' }]}
                >
                    <Input />
                </Form.Item>
                {modalType === 'relation' && (
                    <>
                        <Form.Item
                            name="entity1"
                            label="表1"
                            rules={[{ required: true, message: '请选择表1！' }]}
                        >
                            <Select>
                                {/* 这里需要添加表选项 */}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="entity2"
                            label="表2"
                            rules={[{ required: true, message: '请选择表2！' }]}
                        >
                            <Select>
                                {/* 这里需要添加表选项 */}
                            </Select>
                        </Form.Item>
                    </>
                )}
            </Form>
        </Modal>
    );
};

export default EntityModal;