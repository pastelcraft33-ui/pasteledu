import MaterialCard from "@/components/MaterialCard";
import type { Category, PptMaterial, SiteSettings } from "@/lib/types";

type BoardSettings = Omit<SiteSettings, "id" | "created_at" | "updated_at">;

type Props = {
  category: Category | null;
  materials: PptMaterial[];
  settings: BoardSettings;
  onSelectMaterial: (material: PptMaterial) => void;
};

export default function CategoryColumn({ category, materials, settings, onSelectMaterial }: Props) {
  const title = category?.name ?? "미분류";
  const description = category ? category.description : "카테고리가 지정되지 않은 자료입니다.";
  const backgroundColor = category?.column_color || settings.default_column_color;

  return (
    <section
      className="flex w-[280px] shrink-0 flex-col rounded-lg border p-4 sm:w-[300px] lg:w-[320px]"
      style={{ backgroundColor, borderColor: settings.card_border_color }}
    >
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-semibold">{materials.length}개</span>
        </div>
        {description ? <p className="mt-1 text-sm opacity-70">{description}</p> : null}
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {materials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            settings={settings}
            onClick={() => onSelectMaterial(material)}
          />
        ))}
        {materials.length === 0 ? (
          <div className="rounded-md border border-dashed bg-white/50 p-5 text-center text-sm opacity-60">
            등록된 자료가 없습니다.
          </div>
        ) : null}
      </div>
    </section>
  );
}
