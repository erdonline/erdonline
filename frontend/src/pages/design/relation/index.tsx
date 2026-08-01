/**
 * 关系图入口（ADR-0001 R3）：统一走 ReactFlow。
 * 导出图片已改 DOM+html2canvas（utils/relation2file），不再依赖 G6。
 */
export { default } from './ReactFlowRelation';
export type { ReactFlowRelationProps as RelationProps } from './ReactFlowRelation';
