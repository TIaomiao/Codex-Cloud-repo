const DATA_URL = "data/sample.json";
const RECENT_DAYS = 7;

const state = {
  briefs: [],
  query: "",
  category: "all",
};

const elements = {
  list: document.querySelector("#brief-list"),
  template: document.querySelector("#brief-card-template"),
  searchInput: document.querySelector("#search-input"),
  categoryFilter: document.querySelector("#category-filter"),
  resultSummary: document.querySelector("#result-summary"),
  emptyState: document.querySelector("#empty-state"),
  totalCount: document.querySelector("#total-count"),
  resetButton: document.querySelector("#reset-filters"),
};

async function loadBriefs() {
  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`无法加载数据文件：${response.status}`);
    }

    const data = await response.json();
    state.briefs = Array.isArray(data.briefs) ? data.briefs : [];
    elements.totalCount.textContent = getRecentBriefs(state.briefs).length;
    render();
  } catch (error) {
    elements.resultSummary.textContent = "数据加载失败，请确认 data/sample.json 可访问。";
    elements.list.innerHTML = "";
    elements.emptyState.hidden = false;
    console.error(error);
  }
}

function getRecentBriefs(briefs) {
  const today = getNewestDate(briefs) ?? new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (RECENT_DAYS - 1));
  startDate.setHours(0, 0, 0, 0);

  return briefs
    .filter((brief) => {
      const itemDate = parseLocalDate(brief.date);
      return itemDate && itemDate >= startDate && itemDate <= today;
    })
    .sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));
}

function getNewestDate(briefs) {
  const dates = briefs.map((brief) => parseLocalDate(brief.date)).filter(Boolean);

  if (dates.length === 0) {
    return null;
  }

  return new Date(Math.max(...dates));
}

function parseLocalDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

function filterBriefs() {
  const recentBriefs = getRecentBriefs(state.briefs);
  const normalizedQuery = state.query.trim().toLowerCase();

  return recentBriefs.filter((brief) => {
    const matchesCategory = state.category === "all" || brief.category === state.category;
    const searchableText = [
      brief.title,
      brief.sourceName,
      brief.sourceUrl,
      brief.category,
      brief.whatHappened,
      brief.whyItMatters,
      brief.howToUse,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesCategory && searchableText.includes(normalizedQuery);
  });
}

function render() {
  const filteredBriefs = filterBriefs();
  const recentCount = getRecentBriefs(state.briefs).length;
  elements.list.innerHTML = "";

  filteredBriefs.forEach((brief) => {
    elements.list.appendChild(createBriefCard(brief));
  });

  elements.emptyState.hidden = filteredBriefs.length > 0;
  elements.resultSummary.textContent = buildSummary(filteredBriefs.length, recentCount);
}

function createBriefCard(brief) {
  const fragment = elements.template.content.cloneNode(true);
  const card = fragment.querySelector(".brief-card");
  const category = fragment.querySelector(".category");
  const sampleBadge = fragment.querySelector(".sample-badge");
  const time = fragment.querySelector("time");
  const title = fragment.querySelector("h2");
  const sourceLink = fragment.querySelector(".source-link");
  const why = fragment.querySelector(".why");
  const usage = fragment.querySelector(".usage");

  card.dataset.category = brief.category;
  category.textContent = brief.category;
  sampleBadge.hidden = !brief.isSample;
  time.textContent = formatDate(brief.date);
  time.dateTime = brief.date;
  title.textContent = brief.title;
  sourceLink.href = brief.sourceUrl;
  sourceLink.textContent = brief.sourceName || brief.sourceUrl;
  why.textContent = brief.whyItMatters;
  usage.textContent = brief.howToUse;

  return fragment;
}

function formatDate(value) {
  const date = parseLocalDate(value);

  if (!date) {
    return "未知日期";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function buildSummary(filteredCount, recentCount) {
  const categoryText = state.category === "all" ? "全部分类" : state.category;
  const queryText = state.query.trim() ? `，关键词“${state.query.trim()}”` : "";
  return `最近 ${RECENT_DAYS} 天共 ${recentCount} 条，当前显示 ${filteredCount} 条（${categoryText}${queryText}）。`;
}

function resetFilters() {
  state.query = "";
  state.category = "all";
  elements.searchInput.value = "";
  elements.categoryFilter.value = "all";
  render();
}

elements.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

elements.categoryFilter.addEventListener("change", (event) => {
  state.category = event.target.value;
  render();
});

elements.resetButton.addEventListener("click", resetFilters);

loadBriefs();
