import { Baby, GraduationCap, HeartHandshake, type LucideIcon } from "lucide-react";
import type { LibrarySection } from "@/lib/types";

type Props = {
  activeSection: LibrarySection | null;
  onChange: (section: LibrarySection) => void;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
};

const sections: Array<{ id: LibrarySection; label: string; icon: LucideIcon; accent: string }> = [
  { id: "kindergarten", label: "유치원관", icon: Baby, accent: "#D85C8A" },
  { id: "elementary", label: "초등관", icon: GraduationCap, accent: "#3983C5" },
  { id: "senior", label: "시니어관", icon: HeartHandshake, accent: "#6F8465" }
];

export default function LibrarySectionNav({ activeSection, onChange, textColor, backgroundColor, borderColor }: Props) {
  const navBackground = `color-mix(in srgb, ${borderColor} 30%, ${backgroundColor})`;

  return (
    <nav
      className="border-b px-4 py-2.5 sm:px-8 sm:py-3"
      style={{ backgroundColor: navBackground, borderColor }}
      aria-label="자료실 관 선택"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-1 sm:gap-3">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          const Icon = section.icon;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onChange(section.id)}
              className="inline-flex min-h-[46px] min-w-0 flex-1 items-center justify-center gap-1 rounded-full border px-1 py-2 text-base font-extrabold whitespace-nowrap transition hover:-translate-y-0.5 sm:min-h-[50px] sm:max-w-44 sm:flex-none sm:gap-2 sm:px-6 sm:py-2.5 sm:text-lg"
              style={{
                backgroundColor: isActive ? backgroundColor : "transparent",
                borderColor: isActive ? section.accent : "transparent",
                color: isActive ? section.accent : textColor,
                boxShadow: isActive ? "0 5px 14px rgba(15, 23, 42, 0.10)" : "none"
              }}
              aria-pressed={isActive}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8"
                style={{
                  backgroundColor: `color-mix(in srgb, ${section.accent} ${isActive ? 24 : 15}%, ${backgroundColor})`,
                  color: section.accent
                }}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4 stroke-[2.5] sm:h-[18px] sm:w-[18px]" />
              </span>
              {section.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
