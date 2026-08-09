import React from 'react';
import FieldLibraryManager from '@/pages/design/setting/component/FieldLibraryManager';
import './setting-common.scss';

/** 设置页：字段库完整管理（ADR-0032） */
const FieldLibraryPage: React.FC = () => (
  <div className="erd-setting-page" data-testid="field-library-settings-page">
    <h2 className="erd-setting-page__title">字段库</h2>
    <p className="erd-setting-page__hint">
      管理平台 / 团队 / 个人字段片段；应用到表时为 copy-on-apply，不会 live 级联。
    </p>
    <FieldLibraryManager />
  </div>
);

export default React.memo(FieldLibraryPage);
