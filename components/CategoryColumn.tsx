import MaterialCard from "@/components/MaterialCard";
import type { Category, PptMaterial, SiteSettings } from "@/lib/types";

type BoardSettings = Omit<SiteSettings, "id" | "created_at" | "updated_at">;

type Props = {
  category: Category | null;
  materials: PptMaterial[];
  hasMaterials: boolean;
  settings: BoardSettings;
  onSelectMaterial: (material: PptMaterial) => void;
  onViewAll: () => void;
};

export default function CategoryColumn({ category, materials, hasMaterials, settings, onSelectMaterial, onViewAll }: Props) {
  const title = category?.name ?? "미분류";
  const description = category ? category.description : "카테고리가 지정되지 않은 자료입니다.";
  const backgroundColor = category?.column_color || settings.default_column_color;
  const shouldUseInternalScroll = materials.length > 2;

  return (
    <section
      className="flex min-w-0 flex-col self-start rounded-lg border p-3 sm:p-4"
      style={{ backgroundColor, borderColor: settings.card_border_color }}
    >
      <div className="mb-3 sm:mb-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="min-w-0 break-keep text-lg font-extrabold leading-snug sm:text-xl">{title}</h2>
          <button
            type="button"
            onClick={onViewAll}
            disabled={!hasMaterials}
            className="shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-bold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
            style={{
              backgroundColor: settings.card_background_color,
              borderColor: settings.card_border_color,
              color: settings.text_color
            }}
            aria-label={`${title} 전체보기`}
          >
            전체보기
          </button>
        </div>
        {description ? <p className="mt-1 break-keep text-sm leading-5 opacity-70 sm:text-base sm:leading-6">{description}</p> : null}
      </div>
      <div
        className={[
          "flex flex-col gap-3 pr-1",
          shouldUseInternalScroll
            ? "max-h-[470px] overflow-y-auto overscroll-contain sm:max-h-[500px] lg:max-h-[520px]"
            : "overflow-visible"
        ].join(" ")}
        style={{ scrollbarGutter: shouldUseInternalScroll ? "stable" : undefined }}
      >
        {materials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            settings={settings}
            onClick={() => onSelectMaterial(material)}
          />
        ))}
        {materials.length === 0 ? (
          <div className="rounded-md border border-dashed bg-white/50 p-4 text-center text-sm opacity-60 sm:p-5 sm:text-base">
            등록된 자료가 없습니다.
          </div>
        ) : null}
      </div>
    </section>
  );
}
