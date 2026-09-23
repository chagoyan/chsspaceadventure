// Title menu: new game (name entry), continue, log view, archive, reset.
import { useState } from "react";
import type { SaveData } from "../../game/types";
import { clearSave } from "../../game/save";
import { Link } from "@tanstack/react-router";
import { Volume2, VolumeX } from "lucide-react";
import oscarToad from "../../assets/oscar-toad.png.asset.json";
import shipAsset from "../../assets/space-explorer-title-ship.png";
import { Button } from "../ui/button";

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-5 py-8 sm:px-8">
      <div className="stars-bg" aria-hidden />
      <main className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        <img
          src={shipAsset}
          alt="Oscar piloting his round spacecraft"
          className="h-auto w-[min(78vw,22rem)] object-contain drop-shadow-[0_0_30px_color-mix(in_oklab,var(--color-primary)_28%,transparent)]"
        />

        <p className="mt-3 font-pixel text-sm tracking-[0.28em] text-terminal-green sm:text-base">
          KOMM GIT TRAINING · MISSION TWO
        </p>
        <h1 className="mt-2 font-pixel text-5xl leading-none text-primary drop-shadow-[0_3px_12px_color-mix(in_oklab,var(--color-primary)_38%,transparent)] sm:text-7xl">
          GIT SPACE ADVENTURE
        </h1>
        <p className="mt-5 max-w-lg text-base text-muted-foreground">
          Learn to use KOMM's Git terminal commands to track changes, create checkpoints, and keep Oscar's ship flying.
        </p>

      {!save && (
        <form
          className="mt-8 flex w-full max-w-md flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim().length >= 2) onNewGame(name.trim());
          }}
        >
          <label className="font-pixel text-lg tracking-[0.08em] text-terminal-green" htmlFor="pilot-name">
            PLAYER NAME
          </label>
          <input
            id="pilot-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 border border-primary/60 bg-background px-4 text-center text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-ring"
            placeholder="Enter your full name"
            autoComplete="name"
          />
          {name.trim().length >= 2 && (
            <p className="text-xs text-muted-foreground">
              Certificates will read: <span className="font-bold text-foreground">{name.trim()}</span>
            </p>
          )}
          <Button
            type="submit"
            disabled={name.trim().length < 2}
            size="lg"
            className="mt-1 h-13 font-pixel text-xl"
          >
            START MISSION TWO
          </Button>
        </form>
      )}

      {save && (
        <div className="mt-8 flex w-full max-w-md flex-col items-center gap-3">
          <p className="font-pixel text-lg tracking-[0.08em] text-terminal-green">PLAYER NAME</p>
          <div className="flex h-12 w-full items-center justify-center border border-primary/60 bg-background px-4 text-foreground">
            {save.studentName}
          </div>
          <div className="mt-1 grid w-full grid-cols-2 gap-3 sm:grid-cols-[1.25fr_1fr_auto]">
            <Button type="button" onClick={onContinue} size="lg" className="h-13 font-pixel text-xl">
              CONTINUE
            </Button>
            <Button type="button" onClick={() => setConfirmOver(true)} variant="outline" size="lg" className="h-13 font-pixel text-xl">
              START OVER
            </Button>
            <Button type="button" onClick={onToggleSound} variant="ghost" size="lg" className="col-span-2 h-13 font-pixel text-lg text-foreground sm:col-span-1" aria-label={muted ? "Turn music and sound on" : "Turn music and sound off"}>
              {muted ? <VolumeX /> : <Volume2 />}
              {muted ? "SOUND OFF" : "SOUND ON"}
            </Button>
          </div>
          {latest && (
            <p className="text-xs text-muted-foreground">
              Saved at <span className="font-mono text-foreground">{latest.message}</span>
            </p>
          )}
          <Button type="button" onClick={onViewLog} variant="outline" className="mt-2 w-full">
            View Git Log ({save.repo.commits.length} checkpoint{save.repo.commits.length === 1 ? "" : "s"})
          </Button>
          {save.certificates.length > 0 && (
            <Button type="button" onClick={onViewArchive} variant="outline" className="w-full">
              Certificate Archive ({save.certificates.length})
            </Button>
          )}
          {confirmOver && (
            <div className="rounded border border-destructive bg-destructive/10 p-3 text-sm">
              <p className="text-foreground">Restart the mission from the beginning? Your checkpoint history will be lost.</p>
              <div className="mt-2 flex gap-2">
                <Button type="button" onClick={onStartOver} variant="destructive" size="sm">Yes, start over</Button>
                <Button type="button" onClick={() => setConfirmOver(false)} variant="outline" size="sm">Cancel</Button>
              </div>
            </div>
          )}
          {!confirmReset ? (
            <Button type="button" onClick={() => setConfirmReset(true)} variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive">
              Reset ALL progress…
            </Button>
          ) : (
            <div className="rounded border-2 border-destructive bg-destructive/10 p-3 text-sm">
              <p className="font-bold text-destructive">This erases EVERYTHING on this browser:</p>
              <p className="mt-1 text-foreground">mission progress, checkpoint history, your pilot name, and ALL locally stored certificates.</p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    clearSave();
                    onResetAll();
                  }}
                  variant="destructive"
                  size="sm"
                >
                  Erase everything
                </Button>
                <Button type="button" onClick={() => setConfirmReset(false)} variant="outline" size="sm">Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

        <div className="mt-7 flex max-w-md items-center gap-4 text-left">
          <img src={oscarToad.url} alt="Oscar the horned toad" className="h-16 w-16 shrink-0 object-contain" />
          <p className="text-sm text-foreground">
            “I'm Oscar. KOMM runs the Git training; you keep us flying.”
          </p>
        </div>

        <Link to="/teacher" className="mt-5 text-xs text-muted-foreground underline-offset-2 hover:underline">
          Teacher? View the concept map →
        </Link>
      </main>
    </div>
  );
}
