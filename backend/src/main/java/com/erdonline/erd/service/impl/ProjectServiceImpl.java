package com.erdonline.erd.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.erdonline.common.api.dto.ProjectUserDto;
import com.erdonline.common.api.dto.RoleUserDto;
import com.erdonline.common.api.dto.UserDto;
import com.erdonline.common.api.system.RemoteSystemRole;
import com.erdonline.common.api.system.RemoteSystemUser;
import com.erdonline.common.bean.system.Role;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.constant.ProjectConstants;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.dto.ProjectBaseDto;
import com.erdonline.erd.dto.ProjectDto;
import com.erdonline.erd.entity.Project;
import com.erdonline.erd.entity.ProjectRole;
import com.erdonline.erd.mapper.ProjectMapper;
import com.erdonline.erd.service.ProjectRoleService;
import com.erdonline.erd.service.ProjectService;
import com.erdonline.erd.util.Query;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.validation.constraints.NotEmpty;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * <p>
 * PDMan全局配置表 服务实现类
 * </p>
 *
 * @author 狮少
 * @since 2020-10-26
 */
@Slf4j
@Service
public class ProjectServiceImpl extends MartinServiceImpl<ProjectMapper, Project> implements ProjectService {

    @Autowired
    private RemoteSystemRole remoteSystemRole;

    @Autowired
    private RemoteSystemUser remoteSystemUser;

    @Autowired
    private ProjectRoleService projectRoleService;

    @Autowired
    private com.erdonline.common.data.redis.RedisUtil redisUtil;

    /**
     * 删除项目后清除 VIP 项目计数缓存。
     * 计数缓存（martin:vip:right:{userId}）只增不减，删除项目不失效会导致免费版额度被永久占用。
     */
    @Override
    public boolean removeById(java.io.Serializable id) {
        boolean result = super.removeById(id);
        if (result) {
            try {
                String userId = SecurityContextUtil.getAccessUser().getId();
                redisUtil.hashDelete(StrUtil.format("martin:vip:right:{}", userId),
                        "person_project_count", "group_project_count");
            } catch (Exception e) {
                // 缓存清除失败不阻断删除；计数缓存 24h 后自然过期
                log.warn("清除 VIP 项目计数缓存失败: {}", e.getMessage());
            }
        }
        return result;
    }

    @Override
    public R projectService(String projectId) {
        log.info("projectId: {}", projectId);
        Project project = this.getById(projectId);
        return R.ok(project);
    }

    @SneakyThrows
    @Override
    public R initPersonProject(ProjectDto projectDto) {
        R check = check(projectDto);
        if (check.invalid()) {
            return check;
        }
        Project project = new Project();
        String id = IdUtil.fastSimpleUUID();
        project.setId(id);
        project.setType(ProjectConstants.PERSON_PROJECT_FLAG);
        saveProject(projectDto, project);
        //个人项目无需绑定角色，赋值为-1
        this.bindProjectUser(project.getId(), "-1");
        return R.ok(id);
    }

    @Override
    public R roles(String id) {
        log.info("id: {}", id);
        if (StrUtil.isBlank(id)) {
            return R.failed("项目标识为空");
        }
        LambdaQueryWrapper<ProjectRole> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(ProjectRole::getProjectId, id);
        return R.ok(projectRoleService.list(queryWrapper));
    }

    @Override
    public R roleUsers(ProjectUserDto projectUserDto) {
        log.info("projectUserDto: {}", projectUserDto);
        R result = remoteSystemRole.roleUsers(projectUserDto);
        if (result.valid()) {
            return R.ok(result.getData());
        } else {
            return R.failed("获取角色下的用户失败");
        }
    }

    @Override
    public R users(ProjectUserDto projectUserDto) {
        log.info("projectUserDto: {}", projectUserDto);
        R result = remoteSystemUser.users(projectUserDto);
        log.info("result: {}", result);
        if (result.valid()) {
            return R.ok(result.getData());
        } else {
            return R.failed("获取用户失败");
        }
    }

    @Override
    public R saveRoleUsers(RoleUserDto roleUserDto) {
        log.info("roleUserDto: {}", roleUserDto);
        R result = remoteSystemRole.saveRoleUsers(roleUserDto);
        if (result.valid()) {
            this.batchBindProjectUser(roleUserDto.getUserIds(), roleUserDto.getProjectId(), roleUserDto.getRoleId());
            return R.ok(result.getData());
        } else {
            return R.failed("保存用户失败");
        }
    }

    @Override
    public R delRoleUsers(RoleUserDto roleUserDto) {
        log.info("roleUserDto: {}", roleUserDto);
        R result = remoteSystemRole.delRoleUsers(roleUserDto);
        if (result.valid()) {
            this.baseMapper.removeUserFromGroup(roleUserDto);
            return R.ok(result.getData());
        } else {
            return R.failed("删除角色下的用户失败");
        }
    }

    @Override
    public R userRegister(UserDto userDto) {
        log.info("userDto: {}", userDto);
        R result = remoteSystemUser.userRegister(userDto);
        if (result.valid()) {
            return R.ok(result.getData());
        } else {
            return R.failed(result.getMsg());
        }
    }

    @Override
    public R rolePermission(String roleId, String projectId) {
        if (StrUtil.isBlank(roleId)) {
            return R.failed("roleId 为空");
        }
        if (StrUtil.isBlank(projectId)) {
            return R.failed("projectId 为空");
        }
        log.info("roleId: {}", roleId);
        R r = remoteSystemRole.rolePermission(roleId);
        log.info("r: {}", r);
        if (r.valid()) {
            String userId = SecurityContextUtil.getAccessUser().getId();
            ProjectRole projectRole = this.baseMapper.currentUserRole(projectId, userId);
            log.info("projectRole: {}", projectRole);
            if (ObjectUtil.isNull(projectRole)) {
                return R.failed("获取角色权限失败");
            }
            HashMap<String, Object> result = new HashMap<>(2);
            Integer loginRole = Integer.valueOf(projectRole.getRoleCode().split("_")[1]);
            result.put("loginRole", loginRole);
            result.put("checkboxes", r.getData());
            return R.ok(result);
        } else {
            return R.failed("获取角色权限失败");
        }
    }

    @SneakyThrows
    @Override
    public R initGroupProject(ProjectDto projectDto) {
        log.info("projectDto: {}", projectDto);
        R check = check(projectDto);
        if (check.invalid()) {
            return check;
        }
        Project project = new Project();
        String id = IdUtil.fastSimpleUUID();
        project.setId(id);
        project.setType(ProjectConstants.GROUP_PROJECT_FLAG);
        //保存项目
        saveProject(projectDto, project);
        //初始化团队项目角色
        log.info("初始化项目角色");
        String projectId = project.getId();
        List<Role> roles = Arrays.stream(ProjectConstants.ROLE_NAME).map(f -> {
            Role role = new Role();
            String[] parts = StrUtil.splitToArray(f, ':');
            role.setRoleName(parts[0]);
            role.setRoleCode(ProjectConstants.buildRoleCode(parts[1], projectId));
            return role;
        }).collect(Collectors.toList());
        R<List<Role>> register = remoteSystemRole.register(roles);
        if (register.valid()) {
            List<ProjectRole> projectRoles = register.getData().stream().map(f -> {
                ProjectRole projectRole = new ProjectRole();
                projectRole.setProjectId(projectId);
                projectRole.setRoleId(f.getId());
                projectRole.setRoleName(f.getRoleName());
                projectRole.setRoleCode(f.getRoleCode());
                return projectRole;
            }).collect(Collectors.toList());
            projectRoleService.saveBatch(projectRoles);
            ProjectRole adminRole = projectRoles.stream().filter(f -> f.getRoleCode().contains("_0")).findFirst().get();
            log.info("adminRole: {}", adminRole);
            //绑定项目、用户、角色
            this.bindProjectUser(projectId, adminRole.getRoleId());
        } else {
            return R.failed("新建团队项目失败");
        }
        return R.ok(id);

    }


    /**
     * 批量绑定项目与用户的关系，方便查询
     *
     * @param userIds
     * @param projectId
     * @param roleId
     */
    private void batchBindProjectUser(List<String> userIds, String projectId, @NotEmpty(message = "roleId 为空") String roleId) {
        this.baseMapper.batchBindProjectUser(userIds, projectId, roleId);
    }


    /**
     * 绑定项目与用户的关系，方便查询
     *
     * @param projectId
     * @param roleId
     */
    private void bindProjectUser(String projectId, String roleId) {
        String userId = SecurityContextUtil.getAccessUser().getId();
        this.baseMapper.bindProjectUser(userId, projectId, roleId);
    }

    /**
     * 保存项目
     *
     * @param projectDto
     * @param project
     * @return
     * @throws JsonProcessingException
     */
    private boolean saveProject(ProjectDto projectDto, Project project) throws JsonProcessingException {
        configProject(projectDto, project);
        return this.save(project);
    }

    /**
     * 配置Project属性
     *
     * @param projectDto
     * @param project
     * @throws JsonProcessingException
     */
    public void configProject(ProjectDto projectDto, Project project) throws JsonProcessingException {
        // 必须忽略 null：DTO 缺省字段（如创建时的 id）会把实体已赋值的字段覆盖为 null，
        // 曾导致创建项目时显式 setId 被抹掉、接口返回的 id 与库中实际 id 不一致
        BeanUtil.copyProperties(projectDto, project, CopyOptions.create().setIgnoreNullValue(true));
        ensureDefaultProjectJson(project);
    }

    /**
     * 创建/保存时若未带 projectJSON，写入最小骨架（modules=[]），
     * 避免库内 null；完整数据类型域仍可由前端 defaultData 在打开时补齐。
     */
    static void ensureDefaultProjectJson(Project project) {
        if (project == null) {
            return;
        }
        Map<String, Object> json = project.getProjectJSON();
        if (json == null) {
            json = new LinkedHashMap<>();
            project.setProjectJSON(json);
        }
        Object modules = json.get("modules");
        if (!(modules instanceof List)) {
            json.put("modules", new ArrayList<>());
        }
    }

    @SneakyThrows
    @Override
    public R saveProject(ProjectDto projectDto) {
        QueryWrapper<Project> wrapper = new QueryWrapper<>();
        String id = projectDto.getId();
        if (StrUtil.isBlank(id)) {
            return R.failed("id为空");
        }
        wrapper.eq("id", id);
        Project project = new Project();
        this.configProject(projectDto, project);

        boolean update = this.update(project, wrapper);
        return R.ok(update);
    }

    @Override
    public R groupProjectPage(Map params) {
        MartinUser accessUser = SecurityContextUtil.getAccessUser();
        String userId = accessUser.getId();
        params.put("type", ProjectConstants.GROUP_PROJECT_FLAG);
        params.put("userId", userId);
        Page<ProjectBaseDto> result = this.baseMapper.projectPage(new Query<>(params), params);
        return R.ok(result);
    }

    @Override
    public R personProjectPage(Map params) {
        MartinUser accessUser = SecurityContextUtil.getAccessUser();
        String userId = accessUser.getId();
        params.put("type", ProjectConstants.PERSON_PROJECT_FLAG);
        params.put("userId", userId);
        Page<ProjectBaseDto> result = this.baseMapper.projectPage(new Query<>(params), params);
        return R.ok(result);
    }


    @Override
    public R recentProjectPage(Map params) {
        MartinUser accessUser = SecurityContextUtil.getAccessUser();
        String userId = accessUser.getId();
        params.put("userId", userId);
        Page<ProjectBaseDto> result = this.baseMapper.projectPage(new Query<>(params), params);
        return R.ok(result);
    }

    @Override
    public R saveCheckedOperations(Map map) {
        log.info("map: {}", map);
        R result = remoteSystemRole.saveCheckedOperations(map);
        if (result.valid()) {
            return R.ok("保存权限成功");
        } else {
            return R.failed("保存权限失败");
        }
    }

    @Override
    public R statistic() {
        HashMap<String, Object> result = new HashMap<>();
        Integer today = this.baseMapper.queryToday();
        Integer yesterday = this.baseMapper.queryYesterday();
        Integer month = this.baseMapper.queryMonth();
        Integer total = this.baseMapper.queryTotal();
        Integer personTotal = this.baseMapper.queryPersonTotal();
        Integer groupTotal = this.baseMapper.queryGroupTotal();
        result.put("today", today);
        result.put("yesterday", yesterday);
        result.put("month", month);
        result.put("total", total);
        result.put("personTotal", personTotal);
        result.put("groupTotal", groupTotal);
        Integer userCount= 2201;
        R r = remoteSystemUser.totalUser();
        if (r.valid()){
            userCount = (Integer) r.getData();
        }
        result.put("userCount", userCount);
        return R.ok(result);
    }

    @Override
    public R currentRolePermission(String projectId) {
        log.info("projectId: {}", projectId);
        if (StrUtil.isBlank(projectId)){
            return R.failed("projectId 为空");
        }
        String userId = SecurityContextUtil.getAccessUser().getId();
        ProjectRole projectRole = this.baseMapper.currentUserRole(projectId, userId);
        log.info("projectRole: {}", projectRole);
        if (ObjectUtil.isNull(projectRole)) {
            return R.failed("获取角色权限失败");
        }
        R r = remoteSystemRole.roleCheckedPermission(projectRole.getRoleId());
        if (r.valid()) {
            HashMap<String, Object> result = new HashMap<>(2);
            Integer loginRole = Integer.valueOf(projectRole.getRoleCode().split("_")[1]);
            result.put("loginRole", loginRole);
            result.put("permission", r.getData());
            return R.ok(result);
        } else {
            return R.failed("获取当前用户角色权限失败");
        }
    }

    @Override
    public R getApprovalUsers(String projectId) {
        log.info("projectId: {}", projectId);
        if (StrUtil.isBlank(projectId)){
            return R.failed("projectId 为空");
        }
        String userId = SecurityContextUtil.getAccessUser().getId();
        List<ProjectRole> approvalRole = this.baseMapper.approvalUserRole(projectId, userId);
        log.info("projectRole: {}", approvalRole);
        if (CollUtil.isEmpty(approvalRole)) {
            return R.failed("获取角色权限失败");
        }
        List<String> roleIds = approvalRole.stream().map(r -> r.getRoleId()).collect(Collectors.toList());
        R r=remoteSystemUser.getApprovalUser(roleIds);
        if (r.valid()) {
            return R.ok(r.getData());
        }else {
            return R.failed("获取当前当前项目管理员失败");
        }
    }

    @Override
    public R<Integer> personProjectCount() {
        String userId = SecurityContextUtil.getAccessUser().getId();
        Integer integer = this.baseMapper.projectCountByUserIdAndType(userId,ProjectConstants.PERSON_PROJECT_FLAG);
        return R.ok(integer==null?0:integer);
    }

    @Override
    public R<Integer> groupProjectCount() {
        String userId = SecurityContextUtil.getAccessUser().getId();
        Integer integer = this.baseMapper.projectCountByUserIdAndType(userId,ProjectConstants.GROUP_PROJECT_FLAG);
        return R.ok(integer);
    }

    @Override
    public R<Integer> projectVersionCount() {
        String userId = SecurityContextUtil.getAccessUser().getId();
        HashMap<String , Object> params = new HashMap<>();
        params.put("userId", userId);
        Integer integer = this.baseMapper.projectVersionCount(params);
        return R.ok(integer);
    }

    @Override
    public R<Integer> personCount() {
        return remoteSystemUser.totalUser();
    }

    /**
     * 组装查询需要的参数
     *
     * @param params
     * @return
     */
    private LambdaQueryWrapper<Project> prepareProjectLambdaQueryWrapper(Map params) {
        String order = params.get("order").toString();
        LambdaQueryWrapper<Project> lambdaQueryWrapper = new LambdaQueryWrapper();
        if (StrUtil.equals(order, "createTime")) {
            lambdaQueryWrapper.orderByDesc(Project::getCreateTime);
        } else if (StrUtil.equals(order, "updateTime")) {
            lambdaQueryWrapper.orderByDesc(Project::getUpdateTime);
        }

        MartinUser accessUser = SecurityContextUtil.getAccessUser();
        String userId = accessUser.getId();
        log.info("userId:{}", userId);
        String projectName = (String) params.get("projectName");
        lambdaQueryWrapper.eq(Project::getCreator, userId);
        if (StrUtil.isNotBlank(projectName)) {
            lambdaQueryWrapper.like(Project::getProjectName, projectName);
        }
        lambdaQueryWrapper.select(Project::getId, Project::getProjectName, Project::getDescription, Project::getTags, Project::getType);
        return lambdaQueryWrapper;
    }


    private R check(ProjectDto projectDto) {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        Object projectName = projectDto.getProjectName();
        Object description = projectDto.getDescription();
        if (projectName == null) {
            return R.failed("项目名为空");
        }
        if (description == null) {
            return R.failed("项目描述为空");
        }
        wrapper.eq(Project::getProjectName, projectName);
        Project selectOne = this.getOne(wrapper);

        if (selectOne != null) {
            return R.failed("项目「" + projectName + "」已存在");
        }
        return R.ok("");
    }

    @Override
    protected void setEntity() {
        this.clz = Project.class;
    }
}
