"use client";

export function AnimatedBackground() {
  return (
    <div className="via-bg" aria-hidden="true">
      {/* Rotating Pyramid */}
      <div className="via-pyramid" style={{ perspective: "200px" }}>
        <svg viewBox="0 0 60 60" fill="none">
          {/* Pyramid faces */}
          <polygon
            points="30,5 10,45 50,45"
            fill="rgba(0,200,80,0.3)"
            stroke="rgba(0,255,100,0.6)"
            strokeWidth="0.8"
          />
          <polygon
            points="30,5 50,45 40,50"
            fill="rgba(0,180,70,0.2)"
            stroke="rgba(0,255,100,0.4)"
            strokeWidth="0.5"
          />
          <polygon
            points="30,5 10,45 20,50"
            fill="rgba(0,160,60,0.15)"
            stroke="rgba(0,255,100,0.3)"
            strokeWidth="0.5"
          />
          {/* Bottom */}
          <polygon
            points="10,45 50,45 40,50 20,50"
            fill="rgba(0,150,60,0.1)"
            stroke="rgba(0,255,100,0.2)"
            strokeWidth="0.5"
          />
          {/* Inner glow */}
          <circle cx="30" cy="30" r="8" fill="rgba(0,255,100,0.15)" />
          {/* Tip glow */}
          <circle cx="30" cy="5" r="3" fill="rgba(0,255,100,0.3)" />
        </svg>
      </div>

      {/* Flowing Neon Strands */}
      <div className="via-strands">
        <svg viewBox="0 0 400 800" preserveAspectRatio="none">
          <path
            className="strand"
            style={{
              "--strand-a": "'M-20,200 C80,180 120,350 200,300 C280,250 320,450 420,400'",
              "--strand-b": "'M-20,250 C100,200 80,400 200,350 C320,300 280,500 420,450'",
            } as React.CSSProperties}
            d="M-20,200 C80,180 120,350 200,300 C280,250 320,450 420,400"
          />
          <path
            className="strand"
            style={{
              "--strand-a": "'M-20,350 C60,300 140,500 200,450 C260,400 340,550 420,500'",
              "--strand-b": "'M-20,400 C100,350 100,550 200,500 C300,450 300,600 420,550'",
            } as React.CSSProperties}
            d="M-20,350 C60,300 140,500 200,450 C260,400 340,550 420,500"
          />
          <path
            className="strand"
            style={{
              "--strand-a": "'M-20,500 C100,480 80,620 200,580 C320,540 280,700 420,660'",
              "--strand-b": "'M-20,550 C60,500 140,650 200,620 C260,590 340,720 420,700'",
            } as React.CSSProperties}
            d="M-20,500 C100,480 80,620 200,580 C320,540 280,700 420,660"
          />
          <path
            className="strand"
            style={{
              "--strand-a": "'M-20,150 C120,130 80,250 200,220 C320,190 280,350 420,300'",
              "--strand-b": "'M-20,180 C80,160 150,280 200,250 C250,220 350,380 420,340'",
            } as React.CSSProperties}
            d="M-20,150 C120,130 80,250 200,220 C320,190 280,350 420,300"
          />
          <path
            className="strand"
            style={{
              "--strand-a": "'M-20,650 C80,620 160,750 200,720 C240,690 360,780 420,760'",
              "--strand-b": "'M-20,680 C120,650 100,770 200,740 C300,710 320,790 420,780'",
            } as React.CSSProperties}
            d="M-20,650 C80,620 160,750 200,720 C240,690 360,780 420,760"
          />
        </svg>
      </div>

      {/* Ambient glow spots */}
      <div className="via-glow via-glow-1" />
      <div className="via-glow via-glow-2" />
      <div className="via-glow via-glow-3" />
    </div>
  );
}
