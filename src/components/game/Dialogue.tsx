// Dialogue overlay with illustrated portraits and player choice lines.
import { useEffect, useState } from "react";
import type { DialogueLine } from "../../game/story";
import { sfx } from "../../game/audio";
import oscarToad from "../../assets/oscar-toad.png.asset.json";
import kommAlien from "../../assets/exploration-alien.png.asset.json";

function Portrait({ who }: { who: "oscar" | "komm" | "narrator" }) {
  if (who === "narrator") return null;
  if (who === "oscar") {
    return <img src={oscarToad.url} alt="Oscar" className="h-20 w-20 shrink-0 border-2 border-border bg-background object-contain" />;
  }
  return (
    <img src={kommAlien.url} alt="KOMM" className="h-20 w-20 shrink-0 border-2 border-border bg-background object-contain" />
  );
}

export function Dialogue({ lines, onDone }: { lines: DialogueLine[]; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const line = lines[idx];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !(line?.choices && !chosen)) {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function advance() {
    sfx.pickup();
    if (idx < lines.length - 1) {
      setIdx(idx + 1);
      setChosen(null);
    } else {
      onDone();
    }
  }

  if (!line) return null;
  const name = line.speaker === "oscar" ? "OSCAR" : line.speaker === "komm" ? "KOMM" : "";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 pb-10" role="dialog" aria-label="Dialogue">
      <div className="w-full max-w-3xl rounded-lg border-2 border-border bg-card shadow-2xl">
        {name && (
          <div className="inline-block -translate-y-1/2 translate-x-4 rounded border border-border bg-primary px-3 py-1 font-pixel text-[10px] text-primary-foreground">
            {name}
          </div>
        )}
        <div className="flex items-start gap-4 px-5 pb-5">
          <Portrait who={line.speaker} />
          <div className="min-h-20 flex-1">
            <p className={`text-base leading-relaxed ${line.speaker === "narrator" ? "italic text-muted-foreground" : "text-foreground"}`}>
              {chosen ?? line.text}
            </p>
            {line.choices && !chosen ? (
              <div className="mt-4 flex flex-col gap-2">
                {line.choices.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => {
                      sfx.pickup();
                      setChosen(c.response);
                    }}
                    className="rounded border border-border bg-background px-3 py-2 text-left text-sm text-accent-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIdx(idx - 1);
                      setChosen(null);
                    }}
                    className="rounded border border-border px-3 py-2 text-sm text-foreground hover:bg-accent"
                  >
                    ◂ Read again
                  </button>
                )}
                <button
                  type="button"
                  onClick={advance}
                  className="rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
                >
                  {idx < lines.length - 1 ? "Next ▸" : "Continue ▸"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
