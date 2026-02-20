import type { GroupColor } from "@/lib/types";

export type GroupColorClasses = {
  dot: string;
  badge: string;
  soft: string;
  text: string;
  filledCell: string;
  filledCellHover: string;
};

const GROUP_COLOR_CLASS_MAP: Record<GroupColor, GroupColorClasses> = {
  primary: {
    dot: "bg-primary",
    badge: "bg-primary/10 border-primary/30 text-primary",
    soft: "bg-primary/20",
    text: "text-primary",
    filledCell: "border-primary/60 bg-primary/20",
    filledCellHover: "hover:bg-primary/30",
  },
  accent: {
    dot: "bg-accent",
    badge: "bg-accent/10 border-accent/30 text-accent",
    soft: "bg-accent/20",
    text: "text-accent",
    filledCell: "border-accent/60 bg-accent/20",
    filledCellHover: "hover:bg-accent/30",
  },
  success: {
    dot: "bg-success",
    badge: "bg-success/10 border-success/30 text-success",
    soft: "bg-success/20",
    text: "text-success",
    filledCell: "border-success/60 bg-success/20",
    filledCellHover: "hover:bg-success/30",
  },
  sky: {
    dot: "bg-sky-500",
    badge: "bg-sky-500/10 border-sky-500/30 text-sky-300",
    soft: "bg-sky-500/20",
    text: "text-sky-300",
    filledCell: "border-sky-500/60 bg-sky-500/20",
    filledCellHover: "hover:bg-sky-500/30",
  },
  rose: {
    dot: "bg-rose-500",
    badge: "bg-rose-500/10 border-rose-500/30 text-rose-300",
    soft: "bg-rose-500/20",
    text: "text-rose-300",
    filledCell: "border-rose-500/60 bg-rose-500/20",
    filledCellHover: "hover:bg-rose-500/30",
  },
  amber: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    soft: "bg-amber-500/20",
    text: "text-amber-300",
    filledCell: "border-amber-500/60 bg-amber-500/20",
    filledCellHover: "hover:bg-amber-500/30",
  },
  violet: {
    dot: "bg-violet-500",
    badge: "bg-violet-500/10 border-violet-500/30 text-violet-300",
    soft: "bg-violet-500/20",
    text: "text-violet-300",
    filledCell: "border-violet-500/60 bg-violet-500/20",
    filledCellHover: "hover:bg-violet-500/30",
  },
  emerald: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    soft: "bg-emerald-500/20",
    text: "text-emerald-300",
    filledCell: "border-emerald-500/60 bg-emerald-500/20",
    filledCellHover: "hover:bg-emerald-500/30",
  },
};

export const GROUP_COLOR_OPTIONS: Array<{ value: GroupColor; label: string; dotClass: string }> = [
  { value: "primary", label: "Or", dotClass: GROUP_COLOR_CLASS_MAP.primary.dot },
  { value: "accent", label: "Rouge", dotClass: GROUP_COLOR_CLASS_MAP.accent.dot },
  { value: "success", label: "Vert", dotClass: GROUP_COLOR_CLASS_MAP.success.dot },
  { value: "sky", label: "Bleu Ciel", dotClass: GROUP_COLOR_CLASS_MAP.sky.dot },
  { value: "rose", label: "Rose", dotClass: GROUP_COLOR_CLASS_MAP.rose.dot },
  { value: "amber", label: "Ambre", dotClass: GROUP_COLOR_CLASS_MAP.amber.dot },
  { value: "violet", label: "Violet", dotClass: GROUP_COLOR_CLASS_MAP.violet.dot },
  { value: "emerald", label: "Emeraude", dotClass: GROUP_COLOR_CLASS_MAP.emerald.dot },
];

export const getGroupColorClasses = (color?: string): GroupColorClasses => {
  if (!color) return GROUP_COLOR_CLASS_MAP.primary;
  return GROUP_COLOR_CLASS_MAP[color as GroupColor] ?? GROUP_COLOR_CLASS_MAP.primary;
};
