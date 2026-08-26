import MaterialCard from "@/components/MaterialCard";
import type { Category, PptMaterial, SiteSettings } from "@/lib/types";

type BoardSettings = Omit<SiteSettings, "id" | "created_at" | "updated_at">;

type Props = {
  category: Category | null;
  titleOverride?: string;
  descriptionOverride?: string;
  materials: PptMaterial[];
  layout?: "grid" | "column";
  hasMaterials?: boolean;
  settings: BoardSettings;
  onSelectMaterial: (material: PptMaterial) => void;
  onDownloadMaterial: (material: PptMaterial) => void;
  onViewAll?: () => void;
  prioritizeFirstRow?: boolean;
};

export default function CategoryColumn({
  category,
  titleOverride,
  descriptionOverride,
  materials,
  layout = "grid",
  hasMaterials = materials.length > 0,
  settings,
  onSelectMaterial,
  onDownloadMaterial,
  onViewAll,
  prioritizeFirstRow = false
}: Props) {
  const title = titleOverride ?? category?.name ?? "미분류";
  const description = descriptionOverride ?? (category ? category.description : "카테고리가 지정되지 않은 자료입니다.");
  const backgroundColor = category?.column_color || settings.default_column_color;

  if (layout === "column") {
    const shouldUseInternalScroll = materials.length > 1;

    return (
      <section
        className="flex min-w-0 flex-col self-start rounded-lg border p-3 sm:p-4"
        style={{ backgroundColor, borderColor: settings.card_border_color }}
      >
        <div className="mb-3 sm:mb-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="min-w-0 break-keep text-lg font-extrabold leading-snug sm:text-xl">{title}</h2>
            {onViewAll ? (
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
            ) : null}
          </div>
          {description ? <p className="mt-1 break-keep text-sm leading-5 opacity-70 sm:text-base sm:leading-6">{description}</p> : null}
        </div>
        <div
          className={[
            "flex flex-col gap-3 pr-1",
            shouldUseInternalScroll
              ? "max-h-[520px] overflow-y-auto overscroll-contain"
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
              onDownload={() => onDownloadMaterial(material)}
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

  return (
    <section
      className="border-t px-3 py-5 sm:px-4 sm:py-6"
      style={{ backgroundColor, borderColor: settings.card_border_color }}
    >
      <div className="mb-4 sm:mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-keep text-xl font-black leading-snug sm:text-2xl">{title}</h2>
            {description ? <p className="mt-1 break-keep text-sm leading-5 opacity-70 sm:text-base sm:leading-6">{description}</p> : null}
          </div>
          {onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              disabled={!hasMaterials}
              className="shrink-0 rounded-md px-4 py-2 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40 sm:text-base"
              style={{ backgroundColor: settings.button_color }}
              aria-label={`${title} 더보기`}
            >
              더보기
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid auto-rows-fr items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {materials.map((material, index) => (
          <MaterialCard
            key={material.id}
            material={material}
            settings={settings}
            imagePriority={prioritizeFirstRow && index < 4}
            onClick={() => onSelectMaterial(material)}
            onDownload={() => onDownloadMaterial(material)}
          />
        ))}
        {materials.length === 0 ? (
          <div className="col-span-full rounded-md border border-dashed bg-white/50 p-5 text-center text-sm opacity-60 sm:text-base">
            등록된 자료가 없습니다.
          </div>
        ) : null}
      </div>
    </section>
  );
}
