package com.erdonline.common.data.mybatis.parser;

import com.erdonline.common.data.mybatis.service.MartinService;
import lombok.Data;

import java.io.Serializable;
import java.lang.reflect.Field;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/9/18
 * @describtion TableLinkage
 * @since 1.0
 */
@Data
public class TableLinkage implements Serializable {
    private static final long serialVersionUID = 7899170616733140705L;

    public TableLinkage(String type, Field field, String bindColumn, Class bindEntity, MartinService martinService) {
        this.type = type;
        this.field = field;
        this.bindColumn = bindColumn;
        this.bindEntity = bindEntity;
        this.martinService = martinService;

    }

    /**
     * 字典表type字段值
     */
    private String type;

    /**
     * 在哪个字段做绑定
     */
    private Field field;

    /**
     * 外键表绑定字段
     */
    private String bindColumn;

    /**
     * 外键表实体类
     */
    private Class bindEntity;

    /**
     * 外键表的service类
     */
    private MartinService martinService;
}
