import React, { useEffect, useState } from 'react';
import { Select, message } from 'antd';
import { pageProject, recentProject } from "@/services/project";

const { Option, OptGroup } = Select;

interface ProjectSelectProps {
  value?: string | undefined;
  onChange?: (value: string | undefined) => void;
  style?: React.CSSProperties;
  size?: 'small' | 'middle' | 'large';
}

interface DataModel {
  id: string;
  projectName: string;
  type: string;
}

const ProjectSelect: React.FC<ProjectSelectProps> = ({ value, onChange, style, size = 'middle' }) => {
  const [dataModels, setDataModels] = useState<DataModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDataModels();
  }, []);

  const fetchDataModels = async (searchValue?: string) => {
    setLoading(true);
    try {
      const response = await recentProject({ 
        page: 1, 
        limit: 10,
        projectName: searchValue,
        order: "updateTime",
      });
      if (response && response.data && response.data.records) {
        setDataModels(response.data.records);
      }
    } catch (error) {
      console.error("Error fetching data models:", error);
      message.error("Failed to fetch data models");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    fetchDataModels(value);
  };

  const handleClear = () => {
    if (onChange) {
      onChange(undefined);
    }
    // Remove this line: setDataModels([]);
    // Instead, fetch the initial list again
    fetchDataModels();
  };

  const groupedDataModels = dataModels.reduce((acc, model) => {
    const key = model.type === '1' ? 'personal' : 'team';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(model);
    return acc;
  }, {} as { personal: DataModel[], team: DataModel[] });

  return (
    <Select
      value={value}
      onChange={onChange}
      style={style}
      size={size}
      placeholder="选择数据模型"
      showSearch
      filterOption={false}
      onSearch={handleSearch}
      loading={loading}
      allowClear
      onClear={handleClear}
    >
      <OptGroup label="个人项目">
        {groupedDataModels.personal?.map(model => (
          <Option key={model.id} value={model.id}>{model.projectName}</Option>
        ))}
      </OptGroup>
      <OptGroup label="团队项目">
        {groupedDataModels.team?.map(model => (
          <Option key={model.id} value={model.id}>{model.projectName}</Option>
        ))}
      </OptGroup>
    </Select>
  );
};

export default ProjectSelect;
