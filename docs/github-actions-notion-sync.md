# GitHub Actions 同步 Notion 设计

当前阶段先不启用自动同步，只记录未来方案。原因是：自动写入 Notion 属于真实外部副作用，需要先本地 dry-run 验证 JSON 结构和字段映射。

## Secrets 配置

未来在 GitHub 仓库中进入：

```text
Settings -> Secrets and variables -> Actions
```

添加 Repository secrets：

```text
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=your_database_id
```

普通单数据源数据库只需要这两个。若未来同一个 Notion database 下有多个 data sources，再额外添加：

```text
NOTION_DATA_SOURCE_ID=your_data_source_id
```

注意：

- 不要把 token 写进仓库。
- 不要在日志中打印 token。
- 失败日志只保留记录 ID、错误类型和错误摘要，不输出环境变量值。

## 定时运行

目标是每天北京时间 8:00 自动运行。

GitHub Actions cron 使用 UTC 时间，所以北京时间 8:00 对应 UTC 0:00：

```yaml
on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:
```

## 未来 Workflow 草案

先不要直接提交到 `.github/workflows`。确认本地真实同步可用后，再启用类似流程：

```yaml
name: Daily AI Brief to Notion

on:
  workflow_dispatch:
  schedule:
    - cron: "0 0 * * *"

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "npm"

      - run: npm ci

      - name: Generate daily brief JSON
        run: |
          echo "TODO: generate reports/$(date -u +%F).json and data/$(date -u +%F).json"

      - name: Dry-run Notion mapping
        run: npm run notion:dry-run

      - name: Sync to Notion
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
          NOTION_DATA_SOURCE_ID: ${{ secrets.NOTION_DATA_SOURCE_ID }}
        run: npm run notion:sync
```

## 生成早报 JSON

未来自动化可以拆成四步：

1. 根据 `prompts/daily-brief.md` 生成当天 Markdown 和 JSON。
2. 保存 Markdown 到 `reports/YYYY-MM-DD.md`。
3. 保存 JSON 到 `data/YYYY-MM-DD.json`。
4. 运行同步脚本，把每条 update 写入 Notion 数据库。

## 失败日志原则

可以记录：

- 失败记录的 `id`
- Notion API error code
- HTTP 状态码
- 错误摘要

不能记录：

- `NOTION_TOKEN`
- 完整 request headers
- cookie
- integration secret
- 任何私密环境变量

## 去重策略

每条 update 必须有稳定 `id`。真实同步时，脚本会先按 Notion 字段 `原始 JSON ID` 查询是否已有同 ID 记录：

- 已存在：跳过，不重复创建。
- 不存在：创建新记录。

所以 GitHub Actions 即使重跑同一天任务，也不会重复写入同一条新闻。

