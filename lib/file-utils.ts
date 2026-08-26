const allowedPptExtensions = ["ppt", "pptx"];
const allowedImageExtensions = ["jpg", "jpeg", "png", "webp"];
const allowedWorksheetExtensions = ["pdf", ...allowedImageExtensions];

export function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isAllowedPptFile(file: File) {
  return allowedPptExtensions.includes(getFileExtension(file.name));
}

export function isAllowedImageFile(file: File) {
  return allowedImageExtensions.includes(getFileExtension(file.name));
}

export function isAllowedWorksheetFile(file: File) {
  return allowedWorksheetExtensions.includes(getFileExtension(file.name));
}

export function createSafeStorageFileName(filename: string) {
  const extension = getFileExtension(filename).replace(/[^a-z0-9]/g, "");
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  const storageName = `${Date.now()}-${id}`;

  return extension ? `${storageName}.${extension}` : storageName;
}

export function getTitleFromFileName(filename: string) {
  const extension = getFileExtension(filename);
  const nameWithoutExtension = extension ? filename.slice(0, -(extension.length + 1)) : filename;

  return nameWithoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "제목 없음";
}

export function parseTagsInput(input: string) {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatDate(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}
