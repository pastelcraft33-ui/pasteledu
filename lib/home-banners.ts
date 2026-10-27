import type { HomeBanner } from "@/lib/types";

export const defaultHomeBanners: HomeBanner[] = [
  { id: "culture", image_url: "/home-banner-culture.jpeg", alt: "다양한 문화 넓어지는 우리", link_url: "", enabled: true }
];

export function isBannerUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function getHomeBanners(value: unknown): HomeBanner[] {
  if (!Array.isArray(value)) return defaultHomeBanners.map((banner) => ({ ...banner }));
  return value.filter((banner): banner is HomeBanner =>
    Boolean(banner && typeof banner.id === "string" && typeof banner.image_url === "string" &&
      isBannerUrl(banner.image_url) && typeof banner.alt === "string" && typeof banner.link_url === "string" &&
      (!banner.link_url || isBannerUrl(banner.link_url)) && typeof banner.enabled === "boolean")
  );
}
