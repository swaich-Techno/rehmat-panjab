import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Rehmat homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /REHMAT PANJAB/);
  assert.match(html, /Perfume oil,/);
  assert.match(html, /close to skin/);
  assert.match(html, /Find your scent/);
  assert.match(html, /Create your Rehmat/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
  assert.doesNotMatch(html, /₹|BUY NOW|Top Notes:/i);
});

test("server-renders the core public routes", async () => {
  for (const path of ["/collection", "/find-your-scent", "/create-your-fragrance", "/next-drop", "/layer", "/discover", "/product/musk-rizali"]) {
    const response = await render(path);
    assert.equal(response.status, 200, `${path} should render`);
  }
});
