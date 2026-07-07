import Link from "next/link";

type Props = {
  title: string;
  description?: string;
  detail?: string;
  actionHref?: string;
  actionLabel?: string;
  buttonColor: string;
  borderColor: string;
  tone?: "default" | "error";
};

export default function EmptyState({
  title,
  description,
  detail,
  actionHref,
  actionLabel,
  buttonColor,
  borderColor,
  tone = "default"
}: Props) {
  const isError = tone === "error";

  return (
    <div
      className={`max-w-3xl rounded-md border p-8 text-sm ${isError ? "border-red-200 bg-red-50 text-red-800" : "border-dashed bg-white/70"}`}
      style={isError ? undefined : { borderColor }}
    >
      <h2 className="text-lg font-bold">{title}</h2>
      {description ? <p className="mt-3 whitespace-pre-line leading-6 opacity-80">{description}</p> : null}
      {detail ? <p className="mt-3 text-xs leading-5 opacity-60">{detail}</p> : null}
      {actionHref && actionLabel ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={actionHref} className="rounded-md px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: buttonColor }}>
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
