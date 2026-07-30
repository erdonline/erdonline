package com.erdonline.common.core.constant;

import cn.hutool.core.util.RandomUtil;
import cn.hutool.core.util.StrUtil;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/3/1 11:17
 * @describtion ProjectConstants, 项目常量
 * @since 1.0
 */
public final class ProjectConstants {
    private ProjectConstants() {
    }

    /**
     * 个人项目
     */
    public static final String PERSON_PROJECT_FLAG = "1";

    /**
     * 团队项目
     */
    public static final String GROUP_PROJECT_FLAG = "2";

    /**
     * 项目默认角色集合
     */
    public static final String[] ROLE_NAME = {"团队所有者:0", "团队管理员:1", "团队普通成员:2"};

    /**
     * 截取项目id前八位
     *
     * @param id
     * @return
     */
    public static String subProjectShortId(String id) {
        return StrUtil.sub(id, 0, 8);
    }

    /**
     * 构建角色唯一编码
     *
     * @param projectId
     * @return
     */
    public static String buildRoleCode(String projectId) {
        return buildRoleCode("", projectId);
    }

    /**
     * 构建角色唯一编码
     *
     * @param roleFlag
     * @param projectId
     * @return
     */
    public static String buildRoleCode(String roleFlag, String projectId) {
        if (StrUtil.isBlank(roleFlag)) {
            roleFlag = RandomUtil.randomString(8);
        }
        if (StrUtil.isBlank(projectId)) {
            projectId = RandomUtil.randomString(8);
        }
        return subProjectShortId(projectId) + "_" + roleFlag;
    }

    public static final String PROJECT_JSON = "projectJSON";

    public static final String PROJECT_ID = "id";

    public static final String PROJECT_MODULE_SCHEMA = "module";
    public static final String PROJECT_MODULE_PATH = "$.modules";
    public static final String PROJECT_MODULE_NAME_PATH = PROJECT_MODULE_PATH + "[*].chnname";
}
