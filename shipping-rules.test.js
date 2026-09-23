const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appPath = path.join(__dirname, "app.js");
const source = fs.readFileSync(appPath, "utf8").replace(
  /\ninit\(\);\s*$/,
  "\nglobalThis.__shippingTest = { channelRules, calculateChannel, halfThrowWeight };\n",
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

const { channelRules, calculateChannel, halfThrowWeight } = context.__shippingTest;

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
