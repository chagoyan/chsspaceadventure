// Cinematic time-rewind overlay played when a reset moves the timeline back.
import { useEffect, useState } from "react";

interface Props {
  hash: string;
  message: string;
  onDone: () => void;
}

export function ChronoWarp({ hash, message, onDone }: Props) {
  const lines = [
    ">>> TACHYON DRIVE ENGAGED <<<",
    "COLLAPSING TIMELINE BRANCHES...",
    `REWINDING CHRONOMETER TO CHECKPOINT ${hash}`,
    `RESTORED: "${message}"`,
  ];
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= lines.length) {
      const id = setTimeout(onDone, 1100);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setShown((s) => s + 1), 480);
    return () => clearTimeout(id);
  }, [shown, lines.length, onDone]);

  return (
    <div className="chrono-warp fixed inset-0 z-[80] flex items-center justify-center bg-background/95 p-6" role="status" aria-label="Timeline rewinding">
      <div className="chrono-scanlines pointer-events-none absolute inset-0" />
      <div className="relative text-center">
        <p className="chrono-glitch font-heading text-4xl text-primary md:text-6xl">CHRONO REWIND</p>
        <div className="mt-6 flex flex-col gap-2 font-mono text-sm text-terminal-green md:text-base">
          {lines.slice(0, shown).map((l) => (
            <span key={l} className="animate-fade-in">{l}</span>
          ))}
        </div>
        {shown >= lines.length && (
          <p className="mt-6 animate-fade-in font-heading text-xl text-reward">TIMELINE RESTORED</p>
        )}
      </div>
    </div>
  );
}
