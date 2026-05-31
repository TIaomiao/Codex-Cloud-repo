# Notion 数据库字段设计

## 为什么每条更新一条记录

这个项目建议采用“每条重要更新 = Notion 数据库中的一条记录”，而不是“一天一条记录”。

原因很直接：

- 在 iPad 和手机上更好读：一条新闻就是一张 Notion 页面，可以逐条阅读、收藏和备注。
- 更容易筛选：可以按分类、重要性、来源类型、状态、是否值得实践过滤。
- 更适合复盘：一周后能直接看哪些已读、哪些待实践、哪些已经真的做过。
- 更容易去重：每条更新都有稳定 `id`，同步到 Notion 的 `原始 JSON ID` 字段后，可以避免重复写入。
- 更适合转化为作品：单条记录可以继续沉淀成 X 长文、GitHub 项目更新、教程或复盘。

如果某天没有重要更新，同步脚本会生成一条特殊记录：

```text
今天没有值得单独关注的更新
```

这条记录的意义不是凑数，而是保留日报连续性，方便复盘信息密度和注意力投入。

## 最终 Schema

Notion 数据库字段名需要和下表完全一致。

| 字段名 | Notion 类型 | 可选值 / 格式 | 用途 |
| --- | --- | --- | --- |
| 标题 | Title | 文本 | Notion 页面标题，对应早报更新标题。 |
| 日期 | Date | `YYYY-MM-DD` | 这条更新归属的日报日期。 |
| 分类 | Multi-select | `OpenAI`, `Codex`, `Coding Agents`, `MCP`, `AI Tools`, `Research`, `Content Creation`, `Workflow`, `Other` | 一条更新可能同时属于多个主题，所以用 Multi-select。 |
| 重要性 | Select | `高`, `中`, `低` | 判断是否需要优先阅读、收藏或当天实践。 |
| 来源名称 | Rich text | 文本 | 来源的可读名称，例如 OpenAI Docs、GitHub Repo、AIHOT。 |
| 来源链接 | URL | URL | 原始链接，方便事实核查。 |
| 来源类型 | Select | `Official`, `GitHub`, `AIHOT`, `AI News Radar`, `Blog`, `X`, `Paper`, `Other` | 辅助判断信息可信度和来源结构。 |
| 为什么重要 | Rich text | 文本 | 解释这条更新对学习、开发、作品或自动化的影响。 |
| 我可以怎么用 | Rich text | 文本 | 把新闻转成个人可执行用途。 |
| 可实操建议 | Rich text | 文本 | 今天或本周可以做的最小动作。 |
| X 长文选题 | Rich text | 文本 | 可转化为公开输出的选题角度。 |
| 状态 | Select | `未读`, `已读`, `已收藏`, `待实践`, `已实践` | 支持阅读、收藏和实践闭环。 |
| 是否值得实践 | Checkbox | true / false | 快速筛出值得动手验证的内容。 |
| 备注 | Rich text | 文本 | 保存补充判断、不确定性和复盘记录。 |
| 原始 JSON ID | Rich text | 稳定 ID | 去重键，对应 JSON 中每条 update 的 `id`。 |
| 创建来源 | Select | `manual`, `github-actions`, `codex`, `local-script` | 区分记录是手动、GitHub Actions、Codex 还是本地脚本创建。 |

## JSON 到 Notion 的映射

推荐 JSON 字段使用 snake_case。为了兼容当前前端，脚本也支持现有 camelCase 字段。

| JSON 字段 | 兼容旧字段 | Notion 字段 |
| --- | --- | --- |
| `id` | 无 | 原始 JSON ID |
| `title` | 无 | 标题 |
| `date` | 无 | 日期 |
| `category` | 无 | 分类 |
| `importance` | 无 | 重要性 |
| `source_name` | `sourceName` | 来源名称 |
| `source_url` | `sourceUrl` | 来源链接 |
| `source_type` | 无 | 来源类型 |
| `why_it_matters` | `whyItMatters` | 为什么重要 |
| `how_i_can_use_it` | `howToUse` | 我可以怎么用 |
| `actionable_advice` | 无 | 可实操建议 |
| `x_longform_topic` | 无 | X 长文选题 |
| `status` | 无 | 状态 |
| `worth_practicing` | 无 | 是否值得实践 |
| `notes` | 无 | 备注 |
| `created_by` | 无 | 创建来源 |

日报级字段可以保存在根对象中：

- `today_focus`
- `practical_suggestions`
- `daily_reminder`
- `x_longform_topics`
- `created_by`

当单条 update 缺少 `actionable_advice` 或 `x_longform_topic` 时，脚本会用日报级字段兜底。

## Notion API 兼容性

脚本使用官方 SDK `@notionhq/client`，并按 Notion 2025 年之后的 data source 模型处理真实同步：

1. 从环境变量读取 `NOTION_DATABASE_ID`。
2. 通过 database id 解析对应 data source。
3. 用 data source 创建页面并查询去重。

普通单数据源数据库只需要：

```text
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=your_database_id
```

如果未来同一个 Notion database 下存在多个 data sources，脚本会停止并提示额外设置：

```text
NOTION_DATA_SOURCE_ID=your_data_source_id
```

