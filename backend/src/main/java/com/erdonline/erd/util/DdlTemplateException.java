package com.erdonline.erd.util;

/**
 * Pebble 模板渲染失败；调用方不得静默吞掉或返回空 DDL。
 */
public class DdlTemplateException extends RuntimeException {

    public DdlTemplateException(String message) {
        super(message);
    }

    public DdlTemplateException(String message, Throwable cause) {
        super(message, cause);
    }
}
