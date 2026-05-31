const fs = require("node:fs");
const path = require("node:path");
const { Client, isNotionClientError } = require("@notionhq/client");

const DEFAULT_JSON_PATH = path.join("data", "sample.json");
const DEFAULT_NOTION_VERSION = "2026-03-11";

const VALID_CATEGORIES = new Set([
  "OpenAI",
  "Codex",
  "Coding Agents",
  "MCP",
  "AI Tools",
  "Research",
  "Content Creation",
  "Workflow",
  "Other",
]);

const VALID_IMPORTANCE = new Set(["高", "中", "低"]);
const VALID_SOURCE_TYPES = new Set([
  "Official",
  "GitHub",
  "AIHOT",
  "AI News Radar",
  "Blog",
  "X",
  "Paper",
  "Other",
]);
const VALID_STATUS = new Set(["未读", "已读", "已收藏", "待实践", "已实践"]);
const VALID_CREATED_BY = new Set(["manual", "github-actions", "codex", "local-script"]);

function parseArgs(args) {
  const options = {
    filePath: DEFAULT_JSON_PATH,
    dryRun: false,
    dedupe: true,
  };

  for (const arg of args) {
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--no-dedupe") {
      options.dedupe = false;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      options.filePath = arg;
    }
  }

  return options;
}

function readJsonFile(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");

  return {
    absolutePath,
    data: JSON.parse(raw),
  };
}

function collectRecords(data) {
  const dailyGroups = getDailyGroups(data);
  const records = [];
  const seenIds = new Set();

  dailyGroups.forEach((group, groupIndex) => {
    if (!group.date) {
      throw new Error(`Daily group at index ${groupIndex} is missing required field: date`);
    }

    const updates = Array.isArray(group.updates) ? group.updates : [];
    const effectiveUpdates = updates.length > 0 ? updates : [createEmptyDayUpdate(group)];

    effectiveUpdates.forEach((update, updateIndex) => {
      const normalized = normalizeUpdate(update, group, groupIndex, updateIndex);

      if (seenIds.has(normalized.id)) {
        throw new Error(`Duplicate update id in JSON: ${normalized.id}`);
      }

      seenIds.add(normalized.id);
      records.push({
        group,
        update: normalized,
      });
    });
  });

  return records;
}

function getDailyGroups(data) {
  if (Array.isArray(data.days)) {
    return data.days.map((day) => ({
      ...data,
      ...day,
      updates: day.updates || day.briefs || [],
    }));
  }

  if (Array.isArray(data.updates)) {
    return [
      {
        ...data,
        updates: data.updates,
      },
    ];
  }

  if (Array.isArray(data.briefs)) {
    const looksLikeDailyGroups = data.briefs.some(
      (item) => Array.isArray(item.updates) || Array.isArray(item.briefs)
    );

    if (looksLikeDailyGroups) {
      return data.briefs.map((brief) => ({
        ...data,
        ...brief,
        updates: brief.updates || brief.briefs || [],
      }));
    }

    return [
      {
        ...data,
        updates: data.briefs,
      },
    ];
  }

  return [
    {
      ...data,
      updates: [],
    },
  ];
}

function createEmptyDayUpdate(group) {
  return {
    id: `${group.date}-no-important-updates`,
    title: "今天没有值得单独关注的更新",
    date: group.date,
    category: ["Other"],
    importance: "低",
    source_name: "Daily Brief",
    source_url: "",
    source_type: "Other",
    why_it_matters: "保留当天日报连续性，说明这一天没有需要单独追踪的重要更新。",
    how_i_can_use_it: "把注意力投入到复盘、阅读、跑通一个已有脚本或推进作品集。",
    actionable_advice: stringifyText(group.practical_suggestions),
    x_longform_topic: stringifyText(group.x_longform_topics),
    status: "未读",
    worth_practicing: false,
    notes: group.daily_reminder || "",
    created_by: group.created_by || "local-script",
    generated_empty_day: true,
  };
}

function normalizeUpdate(update, group, groupIndex, updateIndex) {
  const normalized = {
    id: requiredText(update.id, "id", groupIndex, updateIndex),
    title: requiredText(update.title, "title", groupIndex, updateIndex),
    date: requiredText(update.date || group.date, "date", groupIndex, updateIndex),
    category: normalizeCategories(update.category),
    importance: normalizeOption(
      update.importance || "中",
      VALID_IMPORTANCE,
      "importance",
      update.id
    ),
    source_name: requiredText(
      update.source_name || update.sourceName,
      "source_name",
      groupIndex,
      updateIndex
    ),
    source_url: update.generated_empty_day
      ? stringifyText(update.source_url || update.sourceUrl)
      : requiredText(update.source_url || update.sourceUrl, "source_url", groupIndex, updateIndex),
    source_type: normalizeOption(
      update.source_type || "Other",
      VALID_SOURCE_TYPES,
      "source_type",
      update.id
    ),
    why_it_matters: requiredText(
      update.why_it_matters || update.whyItMatters,
      "why_it_matters",
      groupIndex,
      updateIndex
    ),
    how_i_can_use_it: requiredText(
      update.how_i_can_use_it || update.howToUse,
      "how_i_can_use_it",
      groupIndex,
      updateIndex
    ),
    actionable_advice: stringifyText(update.actionable_advice || group.practical_suggestions),
    x_longform_topic: stringifyText(update.x_longform_topic || group.x_longform_topics),
    status: normalizeOption(update.status || "未读", VALID_STATUS, "status", update.id),
    worth_practicing: Boolean(update.worth_practicing),
    notes: stringifyText(update.notes || update.note || ""),
    created_by: normalizeOption(
      update.created_by || group.created_by || "local-script",
      VALID_CREATED_BY,
      "created_by",
      update.id
    ),
  };

  if (normalized.source_url && !isValidUrl(normalized.source_url)) {
    throw new Error(`Invalid source_url for update ${normalized.id}: ${normalized.source_url}`);
  }

  return normalized;
}

function buildNotionProperties(update) {
  return {
    标题: {
      title: richText(update.title),
    },
    日期: {
      date: {
        start: update.date,
      },
    },
    分类: {
      multi_select: update.category.map((name) => ({ name })),
    },
    重要性: {
      select: {
        name: update.importance,
      },
    },
    来源名称: {
      rich_text: richText(update.source_name),
    },
    来源链接: {
      url: update.source_url || null,
    },
    来源类型: {
      select: {
        name: update.source_type,
      },
    },
    为什么重要: {
      rich_text: richText(update.why_it_matters),
    },
    我可以怎么用: {
      rich_text: richText(update.how_i_can_use_it),
    },
    可实操建议: {
      rich_text: richText(update.actionable_advice),
    },
    "X 长文选题": {
      rich_text: richText(update.x_longform_topic),
    },
    状态: {
      select: {
        name: update.status,
      },
    },
    是否值得实践: {
      checkbox: update.worth_practicing,
    },
    备注: {
      rich_text: richText(update.notes),
    },
    "原始 JSON ID": {
      rich_text: richText(update.id),
    },
    创建来源: {
      select: {
        name: update.created_by,
      },
    },
  };
}

async function syncRecords(records, options) {
  if (options.dryRun) {
    console.log(`[dry-run] Loaded ${records.length} Notion record(s).`);
    records.forEach(({ update }, index) => {
      console.log(`\n[dry-run] Record ${index + 1}/${records.length}: ${update.id}`);
      console.log(JSON.stringify(buildNotionProperties(update), null, 2));
    });
    console.log("\n[dry-run] No Notion API calls were made.");
    return;
  }

  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  const configuredDataSourceId = process.env.NOTION_DATA_SOURCE_ID;
  const notionVersion = process.env.NOTION_VERSION || DEFAULT_NOTION_VERSION;

  if (!token || !databaseId) {
    throw new Error(
      "Missing Notion configuration. Set NOTION_TOKEN and NOTION_DATABASE_ID before running a real sync. Dry-run does not need these variables."
    );
  }

  const notion = new Client({
    auth: token,
    notionVersion,
  });

  const dataSourceId = await resolveDataSourceId(notion, databaseId, configuredDataSourceId);

  for (const { update } of records) {
    if (options.dedupe) {
      const existingPage = await findExistingPageByJsonId(notion, dataSourceId, update.id);
      if (existingPage) {
        console.log(`[skip] ${update.id} already exists in Notion.`);
        continue;
      }
    }

    const response = await notion.pages.create({
      parent: {
        data_source_id: dataSourceId,
      },
      properties: buildNotionProperties(update),
    });

    console.log(`[synced] ${update.id} -> ${response.id}`);
  }
}

async function resolveDataSourceId(notion, databaseId, configuredDataSourceId) {
  if (configuredDataSourceId) {
    return configuredDataSourceId;
  }

  const database = await notion.databases.retrieve({
    database_id: databaseId,
  });

  const dataSources = Array.isArray(database.data_sources) ? database.data_sources : [];

  if (dataSources.length === 1) {
    return dataSources[0].id;
  }

  if (dataSources.length > 1) {
    throw new Error(
      "This Notion database has multiple data sources. Set NOTION_DATA_SOURCE_ID to choose the exact data source."
    );
  }

  throw new Error(
    "Could not resolve a Notion data source from NOTION_DATABASE_ID. Check the database id and integration access."
  );
}

async function findExistingPageByJsonId(notion, dataSourceId, jsonId) {
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 1,
    filter: {
      property: "原始 JSON ID",
      rich_text: {
        equals: jsonId,
      },
    },
  });

  return response.results[0] || null;
}

function normalizeCategories(category) {
  const categories = Array.isArray(category) ? category : [category];
  const normalized = categories.map((value) => String(value || "").trim()).filter(Boolean);
  const finalCategories = normalized.length > 0 ? normalized : ["Other"];

  finalCategories.forEach((value) =>
    normalizeOption(value, VALID_CATEGORIES, "category", "unknown")
  );

  return finalCategories;
}

function normalizeOption(value, allowed, fieldName, id) {
  const text = String(value || "").trim();

  if (!allowed.has(text)) {
    throw new Error(
      `Invalid ${fieldName} for update ${id || "unknown"}: ${text}. Allowed values: ${Array.from(
        allowed
      ).join(", ")}`
    );
  }

  return text;
}

function requiredText(value, fieldName, groupIndex, updateIndex) {
  const text = stringifyText(value);

  if (!text) {
    throw new Error(
      `Update at daily group ${groupIndex}, index ${updateIndex} is missing required field: ${fieldName}`
    );
  }

  return text;
}

function richText(value) {
  const text = stringifyText(value);

  if (!text) {
    return [];
  }

  return splitText(text, 1900).map((content) => ({
    text: {
      content,
    },
  }));
}

function splitText(text, size) {
  const chunks = [];

  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }

  return chunks;
}

function stringifyText(value) {
  if (Array.isArray(value)) {
    return value.map((item) => `- ${item}`).join("\n");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value || "").trim();
}

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const { absolutePath, data } = readJsonFile(options.filePath);
    const records = collectRecords(data);

    console.log(`[input] ${absolutePath}`);
    await syncRecords(records, options);
  } catch (error) {
    if (isNotionClientError(error)) {
      console.error(`[notion-error] ${error.code}: ${error.message}`);
    } else {
      console.error(`[error] ${error.message}`);
    }
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildNotionProperties,
  collectRecords,
  parseArgs,
};
