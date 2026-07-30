package com.erdonline.common.data.mybatis.config;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.toolkit.Assert;
import com.baomidou.mybatisplus.extension.handlers.AbstractJsonTypeHandler;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedJdbcTypes;
import org.apache.ibatis.type.MappedTypes;

import java.util.Map;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/2/25 21:44
 * @describtion: ErdJsonTypeHandler
 */
@MappedTypes({JSONObject.class})
@MappedJdbcTypes({JdbcType.BLOB})
@Slf4j
public class ErdJsonTypeHandler extends AbstractJsonTypeHandler<JSONObject> {
    private static ObjectMapper objectMapper = new ObjectMapper();


    public ErdJsonTypeHandler(Class<JSONObject> type) {
        super(type);
        if (log.isTraceEnabled()) {
            log.trace("JacksonTypeHandler(" + type + ")");
        }

        Assert.notNull(type, "Type argument cannot be null", new Object[0]);
    }

    @SneakyThrows
    @Override
    public JSONObject parse(String json) {
        return objectMapper.readValue(json, new TypeReference<JSONObject>(){});
    }

    @SneakyThrows
    @Override
    public String toJson(JSONObject obj) {
        return objectMapper.writeValueAsString(obj);
    }

}
