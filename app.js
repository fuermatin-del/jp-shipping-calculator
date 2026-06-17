(function () {
  const builtInTemplates = (window.MAIL_TEMPLATE_DATA || []).filter(isVisibleTemplate);
  const storageKey = "amazonJpMailTemplates.custom.v2";
  let customTemplates = loadCustomTemplates();
  let templates = mergeTemplates(builtInTemplates, customTemplates);
  const state = {
    category: "all",
    tone: "all",
    search: "",
    selectedId: templates[0]?.id || null,
    variantIndex: 0,
    variables: {},
    matchResult: null,
    autoTimer: null
  };

  const elements = {
    searchInput: document.querySelector("#searchInput"),
    categoryFilters: document.querySelector("#categoryFilters"),
    toneSelect: document.querySelector("#toneSelect"),
    templateList: document.querySelector("#templateList"),
    resultCount: document.querySelector("#resultCount"),
    currentCategory: document.querySelector("#currentCategory"),
    templateMeta: document.querySelector("#templateMeta"),
    templateTitle: document.querySelector("#templateTitle"),
    variantButton: document.querySelector("#variantButton"),
    buyerMessage: document.querySelector("#buyerMessage"),
    analyzeButton: document.querySelector("#analyzeButton"),
    matchPanel: document.querySelector("#matchPanel"),
    humanLineSelect: document.querySelector("#humanLineSelect"),
    chineseDraft: document.querySelector("#chineseDraft"),
    customLine: document.querySelector("#customLine"),
    replyOutput: document.querySelector("#replyOutput"),
    checklist: document.querySelector("#checklist"),
    copyButton: document.querySelector("#copyButton"),
    importInput: document.querySelector("#importInput"),
    exportButton: document.querySelector("#exportButton"),
    resetImportButton: document.querySelector("#resetImportButton"),
    clearButton: document.querySelector("#clearButton"),
    toast: document.querySelector("#toast"),
    variableInputs: Array.from(document.querySelectorAll("[data-var]"))
  };

  const toneLabels = {
    standard: "标准",
    apology: "郑重道歉",
    firm: "规则说明",
    warm: "温和安抚"
  };

  const fallbackValues = {
    buyerName: "お客様",
    productName: "ご注文商品",
    orderId: "ご注文番号",
    date: "確認後",
    action: "状況に応じた対応",
    partName: "該当部品",
    refundAmount: "返金額",
    carrier: "配送業者",
    trackingNumber: "",
    returnAddress: "返品先住所"
  };

  const smartRules = [
    {
      label: "商品破损/不良",
      categories: ["商品不良", "规格差异"],
      keywords: ["破損", "割れ", "割れて", "ヒビ", "亀裂", "壊れ", "不良", "傷", "凹み", "歪み", "錆", "塗装", "破损", "坏", "裂", "碎"]
    },
    {
      label: "返品返金",
      categories: ["返品返金", "返金通知"],
      keywords: ["返品", "返金", "全額返金", "返品したい", "返金して", "キャンセル", "着払い", "送料", "退款", "退货", "退回", "到付"]
    },
    {
      label: "配送异常",
      categories: ["配送"],
      keywords: ["届かない", "未着", "配達", "配送", "発送", "追跡", "追跡番号", "不在", "保管", "住所", "受取", "返送", "没收到", "物流", "快递"]
    },
    {
      label: "部品/补发",
      categories: ["補修部品", "部品不足"],
      keywords: ["部品", "パーツ", "ネジ", "板", "パネル", "キャスター", "不足", "入っていない", "再発送", "送って", "缺件", "配件", "补发"]
    },
    {
      label: "使用方法",
      categories: ["使用方法"],
      keywords: ["説明書", "組み立て", "組立", "取り付け", "使い方", "方法", "安装", "说明书", "组装"]
    },
    {
      label: "评价合规",
      categories: ["评价合规", "不满安抚"],
      keywords: ["レビュー", "評価", "星", "悪い評価", "低評価", "差评", "评价"]
    },
    {
      label: "申诉/A-to-z",
      categories: ["不满安抚", "返品返金"],
      keywords: ["A-to-z", "クレーム", "保証申請", "Amazon介入", "申诉", "索赔"]
    }
  ];

  function isVisibleTemplate(template) {
    return template && String(template.category || "").trim().toLowerCase() !== "english";
  }

  function loadCustomTemplates() {
    try {
      const saved = window.localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter(isVisibleTemplate) : [];
    } catch (error) {
      return [];
    }
  }

  function saveCustomTemplates() {
    window.localStorage.setItem(storageKey, JSON.stringify(customTemplates));
  }

  function mergeTemplates(baseTemplates, extraTemplates) {
    const byId = new Map();
    [...baseTemplates, ...extraTemplates].filter(isVisibleTemplate).forEach((template) => {
      if (template && template.id) {
        byId.set(template.id, template);
      }
    });
    return Array.from(byId.values());
  }

  function asTextArray(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  function normalizeTemplate(template, index) {
    const title = String(template.title || "").trim();
    const category = String(template.category || "").trim();
    const variants = asTextArray(template.variants);
    if (!title || !category || !variants.length) {
      throw new Error(`第 ${index + 1} 条模板缺少 title、category 或 variants`);
    }

    const id = String(template.id || `${category}-${title}-${index + 1}`)
      .trim()
      .replace(/\s+/g, "-");

    return {
      id,
      category,
      tone: toneLabels[template.tone] ? template.tone : "standard",
      title,
      summary: String(template.summary || "导入模板").trim(),
      keywords: asTextArray(template.keywords),
      checklist: asTextArray(template.checklist),
      humanLines: asTextArray(template.humanLines),
      variants
    };
  }

  function extractTemplatesFromJson(json) {
    const rawTemplates = Array.isArray(json) ? json : json.templates;
    if (!Array.isArray(rawTemplates)) {
      throw new Error("模板文件需要是数组，或包含 templates 数组");
    }
    return rawTemplates.map(normalizeTemplate).filter(isVisibleTemplate);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function uniqueCategories() {
    return ["all", ...new Set(templates.map((template) => template.category))];
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getSelectedTemplate() {
    return templates.find((template) => template.id === state.selectedId) || templates[0];
  }

  function formatBuyerName(value) {
    const name = String(value || "").trim();
    if (!name) {
      return fallbackValues.buyerName;
    }
    if (/様$|さま$|さん$|殿$/.test(name)) {
      return name;
    }
    return `${name}様`;
  }

  function getFilteredTemplates() {
    const query = normalize(state.search);
    return templates.filter((template) => {
      const matchesCategory = state.category === "all" || template.category === state.category;
      const matchesTone = state.tone === "all" || template.tone === state.tone;
      const haystack = [
        template.title,
        template.summary,
        template.category,
        template.tone,
        ...(template.keywords || []),
        ...(template.humanLines || []),
        ...(template.variants || [])
      ].join(" ").toLowerCase();
      return matchesCategory && matchesTone && (!query || haystack.includes(query));
    });
  }

  function countHits(message, keywords) {
    const normalizedMessage = normalize(message);
    return keywords.filter((keyword) => normalizedMessage.includes(normalize(keyword)));
  }

  function getRiskNotice(message) {
    const risks = [];
    if (countHits(message, ["レビュー", "評価", "星", "差评", "评价"]).length) {
      risks.push("评价相关：不要要求买家删除、撤销或修改评价，也不要用返金/补发交换评价。");
    }
    if (countHits(message, ["A-to-z", "クレーム", "保証申請", "申诉", "索赔"]).length) {
      risks.push("A-to-z/申诉相关：只按平台状态说明，不要要求买家撤销申诉作为处理条件。");
    }
    if (countHits(message, ["銀行", "口座", "银行卡", "银行账号"]).length) {
      risks.push("银行账号相关：不要接收或使用私人银行账号，返金应走 Amazon 原订单/原支付方式。");
    }
    if (countHits(message, ["電話", "住所", "邮箱", "メール", "地址", "手机号"]).length) {
      risks.push("个人信息相关：按 Amazon 站内规则处理，不主动索要站外联系方式。");
    }
    return risks;
  }

  function scoreTemplate(template, message) {
    const templateText = normalize([
      template.category,
      template.title,
      template.summary,
      ...(template.keywords || []),
      ...(template.checklist || [])
    ].join(" "));
    let score = 0;
    const matched = new Set();

    (template.keywords || []).forEach((keyword) => {
      if (normalize(message).includes(normalize(keyword))) {
        score += 24;
        matched.add(keyword);
      }
    });

    smartRules.forEach((rule) => {
      const hits = countHits(message, rule.keywords);
      if (!hits.length) {
        return;
      }
      hits.slice(0, 6).forEach((hit) => matched.add(hit));
      if (rule.categories.includes(template.category)) {
        score += 18 * hits.length;
      }
      if (rule.categories.some((category) => templateText.includes(normalize(category)))) {
        score += 8 * hits.length;
      }
      if (templateText.includes(normalize(rule.label))) {
        score += 6 * hits.length;
      }
    });

    if (templateText.includes("写真") && countHits(message, ["写真", "画像", "添付", "撮影"]).length) {
      score += 18;
      matched.add("写真");
    }
    if (templateText.includes("着払い") && countHits(message, ["着払い", "送料", "集荷"]).length) {
      score += 20;
      matched.add("着払い");
    }

    return { score, matchedKeywords: Array.from(matched).slice(0, 8) };
  }

  function findBestTemplate(message) {
    const scored = templates
      .map((template) => ({ template, ...scoreTemplate(template, message) }))
      .sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (!best || best.score <= 0) {
      return null;
    }
    return {
      ...best,
      confidence: best.score >= 70 ? "高" : best.score >= 35 ? "中" : "低",
      risks: getRiskNotice(message)
    };
  }

  function renderMatchPanel() {
    if (!elements.matchPanel) {
      return;
    }
    const result = state.matchResult;
    const message = elements.buyerMessage?.value.trim() || "";
    if (!message) {
      elements.matchPanel.innerHTML = "<p>粘贴买家消息后，会根据内置历史话术自动匹配最接近的模板。</p>";
      return;
    }
    if (!result) {
      elements.matchPanel.innerHTML = "<p>暂未匹配到明显场景。可以继续手动搜索模板，或补充更多买家消息。</p>";
      return;
    }
    const keywordHtml = result.matchedKeywords.length
      ? `<div class="match-tags">${result.matchedKeywords.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div>`
      : "";
    const riskHtml = result.risks.length
      ? `<p class="risk-text">${escapeHtml(result.risks.join(" "))}</p>`
      : "<p>未发现明显高风险关键词，发送前仍请按订单实际情况确认。</p>";
    elements.matchPanel.innerHTML = `
      <p><strong>匹配模板：</strong>${escapeHtml(result.template.title)}</p>
      <p><strong>识别场景：</strong>${escapeHtml(result.template.category)} · 匹配度 ${escapeHtml(result.confidence)}</p>
      ${keywordHtml}
      ${riskHtml}
    `;
  }

  function analyzeBuyerMessage(showNotice = true) {
    const message = elements.buyerMessage.value.trim();
    if (!message) {
      state.matchResult = null;
      renderMatchPanel();
      if (showNotice) {
        showToast("请先粘贴买家消息");
      }
      return;
    }
    const result = findBestTemplate(message);
    state.matchResult = result;
    if (result) {
      state.category = "all";
      state.tone = "all";
      state.search = "";
      state.selectedId = result.template.id;
      state.variantIndex = 0;
      elements.searchInput.value = "";
      elements.toneSelect.value = "all";
      render();
      if (showNotice) {
        showToast("已匹配最接近模板");
      }
      return;
    }
    renderMatchPanel();
    if (showNotice) {
      showToast("未找到明显匹配");
    }
  }

  function replaceVariables(text) {
    return text.replace(/【(\w+)】/g, (_, key) => {
      const rawValue = state.variables[key] || fallbackValues[key] || "";
      const value = key === "buyerName" ? formatBuyerName(rawValue) : rawValue;
      return value ? value : "";
    });
  }

  function cleanReply(text) {
    return text
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim();
  }

  function buildReply() {
    const template = getSelectedTemplate();
    if (!template) {
      return "";
    }

    const variant = template.variants[state.variantIndex % template.variants.length] || "";
    const humanLine = elements.humanLineSelect.value || "";
    const customLine = elements.customLine.value.trim();
    const insertion = [humanLine, customLine].filter(Boolean).join("\n");
    const body = replaceVariables(variant);

    if (!insertion) {
      return cleanReply(body);
    }

    const parts = body.split("\n\n");
    parts.splice(Math.min(2, parts.length), 0, insertion);
    return cleanReply(parts.join("\n\n"));
  }

  function renderCategories() {
    elements.categoryFilters.innerHTML = "";
    uniqueCategories().forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `chip${state.category === category ? " active" : ""}`;
      button.textContent = category === "all" ? "全部" : category;
      button.addEventListener("click", () => {
        state.category = category;
        const filtered = getFilteredTemplates();
        state.selectedId = filtered[0]?.id || null;
        state.variantIndex = 0;
        state.matchResult = null;
        render();
      });
      elements.categoryFilters.appendChild(button);
    });
  }

  function renderTemplateList() {
    const filtered = getFilteredTemplates();
    elements.resultCount.textContent = `${filtered.length} 件`;
    elements.currentCategory.textContent = state.category === "all" ? "全部模板" : `${state.category}模板`;
    elements.templateList.innerHTML = "";

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "没有匹配的模板";
      elements.templateList.appendChild(empty);
      return;
    }

    if (!filtered.some((template) => template.id === state.selectedId)) {
      state.selectedId = filtered[0].id;
      state.variantIndex = 0;
    }

    filtered.forEach((template) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `template-card${template.id === state.selectedId ? " active" : ""}`;
      button.innerHTML = `
        <div class="tag-row">
          <span class="tag">${escapeHtml(template.category)}</span>
          <span class="tag">${escapeHtml(toneLabels[template.tone] || template.tone)}</span>
        </div>
        <h3>${escapeHtml(template.title)}</h3>
        <p>${escapeHtml(template.summary)}</p>
      `;
      button.addEventListener("click", () => {
        state.selectedId = template.id;
        state.variantIndex = 0;
        state.matchResult = null;
        render();
      });
      elements.templateList.appendChild(button);
    });
  }

  function renderReplyPanel() {
    const template = getSelectedTemplate();
    if (!template) {
      elements.templateMeta.textContent = "没有可用模板";
      elements.templateTitle.textContent = "回复预览";
      elements.replyOutput.value = "";
      elements.checklist.innerHTML = "";
      return;
    }

    elements.templateMeta.textContent = `${template.category} · ${toneLabels[template.tone] || template.tone}`;
    elements.templateTitle.textContent = template.title;

    const previousHumanLine = elements.humanLineSelect.value;
    elements.humanLineSelect.innerHTML = "";
    const blankOption = document.createElement("option");
    blankOption.value = "";
    blankOption.textContent = "不添加";
    elements.humanLineSelect.appendChild(blankOption);
    template.humanLines.forEach((line) => {
      const option = document.createElement("option");
      option.value = line;
      option.textContent = line;
      elements.humanLineSelect.appendChild(option);
    });
    elements.humanLineSelect.value = template.humanLines.includes(previousHumanLine)
      ? previousHumanLine
      : template.humanLines[0] || "";

    elements.replyOutput.value = buildReply();
    elements.checklist.innerHTML = "";
    template.checklist.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      elements.checklist.appendChild(li);
    });
  }

  function render() {
    renderCategories();
    renderTemplateList();
    renderReplyPanel();
    renderMatchPanel();
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    window.setTimeout(() => elements.toast.classList.remove("show"), 1800);
  }

  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    const filtered = getFilteredTemplates();
    state.selectedId = filtered[0]?.id || null;
    state.variantIndex = 0;
    state.matchResult = null;
    render();
  });

  elements.toneSelect.addEventListener("change", (event) => {
    state.tone = event.target.value;
    const filtered = getFilteredTemplates();
    state.selectedId = filtered[0]?.id || null;
    state.variantIndex = 0;
    state.matchResult = null;
    render();
  });

  elements.analyzeButton.addEventListener("click", () => {
    analyzeBuyerMessage(true);
  });

  elements.buyerMessage.addEventListener("input", () => {
    window.clearTimeout(state.autoTimer);
    state.autoTimer = window.setTimeout(() => {
      if (elements.buyerMessage.value.trim().length >= 6) {
        analyzeBuyerMessage(false);
      } else {
        state.matchResult = null;
        renderMatchPanel();
      }
    }, 450);
  });

  elements.variableInputs.forEach((input) => {
    input.addEventListener("input", () => {
      state.variables[input.dataset.var] = input.value.trim();
      elements.replyOutput.value = buildReply();
    });
  });

  elements.humanLineSelect.addEventListener("change", () => {
    elements.replyOutput.value = buildReply();
  });

  elements.customLine.addEventListener("input", () => {
    elements.replyOutput.value = buildReply();
  });

  elements.chineseDraft.addEventListener("input", () => {
    elements.customLine.placeholder = elements.chineseDraft.value.trim()
      ? "AI接口接入后会自动生成日文译文；当前请在这里手动输入要插入的日文补充。"
      : "AI接口接入后，这里会根据中文补充自动生成日文；现在也可以直接输入日文补充。";
  });

  elements.variantButton.addEventListener("click", () => {
    const template = getSelectedTemplate();
    if (!template) {
      return;
    }
    state.variantIndex = (state.variantIndex + 1) % template.variants.length;
    elements.replyOutput.value = buildReply();
    showToast("已切换表达");
  });

  elements.copyButton.addEventListener("click", async () => {
    elements.replyOutput.select();
    try {
      await navigator.clipboard.writeText(elements.replyOutput.value);
      showToast("已复制");
    } catch (error) {
      document.execCommand("copy");
      showToast("已复制");
    }
  });

  elements.importInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const importedTemplates = extractTemplatesFromJson(JSON.parse(text));
      const importedIds = new Set(importedTemplates.map((template) => template.id));
      customTemplates = [
        ...customTemplates.filter((template) => !importedIds.has(template.id)),
        ...importedTemplates
      ];
      saveCustomTemplates();
      templates = mergeTemplates(builtInTemplates, customTemplates);
      state.category = "all";
      state.tone = "all";
      state.search = "";
      state.selectedId = importedTemplates[0]?.id || templates[0]?.id || null;
      state.variantIndex = 0;
      state.matchResult = null;
      elements.searchInput.value = "";
      elements.toneSelect.value = "all";
      render();
      showToast(`已导入 ${importedTemplates.length} 条模板`);
    } catch (error) {
      showToast(error.message || "导入失败");
    } finally {
      event.target.value = "";
    }
  });

  elements.exportButton.addEventListener("click", () => {
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      templates
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "amazon-jp-mail-templates.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("已导出模板文件");
  });

  elements.resetImportButton.addEventListener("click", () => {
    customTemplates = [];
    window.localStorage.removeItem(storageKey);
    templates = mergeTemplates(builtInTemplates, customTemplates);
    state.category = "all";
    state.tone = "all";
    state.search = "";
    state.selectedId = templates[0]?.id || null;
    state.variantIndex = 0;
    state.matchResult = null;
    elements.searchInput.value = "";
    elements.toneSelect.value = "all";
    render();
    showToast("已恢复内置模板");
  });

  elements.clearButton.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.toneSelect.value = "all";
    elements.customLine.value = "";
    elements.chineseDraft.value = "";
    elements.buyerMessage.value = "";
    elements.variableInputs.forEach((input) => {
      input.value = "";
    });
    state.search = "";
    state.tone = "all";
    state.category = "all";
    state.variantIndex = 0;
    state.variables = {};
    state.selectedId = templates[0]?.id || null;
    state.matchResult = null;
    render();
    showToast("已清空");
  });

  render();
})();
