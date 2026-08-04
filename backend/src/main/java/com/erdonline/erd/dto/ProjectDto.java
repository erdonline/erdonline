package com.erdonline.erd.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2022/11/11 13:34
 * @describtion: ProjectDto
 */
@Data
public class ProjectDto {
    private String id;
    private String projectName;
    private String tags;
    private String description;
    private Map projectJSON;
    private Map configJSON;

    /** 客户端持有的上次成功 load/save 的 update_time，用于乐观锁 */
    private LocalDateTime updateTime;

}
