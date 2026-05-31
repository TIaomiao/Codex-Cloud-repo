# AI / Codex / Coding Agents 早报

一个不需要后端的静态早报项目，用纯 HTML、CSS 和 JavaScript 展示最近 7 天 AI / Codex / Coding Agents 相关动态。首页默认读取 `data/sample.json`，并支持分类筛选与关键词搜索。

> 注意：当前仓库自带的数据都明确标注为 Sample，仅用于演示页面结构与更新流程，不代表真实新闻。

## 项目结构

```text
.
├── README.md
├── index.html
├── style.css
├── app.js
├── package.json
├── data/
│   ├── sample.json
│   └── YYYY-MM-DD.json
├── docs/
│   ├── notion-database-schema.md
│   └── github-actions-notion-sync.md
├── prompts/
│   └── daily-brief.md
├── reports/
    ├── .gitkeep
    └── YYYY-MM-DD.md
└── scripts/
    ├── sync-to-notion.js
    └── mock-notion-mapping.test.js
```

## 本地预览

由于浏览器直接打开 `index.html` 时可能限制 `fetch` 读取本地 JSON，建议启动一个静态文件服务器：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

如果你使用 VS Code，也可以通过 Live Server 等静态服务器插件预览。

## 数据读取方式

首页的 `app.js` 默认从 `data/sample.json` 读取数据。这个文件中的内容是 Sample 示例数据，所有示例来源链接都会在页面中渲染为可点击链接，并通过新标签页打开。

如果后续要切换到生产数据，可以选择以下任一方式：

1. 继续把每天生成的条目合并进 `data/sample.json`，并在发布前移除 Sample 标记。
2. 新建一个生产数据文件，例如 `data/latest.json`，然后把 `app.js` 中的 `DATA_URL` 改成对应路径。
3. 保留每天的独立文件 `data/YYYY-MM-DD.json`，再增加一个索引文件或构建脚本聚合最近 7 天内容。

## 如何使用 Prompt 生成每天的 Markdown / JSON 早报

`prompts/daily-brief.md` 保存了 **AIHOT / AI News Radar 每日早报 Prompt**。它要求优先使用官方来源、一手来源和可验证链接，并一次性输出两个部分：Markdown 早报与 JSON 数据。

推荐流程：

1. 打开 `prompts/daily-brief.md`。
2. 将 Prompt 中的 `{{date}}` 替换为目标日期，例如 `2026-05-31`。
3. 让模型按照 Prompt 检索并整理过去 24-48 小时内的可靠动态。
4. 将输出的 Markdown 部分保存为：

   ```text
   reports/YYYY-MM-DD.md
   ```

5. 将输出的 JSON 部分保存为：

   ```text
   data/YYYY-MM-DD.json
   ```

6. 如果要让首页展示这些内容，可以把 `data/YYYY-MM-DD.json` 中的 `briefs` 条目合并到站点正在读取的数据文件中。
7. 发布前必须确认：
   - 每条来源链接都可以打开。
   - 每条内容都来自官方、一手或可信来源。
   - 没有把 Sample、预测或传闻写成真实新闻。
   - JSON 可以被 `JSON.parse` 解析。

## 示例文件说明

- `reports/YYYY-MM-DD.md`：Markdown 早报模板示例，内容明确标注为 Sample。
- `data/YYYY-MM-DD.json`：每日 JSON 模板示例，根字段和条目字段都设置了 `isSample: true`。
- `data/sample.json`：首页默认读取的演示数据，所有标题和来源都明确标注为 Sample。

## 每条 JSON 早报字段

每条早报建议包含以下字段：

- `id`：稳定 ID，用于 Notion 去重，建议格式为 `YYYY-MM-DD-source-topic-slug`
- `date`：日期，格式为 `YYYY-MM-DD`
- `title`：标题；示例数据必须包含 `[Sample]` 或同等标记
- `sourceName`：来源名称
- `sourceUrl`：来源链接
- `category`：分类，必须是首页支持的 6 个分类之一
- `whatHappened`：发生了什么
- `whyItMatters`：为什么重要
- `howToUse`：我可以怎么用
- `isSample`：是否为示例数据

为了同步到 Notion，`data/sample.json` 也保留了对应的 snake_case 字段：

- `source_name`
- `source_url`
- `source_type`
- `importance`
- `why_it_matters`
- `how_i_can_use_it`
- `actionable_advice`
- `x_longform_topic`
- `status`
- `worth_practicing`
- `notes`

首页会以数据中的最新日期为基准，只展示最近 7 天内容；较旧内容可保留在 JSON 中作为归档数据。

## 支持的分类

- OpenAI
- Codex
- Coding Agents
- MCP
- AI Tools
- Content Creation

Notion 数据库额外支持 `Research`、`Workflow`、`Other`，用于记录研究、流程改进和无法归入主分类的信息。

## 同步到 Notion

这个项目支持把每天早报同步到 Notion 数据库。推荐结构是：

```text
每条重要更新 = Notion 数据库中的一条记录
```

这样在 iPad 和手机上阅读时，可以逐条筛选、收藏、备注和复盘，而不是每次打开一整篇长日报。

### 创建 Notion 数据库

在 Notion 新建一个数据库，建议命名为：

```text
AI / Codex / Coding Agents 早报
```

字段设计见：

```text
docs/notion-database-schema.md
```

字段名需要和文档完全一致，例如 `标题`、`日期`、`分类`、`原始 JSON ID`。

### 创建 Notion Integration

1. 打开 Notion 的 integrations 页面。
2. 新建 internal integration。
3. 复制 integration secret。
4. 只把 secret 放进环境变量，不要写入代码或提交到 GitHub。

占位符示例：

```text
NOTION_TOKEN=secret_xxx
```

### 把数据库分享给 Integration

进入 Notion 数据库页面，点击右上角 Share / Connections，把刚创建的 Integration 添加进来。

如果没有这一步，脚本即使拿到 token，也可能遇到 404 或权限错误。

### 获取 NOTION_DATABASE_ID

打开数据库页面，复制页面链接。链接中通常包含一段数据库 ID。

占位符示例：

```text
NOTION_DATABASE_ID=your_database_id
```

普通单数据源数据库只需要 `NOTION_TOKEN` 和 `NOTION_DATABASE_ID`。如果未来同一个 database 下有多个 data sources，脚本会提示你额外设置：

```text
NOTION_DATA_SOURCE_ID=your_data_source_id
```

### 本地设置环境变量

PowerShell 当前窗口临时设置：

```powershell
$env:NOTION_TOKEN="secret_xxx"
$env:NOTION_DATABASE_ID="your_database_id"
```

不要把真实 token 写进仓库。也不要把 `.env` 提交到 GitHub。

### 安装依赖

```bash
npm install
```

### 运行 dry-run

dry-run 只打印将要写入的 Notion properties，不调用 Notion API，也不需要 token：

```bash
npm run notion:dry-run
```

也可以指定 JSON 文件：

```bash
node scripts/sync-to-notion.js data/YYYY-MM-DD.json --dry-run
```

### 真实同步

确认 dry-run 输出正确后，再运行：

```bash
npm run notion:sync
```

真实同步会：

1. 读取 `NOTION_TOKEN` 和 `NOTION_DATABASE_ID`。
2. 自动解析 Notion database 对应的 data source。
3. 读取 JSON 文件。
4. 按 `原始 JSON ID` 查询 Notion 是否已存在。
5. 已存在则跳过，不重复创建。
6. 不存在则创建一条 Notion 记录。

### 常见错误排查

- `Missing Notion configuration`：真实同步前没有设置 `NOTION_TOKEN` 或 `NOTION_DATABASE_ID`。
- `object_not_found` 或 404：数据库没有分享给 Integration，或 database id 填错。
- `validation_error`：Notion 字段名、字段类型、select 选项和 schema 不一致。
- `multiple data sources`：同一个 database 下有多个 data sources，需要设置 `NOTION_DATA_SOURCE_ID`。
- `Invalid source_url`：JSON 里的 `source_url` / `sourceUrl` 不是合法 URL。
- 重复写入：检查每条 update 的 `id` 是否稳定，并确认 Notion 数据库里存在 `原始 JSON ID` 字段。

## 后续接入 GitHub Actions 的思路

后续可以增加一个定时工作流，让 GitHub Actions 每天自动生成或更新日报：

1. 使用 `schedule` 触发器每天运行一次。
2. 在工作流中调用早报生成脚本或 AI API，使用 `prompts/daily-brief.md` 作为提示词模板。
3. 校验输出 JSON 是否包含必需字段，并确保 `category` 属于允许列表。
4. 将 Markdown 写入 `reports/YYYY-MM-DD.md`，将 JSON 写入 `data/YYYY-MM-DD.json`。
5. 视需要把最近 7 天数据聚合到首页读取的数据文件。
6. 运行 `npm run notion:dry-run` 检查 Notion properties 映射。
7. 使用 GitHub Secrets 中的 `NOTION_TOKEN` 和 `NOTION_DATABASE_ID` 同步到 Notion。
8. 使用自动提交 Action 创建 commit 或 PR，人工审核后合并。
9. 通过 GitHub Pages 部署本静态站点。

示例触发器片段：

```yaml
on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:
```

## 部署

这个项目没有构建步骤。部署到 GitHub Pages、Netlify、Vercel 或任何静态文件托管服务时，直接发布仓库根目录即可。
