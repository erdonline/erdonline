package com.erdonline.erd.plaza.vo.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserBriefVO {
    private Long id;
    private String name;
    private String avatar;
    private LocalDateTime likedAt;
}
