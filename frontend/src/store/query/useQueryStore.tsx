import create from "zustand";
import {DataNode} from "antd/lib/tree";
import {ADD, DEL, EDIT, GET, POST, TREE} from "@/services/crud";
import produce from "immer";
import _ from "lodash";
import useTabStore, {TabGroup} from "@/store/tab/useTabStore";
import {message} from "antd";

// 类型：对象、函数两者都适用，但是 type 可以用于基础类型、联合类型、元祖。
// 同名合并：interface 支持，type 不支持。
// 计算属性：type 支持, interface 不支持。
// 总的来说，公共的用 interface 实现，不能用 interface 实现的再用 type 实现。主要是一个项目最好保持一致。

type actions = {
  queryHistory(params: any): Promise<COMMON.R>;
  explain(params: any): Promise<COMMON.R>;
  exec(selectValue: any): Promise<COMMON.R>;
  updateSqlInfo(model: any): void;
  renameQuery(model: any): void;
  removeQuery(model: any): void;
  addQuery(model: any): void;
  fetchQueryInfo: (id: string | number) => Promise<COMMON.R>;
  onSelectNode(selectedKeys: import("rc-tree/lib/interface").Key[], info: { event: "select"; selected: boolean; node: import("rc-tree/lib/interface").EventDataNode<DataNode>; selectedNodes: DataNode[]; nativeEvent: MouseEvent; }): void;
  fetchTreeData: (params: any) => void,
  setQuerySearchKey: (searchKey: string) => void

}

export type QueryState = {
  querySearchKey: string;
  treeData: DataNode[];
  dispatch: actions
};


const useQueryStore = create<QueryState>(
  (set, get) => ({
    querySearchKey: '',
    treeData: [],
    dispatch: {
      queryHistory: (model) => {
        return POST('/ncnb/queryHistory', model);
      },
      explain: (model) => {
        return POST('/ncnb/queryInfo/explain', model);
      },
      exec: (model) => {
        return POST('/ncnb/queryInfo/exec', model);
      },
      updateSqlInfo: (model) => {
        EDIT('/ncnb/queryInfo/' + model.id, model).then(r => {
          if (r?.code === 200) {
            message.success('保存成功');
          } else {
            message.error(r?.msg || '保存失败');
          }
        }).catch(() => {
          message.error('保存出错');
        });
      },
      renameQuery: async (model) => {
        try {
          const response = await EDIT('/ncnb/queryInfo/' + model.id, model);
          if (response?.code === 200) {
            message.success('查询重命名成功');
            await get().dispatch.fetchTreeData({
              projectId: model.projectId
            });
            return response;
          } else {
            message.error('查询重命名失败');
          }
        } catch (error) {
          message.error('查询重命名出错');
          throw error;
        }
      },
      removeQuery: async (model) => {
        try {
          const response = await DEL('/ncnb/queryInfo/' + model.id, {});
          if (response?.code === 200) {
            message.success('查询删除成功');
            await get().dispatch.fetchTreeData({
              projectId: model.projectId
            });
            return response;
          } else {
            message.error('查询删除失败');
          }
        } catch (error) {
          message.error('查询删除出错');
          throw error;
        }
      },
      addQuery: async (model) => {
        try {
          const response = await ADD('/ncnb/queryInfo', model);
          if (response?.code === 200) {
            message.success(model.isLeaf ? '查询添加成功' : '文件夹添加成功');
            await get().dispatch.fetchTreeData({ projectId: model.projectId });
            return response;
          } else {
            message.error(model.isLeaf ? '查询添加失败' : '文件夹添加失败');
          }
        } catch (error) {
          message.error(model.isLeaf ? '查询添加出错' : '文件夹添加出错');
          throw error;
        }
      },
      fetchQueryInfo: (id) => {
        return GET('/ncnb/queryInfo/' + id, {});
      },
      fetchTreeData: async (params) => {
        const title = get().querySearchKey;
        if (title) {
          params.title = title;
        }
        try {
          const response = await TREE('/ncnb/queryInfo/tree', params);
          if (response?.code === 200) {
            set({ treeData: response?.data || [] });
          } else {
            throw new Error(response?.msg || 'Failed to fetch tree data');
          }
        } catch (error) {
          console.error("Error in fetchTreeData:", error);
          message.error('Failed to fetch tree data');
        }
      },
      setQuerySearchKey: (querySearchKey: string) => set(produce(state => {
        state.querySearchKey = querySearchKey;
      })),
      onSelectNode: (selectedKeys, info) => set(produce(state => {
        const tabDispatch = useTabStore.getState().dispatch;
        if (info.node.isLeaf) {
          tabDispatch.addTab({group: TabGroup.QUERY, module: info.node.key + '', entity: info.node.title + ''});
        }
      })),
    }

  })
);

export default useQueryStore;
