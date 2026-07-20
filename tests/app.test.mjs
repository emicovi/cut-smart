import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const foods = JSON.parse(fs.readFileSync(path.join(root, "data/foods.json"), "utf8")).foods;
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, "Inline app script missing");

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
globalThis.__cut = { meals, mealComponents, schedule, shopping, nutritionFor, totals, dayMeals };`;
const context = vm.createContext({ console, Date, JSON, Math, Object, Array, Set, Map, localStorage, __foods: foods });
vm.runInContext(core, context, { filename: "index.html:inline" });
const { meals, mealComponents, schedule, shopping, nutritionFor, totals, dayMeals } = context.__cut;

assert.equal(schedule.length, 7, "The plan must cover seven days");
assert.equal(new Set(shopping.flatMap(group => group.items.map(item => item.id))).size, 22, "Shopping IDs must be unique");
assert.ok(Object.values(meals).every(meal => meal.method && meal.swap), "Every meal needs instructions and a substitution");
assert.ok(Object.keys(mealComponents).every(key => meals[key]), "Every calculated meal must exist");
assert.equal(manifest.display, "standalone");
for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root, icon.src)), `Missing ${icon.src}`);

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

localStorage.setItem("cut-second-free-meal", "false");
const originalBreakfast = nutritionFor("breakfast", 0);
localStorage.setItem("cut-food-overrides", JSON.stringify({ greek_yogurt_0: { kcal: 100, protein: 20 } }));
const calibratedBreakfast = nutritionFor("breakfast", 0);
assert.ok(calibratedBreakfast.kcal > originalBreakfast.kcal);
assert.ok(calibratedBreakfast.protein > originalBreakfast.protein);

console.log("Cut Smart checks passed: nutrition, flexibility, shopping, PWA assets, label calibration.");
