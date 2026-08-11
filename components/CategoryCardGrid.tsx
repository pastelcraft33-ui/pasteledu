import type { Category, CategoryGroup, PptMaterial, SiteSettings } from "@/lib/types";

type BoardSettings = Omit<SiteSettings, "id" | "created_at" | "updated_at">;

type Props = {
  categories: Category[];
  materials: PptMaterial[];
  group: CategoryGroup;
  settings: BoardSettings;
  onSelectCategory: (category: Category) => void;
};

type CategoryPresentation = {
  description: string;
  visual: string;
};

export default function CategoryCardGrid({ categories, materials, group, settings, onSelectCategory }: Props) {
  const isMonthGroup = group === "month";

  return (
    <section aria-labelledby="category-card-grid-heading">
      <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
        <div>
          <p className="text-sm font-bold opacity-60 sm:text-base">{isMonthGroup ? "월별" : "주제별"} 수업자료</p>
          <h2 id="category-card-grid-heading" className="mt-1 text-xl font-black sm:text-2xl">
            총 {categories.length}개의 {isMonthGroup ? "월별 카테고리" : "주제"}
          </h2>
        </div>
        <p className="hidden text-sm font-semibold opacity-55 sm:block">
          원하는 {isMonthGroup ? "월" : "주제"}을 선택해 자료를 확인해보세요.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => {
          const presentation = getCategoryPresentation(category, group);
          const materialCount = materials.filter((material) =>
            group === "month" ? material.secondary_category_id === category.id : material.category_id === category.id
          ).length;
          const categoryColor = category.column_color || settings.default_column_color;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category)}
              className="group flex min-h-[142px] w-full items-center justify-between gap-5 overflow-hidden rounded-lg p-5 text-left transition duration-200 hover:-translate-y-px hover:brightness-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:min-h-[150px] sm:p-6"
              style={{
                backgroundColor: `color-mix(in srgb, ${categoryColor} 80%, ${settings.card_border_color})`,
                color: settings.text_color,
                outlineColor: settings.button_color
              }}
              aria-label={`${category.name} 자료 ${materialCount}개 전체보기`}
            >
              <span className="min-w-0">
                <span className="block break-keep text-lg font-black leading-snug sm:text-xl">{category.name}</span>
                <span className="mt-3 block break-keep text-sm font-medium leading-5 opacity-70 sm:text-[15px] sm:leading-6">
                  {category.description?.trim() || presentation.description}
                </span>
              </span>

              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-[1.03] sm:h-[72px] sm:w-[72px]"
                aria-hidden="true"
              >
                {category.card_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 관리자가 등록한 Supabase 동적 URL을 표시합니다.
                  <img
                    src={category.card_image_url}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-[38px] leading-none sm:text-[44px]">{presentation.visual}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function getCategoryPresentation(category: Category, group: CategoryGroup): CategoryPresentation {
  if (group === "month") return getMonthPresentation(category.name);

  const name = category.name.replace(/\s/g, "").toLowerCase();

  if (name.includes("동네") || name.includes("직업")) {
    return { visual: "🏘️", description: "가까운 우리 동네의 모습과 다양한 이웃을 만나보세요." };
  }
  if (name.includes("세계") || name.includes("다문화") || name.includes("문화")) {
    return { visual: "🌏", description: "세계 여러 나라의 문화와 생활을 즐겁게 알아봐요." };
  }
  if (name.includes("호국") || name.includes("보훈")) {
    return { visual: "🎖️", description: "나라를 지킨 분들의 뜻과 소중한 역사를 배워요." };
  }
  if (name.includes("독서") || name.includes("도서") || name.includes("책")) {
    return { visual: "📚", description: "책 속 이야기와 함께 생각하는 힘을 키워요." };
  }
  if (name.includes("독도") || name.includes("바다")) {
    return { visual: "🏝️", description: "소중한 우리 섬과 바다의 자연을 함께 알아봐요." };
  }
  if (name.includes("계절") || name.includes("봄") || name.includes("여름") || name.includes("가을") || name.includes("겨울")) {
    return { visual: "🍁", description: "봄, 여름, 가을, 겨울의 다채로운 변화를 느껴보세요." };
  }
  if (name.includes("역사") || name.includes("전통")) {
    return { visual: "🏛️", description: "흥미로운 이야기로 우리 역사와 전통을 만나보세요." };
  }
  if (name.includes("우리나라") || name.includes("나라사랑")) {
    return { visual: "🇰🇷", description: "우리나라의 문화와 소중한 가치를 즐겁게 배워요." };
  }
  if (name.includes("환경") || name.includes("자연") || name.includes("식물")) {
    return { visual: "🌱", description: "지구와 자연을 지키는 방법을 함께 배우고 실천해요." };
  }
  if (name.includes("한글") || name.includes("언어")) {
    return { visual: "📝", description: "재미있는 활동으로 우리말과 한글에 가까워져요." };
  }
  if (name.includes("안전") || name.includes("건강")) {
    return { visual: "🚦", description: "생활 속 안전과 건강 습관을 쉽고 재미있게 익혀요." };
  }

  return { visual: "🎨", description: "다양한 수업자료를 한눈에 살펴보고 즐겁게 배워보세요." };
}

function getMonthPresentation(categoryName: string): CategoryPresentation {
  const month = Number.parseInt(categoryName, 10);
  const presentations: Record<number, CategoryPresentation> = {
    1: { visual: "☃️", description: "새해와 함께 시작하는 신나는 겨울 수업을 만나보세요." },
    2: { visual: "💝", description: "따뜻한 마음을 나누며 새 학기를 준비해보세요." },
    3: { visual: "🌱", description: "새싹처럼 설레는 새 학기의 수업자료를 확인해보세요." },
    4: { visual: "🌸", description: "봄꽃과 자연을 만나는 화사한 수업을 준비해보세요." },
    5: { visual: "👨‍👩‍👧‍👦", description: "가족과 감사의 마음을 나누는 자료를 모았습니다." },
    6: { visual: "🌿", description: "초록이 짙어지는 계절의 생태와 환경을 배워보세요." },
    7: { visual: "🏖️", description: "즐겁고 안전한 여름을 위한 수업자료를 만나보세요." },
    8: { visual: "🌻", description: "한여름의 자연과 뜻깊은 기념일을 함께 알아봐요." },
    9: { visual: "🌕", description: "가을과 우리 명절을 풍성하게 배우고 즐겨보세요." },
    10: { visual: "🍁", description: "알록달록한 가을 자연과 다양한 행사를 만나보세요." },
    11: { visual: "🧣", description: "겨울을 준비하며 건강과 안전 습관을 익혀보세요." },
    12: { visual: "🎄", description: "한 해를 따뜻하게 마무리하는 겨울 자료를 모았습니다." }
  };

  return presentations[month] ?? { visual: "📅", description: "이달의 일정과 계절에 맞는 수업자료를 확인해보세요." };
}
