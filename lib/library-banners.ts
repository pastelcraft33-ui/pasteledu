import type { LibrarySection } from "@/lib/types";

type LibraryBannerDefault = {
  title: string;
  description: string;
  imageUrl: string;
  textColor: string;
  legacyTitle: string;
};

export const libraryBannerDefaults: Record<LibrarySection, LibraryBannerDefault> = {
  kindergarten: {
    title: "유치원 수업을 한눈에",
    description: "유아 눈높이에 맞춘 즐거운 수업자료를 확인해보세요.",
    imageUrl: "/banner-kindergarten-clouds.png",
    textColor: "#c83f73",
    legacyTitle: "유치원관 수업자료"
  },
  elementary: {
    title: "All in one 수업 패키지",
    description: "초등 수업에 바로 활용할 수 있는 자료를 모았습니다.",
    imageUrl: "/banner-elementary-clouds.png",
    textColor: "#2f6f9f",
    legacyTitle: "초등관 수업자료"
  },
  senior: {
    title: "시니어 전통수업",
    description: "시니어 학습과 활동을 위한 자료를 만나보세요.",
    imageUrl: "/banner-senior-clouds.png",
    textColor: "#5f5b66",
    legacyTitle: "시니어관 수업자료"
  }
};

export function resolveLibraryBannerTitle(section: LibrarySection, title: string | null | undefined) {
  const defaults = libraryBannerDefaults[section];
  const normalizedTitle = title?.trim();

  if (!normalizedTitle || normalizedTitle === defaults.legacyTitle) return defaults.title;
  return normalizedTitle;
}

export function resolveLibraryBannerImage(section: LibrarySection, imageUrl: string | null | undefined) {
  return imageUrl?.trim() || libraryBannerDefaults[section].imageUrl;
}
