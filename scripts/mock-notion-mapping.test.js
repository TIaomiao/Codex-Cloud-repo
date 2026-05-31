const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { buildNotionProperties, collectRecords, parseArgs } = require("./sync-to-notion");

const samplePath = path.resolve(__dirname, "..", "data", "sample.json");
const sample = JSON.parse(fs.readFileSync(samplePath, "utf8"));
const sampleRecords = collectRecords(sample);

assert.equal(sampleRecords.length, sample.briefs.length);

const firstProperties = buildNotionProperties(sampleRecords[0].update);
assert.equal(firstProperties["标题"].title[0].text.content, sample.briefs[0].title);
assert.equal(firstProperties["日期"].date.start, sample.briefs[0].date);
assert.equal(firstProperties["分类"].multi_select[0].name, sample.briefs[0].category);
assert.equal(firstProperties["来源链接"].url, sample.briefs[0].source_url);
assert.equal(firstProperties["是否值得实践"].checkbox, true);
assert.equal(firstProperties["原始 JSON ID"].rich_text[0].text.content, sample.briefs[0].id);

const emptyDayRecords = collectRecords({
  date: "2026-06-01",
  created_by: "local-script",
  updates: [],
});

assert.equal(emptyDayRecords.length, 1);
assert.equal(emptyDayRecords[0].update.id, "2026-06-01-no-important-updates");
assert.equal(emptyDayRecords[0].update.title, "今天没有值得单独关注的更新");

const args = parseArgs(["reports/example.json", "--dry-run"]);
assert.equal(args.filePath, "reports/example.json");
assert.equal(args.dryRun, true);

console.log("[mock-test] Notion mapping tests passed.");

