"use client";

const WAVE_COLORS: Record<string, string> = {
  green: "rgba(184,240,104,",
  orange: "rgba(255,140,30,",
  yellow: "rgba(255,220,50,",
  red: "rgba(255,70,50,",
  blue: "rgba(50,150,255,",
  violet: "rgba(150,100,255,",
  pink: "rgba(255,100,180,",
  amber: "rgba(180,120,60,",
};

const WAVE_ANIMS = ["wave-a", "wave-b", "wave-c", "wave-d"];

export function WaveDivider({
  color = "green",
  variant = 0,
}: {
  color?: string;
  variant?: number;
}) {
  const c = WAVE_COLORS[color] ?? "rgba(184,240,104,";
  const anim = WAVE_ANIMS[variant % WAVE_ANIMS.length]!;
  const dur = 2.5 + variant * 0.7;
  const gradId = `wave-${color}-${variant}`;

  return (
    <div className="my-3 flex justify-center overflow-hidden">
      <svg
        viewBox="0 0 400 20"
        className="h-4 w-full max-w-lg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="20%" stopColor={`${c}0.3)`} />
            <stop offset="50%" stopColor={`${c}0.5)`} />
            <stop offset="80%" stopColor={`${c}0.3)`} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ animation: `${anim} ${dur}s ease-in-out infinite` }}
        />
      </svg>
    </div>
  );
}
