import type { PptMaterial } from "@/lib/types";

export type WorksheetFile = {
  url: string;
  fileName: string;
  previewUrl: string;
  pageCount: number;
};

export function getWorksheetFiles(
  material: Pick<
    PptMaterial,
    "worksheet_url" | "worksheet_file_name" | "worksheet_urls" | "worksheet_file_names" | "worksheet_preview_urls" | "worksheet_page_counts"
  >
): WorksheetFile[] {
  const urls = Array.isArray(material.worksheet_urls) ? material.worksheet_urls.filter(Boolean) : [];
  const names = Array.isArray(material.worksheet_file_names) ? material.worksheet_file_names : [];
  const previewUrls = Array.isArray(material.worksheet_preview_urls) ? material.worksheet_preview_urls : [];
  const pageCounts = Array.isArray(material.worksheet_page_counts) ? material.worksheet_page_counts : [];

  if (urls.length > 0) {
    return urls.map((url, index) => ({
      url,
      fileName: names[index] || `활동지 ${index + 1}`,
      previewUrl: previewUrls[index] || "",
      pageCount: Math.max(1, Number(pageCounts[index]) || 1)
    }));
  }

  return material.worksheet_url
    ? [{
        url: material.worksheet_url,
        fileName: material.worksheet_file_name || "활동지 1",
        previewUrl: previewUrls[0] || "",
        pageCount: Math.max(1, Number(pageCounts[0]) || 1)
      }]
    : [];
}

export function isWorksheetImage(url: string) {
  const pathname = url.split("?")[0].toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp"].some((extension) => pathname.endsWith(extension));
}
