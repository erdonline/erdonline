---
title: 数据库表结构改崩了谁背锅？给建模加上 Git 式版本 diff
slug: git-style-version-diff
status: draft
platforms: [juejin, wechat, zhihu]
cta: demo
utm_campaign: launch
created: 2026-08-09
---

> 选题 #3（增长方案主打篇，见 docs/growth.md）。大纲已就绪，正文待写；
> 骨架按「场景事故 → 机制对比 → 卖点讲透 → 30s 验证 → 延伸 → 自部署 → 参与」推进。

## 开场：一次真实的「谁动了 user 表」事故

（待写：字段类型被改、没人认账、没有历史；一段话内让读者点头）

## 为什么现有的工具管不了这件事

（待写：drawio 没有历史；Navicat 是单机手动导出；dbdiagram 只有「当前态」——讲机制差异，不点名贬低）

## 把 Git 心智搬进建模：版本快照是什么

（待写：每次变动自动成版；配 demo 真实截图：版本列表 + tag）

## diff 可视化：两个版本之间到底改了什么

（待写：截图 diff 面板；讲「空改动不算版本」的诚实设计，呼应北极星定义）

## 30 秒亲手验证（免注册）

三步截图引导：打开 demo → 改一张表 → 保存版本看 diff。

{{CTA}}

## 不止 diff：协作、审批流与回滚

（待写：各一句 + 「详见文档」链接，不展开）

## 开源与自部署

MIT、`docker compose up -d` 一键起；projectJSON 开放格式承诺「仅加法不破坏」。

## 路线图与参与

公开 roadmap 与 good first issue（{{DOCS}}）；觉得有用的话欢迎 star（{{REPO}}）。
