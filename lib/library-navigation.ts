import type { CategoryGroup, LibrarySection } from "@/lib/types";

export function categoryHref(group: CategoryGroup, categoryId?: string) {
  return "/categories/" + group + (categoryId ? "/" + encodeURIComponent(categoryId) : "");
}

export function resolveHomeView(value: string | string[] | undefined): LibrarySection | "worksheet" | "home" {
  return value === "kindergarten" || value === "elementary" || value === "senior" || value === "worksheet" ? value : "home";
}
