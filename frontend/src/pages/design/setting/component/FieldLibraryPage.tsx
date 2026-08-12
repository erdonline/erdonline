import React from 'react';
import FieldLibraryManager from '@/pages/design/setting/component/FieldLibraryManager';
import { designIntl } from '@/pages/design/locales/intl';
import './setting-common.scss';

const FieldLibraryPage: React.FC = () => (
  <div className="erd-setting-page" data-testid="field-library-settings-page">
    <h2 className="erd-setting-page__title">
      {designIntl('design.setting.fieldLibrary.page.title')}
    </h2>
    <p className="erd-setting-page__hint">
      {designIntl('design.setting.fieldLibrary.page.hint')}
    </p>
    <FieldLibraryManager />
  </div>
);

export default React.memo(FieldLibraryPage);
