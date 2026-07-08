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
      className="flex min-w-0 flex-col self-start rounded-lg border p-4"
      style={{ backgroundColor, borderColor: settings.card_border_color }}
    >
      <div className="mb-4">
        <h2 className="text-xl font-extrabold leading-snug">{title}</h2>
        {description ? <p className="mt-1 text-base leading-6 opacity-70">{description}</p> : null}
      </div>
      <div className="flex max-h-[880px] flex-col gap-3 overflow-y-auto overscroll-contain pr-1">
        {materials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            settings={settings}
            onClick={() => onSelectMaterial(material)}
          />
        ))}
        {materials.length === 0 ? (
          <div className="rounded-md border border-dashed bg-white/50 p-5 text-center text-base opacity-60">
            등록된 자료가 없습니다.
          </div>
        ) : null}
      </div>
    </section>
  );
}
