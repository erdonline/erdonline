package com.erdonline.erd.catalog;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CatalogCommentView {
    private String id;
    private String userId;
    private String username;
    private String body;
    private LocalDateTime createTime;
    private boolean own;
}
