import type { LibraryView } from "@/lib/types";

type Props = {
  view: LibraryView;
  title?: string;
  description?: string;
  imageUrl?: string | null;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
};

const content: Record<LibraryView, { title: string; description: string }> = {
  month: {
    title: "월별 수업자료",
    description: "월별 일정과 계절에 맞는 수업자료를 확인해보세요."
  },
  subject: {
    title: "주제별 수업자료",
    description: "필요한 수업 주제에 맞춰 자료를 찾아보세요."
  },
  kindergarten: {
    title: "유치원관 수업자료",
    description: "유아 눈높이에 맞춘 즐거운 수업자료를 확인해보세요."
  },
  elementary: {
    title: "초등관 수업자료",
    description: "초등 수업에 바로 활용할 수 있는 자료를 모았습니다."
  },
  senior: {
    title: "시니어관 수업자료",
    description: "시니어 학습과 활동을 위한 자료를 만나보세요."
  }
};

export default function LibraryBanner({ view, title, description, imageUrl, backgroundColor, textColor, borderColor }: Props) {
  const sectionContent = {
    title: title?.trim() || content[view].title,
    description: description?.trim() || content[view].description
  };

  return (
    <section
      className="relative isolate min-h-40 overflow-hidden border-b px-4 py-7 text-center sm:min-h-44 sm:px-8 sm:py-9"
      style={{ backgroundColor, borderColor, color: textColor }}
      aria-labelledby="library-banner-title"
    >
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-bottom" />
          <div className="absolute inset-0 bg-white/10" aria-hidden="true" />
        </>
      ) : null}
      <div className="relative mx-auto max-w-7xl">
        <h1
          id="library-banner-title"
          className="text-2xl font-black sm:text-3xl"
          style={{ textShadow: "0 2px 14px rgba(255, 255, 255, 0.95)" }}
        >
          {sectionContent.title}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold opacity-75 sm:text-base">{sectionContent.description}</p>
      </div>
    </section>
  );
}
