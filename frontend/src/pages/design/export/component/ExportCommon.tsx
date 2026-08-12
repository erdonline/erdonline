import type {ReactNode} from 'react';
import { useMemo } from 'react';
import {List, Tag} from 'antd';
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import {
  FileMarkdownOutlined,
  FileProtectOutlined,
  FileWordOutlined,
  Html5Outlined,
} from '@ant-design/icons';
import { designIntl } from '@/pages/design/locales/intl';
import './export-common.scss';


type ExportItem = {
  key: string;
  title: string;
  subTitle: ReactNode;
  avatar: ReactNode;
  content: string;
};

export default () => {

  const data: ExportItem[] = useMemo(() => [
    {
      key: 'JSON',
      title: designIntl('design.export.erd.title'),
      subTitle: <Tag color="blue">ERD</Tag>,
      avatar: <FileProtectOutlined style={{ fontSize: 16 }} />,
      content: designIntl('design.export.erd.content'),
    }, {
      key: 'Html',
      title: designIntl('design.export.html.title'),
      subTitle: <Tag color="blue">HTML</Tag>,
      avatar: <Html5Outlined style={{ fontSize: 16 }} />,
      content: designIntl('design.export.html.content'),
    }, {
      key: 'Word',
      title: designIntl('design.export.word.title'),
      subTitle: <Tag color="blue">Word</Tag>,
      avatar: <FileWordOutlined style={{ fontSize: 16 }} />,
      content: designIntl('design.export.word.content'),
    }, {
      key: 'Markdown',
      title: designIntl('design.export.markdown.title'),
      subTitle: <Tag color="blue">Markdown</Tag>,
      avatar: <FileMarkdownOutlined style={{ fontSize: 16 }} />,
      content: designIntl('design.export.markdown.content'),
    },
  ], []);

  const {projectDispatch} = useProjectStore(state => ({
    projectDispatch: state.dispatch,
  }), shallow);

  return (
    <div className="export-common-page" data-testid="export-common-page">
      <h2 className="export-common-page__title">{designIntl('design.export.page.title')}</h2>
      <p className="export-common-page__hint">{designIntl('design.export.page.hint')}</p>
      <List<ExportItem>
        grid={{gutter: 8, column: 2}}
        dataSource={data}
        renderItem={(record) => (
          <List.Item>
            <div
              className="export-common-card"
              role="button"
              tabIndex={0}
              aria-label={record.title}
              data-testid={`export-common-${String(record.key).toLowerCase()}`}
              onClick={() => {
                projectDispatch.exportFile(record.key)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  projectDispatch.exportFile(record.key);
                }
              }}
            >
              <List.Item.Meta
                avatar={record.avatar}
                title={
                  <span>
                    {record.title} {record.subTitle}
                  </span>
                }
                description={
                  <p className="export-common-card__desc">{record.content}</p>
                }
              />
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};
