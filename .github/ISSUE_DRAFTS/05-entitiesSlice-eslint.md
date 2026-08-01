# [good first] entitiesSlice 定点清 eslint warn（import type）

> **已合入**（勿再投放）：`import type` + 删除未用 validateTable/时间戳；warn 19→8。  
> 剩余多为 `no-param-reassign` / `no-loop-func`，可另开 Issue。

## 验证命令

```bash
cd frontend && yarn eslint src/store/project/entitiesSlice.tsx --max-warnings 999
# 期望：problems ≤ 8
```
