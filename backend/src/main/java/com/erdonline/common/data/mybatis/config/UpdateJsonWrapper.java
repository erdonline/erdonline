package com.erdonline.common.data.mybatis.config;

import com.baomidou.mybatisplus.core.conditions.AbstractWrapper;
import com.baomidou.mybatisplus.core.conditions.SharedString;
import com.baomidou.mybatisplus.core.conditions.segments.MergeSegments;
import com.baomidou.mybatisplus.core.conditions.update.Update;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.core.toolkit.CollectionUtils;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/2/26 12:58
 * @describtion: UpdateJsonWrapper
 */
@Slf4j
public class UpdateJsonWrapper<T> extends AbstractWrapper<T, String, UpdateJsonWrapper<T>> implements Update<UpdateJsonWrapper<T>, String> {
    private static ObjectMapper objectMapper = new ObjectMapper();

    private final List<String> sqlSet;

    public UpdateJsonWrapper() {
        super.initNeed();
        this.sqlSet = new ArrayList();
    }

    public UpdateJsonWrapper(T entity) {
        super.setEntity(entity);
        super.initNeed();
        this.sqlSet = new ArrayList();
    }

    private UpdateJsonWrapper(T entity, List<String> sqlSet, AtomicInteger paramNameSeq, Map<String, Object> paramNameValuePairs, MergeSegments mergeSegments, SharedString lastSql, SharedString sqlComment) {
        super.setEntity(entity);
        this.sqlSet = sqlSet;
        this.paramNameSeq = paramNameSeq;
        this.paramNameValuePairs = paramNameValuePairs;
        this.expression = mergeSegments;
        this.lastSql = lastSql;
        this.sqlComment = sqlComment;
    }

    @Override
    protected UpdateJsonWrapper<T> instance() {
        return new UpdateJsonWrapper(this, this.sqlSet, this.paramNameSeq, this.paramNameValuePairs, new MergeSegments(), SharedString.emptyString(), SharedString.emptyString());
    }

    @Override
    public UpdateJsonWrapper<T> set(boolean condition, String column, Object val) {
        if (condition) {
            this.sqlSet.add(String.format("%s=%s", column, this.formatParam("{0}", new Object[]{val})));
        }

        return (UpdateJsonWrapper) this.typedThis;
    }

    @Override
    public UpdateJsonWrapper<T> set(boolean condition, String column, Object val, String mapping) {
        return (UpdateJsonWrapper)this.maybeDo(condition, () -> {
            String sql = this.formatParam(mapping, val);
            this.sqlSet.add(column + "=" + sql);
        });
    }

    @Override
    public UpdateJsonWrapper<T> setSql(boolean condition, String setSql, Object... params) {
        return (UpdateJsonWrapper)this.maybeDo(condition && StringUtils.isNotBlank(setSql), () -> {
            this.sqlSet.add(this.formatSqlMaybeWithParam(setSql, params));
        });
    }

    @Override
    public UpdateJsonWrapper<T> setIncrBy(boolean condition, String column, Number val) {
        return null;
    }

    @Override
    public UpdateJsonWrapper<T> setDecrBy(boolean condition, String column, Number val) {
        return null;
    }

    @SneakyThrows
    public UpdateJsonWrapper<T> setJson(String column, String path, Object val) {
        this.sqlSet.add(String.format("%s=json_replace(%s,'%s',CAST(%s AS JSON))", column,column,path, this.formatParam("{0}", objectMapper.writeValueAsString(val))));
        return (UpdateJsonWrapper) this.typedThis;
    }

    @SneakyThrows
    public UpdateJsonWrapper<T> set(String column, String path, Object val) {
        this.sqlSet.add(String.format("%s=json_replace(%s,'%s',%s)", column,column,path, this.formatParam("{0}", new Object[]{val})));
        return (UpdateJsonWrapper) this.typedThis;
    }


    @Override
    public String  getSqlSet() {
        return CollectionUtils.isEmpty(this.sqlSet) ? null : String.join(",", this.sqlSet);
    }
}
