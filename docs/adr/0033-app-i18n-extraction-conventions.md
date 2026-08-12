# ADR-0033：应用主体批量 i18n 工程约定

- 状态：**已接受**（2026-08-12）
- 相关：[ADR-0023](./0023-i18n-foundation.md)（i18n 奠基 · 默认 zh-CN）、[ADR-0034](./0034-locale-path-routing.md)（营销页 `/en/*` 路由）、[ADR-0005](./0005-ui-architecture.md)（antd 唯一）

## 背景

奠基（ADR-0023）已落地：`locale` 插件开启（`default: zh-CN`、`baseNavigator`、`useLocalStorage`）、`getAntdLocale()`、`LocaleSwitcher`。营销页（`pages/landing/*`）与模板广场（`pages/catalog/*`）已完成 key 化，catalog 验证了**模块内 `locales/`** 可行。

剩余存量（`rg` 计数，排除 `locales/`、`*.test.ts`）：**约 2400 处**含中文的字符串字面量（其中 JSDoc/注释虚高，真实用户可见文案约 1500+）。分布：

| 区域 | 含中文字面量 | 性质 |
|---|---|---|
| `utils/` | ~395 | 多为 JSDoc；真文案集中在错误消息 |
| `store/` | ~347 | **非 React 环境**：`message.*` toast、校验错误 |
| `components/` | ~322 | 对话框、左侧树、仪器盘 |
| `pages/design/` | ~283 | 设计器主体（表/索引/触发器/设置） |
| `pages/databaseConfig/` | ~50 | 数据源表单 |

规模决定必须**并行多 agent 抽取**，因此需要先把约定拍死，否则会产生冲突键、重复语料、机翻腔调不一。

## 决策

### 1. 命名空间：模块内 `locales/`

| 规则 | 内容 |
|---|---|
| 位置 | `src/pages/<module>/locales/{zh-CN,en-US}.ts`（umi 自动扫描并 merge 进全局 message） |
| 全局 `src/locales/` | **仅放跨模块公共键**（`common.*`、`validation.*`、`entity.*`、`menu.*`）；禁止继续膨胀为大杂烩 |
| 非页面目录 | `components/` / `store/` / `utils/` 无自己的 `locales/`；其文案归属**调用它的功能域**，写入对应 `pages/<module>/locales/` 或全局公共键 |
| 冲突边界 | 一个 agent 只写自己模块的 `locales/` 两个文件 + 该模块源码；**改全局 `src/locales/` 必须先在切片说明里声明**，避免并行写冲突 |

### 2. 键命名

`<domain>.<area>.<intent>`，全小写点分，camelCase 词元，与 catalog 现状一致：

```
design.table.index.addFailed
common.action.confirm
validation.required
```

| 规则 | 内容 |
|---|---|
| 首段 | 模块名（`design` / `catalog` / `datasource` / `version` / `project`）或 `common` / `validation` |
| 禁止 | 以中文原文或英文整句做键；禁止 `msg1`、`text2` 序号键 |
| 复用门槛 | 同一文案在 **≥3 个模块**出现才上提 `common.*`；1–2 处重复**允许各自定义**，避免过早抽象出语义漂移的公共键 |
| 不复用 | 语义相同但语气/上下文不同（如「删除」按钮 vs「删除项目？」确认标题）**不得**共用键 |

### 3. store / utils 等非 React 环境：`getIntl()`，且必须函数内取

**决策：用 `import { getIntl } from '@umijs/max'`，不做全量错误码上移。**

```ts
// ✅ 函数内调用，每次取当前 locale
function onFail() {
  message.error(getIntl().formatMessage({ id: 'design.module.saveFailed' }));
}

// ❌ module scope：模块加载时求值，语言切换后不更新，且早于 locale 初始化
const intl = getIntl();
const MSG_FAIL = intl.formatMessage({ id: '...' });
```

**module scope 陷阱（红线）**：任何 `getIntl()` / `formatMessage` 结果**不得**赋给模块级常量、不得写进模块级对象字面量（如 `profileSlice` 现有的 `{ missing: '服务器未返回模板内容' }` 这类映射表）。此类表改为**存 key、用时格式化**：

```ts
const DOWNLOAD_ERRORS = { missing: 'design.word.errMissing', notBlob: 'design.word.errNotBlob' } as const;
message.error(getIntl().formatMessage({ id: DOWNLOAD_ERRORS[reason] }));
```

错误码上移（后端 error code → FE 映射，ADR-0023）**仍是后端文案的唯一正解**，但不作为本轮前端本地文案的通道——两者不冲突：后端来的错误走 code 映射表（值是 key），前端本地校验/操作反馈走 `getIntl()`。

### 4. 不该抽的中文（抽了算错）

| 类别 | 处理 |
|---|---|
| 代码注释 / JSDoc | **保留中文**，不抽取；`utils/`、`store/` 的虚高计数主要在此 |
| 与后端数据值比较的字面量 | 不抽（如状态名、字典 code 的中文值判断）。抽了会在 en 下比较失败 |
| `projectJSON` 默认种子 | **不抽**：`datatypeDomains` 名称、默认模块名、「副本」后缀等写入用户数据的值。这是**数据**不是 UI 文案，抽取会造成同一项目在不同 locale 下产生不同持久化内容，破坏 ADR-0022 双层一致性 |
| 测试用例内文案 | 不抽；E2E 定位另遵 `e2e-locators` 反脆弱（新用例用 `data-testid`） |
| 日志 / `console` | 不抽 |

判据一句话：**会被写进数据库或参与逻辑比较的中文一律不抽；只渲染给人看的才抽。**

### 5. ICU 占位符

- 变量用命名占位符：`'{count} 次安装'`、`'模型 {name} 已存在'`；禁止字符串拼接后再塞进 `formatMessage`
- 复数用 ICU `plural`；英文侧必须给 `one/other`，中文侧可只给 `other`
- 富文本（含 `<a>`/`<b>`）用 `intl.formatMessage(desc, { a: (c) => <a…>{c}</a> })`，禁止 `dangerouslySetInnerHTML`

### 6. CI 门禁

新增 `frontend/scripts/check-i18n.mjs`，接进 `frontend-ci.yml`：

| 检查 | 失败条件 |
|---|---|
| 键对齐 | 任一 `locales/zh-CN.ts` 的键集 ≠ 同目录 `en-US.ts`（缺失或多余都红） |
| 键重复 | 同一 key 在多个 `locales/` 文件中定义（并行抽取的主要事故） |
| 占位符一致 | 同一 key 的 zh / en 命名占位符集合不同 |
| 硬编码中文门禁 | **增量制**：记录基线计数，PR 后计数**只减不增**（同 `any` 只减不增）。扫描范围排除注释、`locales/`、测试、白名单（种子/数据值文件在 `i18n-allowlist` 中登记） |

不做「一次性全站零硬编码」硬门禁——存量太大会长期红灯失效。

### 7. 英文术语表

- 位置：**`docs/i18n-glossary.md`**（新建），单一事实源；`website/` 文档站英文译名同此表
- 调性：**工具型产品英文**——祈使句动作（Save / Publish / Install）、句首大写不做 Title Case、不加感叹号、错误文案说明「发生了什么 + 怎么办」
- 强制统一译法（示例）：模型/模块 → Module，实体/表 → Table，关系图 → Diagram，字段 → Field，字段库 → Field Library，版本 → Version，数据源 → Data Source，模板广场 → Template Catalog，工作区 → Workspace
- 新术语进表才允许使用；agent 不得自行发明同义词

## 后果

- 并行抽取可按模块切片下发，冲突面收敛到「全局 `src/locales/` + 术语表」两处，需串行仲裁
- 硬编码计数成为可追踪指标，进 CHANGELOG「验证点」
- 短期内 zh 体验零变化（默认仍 zh-CN，ADR-0023 不变），英文质量取决于术语表执行度
- 代价：`getIntl()` 让 store/utils 与 umi runtime 耦合更深；若未来脱离 umi 需集中替换（调用点单一，可接受）
