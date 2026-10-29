import { createServer } from "node:http";
import { timingSafeEqual, randomUUID, createHash } from "node:crypto";
import { mkdtemp, rm, readFile, writeFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execute = promisify(execFile);
const limit = 100 * 1024 * 1024;
const adminEmail = "pastelcraft3@naver.com";

class ConversionError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export function validToken(actual, expected) {
  if (!expected || expected.length < 32 || !actual) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(`Bearer ${expected}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function sourceExtension(value, supabaseUrl) {
  const url = new URL(value);
  const path = decodeURIComponent(url.pathname);
  if (url.origin !== new URL(supabaseUrl).origin || url.protocol !== "https:" || url.username || url.password || url.hash || url.search || !path.startsWith("/storage/v1/object/public/ppt-files/") || path.split("/").some((part) => part === ".." || part === ".")) {
    throw new ConversionError("등록된 Supabase PPT 원본만 변환할 수 있습니다.");
  }
  const extension = path.match(/\.(pptx?)$/i)?.[1].toLowerCase();
  if (!extension) throw new ConversionError("PPT 또는 PPTX 원본만 변환할 수 있습니다.");
  return extension;
}

export async function limitedBody(response, max = limit) {
  if (!response.ok || !response.body) throw new ConversionError("PPT 원본을 불러오지 못했습니다.", 502);
  if (Number(response.headers.get("content-length")) > max) {
    await response.body.cancel();
    throw new ConversionError("파일 크기는 100MB 이하여야 합니다.");
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) throw new ConversionError("파일 크기는 100MB 이하여야 합니다.");
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  return Buffer.concat(chunks);
}

export async function convertFile(sourcePath, outputDirectory) {
  const profile = pathToFileURL(join(outputDirectory, "profile")).href;
  await execute("libreoffice", [
    `-env:UserInstallation=${profile}`, "--headless", "--nologo", "--nodefault", "--norestore",
    "--convert-to", 'pdf:impress_pdf_Export:{"ExportBookmarks":{"type":"boolean","value":"true"},"ExportBookmarksToPDFDestination":{"type":"boolean","value":"true"}}',
    "--outdir", outputDirectory, sourcePath
  ], { timeout: 180000, maxBuffer: 1024 * 1024, env: { ...process.env, HOME: outputDirectory } });
  const pdfPath = join(outputDirectory, "source.pdf");
  if ((await stat(pdfPath)).size > limit) throw new ConversionError("PDF 파일 크기는 100MB 이하여야 합니다.");
  const pdf = await readFile(pdfPath);
  if (pdf.length > limit || pdf.subarray(0, 5).toString() !== "%PDF-") throw new ConversionError("PDF 결과를 확인할 수 없습니다.", 502);
  return pdf;
}

async function convertMaterial(body, authorization, config, signal) {
  const headers = { apikey: config.key, Authorization: authorization, "Content-Type": "application/json" };
  const api = async (path, init = {}) => fetch(`${config.url}${path}`, { ...init, headers: { ...headers, ...init.headers }, signal, redirect: "error" });
  const userResponse = await api("/auth/v1/user");
  const user = await userResponse.json();
  if (!userResponse.ok || user.email?.toLowerCase() !== adminEmail) throw new ConversionError("관리자 권한이 필요합니다.", 403);
  const id = body.materialId;
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) throw new ConversionError("자료 ID가 올바르지 않습니다.");
  const response = await api(`/rest/v1/ppt_materials?id=eq.${id}&select=id,file_url,preview_pdf_url,preview_source_url`);
  const rows = await response.json();
  if (!response.ok) throw new ConversionError("PDF 설정이 없습니다. supabase/add-ppt-pdf-previews.sql을 먼저 실행해주세요.");
  const material = rows[0];
  if (!material?.file_url) throw new ConversionError("PPT 원본이 없습니다.", 404);
  const extension = sourceExtension(material.file_url, config.url);
  if (!body.force && material.preview_pdf_url && material.preview_source_url === material.file_url) return;
  const directory = await mkdtemp(join(tmpdir(), "pastel-pdf-"));
  let uploadedPath;
  try {
    const source = await limitedBody(await fetch(material.file_url, { signal, redirect: "error" }));
    const sourcePath = join(directory, `source.${extension}`);
    await writeFile(sourcePath, source);
    const pdf = await convertFile(sourcePath, directory);
    const hash = createHash("sha256").update(material.file_url).digest("hex").slice(0, 20);
    const path = `${id}/${hash}-${randomUUID()}.pdf`;
    const upload = await api(`/storage/v1/object/ppt-previews/${path}`, {
      method: "POST", headers: { "Content-Type": "application/pdf", "Cache-Control": "max-age=31536000", "x-upsert": "false" }, body: pdf
    });
    if (!upload.ok) throw new ConversionError("PDF 저장에 실패했습니다. SQL 및 ppt-previews 버킷 권한을 확인해주세요.", 502);
    uploadedPath = path;
    const update = await api(`/rest/v1/ppt_materials?id=eq.${id}&file_url=eq.${encodeURIComponent(material.file_url)}&select=id`, {
      method: "PATCH", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ preview_pdf_url: `${config.url}/storage/v1/object/public/ppt-previews/${path}`, preview_source_url: material.file_url })
    });
    const changed = await update.json();
    if (!update.ok || !Array.isArray(changed) || changed.length !== 1) throw new ConversionError("변환 중 원본이 변경되었거나 저장 권한이 없습니다. 다시 생성해주세요.", 409);
    uploadedPath = null;
  } finally {
    if (uploadedPath) {
      // Only clean up the new PDF from this failed conversion, never the source.
      await api("/storage/v1/object/ppt-previews", { method: "DELETE", body: JSON.stringify({ prefixes: [uploadedPath] }) }).catch(() => {});
    }
    await rm(directory, { recursive: true, force: true });
  }
}

export function createConversionServer(config) {
  let busy = false;
  return createServer(async (request, response) => {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    const reply = (status, data) => { response.writeHead(status); response.end(JSON.stringify(data)); };
    if (request.method === "GET" && request.url === "/health") return reply(200, { status: "ok" });
    if (request.method !== "POST" || request.url !== "/convert") return reply(404, { error: "요청한 기능이 없습니다." });
    if (!validToken(request.headers.authorization, config.token)) return reply(401, { error: "변환기 인증이 필요합니다." });
    const authorization = request.headers["x-supabase-authorization"];
    if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) return reply(401, { error: "관리자 로그인이 필요합니다." });
    if (busy) return reply(429, { error: "다른 자료를 변환 중입니다. 잠시 후 다시 시도해주세요." });
    request.setTimeout(10000, () => request.destroy());
    busy = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 235000);
    try {
      let body = "";
      for await (const chunk of request) {
        body += chunk;
        if (Buffer.byteLength(body) > 2048) throw new ConversionError("요청이 너무 큽니다.", 413);
      }
      request.setTimeout(0);
      await convertMaterial(JSON.parse(body), authorization, config, controller.signal);
      reply(200, { success: true });
    } catch (error) {
      reply(error instanceof ConversionError ? error.status : 502, { error: error instanceof ConversionError ? error.message : "PDF 변환에 실패했습니다. 원본 손상 여부와 변환기 상태를 확인해주세요." });
    } finally { clearTimeout(timeout); busy = false; }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, ""),
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    token: process.env.PPT_CONVERTER_TOKEN
  };
  if (!config.url || !config.key || !config.token || config.token.length < 32) throw new Error("Supabase 환경변수와 32자 이상의 PPT_CONVERTER_TOKEN이 필요합니다.");
  createConversionServer(config).listen(Number(process.env.PORT || 3000), "0.0.0.0");
}
