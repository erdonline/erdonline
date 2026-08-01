package com.erdonline.erd.service;

import com.erdonline.common.core.api.R;
import com.erdonline.common.data.mybatis.bean.JsonBase;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * JSON 路径读写服务（projectJSON 子树）。
 */
@Transactional(rollbackFor = Exception.class)
public interface JsonBaseService extends MartinService<JsonBase> {

    R getJsonByName(String id, String name, String jsonPath);

    R getPathByName(String id, String name, String jsonPath);

    R updateJson(String id, String name, String path, Map<String, Object> json, String jsonPath, String jsonSchema);

    R updateValue(String id, JsonBase jsonBase, String jsonPath);

    R removeJson(String id, String name, String path, String jsonPath);

    R insertJson(String id, Map<String, Object> json, String uniqPath, String jsonSchema);
}
