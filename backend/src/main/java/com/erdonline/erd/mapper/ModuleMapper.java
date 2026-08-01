package com.erdonline.erd.mapper;

import com.erdonline.erd.entity.Module;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 模块 Mapper。
 */
public interface ModuleMapper extends BaseMapper<Module> {

    Map<String, Object> getModuleById(@Param("id") String id, @Param("name") String name);

    List<String> getModulePathByName(@Param("id") String id, @Param("name") String name);

    Map<String, Object> getModuleByPath(@Param("id") String id, @Param("name") String name, @Param("path") String path);
}
