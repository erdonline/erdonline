package com.erdonline.erd.service;

import com.alibaba.fastjson.JSONObject;
import com.erdonline.common.core.api.R;
import com.erdonline.common.data.mybatis.bean.JsonBase;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

/**
 * <p>
 * 模块 服务类
 * </p>
 *
 * @author 零代科技
 * @version 1.0
 * @date 2023-03-04
 * @describtion
 * @since 1.0
 */
@Transactional(rollbackFor = Exception.class)
public interface JsonBaseService extends MartinService<JsonBase> {


    R getJsonByName(String id, String name, String jsonPath);

    R getPathByName(String id, String name, String jsonPath);

    R updateJson(String id, String name, String path, JSONObject json, String jsonPath, String jsonSchema);

    R updateValue(String id, JsonBase jsonBase, String jsonPath);

    R removeJson(String id, String name, String path, String jsonPath);

    R insertJson(String id, JSONObject json, String uniqPath, String jsonSchema);
}
