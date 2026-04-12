"use client";

import { AnimatedBackground } from "./AnimatedBackground";

export type TabColor = "green" | "orange" | "yellow" | "red" | "blue";

interface TabHeaderProps {
  title?: string;
  icon: string;
  color: TabColor;
}

const colorMap: Record<TabColor, { text: string; glowClass: string }> = {
  green: { text: "text-emerald-300", glowClass: "" },
  orange: { text: "text-orange-300", glowClass: "glow-orange" },
  yellow: { text: "text-yellow-300", glowClass: "glow-yellow" },
  red: { text: "text-red-400", glowClass: "glow-red" },
  blue: { text: "text-blue-300", glowClass: "glow-blue" },
};

export function TabHeader({ title, icon, color }: TabHeaderProps) {
  const { text, glowClass } = colorMap[color];
  return (
    <>
      <AnimatedBackground icon={icon} glowClass={glowClass} />
      {/* Einheitlicher Abstand für alle Tabs — Icon bis Content */}
      <div className="h-44" />
      {title && (
        <h1 className={`mb-6 text-center font-cinzel text-2xl ${text}`}>
          {title}
        </h1>
      )}
    </>
  );
}
