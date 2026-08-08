package com.erdonline.erd.controller;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

/**
 * 服务端渲染每项目的社交卡片 PNG（1200×630，ADR-0025）。
 *
 * <p>纯 Java2D，无浏览器依赖。内容取自 projectJSON 的表/字段（ASCII 表名天然可渲染），
 * 品牌与统计文案用 ASCII，避免运行时缺 CJK 字体时出现豆腐块；仅当所选字体能显示时才画中文
 * 项目名。生成的是「像 schema 的品牌卡」，比静态图更「敢晒」，且随项目内容变化。</p>
 */
final class OgImageRenderer {

    static final int WIDTH = 1200;
    static final int HEIGHT = 630;

    private static final Color BG = new Color(0xF6, 0xF7, 0xFF);
    private static final Color BRAND = new Color(0x6C, 0x5C, 0xE7);
    private static final Color INK = new Color(0x1F, 0x29, 0x37);
    private static final Color MUTED = new Color(0x6B, 0x72, 0x80);
    private static final Color CARD = Color.WHITE;
    private static final Color CARD_BORDER = new Color(0xE3, 0xE6, 0xF0);
    private static final Color ROW = new Color(0x53, 0x5B, 0x69);

    /** 一张表：ASCII 表名 + 若干字段名 + 字段总数。 */
    record Table(String name, List<String> fields, int totalFields) {
    }

    private OgImageRenderer() {
    }

    static byte[] render(String projectName, int tableCount, List<Table> tables) {
        BufferedImage img = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            g.setColor(BG);
            g.fillRect(0, 0, WIDTH, HEIGHT);
            // 左侧品牌色条
            g.setColor(BRAND);
            g.fillRect(0, 0, 14, HEIGHT);

            Font brandFont = font(Font.BOLD, 30);
            Font titleFont = font(Font.BOLD, 58);
            Font subFont = font(Font.PLAIN, 30);
            Font cardHeadFont = font(Font.BOLD, 24);
            Font rowFont = font(Font.PLAIN, 20);
            Font footFont = font(Font.PLAIN, 24);

            g.setColor(BRAND);
            g.setFont(brandFont);
            g.drawString("ERD Online", 64, 84);

            // 项目名：仅在字体可显示时绘制（否则退回 ASCII 备用），避免豆腐块
            String title = displayable(projectName, titleFont);
            if (title.isBlank()) {
                title = "Database schema";
            }
            g.setColor(INK);
            g.setFont(titleFont);
            g.drawString(clip(g, title, WIDTH - 128), 64, 168);

            g.setColor(MUTED);
            g.setFont(subFont);
            // 全 ASCII，任何环境不豆腐
            g.drawString(tableCount + (tableCount == 1 ? " table" : " tables")
                    + "  \u00b7  the Git + Figma for database design", 64, 214);

            // 表卡片网格：最多 6 张（3 列 × 2 行）
            int cols = 3;
            int rows = 2;
            int gapX = 28;
            int gapY = 24;
            int gridX = 64;
            int gridY = 250;
            int cardW = (WIDTH - gridX * 2 - gapX * (cols - 1)) / cols;
            int cardH = (HEIGHT - gridY - 90 - gapY * (rows - 1)) / rows;

            int shown = Math.min(tables.size(), cols * rows);
            for (int i = 0; i < shown; i++) {
                int cx = gridX + (i % cols) * (cardW + gapX);
                int cy = gridY + (i / cols) * (cardH + gapY);
                drawTableCard(g, tables.get(i), cx, cy, cardW, cardH, cardHeadFont, rowFont);
            }

            g.setColor(BRAND);
            g.setFont(footFont);
            g.drawString("www.erdonline.com  \u2014  version diffs \u00b7 live collaboration \u00b7 open source",
                    64, HEIGHT - 40);

            ByteArrayOutputStream out = new ByteArrayOutputStream(64 * 1024);
            ImageIO.write(img, "png", out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("render OG image failed", e);
        } finally {
            g.dispose();
        }
    }

    private static void drawTableCard(Graphics2D g, Table t, int x, int y, int w, int h,
                                      Font headFont, Font rowFont) {
        g.setColor(CARD);
        g.fillRoundRect(x, y, w, h, 16, 16);
        g.setColor(CARD_BORDER);
        g.drawRoundRect(x, y, w, h, 16, 16);
        // 头部条
        g.setColor(BRAND);
        g.fillRoundRect(x, y, w, 44, 16, 16);
        g.fillRect(x, y + 22, w, 22);
        g.setColor(Color.WHITE);
        g.setFont(headFont);
        String name = displayable(t.name(), headFont);
        if (name.isBlank()) {
            name = "table";
        }
        g.drawString(clip(g, name, w - 24), x + 14, y + 30);

        g.setFont(rowFont);
        g.setColor(ROW);
        int ry = y + 74;
        int maxRows = Math.max(0, (h - 58) / 26);
        int fieldRows = Math.max(0, maxRows - 1);           // 末行留给「+N more」
        List<String> fields = t.fields();
        int fshown = Math.min(fields.size(), fieldRows);
        for (int i = 0; i < fshown; i++) {
            String f = displayable(fields.get(i), rowFont);
            if (f.isBlank()) {
                f = "col_" + (i + 1);                        // 字段名不可显示时用 ASCII 占位
            }
            g.drawString("\u2022 " + clip(g, f, w - 40), x + 16, ry);
            ry += 26;
        }
        int more = t.totalFields() - fshown;
        if (more > 0) {
            g.setColor(MUTED);
            g.drawString("+" + more + " more", x + 16, ry);
        }
    }

    /** 返回字体能显示的子串（逐字过滤不可显示字符），全不可显示则空串。 */
    private static String displayable(String s, Font f) {
        if (s == null || s.isEmpty()) {
            return "";
        }
        if (f.canDisplayUpTo(s) == -1) {
            return s;
        }
        StringBuilder sb = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == ' ' || f.canDisplay(c)) {
                sb.append(c);
            }
        }
        return sb.toString().trim();
    }

    /** 按像素宽裁剪并加省略号。 */
    private static String clip(Graphics2D g, String s, int maxWidth) {
        if (g.getFontMetrics().stringWidth(s) <= maxWidth) {
            return s;
        }
        String ell = "\u2026";
        int i = s.length();
        while (i > 0 && g.getFontMetrics().stringWidth(s.substring(0, i) + ell) > maxWidth) {
            i--;
        }
        return s.substring(0, Math.max(0, i)) + ell;
    }

    /** 逻辑字体 SansSerif：有 fontconfig + CJK 字体时可显示中文；否则由 displayable() 过滤。 */
    private static Font font(int style, int size) {
        return new Font(Font.SANS_SERIF, style, size);
    }
}
