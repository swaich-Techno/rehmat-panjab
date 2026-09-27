import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = file => readFile(new URL(file, root), "utf8");

test("daily edit is India-time deterministic and festival windows are exactly ten days", async () => {
  const [calendar, daily, page, form] = await Promise.all([
    read("lib/festival-calendar.ts"), read("lib/daily-rehmat.ts"), read("app/page.tsx"), read("app/admin/experiences/experience-form.tsx"),
  ]);
  assert.match(calendar, /timeZone:"Asia\/Kolkata"/);
  assert.match(calendar, /festivalWindowStart\(item\.date\)/);
  assert.match(calendar, /leadDays = 10/);
  assert.match(calendar, /status:"published"/);
  assert.match(daily, /hasAvailableStock/);
  assert.match(daily, /firstPrice/);
  assert.match(daily, /profile\.terms\.reduce/);
  assert.match(daily, /hash\(`\$\{dateKey\}:\$\{product\.slug\}`\)/);
  assert.match(page, /<TodaysRehmat products=\{products\}\/>/);
  assert.match(form, /Festival campaigns JSON/);
});
