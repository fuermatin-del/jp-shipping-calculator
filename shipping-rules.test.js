const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appPath = path.join(__dirname, "app.js");
const source = fs.readFileSync(appPath, "utf8").replace(
  /\ninit\(\);\s*$/,
  "\nglobalThis.__shippingTest = { channelRules, calculateChannel, halfThrowWeight, resolveTier, calculatePrice };\n",
);

function stubElement() {
  return {
    value: "",
    selectedIndex: 0,
    textContent: "",
    className: "",
    innerHTML: "",
    addEventListener() {},
  };
}

const context = {
  console,
  document: {
    querySelector() {
      return stubElement();
    },
  },
};

vm.createContext(context);
vm.runInContext(source, context, { filename: appPath });

const { channelRules, calculateChannel, halfThrowWeight, resolveTier, calculatePrice } = context.__shippingTest;

assert.equal(channelRules.some((channel) => channel.id === "sinotrans-pak"), false,
  "中外运日本邮政PAK小包不应参与报价或推荐");
assert.equal(
  channelRules.filter((channel) => channel.carrier === "盛欣").map((channel) => channel.id).join(","),
  "shengxin-sagawa",
  "盛欣只使用3661佐川普货渠道",
);
assert.equal(
  channelRules.find((channel) => channel.id === "pangu-post-3cm")?.channel,
  "日本黑猫3CM投函件",
);

function quote(channelId, overrides) {
  const channel = channelRules.find((item) => item.id === channelId);
  assert.ok(channel, `Missing channel ${channelId}`);
  return calculateChannel(channel, {
    length: 175,
    width: 8,
    height: 8,
    actualWeight: 5.01,
    region: "ordinary",
    regionLabel: "ordinary",
    ocsArea: "normal",
    valid: true,
    ...overrides,
  });
}

assert.equal(
  halfThrowWeight(5.01, 175, 8, 8, 6000),
  5.01,
  "half throw result must not be lower than actual weight",
);

for (const channel of channelRules.filter((item) => item.tiers?.length > 1)) {
  for (let index = 0; index < channel.tiers.length - 1; index += 1) {
    const current = channel.tiers[index];
    const next = channel.tiers[index + 1];
    const before = current.max - 0.01;
    const after = current.max + 0.01;
    const beforeTier = resolveTier(channel, before);
    const afterTier = resolveTier(channel, after);
    assert.equal(beforeTier.tier?.label, current.label, `${channel.id}: ${before}kg should stay in ${current.label}`);
    assert.equal(afterTier.tier?.label, next.label, `${channel.id}: ${after}kg should enter ${next.label}`);
    const beforePrice = calculatePrice(beforeTier.tier, before);
    assert.ok(beforePrice.chargeWeight >= before, `${channel.id}: charge weight must cover actual billable weight`);
  }
}

for (const channel of channelRules.filter((item) => item.tiers?.length === 1 && item.tiers[0].max !== null)) {
  const max = channel.tiers[0].max;
  assert.equal(resolveTier(channel, max - 0.01).tier?.label, channel.tiers[0].label,
    `${channel.id}: ${max - 0.01}kg must remain in its stated weight range`);
}

const upperBandQuotes = [
  ["shengxin-sagawa", 29.99, "20.5-30kg", 30, 420.5],
  ["ocs-ecommerce", 19.99, "10.5-20kg", 20, 307.5],
  ["yida-sagawa", 19.99, "10-20kg", 20, 343],
  ["pangu-small", 19.99, "10-20kg", 20, 269],
  ["sinotrans-sagawa", 29.99, "20-30kg", 30, 418.5],
  ["sf", 29.99, "10-30kg", 30, 325],
];

for (const [id, actualWeight, tierLabel, chargeWeight, total] of upperBandQuotes) {
  const row = quote(id, { length: 20, width: 20, height: 20, actualWeight });
  assert.equal(row.tier?.label, tierLabel, `${id}: choose the band before rounding`);
  assert.equal(row.chargeWeight, chargeWeight, `${id}: round the charging weight after choosing the band`);
  assert.equal(row.total, total, `${id}: charge at the selected band's rate`);
}

const exactBoundaries = [
  ["shengxin-sagawa", 5, "5.5-10kg"],
  ["shengxin-sagawa", 10, "10.5-20kg"],
  ["ocs-ecommerce", 2, "0-2kg"],
  ["ocs-ecommerce", 5, "5.5-10kg"],
  ["ocs-ecommerce", 10, "10.5-20kg"],
  ["ocs-ecommerce", 20, "20kg以上"],
  ["yida-sagawa", 2, "2-5kg"],
  ["yida-sagawa", 5, "5-10kg"],
  ["yida-sagawa", 10, "10-20kg"],
  ["pangu-small", 10, "10-20kg"],
  ["sinotrans-sagawa", 30, "30-50kg"],
  ["sf", 10, "10-30kg"],
];

for (const [id, weight, tierLabel] of exactBoundaries) {
  const channel = channelRules.find((item) => item.id === id);
  assert.equal(resolveTier(channel, weight).tier?.label, tierLabel,
    `${id}: exact ${weight}kg boundary should match ${tierLabel}`);
}

{
  const row = quote("shengxin-sagawa");
  assert.equal(row.chargeWeight, 5.5);
  assert.equal(row.tier.label, "5.5-10kg");
  assert.equal(row.total, 90.5);
}

{
  const row = quote("sinotrans-sagawa");
  assert.equal(row.chargeWeight, 5.5);
  assert.equal(row.tier.label, "5-20kg");
  assert.equal(row.total, 95);
}

{
  const row = quote("sinotrans-sagawa", {
    length: 103,
    width: 29,
    height: 77,
    actualWeight: 21.65,
  });
  assert.ok(row.billableWeight > 29.99 && row.billableWeight < 30);
  assert.equal(row.tier.label, "20-30kg");
  assert.equal(row.chargeWeight, 30);
  assert.equal(row.total, 418.5);
  assert.match(row.steps.join("；"), /重量段匹配：29\.99kg 匹配 20-30kg/);
}

{
  const row = quote("sinotrans-sagawa", {
    length: 50,
    width: 30,
    height: 20,
    actualWeight: 30,
  });
  assert.equal(row.tier.label, "30-50kg");
  assert.equal(row.total, 450);
}

{
  const row = quote("ocs-ecommerce", {
    length: 50,
    width: 30,
    height: 20,
    actualWeight: 2.01,
  });
  assert.equal(row.tier.label, "2.5-5kg");
  assert.equal(row.chargeWeight, 2.5);
}

for (const [weight, tierLabel, expected] of [
  [1, "0-2kg", 37.5],
  [3, "2.5-5kg", 60],
  [6, "5.5-10kg", 94],
  [11, "10.5-20kg", 181.5],
  [21, "20kg以上", 421.5],
]) {
  const row = quote("ocs-ecommerce", { length: 20, width: 20, height: 20, actualWeight: weight });
  assert.equal(row.tier.label, tierLabel);
  assert.equal(row.total, expected, `OCS ${weight}kg should use the current price`);
}

for (const [weight, tierLabel, expected] of [
  [1, "0-2kg", 36.5],
  [3, "2-5kg", 63.5],
  [7, "5-10kg", 122],
  [12, "10-20kg", 215],
]) {
  const row = quote("yida-sagawa", { length: 20, width: 20, height: 20, actualWeight: weight });
  assert.equal(row.tier.label, tierLabel);
  assert.equal(row.total, expected, `义达 ${weight}kg should use the new rate`);
}

{
  const row = quote("pangu-small", { length: 20, width: 20, height: 20, actualWeight: 2 });
  assert.equal(row.tier.label, "0-5kg");
  assert.equal(row.total, 51, "盘古0-5kg续重按6元/500g");
}

{
  const noThrow = quote("ocs-ecommerce", { length: 121, width: 10, height: 9, actualWeight: 1 });
  assert.equal(noThrow.method, "免抛");
  assert.equal(noThrow.status, "ok", "OCS no longer has a 120cm single-side limit");
  assert.match(noThrow.steps.join("；"), /10\.26规则免抛/);
  const fullThrow = quote("ocs-ecommerce", { length: 121, width: 10, height: 10, actualWeight: 1 });
  assert.equal(fullThrow.method, "全抛");
  const oversized = quote("ocs-ecommerce", { length: 130, width: 100, height: 40, actualWeight: 1 });
  assert.equal(oversized.status, "ok");
  assert.equal(oversized.extraFee, 181.5, "sum over 260cm adds 180 yuan plus the fixed 1.5 yuan");
}

{
  const row = quote("ocs-battery", { length: 20, width: 20, height: 20, actualWeight: 1 });
  assert.equal(row.total, 49.5);
  assert.equal(row.eligible, false);
  assert.match(row.steps.join("；"), /10\.26规则免抛/);
}

{
  const row = quote("shengxin-sagawa", {
    length: 167,
    width: 44,
    height: 20,
    actualWeight: 4.9,
  });
  assert.equal(row.chargeWeight, 15);
  assert.equal(row.tier.label, "10.5-20kg");
  assert.equal(row.total, 210);
}

{
  const row = quote("sf", {
    length: 100,
    width: 30,
    height: 20,
    actualWeight: 4,
  });
  assert.equal(row.method, "半抛");
  assert.equal(row.chargeWeight, 6);
  assert.equal(row.tier.label, "2-10kg");
  assert.equal(row.total, 79.5);
}

{
  const row = quote("sf", {
    length: 80,
    width: 30,
    height: 20,
    actualWeight: 8,
  });
  assert.equal(row.method, "半抛");
  assert.equal(row.chargeWeight, 8);
  assert.equal(row.tier.label, "2-10kg");
  assert.equal(row.total, 97.5);
}

{
  const row = quote("sf", {
    length: 121,
    width: 20,
    height: 10,
    actualWeight: 3,
  });
  assert.equal(row.status, "off");
  assert.equal(row.hasPrice, false);
  assert.match(row.warnings.join("；"), /单边超过120cm/);
}

console.log("shipping rule regression tests passed");
