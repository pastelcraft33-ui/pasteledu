import { test } from "node:test";
import assert from "node:assert/strict";
import { sourceExtension, validToken, limitedBody, createConversionServer } from "./server.mjs";

const base = "https://example.supabase.co";
test("등록된 버킷의 PPT/PPTX만 허용", () => {
  assert.equal(sourceExtension(`${base}/storage/v1/object/public/ppt-files/test.pptx`, base), "pptx");
  assert.equal(sourceExtension(`${base}/storage/v1/object/public/ppt-files/test.PPT`, base), "ppt");
  for (const value of ["http://127.0.0.1/a.pptx", "https://evil.test/a.pptx", `${base}/storage/v1/object/public/other/a.pptx`, `${base}/storage/v1/object/public/ppt-files/a.pdf`, `${base}/storage/v1/object/public/ppt-files/%2e%2e%2fother/a.pptx`]) {
    assert.throws(() => sourceExtension(value, base));
  }
});
test("변환기 비밀키 검증", () => {
  const token = "x".repeat(40);
  assert.equal(validToken(`Bearer ${token}`, token), true);
  assert.equal(validToken(`Bearer ${token}z`, token), false);
  assert.equal(validToken(undefined, token), false);
  assert.equal(validToken("Bearer short", "short"), false);
});
test("크기 초과 응답 거부", async () => {
  await assert.rejects(limitedBody(new Response("123456"), 5));
  assert.equal((await limitedBody(new Response("1234"), 5)).toString(), "1234");
});
test("인증 없는 요청은 변환 전에 거부", async () => {
  const server = createConversionServer({ url: base, key: "public", token: "x".repeat(40) });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/convert`, { method: "POST", body: "{}" });
    assert.equal(response.status, 401);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
