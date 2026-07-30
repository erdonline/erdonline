import { ModuleEntity } from '@/store/tab/useTabStore';

export interface CommonTabsProps {
  tabs: ModuleEntity[];
  activeKey: string;
  onTabChange: (key: string) => void;
  onTabEdit: (targetKey: any, action: 'add' | 'remove') => void;
  onTabClose?: (tab: ModuleEntity) => void;
  onCloseLeft?: (tab: ModuleEntity) => void;
  onCloseRight?: (tab: ModuleEntity) => void;
  onCloseAll?: (tab: ModuleEntity) => void;
  renderTabContent: (tab: ModuleEntity) => React.ReactNode;
}