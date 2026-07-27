import { CATEGORY_ICONS } from "./categoryIcons";

interface CategoryBadgeProps {
  categoryId: string;
  label: string;
  tone?: "default" | "accent";
}

export function CategoryBadge({
  categoryId,
  label,
  tone = "default",
}: CategoryBadgeProps) {
  const Icon = CATEGORY_ICONS[categoryId];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-xs ${
        tone === "accent"
          ? "border-vital/30 bg-vital/10 text-vital"
          : "border-hairline bg-panel-raised text-paper-dim"
      }`}
    >
      {Icon && <Icon size={12} strokeWidth={2} className="shrink-0" />}
      {label}
    </span>
  );
}
