"use client";

export function AnimatedBackground() {
  return (
    <div className="via-bg" aria-hidden="true">
      {/* Pyramide aus dem Originalbild (18KB WebP) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pyramid.webp"
        alt=""
        className="via-pyramid-img"
        loading="eager"
      />

      {/* Grüne Glow-Spots */}
      <div className="via-glow-1" />
      <div className="via-glow-2" />
      <div className="via-glow-3" />
    </div>
  );
}
