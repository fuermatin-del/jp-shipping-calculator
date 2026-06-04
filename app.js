const prefectures = [
  ["ordinary", "普通地区"],
  ["hokkaido", "北海道"],
  ["okinawa", "冲绳"],
  ["ordinary", "青森县"],
  ["ordinary", "岩手县"],
  ["ordinary", "宫城县"],
  ["ordinary", "秋田县"],
  ["ordinary", "山形县"],
  ["ordinary", "福岛县"],
  ["ordinary", "茨城县"],
  ["ordinary", "栃木县"],
  ["ordinary", "群马县"],
  ["ordinary", "埼玉县"],
  ["ordinary", "千叶县"],
  ["ordinary", "东京都"],
  ["ordinary", "神奈川县"],
  ["ordinary", "新潟县"],
  ["ordinary", "富山县"],
  ["ordinary", "石川县"],
  ["ordinary", "福井县"],
  ["ordinary", "山梨县"],
  ["ordinary", "长野县"],
  ["ordinary", "岐阜县"],
  ["ordinary", "静冈县"],
  ["ordinary", "爱知县"],
  ["ordinary", "三重县"],
  ["ordinary", "滋贺县"],
  ["ordinary", "京都府"],
  ["ordinary", "大阪府"],
  ["ordinary", "兵库县"],
  ["ordinary", "奈良县"],
  ["ordinary", "和歌山县"],
  ["ordinary", "鸟取县"],
  ["ordinary", "岛根县"],
  ["ordinary", "冈山县"],
  ["ordinary", "广岛县"],
  ["ordinary", "山口县"],
  ["ordinary", "德岛县"],
  ["ordinary", "香川县"],
  ["ordinary", "爱媛县"],
  ["ordinary", "高知县"],
  ["ordinary", "福冈县"],
  ["ordinary", "佐贺县"],
  ["ordinary", "长崎县"],
  ["ordinary", "熊本县"],
  ["ordinary", "大分县"],
  ["ordinary", "宫崎县"],
  ["ordinary", "鹿儿岛县"],
];

const carriers = [
  {
    name: "盛欣",
    dimensionalRule: ({ sum, actualWeight, length, width, height }) => {
      const smallParcel = length <= 27 && width <= 25 && height <= 5 && actualWeight <= 0.5;
      if (sum < 160) {
        return { mode: "免抛", billableWeight: actualWeight, smallParcel };
      }
      if (sum < 260) {
        return { mode: "半抛", billableWeight: halfThrowWeight(actualWeight, length, width, height), smallParcel };
      }
      return { unavailable: "三边合计达到 260cm 及以上" };
    },
    rateFor: ({ bracket, smallParcel }) => {
      if (smallParcel) {
        return {
          base: 28,
          step: 6,
          label: "小包首重28元 + 续重6元/kg",
          bracketOverride: { id: "small-0.5", label: "0-0.5kg小包" },
        };
      }
      if (["0-0.5", "0.5-2.5", "2.5-5"].includes(bracket.id)) {
        return { base: 35, step: 5, label: "首重35元 + 续重5元/kg" };
      }
      if (bracket.id === "5-10") {
        return { base: 35.5, step: 5.5, label: "首重35.5元 + 续重5.5元/kg" };
      }
      if (bracket.id === "10-20") {
        return { base: 36, step: 6, label: "首重36元 + 续重6元/kg", notRecommended: "10kg以上尽量不选" };
      }
      return { unavailable: "超过可选重量范围" };
    },
  },
  {
    name: "OCS",
    dimensionalRule: ({ sum, actualWeight, length, width, height }) => {
      if (sum < 120) return { mode: "免抛", billableWeight: actualWeight };
      if (sum < 260) return { mode: "全抛", billableWeight: fullThrowWeight(actualWeight, length, width, height) };
      return { unavailable: "三边合计达到 260cm 及以上" };
    },
    rateFor: ({ bracket }) => {
      if (["0-0.5", "0.5-2.5"].includes(bracket.id)) {
        return { base: 31, step: 5, label: "首重31元 + 续重5元/kg" };
      }
      if (bracket.id === "2.5-5") {
        return { base: 31, step: 7, label: "首重31元 + 续重7元/kg" };
      }
      if (bracket.id === "5-10") {
        return { base: 32, step: 7, label: "首重32元 + 续重7元/kg" };
      }
      if (bracket.id === "10-20") {
        return { base: 33, step: 7, label: "首重33元 + 续重7元/kg" };
      }
      return { unavailable: "超过可选重量范围" };
    },
  },
  {
    name: "林道",
    dimensionalRule: ({ sum, actualWeight, length, width, height }) => {
      if (sum < 160) return { mode: "免抛", billableWeight: actualWeight };
      if (sum < 260) return { mode: "全抛", billableWeight: fullThrowWeight(actualWeight, length, width, height) };
      return { unavailable: "三边合计达到 260cm 及以上" };
    },
    rateFor: ({ bracket }) => {
      if (["0-0.5", "0.5-2.5", "2.5-5", "5-10", "10-20"].includes(bracket.id)) {
        return { base: 35, step: 5, label: "首重35元 + 续重5元/kg" };
      }
      return { unavailable: "超过可选重量范围" };
    },
  },
  {
    name: "盘古",
    dimensionalRule: ({ sum, maxSide, actualWeight, length, width, height }) => {
      if (sum >= 260) return { unavailable: "三边合计达到 260cm 及以上" };
      const oversizedFee = maxSide > 200 ? 60 : maxSide > 100 ? 30 : 0;
      const oversizedNote = oversizedFee ? `单边超长费 ${oversizedFee}元` : "";
      if (sum < 140) {
        return { mode: "免抛", billableWeight: actualWeight, extraFee: oversizedFee, extraNote: oversizedNote };
      }
      return {
        mode: "半抛",
        billableWeight: halfThrowWeight(actualWeight, length, width, height),
        extraFee: oversizedFee,
        extraNote: oversizedNote,
      };
    },
    rateFor: ({ bracket }) => {
      if (["0-0.5", "0.5-2.5", "2.5-5"].includes(bracket.id)) {
        return { base: 33, step: 5, label: "首重33元 + 续重5元/kg" };
      }
      if (bracket.id === "5-10") {
        return { base: 34, step: 5.5, label: "首重34元 + 续重5.5元/kg" };
      }
      if (bracket.id === "10-20") {
        return { base: 35, step: 6, label: "首重35元 + 续重6元/kg" };
      }
      return { unavailable: "超过可选重量范围" };
    },
  },
  {
    name: "中外运",
    dimensionalRule: ({ actualWeight }) => ({ mode: "免抛", billableWeight: actualWeight }),
    rateFor: ({ bracket, billableWeight }) => {
      if (["0-0.5", "0.5-2.5"].includes(bracket.id)) {
        return { base: 33, step: 5, label: "首重33元 + 续重5元/kg" };
      }
      if (bracket.id === "2.5-5") {
        return { base: 34, step: 5.5, label: "首重34元 + 续重5.5元/kg" };
      }
      if (["5-10", "10-20"].includes(bracket.id)) {
        return { base: 35, step: 6, label: "首重35元 + 续重6元/kg" };
      }
      if (bracket.id === "20-30") {
        return { base: 35, step: 6.5, label: "首重35元 + 续重6.5元/kg" };
      }
      return { flatPerKg: 15, label: "15元/kg", chargeWeight: roundUpKg(billableWeight) };
    },
    regionFee: ({ region }) => {
      if (region === "okinawa") return { fee: 150, note: "冲绳偏远费 150元" };
      if (region === "hokkaido") return { fee: 0, note: "北海道不额外收费" };
      return { fee: 0, note: "" };
    },
  },
  {
    name: "顺丰",
    dimensionalRule: ({ sum, maxSide, actualWeight }) => {
      const oversized = maxSide >= 120 || sum >= 150;
      return {
        mode: "免抛",
        billableWeight: actualWeight,
        extraFee: oversized ? 108 : 0,
        extraNote: oversized ? "超出尺寸费 108元" : "",
      };
    },
    rateFor: ({ bracket }) => {
      if (["0-0.5", "0.5-2.5", "2.5-5", "5-10"].includes(bracket.id)) {
        return { base: 31, step: 5, label: "首重31元 + 续重5元/kg" };
      }
      return { unavailable: "超过可选重量范围" };
    },
  },
];

const elements = {
  form: document.querySelector("#shipment-form"),
  reset: document.querySelector("#reset-button"),
  length: document.querySelector("#length"),
  width: document.querySelector("#width"),
  height: document.querySelector("#height"),
  weight: document.querySelector("#weight"),
  prefecture: document.querySelector("#prefecture"),
  dimensionSum: document.querySelector("#dimension-sum"),
  volumeWeight: document.querySelector("#volume-weight"),
  regionKind: document.querySelector("#region-kind"),
  bestCard: document.querySelector("#best-card"),
  resultsBody: document.querySelector("#results-body"),
  mobileResults: document.querySelector("#mobile-results"),
};

function init() {
  populatePrefectures();
  elements.form.addEventListener("input", calculateAndRender);
  elements.prefecture.addEventListener("change", calculateAndRender);
  elements.reset.addEventListener("click", resetForm);
  calculateAndRender();
}

function populatePrefectures() {
  elements.prefecture.innerHTML = prefectures
    .map(([region, label]) => `<option value="${region}|${label}">${label}</option>`)
    .join("");
}

function resetForm() {
  elements.length.value = "";
  elements.width.value = "";
  elements.height.value = "";
  elements.weight.value = "";
  elements.prefecture.selectedIndex = 0;
  calculateAndRender();
}

function calculateAndRender() {
  const input = getInput();
  updateMetrics(input);

  if (!input.valid) {
    renderEmpty();
    return;
  }

  const rows = carriers.map((carrier) => calculateCarrier(carrier, input));
  const recommended = chooseRecommended(rows);
  const sortedRows = sortRows(rows, recommended);
  renderBest(recommended, rows);
  renderTable(sortedRows, recommended);
  renderCards(sortedRows, recommended);
}

function getInput() {
  const length = parsePositive(elements.length.value);
  const width = parsePositive(elements.width.value);
  const height = parsePositive(elements.height.value);
  const weight = parsePositive(elements.weight.value);
  const [region, label] = elements.prefecture.value.split("|");

  return {
    length,
    width,
    height,
    actualWeight: weight,
    region,
    regionLabel: label || "普通地区",
    valid: [length, width, height, weight].every((value) => Number.isFinite(value) && value > 0),
  };
}

function parsePositive(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function updateMetrics(input) {
  if (!input.valid) {
    elements.dimensionSum.textContent = "--";
    elements.volumeWeight.textContent = "--";
  } else {
    elements.dimensionSum.textContent = `${formatNumber(input.length + input.width + input.height)} cm`;
    elements.volumeWeight.textContent = `${formatNumber(volumeWeight(input.length, input.width, input.height))} kg`;
  }
  elements.regionKind.textContent = regionName(input.region);
}

function calculateCarrier(carrier, input) {
  const dimensions = {
    length: input.length,
    width: input.width,
    height: input.height,
    actualWeight: input.actualWeight,
    sum: input.length + input.width + input.height,
    maxSide: Math.max(input.length, input.width, input.height),
  };

  const dimensional = carrier.dimensionalRule(dimensions);
  if (dimensional.unavailable) {
    return unavailableRow(carrier.name, dimensional.unavailable);
  }

  const billableWeight = Math.max(input.actualWeight, dimensional.billableWeight);
  const bracket = getWeightBracket(billableWeight);
  const rate = carrier.rateFor({
    bracket,
    billableWeight,
    smallParcel: dimensional.smallParcel,
  });
  const displayBracket = rate.bracketOverride || bracket;

  if (rate.unavailable) {
    return unavailableRow(carrier.name, rate.unavailable, {
      bracket: displayBracket,
      billableWeight,
      method: dimensional.mode,
    });
  }

  const baseFreight = rate.flatPerKg
    ? roundCurrency(rate.chargeWeight * rate.flatPerKg)
    : roundCurrency(rate.base + continuationUnits(billableWeight) * rate.step);

  const regionFee = carrier.regionFee ? carrier.regionFee({ region: input.region }) : { fee: 0, note: "" };
  const extraFee = (dimensional.extraFee || 0) + (regionFee.fee || 0);
  const total = roundCurrency(baseFreight + extraFee);
  const warnings = [];

  if (rate.notRecommended) warnings.push(rate.notRecommended);
  if (dimensional.extraNote) warnings.push(dimensional.extraNote);
  if (regionFee.note) warnings.push(regionFee.note);
  if (input.region === "hokkaido" && !["盘古", "中外运"].includes(carrier.name)) {
    warnings.push("北海道偏远费未提供，按基础价显示");
  }

  const needsReview = input.region === "hokkaido" && !["盘古", "中外运"].includes(carrier.name);
  const status = rate.notRecommended || needsReview ? "warn" : "ok";

  return {
    carrier: carrier.name,
    status,
    statusText: rate.notRecommended ? "不推荐" : needsReview ? "需确认" : "可选",
    bracket: displayBracket,
    billableWeight,
    method: dimensional.mode,
    rateLabel: rate.label,
    baseFreight,
    extraFee,
    total,
    warnings,
    available: true,
  };
}

function unavailableRow(carrier, reason, partial = {}) {
  return {
    carrier,
    status: "off",
    statusText: "不可选",
    reason,
    available: false,
    warnings: [reason],
    ...partial,
  };
}

function volumeWeight(length, width, height) {
  return (length * width * height) / 6000;
}

function fullThrowWeight(actualWeight, length, width, height) {
  return Math.max(actualWeight, volumeWeight(length, width, height));
}

function halfThrowWeight(actualWeight, length, width, height) {
  return Math.max(actualWeight, (volumeWeight(length, width, height) + actualWeight) / 2);
}

function continuationUnits(weight) {
  return Math.max(0, Math.ceil(weight - 0.5));
}

function roundUpKg(weight) {
  return Math.ceil(weight);
}

function getWeightBracket(weight) {
  if (weight < 0.5) return { id: "0-0.5", label: "0-0.5kg" };
  if (weight < 2.5) return { id: "0.5-2.5", label: "0.5-2.5kg" };
  if (weight < 5) return { id: "2.5-5", label: "2.5-5kg" };
  if (weight < 10) return { id: "5-10", label: "5-10kg" };
  if (weight < 20) return { id: "10-20", label: "10-20kg" };
  if (weight < 30) return { id: "20-30", label: "20-30kg" };
  return { id: "30+", label: "30kg以上" };
}

function chooseRecommended(rows) {
  const regular = rows.filter((row) => row.available && row.status === "ok");
  const fallback = rows.filter((row) => row.available);
  const candidates = regular.length ? regular : fallback;
  return candidates.reduce((best, row) => (!best || row.total < best.total ? row : best), null);
}

function sortRows(rows, recommended) {
  return [...rows].sort((a, b) => {
    if (recommended) {
      if (a.carrier === recommended.carrier) return -1;
      if (b.carrier === recommended.carrier) return 1;
    }
    if (a.available !== b.available) return a.available ? -1 : 1;
    if (a.available && b.available) return a.total - b.total;
    return a.carrier.localeCompare(b.carrier, "zh-CN");
  });
}

function renderEmpty() {
  elements.bestCard.className = "best-card empty";
  elements.bestCard.innerHTML = "<span>输入包裹规格后自动核算</span>";
  elements.resultsBody.innerHTML = '<tr><td colspan="7" class="empty-row">等待输入包裹规格</td></tr>';
  elements.mobileResults.innerHTML = "";
}

function renderBest(recommended, rows) {
  if (!recommended) {
    elements.bestCard.className = "best-card empty";
    elements.bestCard.innerHTML = "<span>当前规格没有可选快递</span>";
    return;
  }

  const availableCount = rows.filter((row) => row.available).length;
  const warning = recommended.status === "warn" ? "，但该渠道标注不推荐" : "";
  elements.bestCard.className = "best-card";
  elements.bestCard.innerHTML = `
    <div class="carrier">${recommended.carrier}</div>
    <div class="price">${formatCurrency(recommended.total)}</div>
    <div class="subline">${recommended.method}，计费重 ${formatNumber(recommended.billableWeight)}kg。共 ${availableCount} 个可选报价${warning}。</div>
  `;
}

function renderTable(rows, recommended) {
  elements.resultsBody.innerHTML = rows.map((row) => `
    <tr class="${recommended && row.carrier === recommended.carrier ? "best-row" : ""}">
      <td class="carrier-cell">${row.carrier}</td>
      <td>${statusBadge(row)}${notesMarkup(row)}</td>
      <td>${row.bracket ? row.bracket.label : "--"}</td>
      <td>${row.billableWeight ? `${formatNumber(row.billableWeight)} kg` : "--"}${row.method ? `<div class="muted">${row.method}</div>` : ""}</td>
      <td>${row.rateLabel || "--"}</td>
      <td>${row.available ? formatCurrency(row.extraFee || 0) : "--"}</td>
      <td class="price-cell">${row.available ? formatCurrency(row.total) : "--"}</td>
    </tr>
  `).join("");
}

function renderCards(rows, recommended) {
  elements.mobileResults.innerHTML = rows.map((row) => `
    <article class="result-card ${recommended && row.carrier === recommended.carrier ? "best-card-row" : ""}">
      <div class="card-head">
        <div>
          <div class="card-name">${row.carrier}</div>
          ${statusBadge(row)}
        </div>
        <div class="card-price">${row.available ? formatCurrency(row.total) : "--"}</div>
      </div>
      <div class="card-line"><span>重量档</span><strong>${row.bracket ? row.bracket.label : "--"}</strong></div>
      <div class="card-line"><span>计费重</span><strong>${row.billableWeight ? `${formatNumber(row.billableWeight)} kg` : "--"}</strong></div>
      <div class="card-line"><span>计费方式</span><strong>${row.rateLabel || "--"}</strong></div>
      <div class="card-line"><span>附加费</span><strong>${row.available ? formatCurrency(row.extraFee || 0) : "--"}</strong></div>
      ${row.warnings.length ? `<div class="card-line"><span>备注</span><strong>${escapeHtml(row.warnings.join("；"))}</strong></div>` : ""}
    </article>
  `).join("");
}

function statusBadge(row) {
  return `<span class="badge ${row.status}">${row.statusText}</span>`;
}

function notesMarkup(row) {
  if (!row.warnings.length) return "";
  return `<div class="muted">${escapeHtml(row.warnings.join("；"))}</div>`;
}

function formatCurrency(value) {
  return `¥${formatNumber(value)}`;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "--";
  const rounded = Math.round(value * 100) / 100;
  return rounded.toLocaleString("zh-CN", {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function regionName(region) {
  if (region === "hokkaido") return "北海道";
  if (region === "okinawa") return "冲绳";
  return "普通地区";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
