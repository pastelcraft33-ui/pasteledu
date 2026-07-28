export async function downloadPublicFile(url: string, fileName: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`파일 요청에 실패했습니다. (${response.status})`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = sanitizeDownloadFileName(fileName);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function createDownloadFileName(baseName: string, url: string, fallbackExtension: string) {
  const extension = getUrlExtension(url) || fallbackExtension;
  const normalizedBaseName = baseName.replace(/\.[^.]+$/, "").trim() || "download";

  return extension ? `${normalizedBaseName}.${extension}` : normalizedBaseName;
}

function getUrlExtension(url: string) {
  try {
    const path = new URL(url).pathname;
    return path.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  } catch {
    return "";
  }
}

function sanitizeDownloadFileName(fileName: string) {
  return fileName.replace(/[\\/:*?"<>|]+/g, "_").trim() || "download";
}
