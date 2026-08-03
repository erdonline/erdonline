package com.erdonline.erd.model;

import lombok.Data;

import java.io.Serializable;

/**
 * 表触发器（与前端 projectJSON {@code entity.triggers} 对齐：name / timing / event / ddl）。
 */
@Data
public class Trigger implements Serializable {
    private String name;
    /** BEFORE / AFTER（部分库还有 INSTEAD OF） */
    private String timing;
    /** INSERT / UPDATE / DELETE */
    private String event;
    /** ROW / STATEMENT */
    private String orientation;
    /** 触发器体（不含 CREATE 头；MySQL = ACTION_STATEMENT） */
    private String statement;
    /** 可重建的 CREATE TRIGGER DDL（保真主载荷） */
    private String ddl;

    public Trigger() {
    }

    public Trigger(String name, String timing, String event) {
        this.name = name;
        this.timing = timing;
        this.event = event;
    }
}
