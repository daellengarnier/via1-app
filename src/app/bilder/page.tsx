"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "@/components/AnimatedBackground";

interface Bild {
  id: string;
  caption: string;
  author: string;
  date: string;
  emoji: string;
}

const mockBilder: Bild[] = [
  {
    id: "1",
    caption: "Sommerfest im Innenhof",
    author: "Sophie",
    date: "2025-08-14",
    emoji: "🎉",
  },
  {
    id: "2",
    caption: "Neue Sauna-Bänke",
    author: "Marco",
    date: "2025-09-02",
    emoji: "🔥",
  },
  {
    id: "3",
    caption: "Gartenernte",
    author: "Lena",
    date: "2025-09-20",
    emoji: "🥕",
  },
  {
    id: "4",
    caption: "Haussitzung Oktober",
    author: "Alain",
    date: "2025-10-08",
    emoji: "📝",
  },
  {
    id: "5",
    caption: "Winterputz Pyramide",
    author: "Nina",
    date: "2025-12-11",
    emoji: "✨",
  },
  {
    id: "6",
    caption: "Fondueplausch",
    author: "Felix",
    date: "2026-01-22",
    emoji: "🧀",
  },
];

export default function BilderPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Bild | null>(null);

  return (
    <div className="relative p-4 pb-20">
      <AnimatedBackground
        icon="/pic-bilder.webp"
        glowClass="glow-silver"
        showIcon={false}
      />
      <button
        onClick={() => router.back()}
        className="mb-4 ml-14 text-sm text-gray-500 hover:text-white"
      >
        ← Zurück
      </button>

      <div className="mb-2 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pic-bilder.webp"
          alt=""
          className="tab-btn-icon glow-silver"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <h1 className="mb-1 text-center font-cinzel text-3xl text-gray-200">
        Bilder
      </h1>
      <p className="mb-6 text-center text-sm text-gray-500">
        Fotos aus dem Hausleben
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {mockBilder.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelected(b)}
            className="group flex aspect-square flex-col items-center justify-center rounded-lg border border-gray-800 bg-white/5 p-3 text-center transition-colors hover:border-gray-400/40"
          >
            <span className="text-4xl opacity-80 transition-transform group-hover:scale-110">
              {b.emoji}
            </span>
            <p className="mt-2 line-clamp-2 text-xs text-gray-300">
              {b.caption}
            </p>
            <p className="mt-0.5 text-[10px] text-gray-600">{b.author}</p>
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-gray-600">
        Foto-Upload kommt demnächst
      </p>

      {selected && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-800 bg-black p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 text-7xl">{selected.emoji}</div>
            <h2 className="text-lg font-semibold text-white">
              {selected.caption}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {new Date(selected.date).toLocaleDateString("de-CH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              · {selected.author}
            </p>
            <button
              onClick={() => setSelected(null)}
              className="mt-5 rounded-full border border-gray-700 px-5 py-2 text-xs text-gray-400 hover:text-white"
            >
              Schliessen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
