// Dialogue overlay with pixel portraits and player choice lines.
import { useEffect, useRef, useState } from "react";
import type { DialogueLine } from "../../game/story";
import { GIT_PORTRAIT, KOMM_PORTRAIT, drawSprite } from "../../game/sprites";
import { sfx } from "../../game/audio";

function Portrait({ who }: { who: "git" | "komm" | "narrator" }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 96, 96);
    if (who === "narrator") return;
    drawSprite(ctx, who === "git" ? GIT_PORTRAIT : KOMM_PORTRAIT, 48, 48, 5.5);
  }, [who]);
  if (who === "narrator") return null;
  return (
    <canvas
      ref={ref}
      width={96}
      height={96}
      className="h-20 w-20 shrink-0 rounded border-2 border-border bg-background [image-rendering:pixelated]"
      aria-hidden
    />
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
  const name = line.speaker === "git" ? "GIT" : line.speaker === "komm" ? "KOMM" : "";

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
                      setTimeout(() => {
                        if (idx < lines.length - 1) {
                          setIdx(idx + 1);
                          setChosen(null);
                        } else onDone();
                      }, 1600);
                    }}
                    className="rounded border border-border bg-background px-3 py-2 text-left text-sm text-accent-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={advance}
                className="mt-4 rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                {idx < lines.length - 1 ? "Next ▸" : "Continue ▸"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
