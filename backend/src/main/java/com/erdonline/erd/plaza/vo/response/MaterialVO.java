package com.erdonline.erd.plaza.vo.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

@Data
public class MaterialVO {
    private Long id;
    private String title;
    private String description;
    private String coverImage;
    private Integer categoryId;
    private Integer subCategoryId;
    private Integer platformId;
    private Integer industryId;
    private String content;
    private Integer views;
    private Integer downloads;
    private Integer likes;
    private Integer uses;
    private Integer status;
    private Boolean isFree;
    private BigDecimal price;
    private Long creatorId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isLiked;
    private Boolean isFavorited;
    private Integer likeCount;
    private Integer favoriteCount;
    private List<UserBriefVO> recentLikeUsers;
}
