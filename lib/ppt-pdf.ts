import type { PptMaterial } from "@/lib/types";

export function getPptPdfUrl(material: Pick<PptMaterial, "file_url" | "preview_pdf_url" | "preview_source_url">) {
  return material.file_url && material.preview_source_url === material.file_url
    ? material.preview_pdf_url || null
    : null;
}
