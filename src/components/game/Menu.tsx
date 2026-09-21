// Title menu: new game (name entry), continue, log view, archive, reset.
import { useState } from "react";
import type { SaveData } from "../../game/types";
import { clearSave } from "../../game/save";
import { Link } from "@tanstack/react-router";
import { Volume2, VolumeX } from "lucide-react";
import oscarToad from "../../assets/oscar-toad.png.asset.json";
import shipAsset from "../../assets/voyage-ship.png.asset.json";

function HeroPortrait() {
  return (
    <img src={oscarToad.url} alt="Oscar the horned toad in a CHS spacesuit" className="h-48 w-auto object-contain drop-shadow-[0_0_18px_color-mix(in_oklab,var(--color-primary)_30%,transparent)]" />
  );
}

interface Props {
  save: SaveData | null;
  onNewGame: (name: string) => void;
  onContinue: () => void;
  onViewLog: () => void;
  onViewArchive: () => void;
  onStartOver: () => void;
  onResetAll: () => void;
  muted: boolean;
  onToggleSound: () => void;
}

export function Menu({ save, onNewGame, onContinue, onViewLog, onViewArchive, onStartOver, onResetAll, muted, onToggleSound }: Props) {
  const [name, setName] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmOver, setConfirmOver] = useState(false);
  const latest = save?.repo.commits[save.repo.commits.length - 1];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden bg-background p-6">
      <div className="stars-bg" aria-hidden />
      <button type="button" onClick={onToggleSound} className="absolute right-5 top-5 z-10 rounded-full border border-border bg-card p-3 text-accent hover:bg-secondary" aria-label={muted ? "Turn music and sound on" : "Turn music and sound off"} title={muted ? "Sound off" : "Sound on"}>
        {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </button>
      <div className="relative z-0 flex h-52 w-full max-w-2xl items-center justify-center">
        <img src={shipAsset.url} alt="Oscar's illustrated spacecraft" className="absolute h-auto w-[min(84vw,34rem)] opacity-30" />
        <HeroPortrait />
      </div>
      <div className="text-center">
        <h1 className="font-pixel text-3xl text-primary drop-shadow-[0_2px_10px_color-mix(in_oklab,var(--color-primary)_40%,transparent)] md:text-4xl">OSCAR'S</h1>
        <h2 className="mt-2 font-pixel text-sm text-accent drop-shadow-[0_2px_8px_color-mix(in_oklab,var(--color-accent)_35%,transparent)] md:text-base">GIT SPACE ADVENTURE</h2>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          A top-down arcade mission where Oscar uses Git commands to track the ship's status, changes, and checkpoints.
        </p>
      </div>

      {!save && (
        <form
          className="flex w-full max-w-sm flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim().length >= 2) onNewGame(name.trim());
          }}
        >
          <label className="text-sm font-medium text-foreground" htmlFor="pilot-name">
            Pilot's full name <span className="text-muted-foreground">(goes on your certificates — check spelling!)</span>
          </label>
          <input
            id="pilot-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-input bg-card px-3 py-2 text-foreground focus:outline-2 focus:outline-ring"
            placeholder="e.g. Ada Lovelace"
            autoComplete="name"
          />
          {name.trim().length >= 2 && (
            <p className="text-xs text-muted-foreground">
              Certificates will read: <span className="font-bold text-foreground">{name.trim()}</span>
            </p>
          )}
          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="rounded bg-primary px-4 py-3 font-pixel text-xs text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            START NEW MISSION
          </button>
        </form>
      )}

      {save && (
        <div className="flex w-full max-w-sm flex-col gap-2">
          <p className="text-center text-sm text-muted-foreground">
            Welcome back, <span className="font-bold text-foreground">{save.studentName}</span>
            {latest && (
              <>
                <br />
                Latest checkpoint: <span className="hash-flash font-mono text-terminal-green">{latest.hash}</span> "{latest.message}"
              </>
            )}
          </p>
          <button type="button" onClick={onContinue} className="rounded bg-primary px-4 py-3 font-pixel text-xs text-primary-foreground hover:opacity-90">
            CONTINUE FROM LATEST COMMIT
          </button>
          <button type="button" onClick={onViewLog} className="rounded border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-accent">
            View Git Log ({save.repo.commits.length} checkpoint{save.repo.commits.length === 1 ? "" : "s"})
          </button>
          {save.certificates.length > 0 && (
            <button type="button" onClick={onViewArchive} className="rounded border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-accent">
              Certificate Archive ({save.certificates.length})
            </button>
          )}
          {!confirmOver ? (
            <button type="button" onClick={() => setConfirmOver(true)} className="rounded border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent">
              Start Over (keep name & certificates)
            </button>
          ) : (
            <div className="rounded border border-destructive bg-destructive/10 p-3 text-sm">
              <p className="text-foreground">Restart the mission from the beginning? Your checkpoint history will be lost.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={onStartOver} className="rounded bg-destructive px-3 py-1.5 font-bold text-destructive-foreground">Yes, start over</button>
                <button type="button" onClick={() => setConfirmOver(false)} className="rounded border border-border px-3 py-1.5">Cancel</button>
              </div>
            </div>
          )}
          {!confirmReset ? (
            <button type="button" onClick={() => setConfirmReset(true)} className="rounded px-4 py-2 text-xs text-muted-foreground hover:text-destructive">
              Reset ALL progress…
            </button>
          ) : (
            <div className="rounded border-2 border-destructive bg-destructive/10 p-3 text-sm">
              <p className="font-bold text-destructive">This erases EVERYTHING on this browser:</p>
              <p className="mt-1 text-foreground">mission progress, checkpoint history, your pilot name, and ALL locally stored certificates.</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearSave();
                    onResetAll();
                  }}
                  className="rounded bg-destructive px-3 py-1.5 font-bold text-destructive-foreground"
                >
                  Erase everything
                </button>
                <button type="button" onClick={() => setConfirmReset(false)} className="rounded border border-border px-3 py-1.5">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      <Link to="/teacher" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
        Teacher? View the concept map →
      </Link>
    </div>
  );
}
