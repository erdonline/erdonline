---
title: {{title}}
slug: {{slug}}
status: draft
platforms: [juejin]
cta: demo
utm_campaign: launch
created: {{date}}
---

<!-- 写作纪律（发布前删除本注释块）：
  1. CTA 永远只有一个主链接 = demo（构建时自动注入文末，正文别手写裸链接）
  2. 正文用 {{CTA}} 占位符标记主 CTA 插入点；{{REPO}} {{DOCS}} 同理
  3. 截图存 content/articles/assets/<slug>/，相对路径引用，平台上传时替换
  4. 写完把 status 改为 ready，再跑 build-package 出平台包
-->

## 开场：场景化痛点

> 用一个真实/可共情的事故或日常场景开场，一段话内让读者点头。

## 为什么现有工具管不了这件事

> 对比痛点，不点名贬低，讲机制差异。

## 核心卖点（本文主角）

> 只讲一个主卖点讲透，配 demo 真实截图。

## 30 秒亲手验证（免注册）

三步引导：打开 demo → 做一次最小操作 → 看到结果。

{{CTA}}

## 延伸能力（简笔带过）

每项一句 + 「详见文档」链接，不展开。

## 开源与自部署

MIT、`docker compose up -d` 一键起、projectJSON 开放格式承诺。

## 路线图与参与

公开 roadmap、good first issue；star 请求放最末（{{REPO}}）。
