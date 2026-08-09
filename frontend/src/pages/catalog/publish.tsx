import {Button, Form, Input, message} from 'antd';
import {history} from '@@/exports';
import * as cache from '@/utils/cache';
import {CONSTANT} from '@/utils/constant';
import {submitCatalogTemplate} from '@/services/catalog';
import '../project/project-list.scss';

export default function CatalogPublishPage() {
  const [form] = Form.useForm();
  const cachedProjectId = cache.getItem(CONSTANT.PROJECT_ID) as string | undefined;

  const onFinish = async (values: {
    projectId: string;
    title: string;
    description?: string;
    tags?: string;
  }) => {
    try {
      const res: any = await submitCatalogTemplate(values);
      if (res?.code === 200) {
        message.success('已提交审核，维护者通过后会上架');
        history.push('/catalog');
        return;
      }
      message.error(res?.msg || '提交失败（须绑定 GitHub）');
    } catch (e: any) {
      message.error(e?.data?.msg || e?.message || '提交失败');
    }
  };

  return (
    <div className="project-list-page" data-testid="catalog-publish-page">
      <Button type="link" onClick={() => history.push('/catalog')} style={{paddingLeft: 0}}>
        ← 返回模板广场
      </Button>
      <h2>发布为模板</h2>
      <p>须为项目创建人且已绑定 GitHub。提交后由维护者审核。</p>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{projectId: cachedProjectId ?? ''}}
        style={{maxWidth: 520}}
      >
        <Form.Item name="projectId" label="项目 ID" rules={[{required: true}]}>
          <Input placeholder="设计器 URL 中的 projectId" data-testid="catalog-publish-project-id" />
        </Form.Item>
        <Form.Item name="title" label="模板标题" rules={[{required: true}, {max: 100}]}>
          <Input data-testid="catalog-publish-title" />
        </Form.Item>
        <Form.Item name="description" label="简介" rules={[{max: 500}]}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="tags" label="标签（逗号分隔）">
          <Input placeholder="社区,电商" />
        </Form.Item>
        <Button type="primary" htmlType="submit" data-testid="catalog-publish-submit">
          提交审核
        </Button>
      </Form>
    </div>
  );
}
