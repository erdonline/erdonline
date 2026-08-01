package com.erdonline.common.data.mybatis.config;

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
 * MyBatis JSON 列 TypeHandler（Jackson），用于 projectJSON / configJSON 等对象列。
 */
@MappedTypes({Map.class})
@MappedJdbcTypes({JdbcType.BLOB})
@Slf4j
public class ErdJsonTypeHandler extends AbstractJsonTypeHandler<Map<String, Object>> {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<Map<String, Object>>() {
    };

    public ErdJsonTypeHandler(Class<?> type) {
        super(type);
        if (log.isTraceEnabled()) {
            log.trace("ErdJsonTypeHandler({})", type);
        }
        Assert.notNull(type, "Type argument cannot be null", new Object[0]);
    }

    @SneakyThrows
    @Override
    public Map<String, Object> parse(String json) {
        return OBJECT_MAPPER.readValue(json, MAP_TYPE);
    }

    @SneakyThrows
    @Override
    public String toJson(Map<String, Object> obj) {
        return OBJECT_MAPPER.writeValueAsString(obj);
    }
}
