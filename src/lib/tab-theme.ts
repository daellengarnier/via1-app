import type { TabColor } from "@/components/TabHeader";

export interface TabTheme {
  // Text accents
  label: string; // kleine Labels (ORBITRON, uppercase)
  accent: string; // subtile Akzente
  // Borders
  border: string;
  borderStrong: string;
  // Backgrounds
  bg: string;
  bgStrong: string;
  // Buttons
  btnBg: string;
  btnText: string;
  // Ring (selected state)
  ring: string;
}

export const tabThemes: Record<TabColor, TabTheme> = {
  green: {
    label: "text-emerald-300",
    accent: "text-emerald-300",
    border: "border-emerald-500/30",
    borderStrong: "border-emerald-400",
    bg: "bg-emerald-500/5",
    bgStrong: "bg-emerald-500/15",
    btnBg: "bg-emerald-400",
    btnText: "text-black",
    ring: "ring-emerald-400",
  },
  orange: {
    label: "text-orange-300",
    accent: "text-orange-300",
    border: "border-orange-500/30",
    borderStrong: "border-orange-400",
    bg: "bg-orange-500/5",
    bgStrong: "bg-orange-500/15",
    btnBg: "bg-orange-400",
    btnText: "text-black",
    ring: "ring-orange-400",
  },
  yellow: {
    label: "text-yellow-300",
    accent: "text-yellow-300",
    border: "border-yellow-500/30",
    borderStrong: "border-yellow-400",
    bg: "bg-yellow-500/5",
    bgStrong: "bg-yellow-500/15",
    btnBg: "bg-yellow-400",
    btnText: "text-black",
    ring: "ring-yellow-400",
  },
  red: {
    label: "text-red-400",
    accent: "text-red-400",
    border: "border-red-500/30",
    borderStrong: "border-red-400",
    bg: "bg-red-500/5",
    bgStrong: "bg-red-500/15",
    btnBg: "bg-red-500",
    btnText: "text-white",
    ring: "ring-red-400",
  },
  blue: {
    label: "text-blue-300",
    accent: "text-blue-300",
    border: "border-blue-500/30",
    borderStrong: "border-blue-400",
    bg: "bg-blue-500/5",
    bgStrong: "bg-blue-500/15",
    btnBg: "bg-blue-400",
    btnText: "text-black",
    ring: "ring-blue-400",
  },
  amber: {
    label: "text-amber-300",
    accent: "text-amber-200",
    border: "border-amber-600/30",
    borderStrong: "border-amber-500",
    bg: "bg-amber-600/5",
    bgStrong: "bg-amber-600/15",
    btnBg: "bg-amber-500",
    btnText: "text-black",
    ring: "ring-amber-400",
  },
  violet: {
    label: "text-violet-300",
    accent: "text-violet-200",
    border: "border-violet-500/30",
    borderStrong: "border-violet-400",
    bg: "bg-violet-500/5",
    bgStrong: "bg-violet-500/15",
    btnBg: "bg-violet-500",
    btnText: "text-white",
    ring: "ring-violet-400",
  },
  pink: {
    label: "text-pink-300",
    accent: "text-pink-200",
    border: "border-pink-500/30",
    borderStrong: "border-pink-400",
    bg: "bg-pink-500/5",
    bgStrong: "bg-pink-500/15",
    btnBg: "bg-pink-500",
    btnText: "text-white",
    ring: "ring-pink-400",
  },
  silver: {
    label: "text-gray-300",
    accent: "text-gray-200",
    border: "border-gray-500/30",
    borderStrong: "border-gray-400",
    bg: "bg-gray-500/5",
    bgStrong: "bg-gray-500/15",
    btnBg: "bg-gray-400",
    btnText: "text-black",
    ring: "ring-gray-400",
  },
};
