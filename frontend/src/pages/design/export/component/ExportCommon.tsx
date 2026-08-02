import type {ReactNode} from 'react';
import {List, Tag} from 'antd';
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import {FileDisplay, FileLock, FileWord, HtmlFive} from "@icon-park/react";
import './export-common.scss';


type ExportItem = {
  key: string;
  title: string;
  subTitle: ReactNode;
  avatar: ReactNode;
  content: string;
};

export default () => {

  const data: ExportItem[] = [
    {
      key: 'JSON',
      title: '导出ERD',
      subTitle: <Tag color="blue">ERD</Tag>,
      avatar: <FileLock theme="filled" size="16" fill="currentColor" strokeWidth={2}/>,
      content: '导出一个ERD格式的文件，文本内容已加密，可再次导入ERD系统',
    }, {
      key: 'Html',
      title: '导出HTML',
      subTitle: <Tag color="blue">HTML</Tag>,
      avatar: <HtmlFive theme="filled" size="16" fill="currentColor" strokeWidth={2}/>,
      content: '导出一个可以在任意浏览器中打开的HTML文件',
    }, {
      key: 'Word',
      title: '导出Word',
      subTitle: <Tag color="blue">Word</Tag>,
      avatar: <FileWord theme="filled" size="16" fill="currentColor" strokeWidth={2}/>,
      content: '导出一个漂亮的word文件，包含表元数据和关系图',
    }, {
      key: 'Markdown',
      title: '导出Markdown',
      subTitle: <Tag color="blue">Markdown</Tag>,
      avatar: <FileDisplay theme="filled" size="16" fill="currentColor" strokeWidth={2}/>,
      content: '导出一个Markdown文件，可以在任意Markdown编辑器中预览',
    },
  ];

  const {projectDispatch} = useProjectStore(state => ({
    projectDispatch: state.dispatch,
  }), shallow);

  return (
    <div className="export-common-page" data-testid="export-common-page">
      <h2 className="export-common-page__title">导出文件</h2>
      <p className="export-common-page__hint">单击下方区块即可导出</p>
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
