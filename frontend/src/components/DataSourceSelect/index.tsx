import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Select, message } from 'antd';
import { getIntl } from '@umijs/max';
import { debounce as _debounce, groupBy as _groupBy } from 'lodash-es';
import { fetchDatabaseConfigs } from '@/utils/databaseUtils';

const { Option, OptGroup } = Select;

export interface DataSourceSelectProps {
  value?: { value: string; label: string };
  onChange?: (value: any) => void;
  style?: React.CSSProperties;
  onDbChange?: (db: any) => void;
  size?: 'large' | 'middle' | 'small';
}

export const DataSourceSelect: React.FC<DataSourceSelectProps> = ({
  value,
  onChange,
  style,
  onDbChange,
  size
}) => {
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const fetchDataSources = useCallback(async (search: string = '') => {
    setLoading(true);
    try {
      const databases = await fetchDatabaseConfigs(search);
      setDataSources(databases);
      if (databases.length > 0 && !value) {
        // 默认选中第一个数据源
        onChange?.({ value: databases[0].key, label: databases[0].name });
        onDbChange?.(databases[0]);
      }
    } catch (error) {
      console.error('Error fetching data sources:', error);
      message.error(getIntl().formatMessage({ id: 'dataSourceSelect.fetchFailed' }));
    } finally {
      setLoading(false);
    }
  }, [onChange, onDbChange, value]);

  const debouncedFetchDataSources = useMemo(
    () => _debounce((search: string) => fetchDataSources(search), 300),
    [fetchDataSources]
  );

  useEffect(() => {
    debouncedFetchDataSources(searchValue);
  }, [debouncedFetchDataSources, searchValue]);

  const groupedDataSources = useMemo(() => {
    return _groupBy(dataSources, 'select');
  }, [dataSources]);

  const handleSearch = (search: string) => {
    setSearchValue(search);
  };

  const handleClear = () => {
    setSearchValue('');
    onChange?.(undefined);
  };

  const handleChange = (selectedValue: { value?: string; label?: string } | undefined) => {
    onChange?.(selectedValue);
    if (selectedValue?.value) {
      const selectedDb = dataSources.find(
        (db: { key?: string; name?: string }) =>
          db.key === selectedValue.value || db.name === selectedValue.value,
      );
      if (selectedDb) {
        onDbChange?.(selectedDb);
      } else {
        message.error(getIntl().formatMessage({ id: 'dataSourceSelect.notFound' }));
      }
    }
  };

  return (
    <Select
      labelInValue
      value={value}
      style={style || { width: 200 }}
      onChange={handleChange}
      placeholder={getIntl().formatMessage({ id: 'dataSourceSelect.placeholder' })}
      showSearch
      filterOption={false}
      onSearch={handleSearch}
      onClear={handleClear}
      notFoundContent={null}
      allowClear
      loading={loading}
      size={size}
      data-testid="datasource-select"
      aria-label={getIntl().formatMessage({ id: 'dataSourceSelect.aria' })}
    >
      {Object.entries(groupedDataSources).map(([group, databases]) => (
        <OptGroup key={group} label={group}>
          {databases.map((db: { key: string; name: string }) => (
            <Option key={db.key} value={db.key}>{db.name}</Option>
          ))}
        </OptGroup>
      ))}
    </Select>
  );
};
