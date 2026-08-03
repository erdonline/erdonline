import * as cache from '@/utils/cache';
import { CONSTANT } from '@/utils/constant';
import { history } from '@@/core/history';

export function openProjectInDesigner(projectId: string | number) {
  cache.setItem(CONSTANT.PROJECT_ID, projectId);
  history.push({ pathname: `/design/table/model?projectId=${projectId}` });
}

export type ProjectListOpenLinkProps = {
  projectId: string | number;
  projectName: string;
};

/** 列表行主链：真链接 + stretched ::after 消死区；Enter/键盘开项目 */
export default function ProjectListOpenLink({
  projectId,
  projectName,
}: ProjectListOpenLinkProps) {
  return (
    <a
      href={`/design/table/model?projectId=${projectId}`}
      className="project-list-page__open-link"
      data-testid="project-list-open-link"
      onClick={(e) => {
        e.preventDefault();
        openProjectInDesigner(projectId);
      }}
    >
      {projectName}
    </a>
  );
}
