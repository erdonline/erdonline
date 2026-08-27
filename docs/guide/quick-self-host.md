# 五分钟自托管

想把数据和账号留在自己机器 / 内网？用 Docker Compose 拉起一套可用实例，再按「存版」做一次冒烟。

还没决定要不要自托管？可先 **[打开在线 Demo](https://www.erdonline.com/demo)**（免登录）或看 **[工具对照](https://www.erdonline.com/compare)**。

> **目标**：本机或内网跑通 ERD Online。  
> **前置**：已装 Docker 与 Compose；建议 2C4G 以上。完整选项见 [部署指南](../deployment.md)。

## 步骤

```bash
git clone https://github.com/erdonline/erdonline.git
cd erdonline
docker compose pull
docker compose up -d
```

1. 等待就绪：`docker compose ps`；异常时 `docker compose logs -f backend`。  
2. 浏览器打开前端映射端口（默认 **8000**，以你的 compose 为准）。  
3. **注册 / 登录** → **新建项目** → 按 [保存版本并查看 diff](./save-version-and-diff.md) 冒烟一次。

## 成功时你会看到什么

- `docker compose ps` 中 mysql / redis / backend / frontend 为 running（或等价健康态）。  
- 浏览器能打开登录或工作台，而不是网关 502。  
- 新建项目后能进设计器并 **保存版本**。

## 常见问题 / 排障

| 现象 | 可尝试 |
|---|---|
| 端口被占用 | 改 compose 端口映射，或停掉占用 8000/9502 的进程 |
| 后端反复重启 | 看 backend 日志：多为等 MySQL 未就绪或口令/库名不匹配 |
| 拉镜像失败 | 检查网络访问 GHCR；或按部署文档改为本地 build |
| 生产仍用默认口令 | 必须改；逆向请用只读库账号 |
| 需要 Agent / MCP | MCP **不在**默认 compose 内。自托管把 `ERD_API_URL` 设为 `http://127.0.0.1:9502`，走 [API 与 MCP](./api-and-mcp.md)。选 prompt `suggest-erd-version`。`create_version` 的 API 200 **不是**人批准。官方 Demo **不能**当 PAT |

## 下一步

- 更细的拓扑与云托管：[部署指南](../deployment.md)  
- 让 Cursor 读本机图再提交一版：[MCP 指南](./api-and-mcp.md) — prompt `suggest-erd-version`；`ERD_API_URL=http://127.0.0.1:9502`  
- 迁入模型：[导入 DBML](./import-dbml.md) · [数据源逆向](./reverse-engineer.md)  
- [从这里开始](./intro.md)
