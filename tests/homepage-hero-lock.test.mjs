import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const hero = new URL("public/images/hero/rehmat-panjab-homepage-hero.webp", root);

test("approved homepage hero asset remains byte-for-byte locked", async () => {
  const [bytes, info, component] = await Promise.all([
    readFile(hero),
    stat(hero),
    readFile(new URL("app/components/homepage-campaign.tsx", root), "utf8"),
  ]);
  assert.equal(info.size, 197180);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "38dc76ee191b344e936dde6f1cba95407fc97df6240271cad28ad4dd8f9741b9");
  assert.match(component, /src="\/images\/hero\/rehmat-panjab-homepage-hero\.webp"/);
  assert.match(component, /width=(?:"1731"|\{1731\})/);
  assert.match(component, /height=(?:"909"|\{909\})/);
});
