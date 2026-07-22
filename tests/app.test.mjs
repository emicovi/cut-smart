import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const appCss = fs.readFileSync(path.join(root, "app.css"), "utf8");
const tokensCss = fs.readFileSync(path.join(root, "tokens.css"), "utf8");
const design = fs.readFileSync(path.join(root, "design.md"), "utf8");
const preflight = JSON.parse(fs.readFileSync(path.join(root, ".hallmark/preflight.json"), "utf8"));
const hallmarkLog = JSON.parse(fs.readFileSync(path.join(root, ".hallmark/log.json"), "utf8"));
const serviceWorker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const foods = JSON.parse(fs.readFileSync(path.join(root, "data/foods.json"), "utf8")).foods;
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, "Inline app script missing");
new vm.Script(script, { filename: "index.html:inline" });
new vm.Script(serviceWorker, { filename: "sw.js" });

class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : ["2026-07-20T12:00:00"])); }
  static now() { return new Date("2026-07-20T12:00:00").getTime(); }
}

const storage = new Map();
const localStorage = {
  get length() { return storage.size; },
  key(index) { return [...storage.keys()][index] ?? null; },
  getItem(key) { return storage.get(key) ?? null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};

const coreEnd = script.indexOf('document.addEventListener("click"');
assert.ok(coreEnd > 0, "Core boundary missing");
const core = `${script.slice(0, coreEnd)}
foodDatabase = globalThis.__foods;
globalThis.__cut = { meals, mealComponents, schedule, shopping, nutritionFor, totals, dayMeals, mealCard, todayIndex, weekDate, dateKey, localDate, isCalendarDate, isFutureDate, canTrackDay, isValidMeasurementDate, isValidMeasurement, normalizeMeasurements, sanitizeTrackingData, nextMealIndex, proteinTarget, energyEstimate, recommendationFor, matchesShoppingQuery, recipeSteps, shoppingGroupId, measurementTrend, isRecord, storedList, storedRecord, validMealIndex, validHabit, validShoppingId, validFoodOverride, labelFoodIds };`;
const context = vm.createContext({ console, Date: FixedDate, JSON, Math, Object, Array, Set, Map, localStorage, __foods: foods });
vm.runInContext(core, context, { filename: "index.html:inline" });
const { meals, mealComponents, schedule, shopping, nutritionFor, totals, dayMeals, mealCard, todayIndex, weekDate, dateKey, localDate, isCalendarDate, isFutureDate, canTrackDay, isValidMeasurementDate, isValidMeasurement, normalizeMeasurements, sanitizeTrackingData, nextMealIndex, proteinTarget, energyEstimate, recommendationFor, matchesShoppingQuery, recipeSteps, shoppingGroupId, measurementTrend, isRecord, storedList, storedRecord, validMealIndex, validHabit, validShoppingId, validFoodOverride, labelFoodIds } = context.__cut;

assert.equal(schedule.length, 7, "The plan must cover seven days");
assert.equal(new Set(shopping.flatMap(group => group.items.map(item => item.id))).size, 22, "Shopping IDs must be unique");
assert.ok(Object.values(meals).every(meal => meal.method && meal.swap), "Every meal needs instructions and a substitution");
assert.ok(Object.keys(mealComponents).every(key => meals[key]), "Every calculated meal must exist");
assert.equal(manifest.display, "standalone");
for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root, icon.src)), `Missing ${icon.src}`);
assert.match(html, /href="tokens\.css"/, "The app must load the locked Hallmark tokens");
assert.match(html, /href="app\.css"/, "The app must load the Hallmark interface stylesheet");
assert.doesNotMatch(html, /<style>/, "Legacy inline styles should not bypass the locked design system");
assert.doesNotMatch(html, /style="/, "Markup should not improvise inline styles");
assert.ok(appCss.startsWith("/* Hallmark · genre: modern-minimal"), "The page stylesheet needs the durable Hallmark stamp");
assert.match(appCss, /pre-emit critique: P\d H\d E\d S\d R\d V\d/, "The Hallmark self-critique must be recorded");
assert.match(appCss, /html,\s*\nbody\s*\{\s*\n\s*overflow-x: clip;/, "Responsive output must clip horizontal overflow without creating a scroll container");
assert.doesNotMatch(appCss, /transition:\s*all\b/, "Hallmark output must not use transition-all");
assert.doesNotMatch(appCss, /100vw/, "Hallmark output must not use viewport widths that include scrollbars");
assert.match(tokensCss, /--color-paper:\s*oklch\(/, "The design tokens must use OKLCH colours");
assert.match(tokensCss, /--font-display:\s*"Bricolage Grotesque"/, "The display font must stay locked");
assert.match(tokensCss, /--font-body:\s*"Geist"/, "The body font must stay locked");
assert.match(design, /## Macrostructure family[\s\S]*Narrative Workflow/, "The app design system must lock its workflow structure");
assert.equal(preflight.framework, "vanilla-html");
assert.equal(hallmarkLog[0].scope, "app");
assert.equal(hallmarkLog[0].macrostructure, "Narrative Workflow");
assert.match(serviceWorker, /cut-smart-v16/, "The service worker cache must be bumped for the redesign");
assert.match(serviceWorker, /\.\/tokens\.css/);
assert.match(serviceWorker, /\.\/app\.css/);

assert.equal(localDate(), "2026-07-20");
assert.equal(todayIndex(), 0, "Fixed test date must be Monday");
assert.equal(dateKey(weekDate(0)), "2026-07-20");
assert.equal(dateKey(weekDate(6)), "2026-07-26");
assert.equal(isCalendarDate("2026-07-20"), true);
assert.equal(isCalendarDate("2026-02-30"), false);
assert.equal(isCalendarDate("not-a-date"), false);
assert.equal(isFutureDate(new FixedDate("2026-07-19T12:00:00")), false);
assert.equal(isFutureDate(new FixedDate("2026-07-20T23:59:00")), false);
assert.equal(isFutureDate(new FixedDate("2026-07-21T00:01:00")), true);
assert.equal(canTrackDay(0), true, "Today must be trackable");
assert.equal(canTrackDay(1), false, "Tomorrow must not be trackable");
assert.equal(canTrackDay(6), false, "Future days must not be trackable");
assert.equal(isValidMeasurementDate("2026-07-19"), true);
assert.equal(isValidMeasurementDate("2026-07-20"), true);
assert.equal(isValidMeasurementDate("2026-07-21"), false, "Future measurements must be rejected");
assert.equal(isValidMeasurementDate("2026-02-30"), false, "Invalid calendar dates must be rejected");
assert.equal(isValidMeasurement({ date: "2026-07-20", weight: "70", waist: "85" }), true);
assert.equal(isValidMeasurement({ date: "2026-07-20", weight: "39.9" }), false, "Weights below the allowed range must be rejected");
assert.equal(isValidMeasurement({ date: "2026-07-20", weight: "70", waist: "160.1" }), false, "Waists above the allowed range must be rejected");
assert.equal(JSON.stringify(normalizeMeasurements([
  { date: "2026-07-20", weight: "70" },
  { date: "2026-07-20", weight: "69.6", waist: "85" },
  { date: "2026-07-19", weight: "39" },
  { date: "2026-07-21", weight: "69" }
])), JSON.stringify([{ date: "2026-07-20", weight: "69.6", waist: "85" }]), "Measurements must be valid, unique by date and limited to today");
assert.match(mealCard("breakfast", 0, 0), />Mangiato<\/button>/);
assert.match(mealCard("breakfast", 0, 1), /disabled[^>]*>In programma<\/button>/, "Future meal button must be disabled");
assert.match(mealCard("breakfast", 0, 0), /data-cook="breakfast"/, "Every recipe card should launch guided cooking");
assert.ok(recipeSteps(meals.breakfast.method).length >= 2, "Recipe methods should become multiple guided steps");
assert.match(html, /meta name="description"/, "The app needs a concise page description");
assert.match(html, /id="today-next"/, "Today view should surface the next meal");
assert.match(html, /<details class="habit-card">/, "Supporting habits should stay secondary to the meal workflow");
assert.equal((html.match(/data-nav-section=/g) || []).length, 3, "Primary navigation should stay focused on three sections");
assert.match(html, /data-plan-view="oggi"[\s\S]*data-plan-view="settimana"/, "Today and week should be views of one plan");
assert.match(html, /id="week-average-kcal">—<\/strong>/, "Nutrition summaries must start neutral before food data loads");
assert.match(html, /foodDatabase = \(await response\.json\(\)\)\.foods;[\s\S]*refreshNutrition\(\);/, "Nutrition must render after the food database resolves");
assert.match(html, /id="shopping-badge"/, "Shopping progress should be visible in navigation");
assert.match(html, /id="shopping-search"/, "Shopping list should be searchable");
assert.match(html, /data-shopping-filter="remaining"/, "Shopping should offer one-tap status filters");
assert.match(html, /data-shopping-filter="remaining" aria-pressed="true"/, "Shopping should open on items still to buy");
assert.doesNotMatch(html, /data-shopping-filter="all"/, "Shopping should not duplicate the pending-items view with an all-items filter");
assert.match(html, /id="shopping-empty"/, "Shopping search and filters need an empty state");
assert.match(html, /id="undo-shopping"/, "Shopping should allow accidental checks to be undone");
assert.doesNotMatch(html, /Il tocco buono/, "Shopping should not end with decorative advice");
assert.match(html, /groupIndex \? " collapsed" : ""/, "Shopping should reveal one department at a time");
assert.match(html, /id="cook-mode"/, "Guided cooking dialog must be available");
assert.match(html, /id="weight-chart"/, "Check-in should visualize the measurement trend");
assert.match(html, /data-group-count>0\/\$\{group\.items\.length\}/, "Category counters should start at zero items taken");
assert.match(html, /addEventListener\("hashchange"/, "Deep links should keep the visible panel in sync");
assert.deepEqual([nextMealIndex([]), nextMealIndex([0]), nextMealIndex([0, 2]), nextMealIndex([0, 1, 2, 3])], [0, 1, 1, undefined]);
assert.equal(JSON.stringify(proteinTarget(70)), JSON.stringify({ low: 112, high: 140 }));
assert.equal(proteinTarget("invalid"), null, "Invalid weights must not create a protein target");
assert.equal(JSON.stringify(energyEstimate({ sex: "male", age: 31, heightCm: 164, weightKg: 70 })), JSON.stringify({ bmr: 1575, maintenanceLow: 2126, maintenanceHigh: 2284, targetKcal: 1850 }));
assert.match(html, /I tuoi 7 giorni/, "The weekly plan should use a simple, direct title");
assert.equal(recommendationFor(70, 69.6, "stable", false).title, "Continua uguale");
assert.equal(recommendationFor(70, 69.8, "stable", true).title, "Riduci una sola uscita");
assert.equal(recommendationFor(70, 69, "stable", false).tone, "alert");
assert.equal(recommendationFor(70, 69.6, "down", false).title, "Proteggi la forza");
assert.equal(matchesShoppingQuery({ amount: "1 kg", name: "Pollo o tacchino" }, "pollo"), true);
assert.equal(matchesShoppingQuery({ amount: "1 kg", name: "Pollo o tacchino" }, "riso"), false);
assert.equal(shoppingGroupId("Frutta e verdura"), "shopping-frutta-e-verdura");
const trend = measurementTrend([
  { date: "2026-07-20", weight: "70" },
  { date: "2026-07-18", weight: "70.5", waist: "86" }
]);
assert.equal(trend.latest.date, "2026-07-20");
assert.equal(trend.deltaWeight, -0.5);
assert.equal(isRecord({}), true);
assert.equal(isRecord([]), false);
assert.equal(validMealIndex(3), true);
assert.equal(validMealIndex(4), false);
assert.equal(validHabit("sleep"), true);
assert.equal(validHabit("unknown"), false);
assert.equal(validShoppingId("chicken"), true);
assert.equal(validShoppingId("unknown"), false);
assert.equal(validFoodOverride({ kcal: 75, protein: 12 }), true);
assert.equal(validFoodOverride({ kcal: 0, protein: 12 }), false);
assert.equal(labelFoodIds.includes("tuna"), true);
assert.equal(labelFoodIds.includes("unknown"), false);
localStorage.setItem("bad-list", '{}');
localStorage.setItem("mixed-list", '[0,4,"1",2]');
localStorage.setItem("bad-record", '[]');
assert.equal(JSON.stringify(storedList("bad-list", validMealIndex)), "[]");
assert.equal(JSON.stringify(storedList("mixed-list", validMealIndex)), "[0,2]");
assert.equal(JSON.stringify(storedRecord("bad-record")), "{}");

localStorage.setItem("cut-meals-2026-07-21", "[0]");
localStorage.setItem("cut-habits-2026-07-22", '["steps"]');
localStorage.setItem("cut-meals-2026-07-20", "[1]");
localStorage.setItem("cut-history", JSON.stringify({ "2026-07-20": { meals: {}, habits: [] }, "2026-07-21": { meals: { 0: { name: "Impossible" } }, habits: [] } }));
localStorage.setItem("cut-measurements", JSON.stringify([{ date: "2026-07-20", weight: "70" }, { date: "2026-07-21", weight: "69" }, { date: "2026-02-30", weight: "68" }]));
sanitizeTrackingData();
assert.equal(localStorage.getItem("cut-meals-2026-07-21"), null, "Future meal state must be removed");
assert.equal(localStorage.getItem("cut-habits-2026-07-22"), null, "Future habit state must be removed");
assert.equal(localStorage.getItem("cut-meals-2026-07-20"), "[1]", "Today's state must be preserved");
assert.deepEqual(Object.keys(JSON.parse(localStorage.getItem("cut-history"))), ["2026-07-20"]);
assert.deepEqual(JSON.parse(localStorage.getItem("cut-measurements")).map(entry => entry.date), ["2026-07-20"]);

function weekly(secondFree) {
  localStorage.setItem("cut-second-free-meal", JSON.stringify(secondFree));
  return schedule.map((day, index) => totals(day, index));
}

for (const secondFree of [false, true]) {
  const days = weekly(secondFree);
  assert.ok(days.every(day => day.protein >= 140), "Every day must provide at least 140 g protein");
  assert.ok(days.every((day, index) => day.kcal >= 1650 && day.kcal <= (index === 5 ? 2250 : 2050)), "Daily calories outside the planned range");
  const average = days.reduce((sum, day) => sum + day.kcal, 0) / days.length;
  assert.ok(average >= 1700 && average <= 1900, "Weekly average outside the cut range");
}

localStorage.setItem("cut-second-free-meal", "false");
assert.equal(dayMeals(schedule[4], 4)[3], "pasta", "Friday should use the standard dinner");
localStorage.setItem("cut-second-free-meal", "true");
assert.equal(dayMeals(schedule[4], 4)[3], "free2", "Second free meal must replace Friday dinner");
assert.equal(dayMeals(schedule[5], 5)[3], "pizza", "Saturday pizza must remain included");

function ingredientTotal(foodId, secondFree = false) {
  localStorage.setItem("cut-second-free-meal", JSON.stringify(secondFree));
  let grams = 0;
  schedule.forEach((day, dayIndex) => {
    for (const mealKey of dayMeals(day, dayIndex)) {
      for (const component of mealComponents[mealKey] || []) {
        if (component.food !== foodId) continue;
        grams += component.grams ?? component.servings * foods[foodId].servingGrams;
      }
    }
  });
  return grams;
}

assert.equal(ingredientTotal("chicken"), 810);
assert.equal(ingredientTotal("potatoes"), 1150);
assert.equal(ingredientTotal("tuna"), 420);
assert.equal(ingredientTotal("tuna", true), 280);
assert.equal(ingredientTotal("pasta"), 240);
assert.equal(ingredientTotal("pasta", true), 160);
assert.equal(ingredientTotal("dark_chocolate"), 70);
assert.equal(shopping.flatMap(group => group.items).find(item => item.id === "whites").amount, "1 confezione da 750 g");

localStorage.setItem("cut-second-free-meal", "false");
const originalBreakfast = nutritionFor("breakfast", 0);
localStorage.setItem("cut-food-overrides", JSON.stringify({ greek_yogurt_0: { kcal: 100, protein: 20 } }));
const calibratedBreakfast = nutritionFor("breakfast", 0);
assert.ok(calibratedBreakfast.kcal > originalBreakfast.kcal);
assert.ok(calibratedBreakfast.protein > originalBreakfast.protein);

console.log("Cut Smart checks passed: dates, future guards, cleanup, nutrition, flexibility, shopping, PWA, labels.");
