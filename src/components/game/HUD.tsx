// In-action HUD: ship stats, objective, staged/committed indicator.
import type { ShipState } from "../../game/types";

function Bar({ label, value, tone }: { label: string; value: number; tone: "hull" | "armor" | "energy" | "fuel" | "ammo" }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 font-heading text-sm text-muted-foreground">{label}</span>
      <div className="h-2.5 w-24 overflow-hidden border border-border bg-background/80">
        <div className={`h-full hud-bar-${tone}`} style={{ width: `${v}%` }} />
      </div>
      <span className={`w-8 font-heading text-sm ${v <= 25 ? "text-destructive" : "text-foreground"}`}>{v}</span>
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
  kills?: number | undefined;
  killTarget?: number | undefined;
  bombs?: number;
  shield?: boolean;
  boostReady?: boolean;
  shieldReady?: boolean;
  temporal?: boolean;
}

export function HUD({ ship, objective, stageTitle, score, staged, commits, kills, killTarget, bombs = 0, shield = false, boostReady = true, shieldReady = true, temporal = false }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="arcade-panel p-3">
          {temporal && (
            <div className="chrono-badge mb-2 inline-block rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest">
              ⟲ Timeline re-entry · rewriting history
            </div>
          )}
          <div className="mb-2 font-heading text-xl leading-none text-primary">{stageTitle}</div>
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
          <div className="arcade-panel px-3 py-2 text-right">
            <div className="font-heading text-2xl leading-none text-reward">SCORE {String(score).padStart(7, "0")}</div>
            {killTarget != null && (
              <div className="font-mono text-xs text-muted-foreground">
                Kills {kills ?? 0}/{killTarget}
              </div>
            )}
            <div className="mt-1 flex items-center justify-end gap-2 font-mono text-[11px]">
              <span className={`rounded px-1.5 py-0.5 ${bombs > 0 ? "bg-reward/20 text-reward" : "bg-muted/30 text-muted-foreground"}`} title="Smart bombs (right click)">
                ✸ {bombs} bomb{bombs === 1 ? "" : "s"}
              </span>
              <span className={`rounded px-1.5 py-0.5 ${boostReady ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"}`}>A boost</span>
              <span className={`rounded px-1.5 py-0.5 ${shield ? "bg-terminal-green/30 text-terminal-green" : shieldReady ? "bg-terminal-green/20 text-terminal-green" : "bg-muted/30 text-muted-foreground"}`}>F shield</span>
            </div>
            <div className="mt-1 flex items-center gap-2 font-mono text-[11px]">
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${commits ? "bg-terminal-green/20 text-terminal-green" : "bg-destructive/20 text-destructive"}`}>
                ● {commits} checkpoint{commits === 1 ? "" : "s"}
              </span>
              {staged && (
                <span className="rounded bg-reward/20 px-1.5 py-0.5 text-reward" title="Staged but NOT committed — not protected!">
                  ◐ staged (not saved)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="arcade-panel max-w-lg px-3 py-2">
          <div className="font-heading text-sm text-reward">MISSION OBJECTIVE</div>
          <div className="text-xs font-semibold text-foreground md:text-sm">{objective}</div>
        </div>
        <div className="arcade-panel hidden px-3 py-2 text-xs font-bold text-muted-foreground md:block">
          MOUSE AIM · SPACE THRUST · LEFT CLICK FIRE · RIGHT CLICK SMART BOMB · A BOOST · F SHIELD
        </div>
      </div>
    </div>
  );
}
