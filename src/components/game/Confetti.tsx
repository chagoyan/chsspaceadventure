// Celebration confetti overlay — purely decorative, never blocks input.
const COLORS = ["var(--color-primary)", "var(--color-accent)", "var(--color-reward)", "var(--color-terminal-green)"];

export function Confetti({ pieces = 70 }: { pieces?: number }) {
  return (
    <div className="confetti-layer" aria-hidden="true">
      {Array.from({ length: pieces }).map((_, i) => {
        const left = (i * 137.5) % 100;
        const delay = (i % 12) * 0.18;
        const duration = 2.6 + ((i * 7) % 20) / 10;
        const size = 6 + ((i * 5) % 8);
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * 1.8}px`,
              background: COLORS[i % COLORS.length],
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}
