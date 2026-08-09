package com.erdonline.erd.catalog;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.erdonline.erd.service.impl.ProjectShareServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 首次启动时从 classpath catalog-seed 灌入官方模板（幂等）。
 */
@Slf4j
@Component
@RequiredArgsConstructor
class CatalogSeedRunner {

    private static final List<SeedMeta> OFFICIAL = List.of(
            new SeedMeta("blank", "blank", "空白项目", "从零开始建模", "官方,空白", "erdonline", "ERD Online"),
            new SeedMeta("demo-authz", "demo-authz", "功能鉴权示例",
                    "RBAC 用户/角色/权限/会话/审计 + 业务订单", "官方,鉴权,RBAC", "erdonline", "ERD Online"),
            new SeedMeta("blog-basic", "blog-basic", "博客基础模型",
                    "文章/作者/标签及多对多", "官方,博客", "erdonline", "ERD Online"),
            new SeedMeta("ecommerce-basic", "ecommerce-basic", "电商基础模型",
                    "商品/分类/订单/明细", "官方,电商", "erdonline", "ERD Online")
    );

    private final CatalogTemplateMapper templateMapper;
    private final ObjectMapper objectMapper;

    @EventListener(ApplicationReadyEvent.class)
    public void seedIfEmpty() {
        Long count = templateMapper.selectCount(new LambdaQueryWrapper<>());
        if (count != null && count > 0) {
            return;
        }
        log.info("catalog seed: loading official templates from classpath");
        for (SeedMeta meta : OFFICIAL) {
            try {
                String resourcePath = "catalog-seed/" + meta.file + ".projectjson.json";
                Resource resource = new PathMatchingResourcePatternResolver()
                        .getResource("classpath:" + resourcePath);
                if (!resource.exists()) {
                    log.warn("catalog seed missing: {}", resourcePath);
                    continue;
                }
                Map<String, Object> projectJson;
                try (InputStream in = resource.getInputStream()) {
                    projectJson = objectMapper.readValue(in, new TypeReference<>() {});
                }
                Map<String, Object> sanitized = ProjectShareServiceImpl.sanitizeProjectJson(projectJson);
                CatalogTemplate row = new CatalogTemplate()
                        .setId(meta.id)
                        .setSlug(meta.file())
                        .setTitle(meta.title)
                        .setDescription(meta.description)
                        .setTags(meta.tags)
                        .setAuthorHandle(meta.authorHandle)
                        .setAuthorDisplayName(meta.authorDisplayName)
                        .setProjectJson(sanitized)
                        .setConfigJson(defaultConfig())
                        .setStatus("published")
                        .setInstallCount(0)
                        .setRatingSum(0)
                        .setRatingCount(0);
                templateMapper.insert(row);
            } catch (Exception e) {
                log.error("catalog seed failed for {}", meta.id, e);
            }
        }
    }

    private static Map<String, Object> defaultConfig() {
        Map<String, Object> cfg = new HashMap<>(2);
        Map<String, Object> sync = new HashMap<>(2);
        sync.put("upgradeType", "increment");
        cfg.put("synchronous", sync);
        return cfg;
    }

    private record SeedMeta(
            String id, String file, String title, String description,
            String tags, String authorHandle, String authorDisplayName) {
    }
}
