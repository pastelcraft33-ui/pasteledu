import Image from "next/image";
import type { PptMaterial, SiteSettings } from "@/lib/types";

type BoardSettings = Omit<SiteSettings, "id" | "created_at" | "updated_at">;

type Props = {
  material: PptMaterial;
  settings: BoardSettings;
  onClick: () => void;
};

export default function MaterialCard({ material, settings, onClick }: Props) {
  const formattedDate = formatDate(material.created_at);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onClick();
      }}
      className="shrink-0 overflow-hidden border text-left transition hover:-translate-y-0.5"
      style={{
        backgroundColor: settings.card_background_color,
        borderColor: settings.card_border_color,
        borderRadius: settings.card_radius,
        boxShadow: settings.use_card_shadow ? "0 8px 24px rgba(15, 23, 42, 0.10)" : "none"
      }}
    >
      {material.thumbnail_url ? (
        <Image src={material.thumbnail_url} alt={`${material.title} 썸네일`} width={640} height={360} className="aspect-video w-full object-cover" />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-gray-100 text-sm font-semibold text-gray-500 sm:text-base">썸네일 없음</div>
      )}
      <div className="space-y-3 p-3 sm:p-4">
        <div>
          <h3 className="line-clamp-2 break-keep text-base font-extrabold leading-snug sm:text-lg">{material.title}</h3>
          {material.description ? <p className="mt-1 line-clamp-3 break-keep text-sm leading-5 opacity-70 sm:text-base sm:leading-6">{material.description}</p> : null}
        </div>
        {material.tags?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {material.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 sm:px-2.5 sm:text-sm">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-2 text-sm opacity-70 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <time dateTime={material.created_at}>{formattedDate}</time>
          {material.is_downloadable && material.file_url ? (
            <a
              href={material.file_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="w-fit rounded-md px-3 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: settings.button_color }}
            >
              PPT 다운로드
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}
