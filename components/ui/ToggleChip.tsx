"use client";

export function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="filter-chip toggle-chip"
    >
      <span className="skew-label">{label}</span>
    </button>
  );
}
