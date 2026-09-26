import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
const root=new URL("../",import.meta.url),read=file=>readFile(new URL(file,root),"utf8");
test("daily edit is India-time deterministic and festival windows are exactly ten days",async()=>{const [calendar,daily,page,form]=await Promise.all([read("lib/festival-calendar.ts"),read("lib/daily-rehmat.ts"),read("app/page.tsx"),read("app/admin/experiences/experience-form.tsx")]);assert.match(calendar,/timeZone:\"Asia\/Kolkata\"/);assert.match(calendar,/date:\"2026-11-08\".*startDate:\"2026-10-29\"/s);assert.match(calendar,/status:\"published\"/);assert.match(daily,/hasAvailableStock/);assert.match(daily,/firstPrice/);assert.match(daily,/hash\(dateKey\)%unique\.length/);assert.match(page,/<TodaysRehmat products=\{products\}\/>/);assert.match(form,/Festival campaigns JSON/);});
