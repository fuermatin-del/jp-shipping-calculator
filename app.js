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

const BOUNDARY_TO_NEXT_TIER = new Set([0.5, 2.5, 5, 10]);

const channelRules = [
  {
    id: "shengxin-sagawa",
    carrier: "盛欣",
    channel: "3661佐川普货渠道",
    participates: true,
    dimensionalRule: ({ sum, actualWeight, length, width, height }) => {
      if (sum < 160) {
        return dimensionalResult("免抛", actualWeight, [`三边合 ${formatNumber(sum)}cm < 160cm，免抛`]);
      }
      if (sum < 260) {
        const half = halfThrowResult(actualWeight, length, width, height, 6000);
        return dimensionalResult("半抛", half.billableWeight, [
          `三边合 ${formatNumber(sum)}cm 进入160-260cm半抛`,
          ...half.steps,
        ]);
      }
      return unavailableDimensional("三边合达到260cm及以上，盛欣普货不可选");
    },
    tiers: [
      tier("0.5-5kg", 0, 5, 35, 5, 500),
      tier("5.5-10kg", 5.5, 10, 35.5, 5.5, 500),
      tier("10.5-20kg", 10.5, 20, 36, 6, 500),
      tier("20.5-30kg", 20.5, 30, 37, 6.5, 500),
    ],
    regionFee: ({ region }) => {
      if (region === "okinawa") {
        return manualFee("冲绳偏远费为实报实销，需人工确认最终附加费");
      }
      return noFee();
    },
  },
  {
    id: "shengxin-kuroneko-5cm",
    carrier: "盛欣",
    channel: "黑猫5CM渠道",
    participates: true,
    dimensionalRule: ({ actualWeight, length, width, height }) => {
      if (!fitsBox(length, width, height, [35, 27, 5], true)) {
        return unavailableDimensional("尺寸超过35cm x 27cm x 5cm，黑猫5CM不可选");
      }
      return dimensionalResult("免抛", actualWeight, ["满足35cm x 27cm x 5cm以内，按实重计费"]);
    },
    tiers: [tier("尺寸内不限重", 0, null, 28, 6, 500)],
  },
  {
    id: "shengxin-battery",
    carrier: "盛欣",
    channel: "带电渠道",
    participates: false,
    recommendationNote: "带电渠道只展示，不参与最便宜推荐",
    dimensionalRule: ({ sum, actualWeight, length, width, height }) => {
      if (sum < 160) return dimensionalResult("免抛", actualWeight, [`三边合 ${formatNumber(sum)}cm < 160cm，免抛`]);
      if (sum < 260) {
        const half = halfThrowResult(actualWeight, length, width, height, 6000);
        return dimensionalResult("半抛", half.billableWeight, [
          `带电渠道沿用盛欣尺寸规则：160-260cm半抛`,
          ...half.steps,
        ]);
      }
      return unavailableDimensional("三边合达到260cm及以上，盛欣带电不可选");
    },
    tiers: [tier("带电渠道", 0, 30, 40, 10, 500)],
    regionFee: ({ region }) => {
      if (region === "okinawa") return manualFee("冲绳偏远费未提供，需人工确认");
      return noFee();
    },
  },
  {
    id: "ocs-ecommerce",
    carrier: "OCS",
    channel: "电商小包价格",
    participates: true,
    dimensionalRule: ({ sum, actualWeight, length, width, height }) => {
      const steps = [];
      let extraFee = 0;
      if (sum <= 140) {
        steps.push(`三边合 ${formatNumber(sum)}cm <= 140cm，OCS 8.26规则免抛`);
        return dimensionalResult("免抛", actualWeight, steps);
      }
      const billableWeight = fullThrowWeight(actualWeight, length, width, height, 5000);
      steps.push(`三边合 ${formatNumber(sum)}cm > 140cm，OCS 8.26规则按全抛`);
      steps.push(`OCS体积重 = 长 × 宽 × 高 / 5000 = ${formatNumber(volumeWeight(length, width, height, 5000))}kg`);
      steps.push(`全抛计费重 = 实重与OCS体积重取较大值 = ${formatNumber(billableWeight)}kg`);
      if (sum > 260) {
        extraFee = 180;
        steps.push("三边合超过260cm，继续计算并加超尺寸费180元");
      }
      return dimensionalResult("全抛", billableWeight, steps, extraFee, extraFee ? "三边和>260cm超尺寸费180元" : "");
    },
    tiers: [
      tier("0-2kg", 0, 2, 31, 5, 500),
      tier("2.5-5kg", 2.5, 5, 31, 5, 500),
      tier("5.5-10kg", 5.5, 10, 32, 5.5, 500),
      tier("10.5-20kg", 10.5, 20, 33, 7, 500),
      perKgTier("20kg以上", 20, null, 20),
    ],
    regionFee: ocsRegionFee,
    finalSurcharge: { fee: 1.5, note: "OCS固定附加费1.5元" },
  },
  {
    id: "ocs-battery",
    carrier: "OCS",
    channel: "带电渠道",
    participates: false,
    recommendationNote: "OCS带电渠道只展示，不参与最便宜推荐",
    dimensionalRule: ({ sum, actualWeight, length, width, height }) => {
      const steps = [];
      let extraFee = 0;
      if (sum <= 140) {
        steps.push(`三边合 ${formatNumber(sum)}cm <= 140cm，OCS带电8.26规则免抛`);
        return dimensionalResult("免抛", actualWeight, steps);
      }
      const billableWeight = fullThrowWeight(actualWeight, length, width, height, 5000);
      steps.push(`三边合 ${formatNumber(sum)}cm > 140cm，OCS带电8.26规则按全抛`);
      steps.push(`OCS体积重 = 长 × 宽 × 高 / 5000 = ${formatNumber(volumeWeight(length, width, height, 5000))}kg`);
      steps.push(`全抛计费重 = 实重与OCS体积重取较大值 = ${formatNumber(billableWeight)}kg`);
      if (sum > 260) {
        extraFee = 180;
        steps.push("三边合超过260cm，继续计算并加超尺寸费180元");
      }
      return dimensionalResult("全抛", billableWeight, steps, extraFee, extraFee ? "三边和>260cm超尺寸费180元" : "");
    },
    tiers: [tier("带电渠道", 0, null, 38, 10, 500)],
    regionFee: ocsRegionFee,
    finalSurcharge: { fee: 1.5, note: "OCS固定附加费1.5元" },
  },
  {
    id: "ocs-mailbox",
    carrier: "OCS",
    channel: "投函",
    participates: true,
    dimensionalRule: ({ actualWeight, length, width, height }) => {
      if (actualWeight > 1) return unavailableDimensional("重量超过1kg，OCS投函不可选");
      if (!fitsBox(length, width, height, [31.2, 22.8, 3], true)) {
        return unavailableDimensional("尺寸超过31.2cm x 22.8cm x 3cm，OCS投函不可选");
      }
      return dimensionalResult("免抛", actualWeight, ["投函满足尺寸与1kg以内，按实重计费"]);
    },
    tiers: [tier("0-1kg", 0, 1, 16, 3, 500)],
    regionFee: () => noFee("OCS投函全境无偏远"),
    finalSurcharge: { fee: 1.5, note: "OCS固定附加费1.5元" },
  },
  {
    id: "ocs-commercial",
    carrier: "OCS",
    channel: "商业件（大货）",
    manualOnly: true,
    manualReason: "需人工确认",
    manualDetail: "OCS商业件无固定网页报价，需要人工核算确认。",
  },
  {
    id: "yida-sagawa",
    carrier: "义达",
    channel: "义达-佐川",
    participates: true,
    dimensionalRule: ({ sum, actualWeight, length, width, height }) => {
      if (sum < 130) return dimensionalResult("免抛", actualWeight, [`三边合 ${formatNumber(sum)}cm < 130cm，免抛`]);
      if (sum <= 160) {
        const half = halfThrowResult(actualWeight, length, width, height, 6000);
        return dimensionalResult("半抛", half.billableWeight, [
          `三边合 ${formatNumber(sum)}cm 进入130-160cm半抛`,
          ...half.steps,
        ]);
      }
      return manualDimensional("三边和超过160cm，超长费暂时不清楚，需人工确认");
    },
    tiers: [
      tier("0-2kg", 0, 2, 31, 5, 500),
      tier("2-5kg", 2, 5, 31, 5, 500),
      tier("5-10kg", 5, 10, 31, 5.5, 500),
      tier("10-20kg", 10, 20, 31, 6, 500),
    ],
    regionFee: ({ region, chargeWeight }) => {
      if (region === "okinawa") {
        const fee = Math.max(roundUpKg(chargeWeight) * 10, 150);
        return moneyFee(fee, `冲绳偏远费10元/KG，最低150元，按${roundUpKg(chargeWeight)}kg计`);
      }
      return noFee();
    },
  },
  {
    id: "yida-mini",
    carrier: "义达",
    channel: "MINI小包",
    participates: true,
    dimensionalRule: ({ actualWeight, length, width, height }) => {
      if (actualWeight > 2) return unavailableDimensional("重量超过2kg，义达MINI小包不可选");
      if (minSide(length, width, height) > 3) return unavailableDimensional("厚度超过3cm，义达MINI小包不可选");
      return dimensionalResult("免抛", actualWeight, ["厚度3cm以内，按实重计费"]);
    },
    tiers: [tier("0-2kg", 0, 2, 19, 2, 500)],
    regionFee: () => noFee("其它费用需另算，当前只按基础价显示"),
  },
  {
    id: "lindao-sagawa",
    carrier: "林道",
    channel: "林道-佐川",
    participates: true,
    dimensionalRule: ({ sum, actualWeight, length, width, height }) => {
      if (sum < 160) return dimensionalResult("免抛", actualWeight, [`三边合 ${formatNumber(sum)}cm < 160cm，免抛`]);
      if (sum < 260) {
        const billableWeight = fullThrowWeight(actualWeight, length, width, height, 6000);
        return dimensionalResult("全抛", billableWeight, [
          `三边合 ${formatNumber(sum)}cm 进入160-260cm全抛`,
          `体积重 = 长 × 宽 × 高 / 6000 = ${formatNumber(volumeWeight(length, width, height, 6000))}kg`,
          `全抛计费重 = 实重与体积重取较大值 = ${formatNumber(billableWeight)}kg`,
        ]);
      }
      return unavailableDimensional("三边合达到260cm及以上，林道不可选");
    },
    tiers: [tier("0-20kg", 0, 20, 35, 5, 500)],
    regionFee: ({ region }) => {
      if (region === "hokkaido") return moneyFee(50, "北海道偏远费50元/票");
      if (region === "okinawa") return unavailableFee("冲绳不接");
      return noFee();
    },
  },
  {
    id: "lindao-battery",
    carrier: "林道",
    channel: "带电渠道",
    participates: false,
    recommendationNote: "带电渠道只展示，不参与最便宜推荐",
    dimensionalRule: ({ sum, actualWeight, length, width, height }) => {
      if (sum < 160) return dimensionalResult("免抛", actualWeight, [`三边合 ${formatNumber(sum)}cm < 160cm，免抛`]);
      if (sum < 260) {
        const billableWeight = fullThrowWeight(actualWeight, length, width, height, 6000);
        return dimensionalResult("全抛", billableWeight, [
          "带电渠道沿用林道尺寸规则：160-260cm全抛",
          `全抛计费重 = ${formatNumber(billableWeight)}kg`,
        ]);
      }
      return unavailableDimensional("三边合达到260cm及以上，林道带电不可选");
    },
    tiers: [tier("带电渠道", 0, 20, 40, 10, 500)],
    regionFee: ({ region }) => {
      if (region === "hokkaido") return moneyFee(50, "北海道偏远费50元/票");
      if (region === "okinawa") return unavailableFee("冲绳不接");
      return noFee();
    },
  },
  {
    id: "pangu-small",
    carrier: "盘古",
    channel: "电商小包 普货",
    participates: true,
    dimensionalRule: ({ sum, maxSide, actualWeight, length, width, height }) => {
      if (sum > 260) return unavailableDimensional("三边和超过260cm，盘古小包不可发送");
      const extraFee = oversizedPanguFee(maxSide);
      const extraNote = oversizedPanguNote(maxSide, extraFee);
      if (sum < 140) {
        return dimensionalResult("免抛", actualWeight, [`三边合 ${formatNumber(sum)}cm < 140cm，免抛`], extraFee, extraNote);
      }
      const half = halfThrowResult(actualWeight, length, width, height, 6000);
      return dimensionalResult("半抛", half.billableWeight, [
        `三边合 ${formatNumber(sum)}cm 达到140cm，按半抛`,
        ...half.steps,
      ], extraFee, extraNote);
    },
    tiers: [
      tier("0-2kg", 0, 2, 33, 5, 500),
      tier("2-10kg", 2, 10, 34, 5.5, 500),
      tier("10-20kg", 10, 20, 35, 6, 500),
    ],
    fallbackManual: ({ chargeWeight }) => chargeWeight > 20
      ? "实重/计费重20kg以上需单独确认，不参与自动推荐"
      : "",
    regionFee: ({ region, chargeWeight }) => {
      if (region === "okinawa") {
        if (chargeWeight <= 10) return moneyFee(100, "冲绳10kg内按最低偏远附加费100元/票");
        const fee = Math.max(roundUpKg(chargeWeight) * 10, 200);
        return moneyFee(fee, `冲绳超过10kg：10元/KG，最低200元，按${roundUpKg(chargeWeight)}kg计`);
      }
      if (region === "hokkaido") {
        if (chargeWeight <= 10) return noFee("北海道10kg内免费");
        const fee = Math.max(roundUpKg(chargeWeight) * 5, 50);
        return moneyFee(fee, `北海道超过10kg：5元/KG，最低50元，按${roundUpKg(chargeWeight)}kg计`);
      }
      return noFee();
    },
  },
  {
    id: "pangu-post-3cm",
    carrier: "盘古",
    channel: "日本邮政3CM投函件",
    participates: true,
    dimensionalRule: ({ actualWeight, length, width, height }) => {
      if (actualWeight > 1) return unavailableDimensional("重量超过1kg，盘古日本邮政3CM不可选");
      if (!fitsBox(length, width, height, [29.7, 21, 3], true)) {
        return unavailableDimensional("尺寸超过A4纸大小或厚度超过3cm，盘古日本邮政3CM不可选");
      }
      return dimensionalResult("免抛", actualWeight, ["厚3cm内、A4纸大小、1kg以内，按实重计费"]);
    },
    tiers: [tier("0.1-1kg", 0.1, 1, 18, 2, 100)],
    regionFee: () => noFee("日本全国无偏远"),
  },
  {
    id: "sinotrans-sagawa",
    carrier: "中外运",
    channel: "日本佐川经济小包（大件普货）",
    participates: true,
    dimensionalRule: ({ sum, actualWeight, length, width, height }) => {
      let extraFee = 0;
      const steps = [];
      if (sum < 160) {
        steps.push(`三边合 ${formatNumber(sum)}cm < 160cm，免抛`);
        return dimensionalResult("免抛", actualWeight, steps);
      }
      steps.push(`三边合 ${formatNumber(sum)}cm 达到160cm，按半抛`);
      const half = halfThrowResult(actualWeight, length, width, height, 6000);
      steps.push(...half.steps);
      if (sum > 260) {
        extraFee = 200;
        steps.push("三边超过260cm，部分可走并加200元/票");
      }
      return dimensionalResult("半抛", half.billableWeight, steps, extraFee, extraFee ? "三边超过260cm附加200元/票" : "");
    },
    tiers: [
      tier("0-2kg", 0, 2, 33, 5, 500),
      tier("2-5kg", 2, 5, 34, 5.5, 500),
      tier("5-20kg", 5, 20, 35, 6, 500),
      tier("20-30kg", 20, 30, 35, 6.5, 500),
      perKgTier("30-50kg", 30, 50, 15),
    ],
    regionFee: ({ region }) => {
      if (region === "okinawa") return moneyFee(150, "冲绳偏远费150元/票");
      return noFee("普通地区/北海道无额外偏远费");
    },
  },
  {
    id: "sinotrans-mini",
    carrier: "中外运",
    channel: "日本黑猫MINI特快小包（普货）",
    participates: true,
    dimensionalRule: ({ actualWeight, length, width, height }) => {
      if (actualWeight > 1) return unavailableDimensional("重量超过1kg，中外运黑猫MINI不可选");
      const [longest, middle, shortest] = [length, width, height].sort((a, b) => b - a);
      if (!(longest < 30 && middle < 20 && shortest <= 2.5)) {
        return unavailableDimensional("尺寸超过厚<2.5cm、最长边<30cm、宽<20cm，中外运黑猫MINI不可选");
      }
      return dimensionalResult("免抛", actualWeight, ["满足黑猫MINI尺寸与1kg以内，按实重计费"]);
    },
    tiers: [tier("0-1kg", 0, 1, 17, 1.5, 100)],
    regionFee: () => noFee("日本全境无偏远"),
  },
  {
    id: "sinotrans-commercial",
    carrier: "中外运",
    channel: "日本商业件（ERP专用）",
    manualOnly: true,
    manualReason: "需人工确认",
    manualDetail: "中外运商业件需要人工核算确认，网页不自动报价、不参与推荐。",
  },
  {
    id: "sinotrans-pak",
    carrier: "中外运",
    channel: "日本邮政PAK小包（普货）",
    participates: true,
    dimensionalRule: ({ actualWeight }) => {
      if (actualWeight > 3) return unavailableDimensional("重量超过3kg，中外运邮政PAK不可选");
      return dimensionalResult("免抛", actualWeight, ["3kg内指定PAK袋/箱装，按实重计费"]);
    },
    tiers: [tier("0-3kg", 0, 3, 29, 6, 500)],
    regionFee: () => noFee("日本全境无偏远"),
  },
  {
    id: "sf",
    carrier: "顺丰",
    channel: "顺丰",
    participates: true,
    dimensionalRule: ({ sum, maxSide, actualWeight, length, width, height }) => {
      if (sum > 160) return unavailableDimensional("三边和超过160cm，顺丰不可发");
      if (maxSide > 120) return unavailableDimensional("单边超过120cm，顺丰不可发");
      const half = halfThrowResult(actualWeight, length, width, height, 8000);
      return dimensionalResult("半抛", half.billableWeight, [
        "顺丰新标准无免抛尺寸，三边和160cm以内且单边120cm以内按半抛",
        "顺丰抛重系数 = 8000",
        ...half.steps,
      ]);
    },
    tiers: [
      tier("0-2kg", 0, 2, 29, 4, 500),
      tier("2-10kg", 2, 10, 30, 4.5, 500),
      tier("10-30kg", 10, 30, 30, 5, 500),
    ],
    notRecommendedWhen: ({ chargeWeight }) => chargeWeight >= 10 ? "10kg以上不推荐但继续计算" : "",
    regionFee: ({ region }) => {
      if (region === "okinawa") return moneyFee(100, "冲绳偏远费100元/票");
      return noFee();
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
  ocsArea: document.querySelector("#ocs-area"),
  dimensionSum: document.querySelector("#dimension-sum"),
  volumeWeight: document.querySelector("#volume-weight"),
  regionKind: document.querySelector("#region-kind"),
  bestCard: document.querySelector("#best-card"),
  resultsBody: document.querySelector("#results-body"),
  mobileResults: document.querySelector("#mobile-results"),
  details: document.querySelector("#calculation-details"),
};

function init() {
  populatePrefectures();
  elements.form.addEventListener("input", calculateAndRender);
  elements.prefecture.addEventListener("change", calculateAndRender);
  elements.ocsArea.addEventListener("change", calculateAndRender);
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
  elements.ocsArea.value = "normal";
  calculateAndRender();
}

function calculateAndRender() {
  const input = getInput();
  updateMetrics(input);

  if (!input.valid) {
    renderEmpty();
    return;
  }

  const rows = channelRules.map((channel) => calculateChannel(channel, input));
  const recommended = chooseRecommended(rows);
  const sortedRows = sortRows(rows, recommended);
  renderBest(recommended, rows);
  renderTable(sortedRows, recommended);
  renderCards(sortedRows, recommended);
  renderDetails(sortedRows, recommended);
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
    ocsArea: elements.ocsArea.value,
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
    elements.volumeWeight.textContent = `${formatNumber(volumeWeight(input.length, input.width, input.height, 6000))} kg`;
  }
  elements.regionKind.textContent = regionName(input.region);
}

function calculateChannel(channel, input) {
  const displayName = `${channel.carrier} ${channel.channel}`;
  const baseSteps = [
    `三边合 ${formatNumber(input.length + input.width + input.height)}cm，最大边 ${formatNumber(Math.max(input.length, input.width, input.height))}cm，实重 ${formatNumber(input.actualWeight)}kg`,
  ];

  if (channel.manualOnly) {
    return manualRow(channel, channel.manualReason || "需人工确认", [channel.manualDetail || "该渠道需人工核算确认。", ...baseSteps]);
  }

  const dimensions = {
    length: input.length,
    width: input.width,
    height: input.height,
    actualWeight: input.actualWeight,
    sum: input.length + input.width + input.height,
    maxSide: Math.max(input.length, input.width, input.height),
  };

  const dimensional = channel.dimensionalRule(dimensions);
  const steps = [...baseSteps, ...dimensional.steps];

  if (dimensional.unavailable) {
    return unavailableRow(channel, dimensional.unavailable, steps);
  }

  if (dimensional.manual) {
    return manualRow(channel, dimensional.manual, steps);
  }

  const billableWeight = dimensional.directBillableWeight
    ? dimensional.billableWeight
    : Math.max(input.actualWeight, dimensional.billableWeight);
  const tierBasisWeight = dimensional.tierBasisWeight ?? billableWeight;
  const tierInfo = resolveTier(channel, tierBasisWeight);

  if (tierInfo.manual) {
    return manualRow(channel, tierInfo.manual, [...steps, `计费重 ${formatNumber(billableWeight)}kg，${tierInfo.manual}`]);
  }

  if (!tierInfo.tier) {
    return unavailableRow(channel, "超过可选重量范围", [...steps, `计费重 ${formatNumber(billableWeight)}kg，未匹配到表格重量段`], {
      billableWeight,
      method: dimensional.mode,
    });
  }

  const price = calculatePrice(tierInfo.tier, billableWeight, tierInfo.tierWeight);
  const regionFee = channel.regionFee ? channel.regionFee({
    region: input.region,
    ocsArea: input.ocsArea,
    chargeWeight: price.chargeWeight,
    billableWeight,
  }) : noFee();

  if (regionFee.unavailable) {
    return unavailableRow(channel, regionFee.note, [...steps, regionFee.note], {
      billableWeight,
      chargeWeight: price.chargeWeight,
      method: dimensional.mode,
      tier: tierInfo.tier,
    });
  }

  if (regionFee.manual) {
    return manualRow(channel, regionFee.note, [
      ...steps,
      ...price.steps,
      `基础运费 ${formatCurrency(price.baseFreight)}；${regionFee.note}`,
    ], {
      billableWeight,
      chargeWeight: price.chargeWeight,
      method: dimensional.mode,
      tier: tierInfo.tier,
      baseFreight: price.baseFreight,
    });
  }

  const extraItems = [];
  if (dimensional.extraFee) extraItems.push({ fee: dimensional.extraFee, note: dimensional.extraNote || "尺寸附加费" });
  if (regionFee.fee) extraItems.push({ fee: regionFee.fee, note: regionFee.note });
  if (channel.finalSurcharge?.fee) extraItems.push(channel.finalSurcharge);

  const extraFee = roundCurrency(extraItems.reduce((sum, item) => sum + item.fee, 0));
  const total = roundCurrency(price.baseFreight + extraFee);
  const warnings = [];

  if (!channel.participates && channel.recommendationNote) warnings.push(channel.recommendationNote);
  if (channel.notRecommendedWhen) {
    const note = channel.notRecommendedWhen({ chargeWeight: price.chargeWeight, billableWeight, input });
    if (note) warnings.push(note);
  }
  if (regionFee.warn && regionFee.note) warnings.push(regionFee.note);

  const isWarn = warnings.length > 0 || !channel.participates;
  const statusText = !channel.participates ? "不参与推荐" : isWarn ? "不推荐" : "可选";
  const allSteps = [
    ...steps,
    `重量段匹配：${formatNumber(tierInfo.tierWeight)}kg 匹配 ${tierInfo.tier.label}`,
    ...price.steps,
  ];

  if (extraItems.length) {
    allSteps.push(`附加费：${extraItems.map((item) => `${item.note} ${formatCurrency(item.fee)}`).join("；")}`);
  } else if (regionFee.note) {
    allSteps.push(`附加费：${regionFee.note}`);
  } else {
    allSteps.push("附加费：无");
  }
  allSteps.push(`合计：${formatCurrency(price.baseFreight)} + ${formatCurrency(extraFee)} = ${formatCurrency(total)}`);

  return {
    id: channel.id,
    carrier: channel.carrier,
    channel: channel.channel,
    displayName,
    status: isWarn ? "warn" : "ok",
    statusText,
    eligible: channel.participates && !isWarn,
    hasPrice: true,
    tier: tierInfo.tier,
    billableWeight,
    chargeWeight: price.chargeWeight,
    method: dimensional.mode,
    rateLabel: price.rateLabel,
    baseFreight: price.baseFreight,
    extraFee,
    total,
    warnings,
    steps: allSteps,
  };
}

function resolveTier(channel, billableWeight) {
  const defaultUnit = defaultUnitKg(channel.tiers);
  const tierWeight = ceilToUnit(billableWeight, defaultUnit);
  const fallbackManual = channel.fallbackManual ? channel.fallbackManual({ chargeWeight: tierWeight, billableWeight }) : "";
  if (fallbackManual) return { manual: fallbackManual, tierWeight };

  for (let index = 0; index < channel.tiers.length; index += 1) {
    const previous = channel.tiers[index - 1];
    const current = channel.tiers[index];
    const next = channel.tiers[index + 1];
    if (matchesTier(previous, current, next, tierWeight)) return { tier: current, tierWeight };
  }
  return { tier: null, tierWeight };
}

function matchesTier(previous, current, next, weight) {
  const min = effectiveTierMin(previous, current);
  const lowerOk = weight + 1e-9 >= min;
  if (!lowerOk) return false;
  if (current.max === null || current.max === undefined) return true;

  const max = Number(current.max);
  const nextStartsAtMax = next && Math.abs(Number(next.min || 0) - max) < 1e-9;
  const exactBoundaryGoesNext = BOUNDARY_TO_NEXT_TIER.has(max);
  if (nextStartsAtMax || exactBoundaryGoesNext) return weight < max - 1e-9;
  return weight <= max + 1e-9;
}

function effectiveTierMin(previous, current) {
  const min = Number(current.min || 0);
  if (!previous || previous.max === null || previous.max === undefined) return min;
  const previousMax = Number(previous.max);
  if (BOUNDARY_TO_NEXT_TIER.has(previousMax) && min > previousMax) return previousMax;
  return min;
}

function calculatePrice(tierConfig, billableWeight, tierWeight) {
  if (tierConfig.perKg) {
    const chargeWeight = roundUpKg(billableWeight);
    const baseFreight = roundCurrency(chargeWeight * tierConfig.perKg);
    return {
      chargeWeight,
      baseFreight,
      rateLabel: `${formatCurrency(tierConfig.perKg)}/KG`,
      steps: [
        `按KG向上取整：${formatNumber(billableWeight)}kg -> ${formatNumber(chargeWeight)}kg`,
        `运费 = ${formatCurrency(tierConfig.perKg)} × ${formatNumber(chargeWeight)} = ${formatCurrency(baseFreight)}`,
      ],
    };
  }

  const unitKg = tierConfig.unitG / 1000;
  const chargeWeight = Math.max(ceilToUnit(billableWeight, unitKg), unitKg);
  const unitCount = Math.max(1, Math.round(chargeWeight / unitKg));
  const continuationCount = Math.max(0, unitCount - 1);
  const continuationAmount = roundCurrency(continuationCount * tierConfig.step);
  const baseFreight = roundCurrency(tierConfig.base + continuationAmount);
  return {
    chargeWeight,
    baseFreight,
    rateLabel: `首重${formatCurrency(tierConfig.base)} + 续重${formatCurrency(tierConfig.step)}/${tierConfig.unitG}g`,
    steps: [
      `按${tierConfig.unitG}g向上取整：${formatNumber(billableWeight)}kg -> ${formatNumber(chargeWeight)}kg`,
      `首重 ${formatCurrency(tierConfig.base)}，续重次数 ${continuationCount}`,
      `续重金额 = ${formatCurrency(tierConfig.step)} × ${continuationCount} = ${formatCurrency(continuationAmount)}`,
      `基础运费 = ${formatCurrency(tierConfig.base)} + ${formatCurrency(continuationAmount)} = ${formatCurrency(baseFreight)}`,
    ],
    tierWeight,
  };
}

function chooseRecommended(rows) {
  return rows
    .filter((row) => row.hasPrice && row.eligible)
    .reduce((best, row) => (!best || row.total < best.total ? row : best), null);
}

function sortRows(rows, recommended) {
  const statusRank = { ok: 0, warn: 1, manual: 2, off: 3 };
  return [...rows].sort((a, b) => {
    if (recommended) {
      if (a.id === recommended.id) return -1;
      if (b.id === recommended.id) return 1;
    }
    if (a.hasPrice !== b.hasPrice) return a.hasPrice ? -1 : 1;
    if (a.hasPrice && b.hasPrice && a.total !== b.total) return a.total - b.total;
    const rankDiff = (statusRank[a.status] || 9) - (statusRank[b.status] || 9);
    if (rankDiff) return rankDiff;
    return a.displayName.localeCompare(b.displayName, "zh-CN");
  });
}

function renderEmpty() {
  elements.bestCard.className = "best-card empty";
  elements.bestCard.innerHTML = "<span>输入包裹规格后自动核算</span>";
  elements.resultsBody.innerHTML = '<tr><td colspan="7" class="empty-row">等待输入包裹规格</td></tr>';
  elements.mobileResults.innerHTML = "";
  elements.details.innerHTML = '<p class="empty-row">等待输入包裹规格</p>';
}

function renderBest(recommended, rows) {
  if (!recommended) {
    elements.bestCard.className = "best-card empty";
    elements.bestCard.innerHTML = "<span>当前规格没有可自动推荐的报价</span>";
    return;
  }

  const quotedCount = rows.filter((row) => row.hasPrice).length;
  elements.bestCard.className = "best-card";
  elements.bestCard.innerHTML = `
    <div class="carrier">${escapeHtml(recommended.carrier)}</div>
    <div class="channel">${escapeHtml(recommended.channel)}</div>
    <div class="price">${formatCurrency(recommended.total)}</div>
    <div class="subline">${recommended.method}，收费重 ${formatNumber(recommended.chargeWeight)}kg。共 ${quotedCount} 个已报价渠道。</div>
  `;
}

function renderTable(rows, recommended) {
  elements.resultsBody.innerHTML = rows.map((row) => `
    <tr class="${recommended && row.id === recommended.id ? "best-row" : ""}">
      <td class="carrier-cell">
        <strong>${escapeHtml(row.carrier)}</strong>
        <span>${escapeHtml(row.channel)}</span>
      </td>
      <td>${statusBadge(row)}${notesMarkup(row)}</td>
      <td>${row.tier ? escapeHtml(row.tier.label) : "--"}</td>
      <td>${row.chargeWeight ? `${formatNumber(row.chargeWeight)} kg` : row.billableWeight ? `${formatNumber(row.billableWeight)} kg` : "--"}${row.method ? `<div class="muted">${escapeHtml(row.method)}</div>` : ""}</td>
      <td>${row.rateLabel || "--"}</td>
      <td>${row.hasPrice ? formatCurrency(row.extraFee || 0) : "--"}</td>
      <td class="price-cell">${row.hasPrice ? formatCurrency(row.total) : "--"}</td>
    </tr>
  `).join("");
}

function renderCards(rows, recommended) {
  elements.mobileResults.innerHTML = rows.map((row) => `
    <article class="result-card ${recommended && row.id === recommended.id ? "best-card-row" : ""}">
      <div class="card-head">
        <div>
          <div class="card-name">${escapeHtml(row.carrier)}</div>
          <div class="card-channel">${escapeHtml(row.channel)}</div>
          ${statusBadge(row)}
        </div>
        <div class="card-price">${row.hasPrice ? formatCurrency(row.total) : "--"}</div>
      </div>
      <div class="card-line"><span>重量档</span><strong>${row.tier ? escapeHtml(row.tier.label) : "--"}</strong></div>
      <div class="card-line"><span>计费重</span><strong>${row.chargeWeight ? `${formatNumber(row.chargeWeight)} kg` : row.billableWeight ? `${formatNumber(row.billableWeight)} kg` : "--"}</strong></div>
      <div class="card-line"><span>计费方式</span><strong>${row.rateLabel || "--"}</strong></div>
      <div class="card-line"><span>附加费</span><strong>${row.hasPrice ? formatCurrency(row.extraFee || 0) : "--"}</strong></div>
      ${row.warnings.length ? `<div class="card-line"><span>备注</span><strong>${escapeHtml(row.warnings.join("；"))}</strong></div>` : ""}
    </article>
  `).join("");
}

function renderDetails(rows, recommended) {
  elements.details.innerHTML = rows.map((row) => `
    <article class="detail-card ${recommended && row.id === recommended.id ? "best-detail" : ""}">
      <div class="detail-head">
        <div>
          <strong>${escapeHtml(row.carrier)}</strong>
          <span>${escapeHtml(row.channel)}</span>
        </div>
        ${statusBadge(row)}
      </div>
      <ol class="step-list">
        ${row.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
      </ol>
    </article>
  `).join("");
}

function statusBadge(row) {
  return `<span class="badge ${row.status}">${escapeHtml(row.statusText)}</span>`;
}

function notesMarkup(row) {
  if (!row.warnings?.length) return "";
  return `<div class="muted">${escapeHtml(row.warnings.join("；"))}</div>`;
}

function unavailableRow(channel, reason, steps = [], partial = {}) {
  return {
    id: channel.id,
    carrier: channel.carrier,
    channel: channel.channel,
    displayName: `${channel.carrier} ${channel.channel}`,
    status: "off",
    statusText: "不可选",
    eligible: false,
    hasPrice: false,
    warnings: [reason],
    steps: steps[steps.length - 1] === reason ? steps : [...steps, reason],
    ...partial,
  };
}

function manualRow(channel, reason, steps = [], partial = {}) {
  return {
    id: channel.id,
    carrier: channel.carrier,
    channel: channel.channel,
    displayName: `${channel.carrier} ${channel.channel}`,
    status: "manual",
    statusText: "需人工确认",
    eligible: false,
    hasPrice: false,
    warnings: [reason],
    steps: steps.length ? steps : [reason],
    ...partial,
  };
}

function dimensionalResult(mode, billableWeight, steps, extraFee = 0, extraNote = "", options = {}) {
  return { mode, billableWeight, steps, extraFee, extraNote, ...options };
}

function unavailableDimensional(reason) {
  return { unavailable: reason, steps: [reason] };
}

function manualDimensional(reason) {
  return { manual: reason, steps: [reason] };
}

function moneyFee(fee, note) {
  return { fee: roundCurrency(fee), note };
}

function noFee(note = "", warn = false) {
  return { fee: 0, note, warn };
}

function ocsRegionFee({ ocsArea, chargeWeight }) {
  if (ocsArea === "remote") {
    const roundedKg = roundUpKg(chargeWeight);
    const fee = Math.max(roundedKg * 12, 15);
    return moneyFee(fee, `日本B2C偏远地区：12元/KG，最低15元，按${roundedKg}kg计`);
  }
  if (ocsArea === "out-of-area") {
    const roundedKg = roundUpKg(chargeWeight);
    const fee = Math.max(roundedKg * 18, 30);
    return moneyFee(fee, `日本B2C超范围派送：18元/KG，最低30元，按${roundedKg}kg计`);
  }
  return noFee("OCS偏远/超范围按邮编判断，当前选择普通邮编");
}

function manualFee(note) {
  return { manual: true, note };
}

function unavailableFee(note) {
  return { unavailable: true, note };
}

function tier(label, min, max, base, step, unitG) {
  return { label, min, max, base, step, unitG };
}

function perKgTier(label, min, max, perKg) {
  return { label, min, max, perKg };
}

function defaultUnitKg(tiers) {
  const firstUnitTier = tiers.find((item) => item.unitG);
  return firstUnitTier ? firstUnitTier.unitG / 1000 : 1;
}

function volumeWeight(length, width, height, divisor) {
  return (length * width * height) / divisor;
}

function fullThrowWeight(actualWeight, length, width, height, divisor) {
  return Math.max(actualWeight, volumeWeight(length, width, height, divisor));
}

function halfThrowResult(actualWeight, length, width, height, divisor) {
  const volumetricWeight = volumeWeight(length, width, height, divisor);
  const rawHalfWeight = (volumetricWeight + actualWeight) / 2;
  const billableWeight = Math.max(rawHalfWeight, actualWeight);
  return {
    billableWeight,
    steps: [
      `半抛原值 = (${formatNumber(volumetricWeight)} + ${formatNumber(actualWeight)}) / 2 = ${formatNumber(rawHalfWeight)}kg`,
      `半抛计费重 = 半抛原值与实重取较大值 = ${formatNumber(billableWeight)}kg`,
    ],
  };
}

function halfThrowWeight(actualWeight, length, width, height, divisor) {
  return halfThrowResult(actualWeight, length, width, height, divisor).billableWeight;
}

function ceilToUnit(value, unit) {
  return roundCurrency(Math.ceil((value - 1e-9) / unit) * unit);
}

function roundUpKg(weight) {
  return Math.ceil(weight - 1e-9);
}

function oversizedPanguFee(maxSide) {
  let fee = 0;
  if (maxSide > 160) fee += 30;
  if (maxSide > 200) fee += 60;
  return fee;
}

function oversizedPanguNote(maxSide, fee) {
  if (!fee) return "";
  if (maxSide > 200) return "单边超过160cm加30元，超过200cm额外加60元";
  return "单边超过160cm加30元";
}

function fitsBox(length, width, height, limits, inclusive) {
  const sides = [length, width, height].sort((a, b) => b - a);
  const sortedLimits = [...limits].sort((a, b) => b - a);
  return sides.every((side, index) => inclusive
    ? side <= sortedLimits[index] + 1e-9
    : side < sortedLimits[index] - 1e-9);
}

function minSide(length, width, height) {
  return Math.min(length, width, height);
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
  return Math.round((value + Number.EPSILON) * 100) / 100;
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
