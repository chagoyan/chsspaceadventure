// Dialogue overlay with illustrated portraits and player choice lines.
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MonitorCog } from "lucide-react";
import type { DialogueLine } from "../../game/story";
import { sfx } from "../../game/audio";
import oscarToad from "../../assets/oscar-toad.png.asset.json";
import { Button } from "../ui/button";

function Portrait({ who }: { who: "oscar" | "komm" | "narrator" }) {
  if (who === "narrator") return null;
  if (who === "oscar") {
    return <img src={oscarToad.url} alt="Oscar" className="h-28 w-28 shrink-0 border-2 border-border bg-background object-contain sm:h-36 sm:w-36" />;
  }
  return (
    <div className="komm-display flex h-28 w-28 shrink-0 flex-col items-center justify-center border-2 border-border bg-background sm:h-36 sm:w-36" role="img" aria-label="KOMM ship computer">
      <MonitorCog aria-hidden="true" className="h-12 w-12 text-terminal-green sm:h-16 sm:w-16" />
      <span className="mt-2 font-heading text-lg text-reward">SHIP AI</span>
      <span className="font-mono text-[10px] text-terminal-green">ONLINE</span>
    </div>
  );
}

export function Dialogue({ lines, onDone }: { lines: DialogueLine[]; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const line = lines[idx];

  useEffect(() => {
    if (line?.text.trim().toUpperCase().startsWith("ALERT")) sfx.alarm();
  }, [line?.text]);

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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/90 p-4 sm:p-8" role="dialog" aria-label="Dialogue">
      <div className="communication-panel w-full max-w-5xl border-2 border-border bg-card shadow-2xl">
        {name && (
          <div className="inline-block -translate-y-1/2 translate-x-5 border border-border bg-primary px-4 py-1.5 font-heading text-lg text-primary-foreground sm:text-xl">
            {name}
          </div>
        )}
        <div className="flex flex-col items-center gap-5 px-5 pb-6 sm:flex-row sm:items-start sm:gap-7 sm:px-8 sm:pb-8">
          <Portrait who={line.speaker} />
          <div className="min-h-28 w-full flex-1">
            <p className={`dialogue-copy text-center text-xl leading-relaxed sm:text-left sm:text-2xl ${line.speaker === "narrator" ? "italic text-muted-foreground" : "text-foreground"}`}>
              {chosen ?? line.text}
            </p>
            {line.choices && !chosen ? (
              <div className="mt-6 grid gap-3">
                {line.choices.map((c) => (
                  <Button
                    key={c.label}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      sfx.pickup();
                      setChosen(c.response);
                    }}
                    className="h-auto min-h-14 justify-start whitespace-normal px-5 py-3 text-left text-base leading-snug sm:text-lg"
                  >
                    {c.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                {idx > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIdx(idx - 1);
                      setChosen(null);
                    }}
                    className="h-12 px-5 text-base"
                  >
                    <ChevronLeft aria-hidden="true" /> Read again
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={advance}
                  className="h-12 px-6 text-base font-bold"
                >
                  {idx < lines.length - 1 ? "Next" : "Continue"} <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
