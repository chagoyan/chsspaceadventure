// In-action HUD: ship stats, objective, staged/committed indicator.
import type { ShipState } from "../../game/types";

function Bar({ label, value, tone }: { label: string; value: number; tone: "hull" | "armor" | "energy" | "fuel" | "ammo" }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 font-pixel text-[8px] text-muted-foreground">{label}</span>
      <div className="h-3 w-28 overflow-hidden rounded-sm bg-background/80 ring-1 ring-border">
        <div className={`h-full hud-bar-${tone}`} style={{ width: `${v}%` }} />
      </div>
      <span className={`w-9 font-mono text-xs ${v <= 25 ? "font-bold text-destructive" : "text-foreground"}`}>{v}%</span>
    </div>
  );
}

interface Props {
  ship: ShipState;
  objective: string;
  stageTitle: string;
  score: number;
  staged: boolean;
  commits: number;
  kills?: number;
  killTarget?: number;
}

export function HUD({ ship, objective, stageTitle, score, staged, commits, kills, killTarget }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded border border-border bg-card/85 p-3 backdrop-blur-sm">
          <div className="mb-2 font-pixel text-[9px] text-primary">{stageTitle}</div>
          <div className="flex flex-col gap-1.5">
            <Bar label="HULL" value={ship.hull} tone="hull" />
            <Bar label="ARMOR" value={ship.armor} tone="armor" />
            <Bar label="ENERGY" value={ship.energy} tone="energy" />
            <Bar label="FUEL" value={ship.fuel} tone="fuel" />
            <Bar label="AMMO" value={ship.ammo} tone="ammo" />
          </div>
          {ship.upgrades.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {ship.upgrades.map((u) => (
                <span key={u} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-secondary-foreground">
                  ◆ {u}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="rounded border border-border bg-card/85 px-3 py-2 text-right backdrop-blur-sm">
            <div className="font-mono text-sm text-foreground">SCORE {score}</div>
            {killTarget != null && (
              <div className="font-mono text-xs text-muted-foreground">
                Kills {kills ?? 0}/{killTarget}
              </div>
            )}
            <div className="mt-1 flex items-center gap-2 font-mono text-[11px]">
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${commits ? "bg-terminal-green/20 text-terminal-green" : "bg-destructive/20 text-destructive"}`}>
                ● {commits} checkpoint{commits === 1 ? "" : "s"}
              </span>
              {staged && (
                <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-yellow-300" title="Staged but NOT committed — not protected!">
                  ◐ staged (not saved)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="rounded border border-border bg-card/85 px-3 py-2 backdrop-blur-sm">
          <div className="font-pixel text-[8px] text-muted-foreground">OBJECTIVE</div>
          <div className="max-w-md font-mono text-xs text-foreground">{objective}</div>
        </div>
        <div className="rounded border border-border bg-card/85 px-3 py-2 font-mono text-[10px] text-muted-foreground backdrop-blur-sm">
          WASD/arrows fly · mouse aim · click/Space shoot · Shift boost
        </div>
      </div>
    </div>
  );
}
