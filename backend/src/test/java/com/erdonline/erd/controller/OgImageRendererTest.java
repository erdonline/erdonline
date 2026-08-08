package com.erdonline.erd.controller;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-0025：动态 OG 缩略图为合法 PNG 且尺寸 1200×630；含 CJK 项目名与多表时不抛异常
 * （无 CJK 字体时由 displayable() 过滤，不豆腐、不崩）。
 */
class OgImageRendererTest {

    @Test
    void render_producesValidPngAtExpectedSize() throws Exception {
        byte[] png = OgImageRenderer.render("功能鉴权示例-115266", 8, List.of(
                new OgImageRenderer.Table("sys_user", List.of("id", "username", "email"), 9),
                new OgImageRenderer.Table("sys_role", List.of("id", "code"), 7),
                new OgImageRenderer.Table("biz_order", List.of("id", "user_id", "amount"), 6)));

        assertNotNull(png);
        assertTrue(png.length > 1000, "png should be non-trivial");
        // PNG 魔数
        assertEquals((byte) 0x89, png[0]);
        assertEquals('P', png[1]);
        assertEquals('N', png[2]);
        assertEquals('G', png[3]);

        BufferedImage img = ImageIO.read(new ByteArrayInputStream(png));
        assertNotNull(img, "decodable image");
        assertEquals(OgImageRenderer.WIDTH, img.getWidth());
        assertEquals(OgImageRenderer.HEIGHT, img.getHeight());
    }

    @Test
    void render_emptyTables_stillValid() throws Exception {
        byte[] png = OgImageRenderer.render("ERD Online", 0, List.of());
        BufferedImage img = ImageIO.read(new ByteArrayInputStream(png));
        assertEquals(1200, img.getWidth());
        assertEquals(630, img.getHeight());
    }
}
