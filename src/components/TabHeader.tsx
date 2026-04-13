"use client";

import { AnimatedBackground } from "./AnimatedBackground";

export type TabColor =
  | "green"
  | "orange"
  | "yellow"
  | "red"
  | "blue"
  | "amber"
  | "violet"
  | "pink"
  | "silver";

interface TabHeaderProps {
  title?: string;
  icon: string;
  color: TabColor;
  /** Wenn false, wird das grosse Tab-Icon ausgeblendet und der Abstand
   *  verkleinert (fuer Tabs, die das Icon neben dem Button zeigen). */
  showIcon?: boolean;
}

const colorMap: Record<TabColor, { text: string; glowClass: string }> = {
  green: { text: "text-emerald-300", glowClass: "" },
  orange: { text: "text-orange-300", glowClass: "glow-orange" },
  yellow: { text: "text-yellow-300", glowClass: "glow-yellow" },
  red: { text: "text-red-400", glowClass: "glow-red" },
  blue: { text: "text-blue-300", glowClass: "glow-blue" },
  amber: { text: "text-amber-300", glowClass: "glow-amber" },
  violet: { text: "text-violet-300", glowClass: "glow-violet" },
  pink: { text: "text-pink-300", glowClass: "glow-pink" },
  silver: { text: "text-gray-300", glowClass: "glow-silver" },
};

export function TabHeader({
  title,
  icon,
  color,
  showIcon = true,
}: TabHeaderProps) {
  const { text, glowClass } = colorMap[color];
  return (
    <>
      <AnimatedBackground
        icon={icon}
        glowClass={glowClass}
        showIcon={showIcon}
      />
      {/* Einheitlicher Abstand: gross mit Icon, minimal ohne */}
      {showIcon && <div className="h-36" />}
      {title && (
        <h1 className={`mb-5 text-center font-cinzel text-2xl ${text}`}>
          {title}
        </h1>
      )}
    </>
  );
}
