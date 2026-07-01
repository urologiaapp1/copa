"use client";

/** Confeti discreto (PRD §14). CSS puro, sin dependencias. */
export function Confetti({ count = 40 }: { count?: number }) {
  const colors = ["#c9a227", "#6a1b2a", "#e4c866", "#f6f1e7"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const dur = 2.4 + Math.random() * 1.6;
        const size = 6 + Math.random() * 8;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "-5vh",
              width: size,
              height: size * 0.6,
              background: colors[i % colors.length],
              borderRadius: 2,
              animation: `confetti-fall ${dur}s linear ${delay}s forwards`,
            }}
          />
        );
      })}
    </div>
  );
}
