package com.erdonline.common.core.enums;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/5/21 20:42
 * @describtion: IdEnum
 */
public enum IdEnum {
    ERD("ERD"),
    ;

    /**
     * 单号前缀
     */
    private String prefix;

    IdEnum(String prefix) {
        this.prefix = prefix;
    }

    public String getPrefix() {
        return prefix;
    }
}
