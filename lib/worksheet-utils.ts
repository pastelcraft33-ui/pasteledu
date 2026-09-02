import type { PptMaterial } from "@/lib/types";

export type WorksheetFile = {
  url: string;
  fileName: string;
};

export function getWorksheetFiles(
  material: Pick<PptMaterial, "worksheet_url" | "worksheet_file_name" | "worksheet_urls" | "worksheet_file_names">
): WorksheetFile[] {
  const urls = Array.isArray(material.worksheet_urls) ? material.worksheet_urls.filter(Boolean) : [];
  const names = Array.isArray(material.worksheet_file_names) ? material.worksheet_file_names : [];

  if (urls.length > 0) {
    return urls.map((url, index) => ({
      url,
      fileName: names[index] || `활동지 ${index + 1}`
    }));
  }

  return material.worksheet_url
    ? [{ url: material.worksheet_url, fileName: material.worksheet_file_name || "활동지 1" }]
    : [];
}

export function isWorksheetImage(url: string) {
  const pathname = url.split("?")[0].toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp"].some((extension) => pathname.endsWith(extension));
}
