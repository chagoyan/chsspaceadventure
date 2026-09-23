// Game orchestrator: menu → story steps (dialogue / terminal / action / certificates).
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { CertificateData, Repo, SaveData, ShipState } from "../game/types";
import { freshRepo } from "../game/types";
import { loadSave, storeSave, clearSave, makeVerificationCode } from "../game/save";
import { cloneSnapshot, head, mergeOrphaned } from "../game/git";
import { STEPS, stepById, nextStepId, type ActionStep, type DialogueStep, type TerminalStep, type CertificateStep } from "../game/story";
import { GameEngine, WORLD_W, WORLD_H, type EngineEvent } from "../game/engine";
import { setMuted, startMusic, stopMusic, sfx } from "../game/audio";
import { Terminal } from "./game/Terminal";
import { Dialogue } from "./game/Dialogue";
import { Confetti } from "./game/Confetti";
import { HUD } from "./game/HUD";
import { Menu } from "./game/Menu";
import { CertificateView } from "../routes/certificate.$part";
import { Button } from "./ui/button";

type DestroyInfo = { hadCommits: false } | { hadCommits: true; hash: string; message: string };

export function Game() {
  const [save, setSave] = useState<SaveData | null | undefined>(undefined);
  const [mode, setMode] = useState<"menu" | "playing" | "log" | "archive" | "done">("menu");
  const [stepId, setStepId] = useState<string>("d_intro");
  const [destroyed, setDestroyed] = useState<DestroyInfo | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hudShip, setHudShip] = useState<ShipState | null>(null);
  const [hudKills, setHudKills] = useState(0);
  const [hudScore, setHudScore] = useState(0);
  const [hudPower, setHudPower] = useState({ bombs: 2, shield: false, boostReady: true, shieldReady: true });
  const [controlsSeen, setControlsSeen] = useState(false);
  const [victory, setVictory] = useState<number | null>(null);
  const [selectedCheckpointHash, setSelectedCheckpointHash] = useState<string | null>(null);
  const [resetTargetHash, setResetTargetHash] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const navigate = useNavigate();

  // load save on mount
  useEffect(() => {
    setSave(loadSave());
  }, []);

  // play time ticker
  useEffect(() => {
    if (mode !== "playing") return;
    const id = setInterval(() => {
      setSave((s) => {
        if (!s) return s;
        const next = { ...s, playTimeSeconds: s.playTimeSeconds + 5 };
        storeSave(next);
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [mode]);

  const persist = useCallback((next: SaveData) => {
    storeSave(next);
    setSave(next);
  }, []);

  const updateRepo = useCallback(
    (repo: Repo) => {
      setSave((s) => {
        if (!s) return s;
        const next = { ...s, repo };
        storeSave(next);
        return next;
      });
    },
    [],
  );

  function newGame(name: string) {
    const data: SaveData = {
      version: 1,
      studentName: name,
      repo: freshRepo("d_intro"),
      storyStep: "d_intro",
      certificates: [],
      playTimeSeconds: 0,
      gameComplete: false,
      settings: { reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches, muted: false },
    };
    persist(data);
    setMuted(false);
    startMusic(1);
    setStepId("d_intro");
    setMode("playing");
  }

  function continueGame() {
    if (!save) return;
    // Resume from the LATEST COMMIT — discard staged/uncommitted remnants.
    const h = head(save.repo);
    const repo: Repo = {
      ...save.repo,
      working: h ? cloneSnapshot(h.snapshot) : save.repo.working,
      staged: null,
    };
    const next = { ...save, repo };
    persist(next);
    setMuted(save.settings.muted);
    startMusic(1);
    setStepId(save.storyStep);
    setMode("playing");
  }

  function startOver() {
    if (!save) return;
    const next: SaveData = {
      ...save,
      repo: freshRepo("d_intro"),
      storyStep: "d_intro",
      gameComplete: false,
      playTimeSeconds: 0,
    };
    persist(next);
    setStepId("d_intro");
    setMode("playing");
  }

  function resetAll() {
    stopMusic();
    setSave(null);
    setMode("menu");
    setStepId("d_intro");
  }

  function toggleSound() {
    setSave((current) => {
      const nextMuted = !(current?.settings.muted ?? false);
      setMuted(nextMuted);
      if (!nextMuted) startMusic(1);
      if (!current) return current;
      const next = { ...current, settings: { ...current.settings, muted: nextMuted } };
      storeSave(next);
      return next;
    });
  }

  const advance = useCallback(() => {
    // Once the rewind lesson is done, a replayed run must not repeat it.
    const skip = new Set(save?.flags?.["resetDone"] ? ["t_reset"] : []);
    let next = nextStepId(stepId);
    while (next && skip.has(next)) next = nextStepId(next);
    if (!next) {
      setMode("done");
      return;
    }
    setStepId(next);
    setSave((s) => {
      if (!s) return s;
      // storyStep is a committed-safe resume boundary
      const updated: SaveData = { ...s, storyStep: next };
      storeSave(updated);
      return updated;
    });
    setDestroyed(null);
    setNotice(null);
  }, [stepId, save?.flags]);

  // Victory lap countdown after the final boss falls.
  useEffect(() => {
    if (victory == null) return;
    if (victory <= 0) {
      setVictory(null);
      advance();
      return;
    }
    const id = setTimeout(() => setVictory((v) => (v == null ? null : v - 1)), 1000);
    return () => clearTimeout(id);
  }, [victory, advance]);

  // ---- action step engine lifecycle ----
  const step = stepById(stepId);
  const showControls = mode === "playing" && stepId === "a_field" && !controlsSeen;
  const actionStep = mode === "playing" && step?.kind === "action" && !destroyed && !showControls ? (step as ActionStep) : null;
  const visibleActionStep = mode === "playing" && step?.kind === "action" ? (step as ActionStep) : null;

  useEffect(() => {
    if (!actionStep || !canvasRef.current || !save) return;
    const working = save.repo.working;
    setHudShip(working.ship);
    setHudKills(0);
    setHudScore(working.score);
    startMusic(((Math.max(1, working.stage) - 1) % 3) + 1);
    // Sector 7 replay (after a reset): the rammer returns, but it can be shot down.
    const replayingNebula = actionStep.id === "a_nebula" && !!save.flags?.["resetDone"];
    const spec = replayingNebula
      ? {
          ...actionStep.spec,
          kamikazeWeak: true,
          objective: "Thread the nebula clouds and reach the beacon. The red rammer is back — this time your guns can bring it down.",
        }
      : actionStep.spec;
    const engine = new GameEngine(
      canvasRef.current,
      working.ship,
      working.score,
      spec,
      {
        onShip: (ship, extras) => {
          setHudShip(ship);
          setHudKills(extras.kills);
          setHudScore(extras.score);
          setHudPower({ bombs: extras.bombs, shield: extras.shield, boostReady: extras.boostReady, shieldReady: extras.shieldReady });
        },
        onEvent: (e: EngineEvent) => handleEngineEvent(e, actionStep),
      },
      save.settings.reducedMotion,
    );
    engineRef.current = engine;
    engine.start();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId, destroyed, mode, controlsSeen]);

  function syncWorkingFromEngine(engine: GameEngine) {
    const ship = engine.getShip();
    const score = engine.getScore();
    setSave((s) => {
      if (!s) return s;
      const repo: Repo = {
        ...s.repo,
        working: { ...cloneSnapshot(s.repo.working), ship, score, stepId },
      };
      const next = { ...s, repo };
      storeSave(next);
      return next;
    });
  }

  function handleEngineEvent(e: EngineEvent, current: ActionStep) {
    const engine = engineRef.current;
    if (!engine) return;
    if (e.type === "destroyed") {
      setSave((s) => {
        if (!s) return s;
        const h = head(s.repo);
        if (!h) {
          setDestroyed({ hadCommits: false });
          return s;
        }
        setDestroyed({ hadCommits: true, hash: h.hash, message: h.message });
        return s;
      });
      return;
    }
    if (e.type === "upgrade") {
      syncWorkingFromEngine(engine);
      if (e.id === "Shield Booster") {
        setNotice("◆ Shield Booster installed! That's a valuable change — stage & commit it at the next terminal to protect it.");
      }
      if (e.id === "Turbo Core") {
        setNotice("◆ Turbo Core installed! Engines surge with power...");
      }
      return;
    }
    if (e.type === "safeZone") {
      syncWorkingFromEngine(engine);
      advance();
      return;
    }
    if (e.type === "objective") {
      syncWorkingFromEngine(engine);
      if (current.spec.boss) {
        // Victory lap: celebrate and let the player fly before the certificate.
        engine.celebrate(12);
        setVictory(8);
        return;
      }
      advance();
      return;
    }
    void current;
  }

  function respawnFromDestroy() {
    if (!save) return;
    if (!destroyed) return;
    if (!destroyed.hadCommits) {
      // No checkpoints: mission restarts from the beginning (keep name, certs, playtime).
      const repo = freshRepo("d_intro");
      const next = { ...save, repo, storyStep: "t_init" };
      persist(next);
      setStepId("t_init");
      setDestroyed(null);
      setNotice("No checkpoints found. Mission restarted — initialize tracking again.");
      return;
    }
    // Restore the most recent committed snapshot exactly.
    const h = head(save.repo)!;
    const repo: Repo = { ...save.repo, working: cloneSnapshot(h.snapshot), staged: null };
    persist({ ...save, repo });
    setDestroyed(null);
    setNotice(`Restored to checkpoint ${h.hash} — "${h.message}". Uncommitted progress was lost.`);
    // re-mount same action step: force remount by toggling destroyed already false
  }

  // ---- certificate awarding ----
  function awardCertificate(part: 1 | 2): CertificateData | null {
    if (!save) return null;
    const existing = save.certificates.find((c) => c.part === part);
    if (existing) return existing;
    const commands =
      part === 1
        ? ["git init", "git status", "git add .", 'git commit -m "..."']
        : ["git init", "git status", "git add .", 'git commit -m "..."', "git log --oneline", "git reset --hard <hash>", "git revert <hash>"];
    const cert: CertificateData = {
      part,
      studentName: save.studentName,
      completedAt: Date.now(),
      verificationCode: makeVerificationCode(save.studentName + part, Date.now()),
      commandsDemonstrated: commands,
      milestone:
        part === 1
          ? "Sector 4 cleared — The Iron Ring (midpoint)"
          : "Sector 11 cleared — MERGE CONFLICT destroyed, Void Gate reached",
      commitEvidence: save.repo.commits.slice(-6).map((c) => ({ hash: c.hash, message: c.message })),
      playTimeSeconds: save.playTimeSeconds,
    };
    const next: SaveData = {
      ...save,
      certificates: [...save.certificates, cert],
      gameComplete: part === 2 ? true : save.gameComplete,
    };
    persist(next);
    sfx.commit();
    return cert;
  }

  // ---- render ----
  if (save === undefined) return null;

  if (mode === "menu") {
    return (
      <Menu
        save={save}
        onNewGame={newGame}
        onContinue={continueGame}
        onViewLog={() => setMode("log")}
        onViewArchive={() => setMode("archive")}
        onStartOver={startOver}
        onResetAll={resetAll}
        muted={save?.settings.muted ?? false}
        onToggleSound={toggleSound}
      />
    );
  }

  if (mode === "log" && save) {
    const timelineSave = save;
    const recommendedTimelineCheckpoint = timelineSave.repo.commits.slice(0, -1).reduce<(typeof timelineSave.repo.commits)[number] | null>((best, commit) => {
      if (!best) return commit;
      const score = commit.snapshot.ship.hull + commit.snapshot.ship.armor + commit.snapshot.ship.energy + commit.snapshot.ship.fuel + commit.snapshot.ship.ammo;
      const bestScore = best.snapshot.ship.hull + best.snapshot.ship.armor + best.snapshot.ship.energy + best.snapshot.ship.fuel + best.snapshot.ship.ammo;
      return score > bestScore ? commit : best;
    }, null);
    const selectedCheckpoint = selectedCheckpointHash
      ? timelineSave.repo.commits.find((commit) => commit.hash === selectedCheckpointHash) ?? null
      : null;

    function startFromCheckpoint(hash: string) {
      const index = timelineSave.repo.commits.findIndex((commit) => commit.hash === hash);
      const checkpoint = index >= 0 ? timelineSave.repo.commits[index] : undefined;
      if (!checkpoint) return;
      const target = stepById(checkpoint.snapshot.stepId);
      const storyStep = target ? target.id : timelineSave.storyStep;
      const repo: Repo = {
        ...timelineSave.repo,
        commits: timelineSave.repo.commits.slice(0, index + 1),
        orphaned: mergeOrphaned(timelineSave.repo.orphaned, timelineSave.repo.commits.slice(index + 1)),
        working: cloneSnapshot(checkpoint.snapshot),
        staged: null,
      };
      persist({ ...timelineSave, repo, storyStep });
      setStepId(storyStep);
      setSelectedCheckpointHash(null);
      setNotice(`Restored checkpoint ${checkpoint.hash} — "${checkpoint.message}".`);
      setMuted(timelineSave.settings.muted);
      startMusic(((Math.max(1, checkpoint.snapshot.stage) - 1) % 3) + 1);
      setMode("playing");
    }

    return (
      <div className="flex min-h-screen flex-col items-center bg-background p-4 text-foreground sm:p-6">
        <div className="w-full max-w-3xl">
          <h1 className="font-heading text-3xl text-primary sm:text-4xl">MISSION TIMELINE</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a checkpoint to restart the mission from that moment.</p>
          {notice && (
            <p className="mt-3 rounded border border-primary bg-card px-3 py-2 text-sm text-foreground">{notice}</p>
          )}
          <div className="mt-5 overflow-hidden rounded border border-border bg-card font-mono text-sm">
            {timelineSave.repo.commits.length === 0 && <p className="p-4 text-muted-foreground">No checkpoints yet.</p>}
            {[...timelineSave.repo.commits].reverse().map((c, i) => (
              <Button
                key={c.hash}
                type="button"
                variant="ghost"
                onClick={() => setSelectedCheckpointHash(c.hash)}
                className="h-auto w-full justify-start rounded-none border-b border-border px-4 py-4 text-left last:border-b-0 hover:bg-accent/10"
                aria-label={`Start from checkpoint ${c.hash}: ${c.message}`}
              >
                <span className="flex min-w-0 flex-1 flex-col items-start gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                  <span className={c.hash === recommendedTimelineCheckpoint?.hash ? "hash-recommended shrink-0 text-terminal-green" : "hash-flash shrink-0 text-terminal-green"}>{c.hash}</span>
                  <span className="min-w-0 whitespace-normal text-foreground">{c.message}</span>
                  <span className="shrink-0 text-xs text-muted-foreground sm:ml-auto">{new Date(c.timestamp).toLocaleString()}</span>
                </span>
                {i === 0 && <span className="shrink-0 text-xs text-muted-foreground">CURRENT</span>}
              </Button>
            ))}
          </div>
          {(timelineSave.repo.orphaned?.length ?? 0) > 0 && (
            <div className="mt-6">
              <p className="font-heading text-lg text-muted-foreground">NO LONGER IN THIS TIMELINE</p>
              <p className="text-xs text-muted-foreground">These checkpoints existed before a reset. They are kept here for reference only.</p>
              <div className="mt-2 overflow-hidden rounded border border-dashed border-border bg-card/40 font-mono text-sm opacity-50">
                {timelineSave.repo.orphaned?.map((c) => (
                  <div key={c.hash} className="flex flex-col gap-1 border-b border-border px-4 py-3 text-left line-through last:border-b-0 sm:flex-row sm:items-baseline sm:gap-3">
                    <span className="shrink-0 text-muted-foreground">{c.hash}</span>
                    <span className="min-w-0 text-muted-foreground">{c.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button type="button" variant="outline" className="mt-5" onClick={() => { setSelectedCheckpointHash(null); setNotice(null); setMode("menu"); }}>
            Back to Main Menu
          </Button>
        </div>

        {selectedCheckpoint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4" role="dialog" aria-modal="true" aria-label="Confirm checkpoint">
            <div className="arcade-panel w-full max-w-md p-6 text-center">
              <p className="font-heading text-3xl text-primary">START HERE?</p>
              <p className="mt-3 text-sm text-foreground">
                Restore <span className="hash-flash font-mono text-terminal-green">{selectedCheckpoint.hash}</span>{" "}
                “{selectedCheckpoint.message}” and continue from that mission?
              </p>
              {selectedCheckpoint.hash !== timelineSave.repo.commits[timelineSave.repo.commits.length - 1]?.hash && (
                <p className="mt-3 text-xs text-muted-foreground">Later checkpoints will be removed from this timeline.</p>
              )}
              <div className="mt-5 flex justify-center gap-3">
                <Button type="button" onClick={() => startFromCheckpoint(selectedCheckpoint.hash)}>Start from checkpoint</Button>
                <Button type="button" variant="outline" onClick={() => setSelectedCheckpointHash(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if ((mode === "archive" || (step?.kind === "archive" && mode === "playing")) && save) {
    return <ArchiveScreen save={save} onBack={() => (save.gameComplete ? setMode("done") : setMode("menu"))} onView={(p) => navigate({ to: "/certificate/$part", params: { part: String(p) } })} />;
  }

  if (mode === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center text-foreground">
        <h1 className="font-pixel text-xl text-primary">MISSION COMPLETE</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Oscar delivered the Starlight Beacon to the Void Gate. Final score:{" "}
          <span className="font-mono text-foreground">{save?.repo.working.score ?? 0}</span> · Play time:{" "}
          {Math.floor((save?.playTimeSeconds ?? 0) / 60)}m
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          You now know the core Git workflow: init, status, add, commit, log, reset --hard, and revert.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setMode("archive")} className="rounded bg-primary px-4 py-2 font-pixel text-[10px] text-primary-foreground">
            VIEW ALL CERTIFICATES
          </button>
          <button type="button" onClick={() => setMode("menu")} className="rounded border border-border px-4 py-2 text-sm hover:bg-accent">
            Main menu
          </button>
        </div>
      </div>
    );
  }

  // playing
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      {victory != null && (
        <>
          <Confetti />
          <div className="pointer-events-none fixed left-1/2 top-10 z-[60] -translate-x-1/2 text-center">
            <p className="font-heading text-5xl text-reward drop-shadow">MERGE CONFLICT DESTROYED!</p>
            <p className="mt-2 font-heading text-xl text-terminal-green">Victory lap — take the Void Gate in style.</p>
            <p className="mt-1 text-sm text-muted-foreground">Certificate in {victory}…</p>
          </div>
        </>
      )}
      {visibleActionStep && (
        <div className="arcade-frame relative" style={{ width: "min(100vw, 1280px)" }}>
          <div className="relative w-full" style={{ aspectRatio: `${WORLD_W}/${WORLD_H}` }}>
            <canvas ref={canvasRef} width={WORLD_W} height={WORLD_H} className="h-full w-full" />
            {hudShip && (
              <HUD
                ship={hudShip}
                objective={visibleActionStep.spec.objective}
                stageTitle={visibleActionStep.spec.title}
                score={hudScore}
                staged={save?.repo.staged != null}
                commits={save?.repo.commits.length ?? 0}
                kills={hudKills}
                killTarget={visibleActionStep.spec.killTarget}
                bombs={hudPower.bombs}
                shield={hudPower.shield}
                boostReady={hudPower.boostReady}
                shieldReady={hudPower.shieldReady}
              />
            )}
          </div>
        </div>
      )}

      {showControls && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/90 p-4" role="dialog" aria-label="Flight controls">
          <div className="arcade-panel w-full max-w-xl p-6 text-center">
            <p className="font-heading text-sm text-reward">FLIGHT SCHOOL</p>
            <h2 className="mt-1 font-heading text-4xl text-primary">Point, thrust, shoot.</h2>
            <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              <div className="control-tile"><kbd>MOUSE</kbd><span>Point where the ship should face</span></div>
              <div className="control-tile"><kbd>SPACE</kbd><span>Thrust toward the pointer</span></div>
              <div className="control-tile"><kbd>LEFT CLICK</kbd><span>Fire</span></div>
              <div className="control-tile"><kbd>RIGHT CLICK</kbd><span>Smart bomb in all directions (limited)</span></div>
              <div className="control-tile"><kbd>A</kbd><span>Short speed burst</span></div>
              <div className="control-tile"><kbd>F</kbd><span>Force field for a few seconds</span></div>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">Left hand rests on A and F, thumb on the spacebar, right hand on the mouse. Collect bomb canisters to restock smart bombs.</p>
            <Button className="mt-6 h-12 w-full font-heading text-xl" onClick={() => setControlsSeen(true)}>START FLYING</Button>
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed left-1/2 top-6 z-50 w-full max-w-lg -translate-x-1/2 rounded border border-primary bg-card px-4 py-3 text-center text-sm text-foreground shadow-xl">
          {notice}
          <button type="button" onClick={() => setNotice(null)} className="ml-3 text-xs text-muted-foreground underline">
            dismiss
          </button>
        </div>
      )}

      {destroyed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-md rounded-lg border-2 border-destructive bg-card p-6 text-center">
            <h2 className="font-pixel text-lg text-destructive">SHIP DESTROYED</h2>
            {!destroyed.hadCommits ? (
              <p className="mt-3 text-sm text-foreground">
                No checkpoints found. Mission must restart.
                <br />
                <span className="text-muted-foreground">
                  This is why we commit early and often — nothing was protected.
                </span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-foreground">
                Restoring your most recent checkpoint:{" "}
                <span className="hash-flash font-mono text-terminal-green">{destroyed.hash}</span> "{destroyed.message}".
                <br />
                <span className="text-muted-foreground">
                  Exactly that committed state returns — including its weaknesses. Anything staged but never committed
                  is gone.
                </span>
              </p>
            )}
            <button
              type="button"
              onClick={respawnFromDestroy}
              className="mt-4 rounded bg-primary px-4 py-2 font-pixel text-[10px] text-primary-foreground"
            >
              {destroyed.hadCommits ? "RESTORE CHECKPOINT" : "RESTART MISSION"}
            </button>
          </div>
        </div>
      )}

      {step?.kind === "dialogue" && (
        <Dialogue key={step.id} lines={(step as DialogueStep).lines} onDone={advance} />
      )}

      {step?.kind === "terminal" && save && (
        <Terminal
          key={step.id}
          repo={save.repo}
          task={(step as TerminalStep).task}
          commitsAtOpen={save.repo.commits.length}
          onRepoChange={updateRepo}
          onReset={(hash) => setResetTargetHash(hash)}
          onAdvance={() => {
            if (resetTargetHash) {
              // A reset rewinds BOTH the ship and the mission: resume from the
              // step right after the restored checkpoint and replay forward.
              const target = save.repo.commits.find((c) => c.hash === resetTargetHash);
              setResetTargetHash(null);
              if (target) {
                const back = nextStepId(target.snapshot.stepId) ?? target.snapshot.stepId;
                const updated: SaveData = {
                  ...save,
                  storyStep: back,
                  flags: { ...(save.flags ?? {}), resetDone: true },
                };
                persist(updated);
                setStepId(back);
                setNotice(`Timeline rewound to ${target.hash} — "${target.message}". Later checkpoints are no longer part of this timeline. Fly these missions again and make new checkpoints.`);
                return;
              }
            }
            if (step.id === "t_turbocommit") {
              // Committing the Turbo Core also commits its hidden instability.
              setSave((s) => {
                if (!s) return s;
                const repo: Repo = {
                  ...s.repo,
                  working: { ...cloneSnapshot(s.repo.working), flags: { ...s.repo.working.flags, turboCorrupt: true } },
                };
                const next = { ...s, repo };
                storeSave(next);
                return next;
              });
            }
            if (step.id === "t_revert") {
              // The lesson only completes if the Turbo Core's change was actually reversed.
              if (save.repo.working.ship.upgrades.includes("Turbo Core")) {
                setNotice("The corruption is still active — the Turbo Core is still installed. Find the checkpoint that installed it and reverse THAT one.");
                return;
              }
              setNotice("Corruption reversed! The harmful checkpoint remains in history, undone by a new one. That's git revert.");
            }
            advance();
          }}
        />
      )}

      {step?.kind === "certificate" && save && (
        <CertificateScreen part={(step as CertificateStep).part} cert={awardCertificate((step as CertificateStep).part)} onContinue={advance} onPrint={() => navigate({ to: "/certificate/$part", params: { part: String((step as CertificateStep).part) } })} />
      )}
    </div>
  );
}

function CertificateScreen({ part, cert, onContinue, onPrint }: { part: 1 | 2; cert: CertificateData | null; onContinue: () => void; onPrint: () => void }) {
  if (!cert) return null;
  return (
    <div className="fixed inset-0 z-40 overflow-auto bg-background p-4 md:p-8">
      <div className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center gap-2">
        <p className="flex-1 font-pixel text-[10px] text-terminal-green">
          {part === 1 ? "PART 1 COMPLETE — CERTIFICATE EARNED" : "MISSION COMPLETE — FINAL CERTIFICATE EARNED"}
        </p>
        <button type="button" onClick={onPrint} className="rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          Print Certificate
        </button>
        <button type="button" onClick={onContinue} className="rounded border border-border px-4 py-2 text-sm text-foreground hover:bg-accent">
          {part === 1 ? "Save & Continue to Part 2 →" : "Continue →"}
        </button>
      </div>
      <p className="mx-auto mb-4 max-w-3xl text-xs text-muted-foreground">
        {part === 1
          ? "A midpoint checkpoint has been committed. You can stop here safely — print or save this page for your teacher, and return later on this same browser/computer."
          : "Print or save this page for your teacher. Both certificates remain available in the archive."}
      </p>
      <CertificateView cert={cert} />
    </div>
  );
}

function ArchiveScreen({ save, onBack, onView }: { save: SaveData; onBack: () => void; onView: (part: 1 | 2) => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-6 text-foreground">
      <div className="w-full max-w-2xl">
        <h1 className="font-pixel text-sm text-primary">CERTIFICATE ARCHIVE</h1>
        <p className="mt-2 text-sm text-muted-foreground">Every certificate you earn stays saved here — reopen and print any time.</p>
        <div className="mt-6 flex flex-col gap-4">
          {([1, 2] as const).map((p) => {
            const cert = save.certificates.find((c) => c.part === p);
            return (
              <div key={p} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div>
                  <div className="font-pixel text-[10px] text-foreground">
                    {p === 1 ? "PART 1 — MIDPOINT" : "PART 2 — FINAL COMPLETION"}
                  </div>
                  {cert ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Earned {new Date(cert.completedAt).toLocaleDateString()} · Code {cert.verificationCode}
                    </div>
                  ) : (
                    <div className="mt-1 text-xs italic text-muted-foreground">Not yet earned</div>
                  )}
                </div>
                {cert && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => onView(p)} className="rounded bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground">
                      View
                    </button>
                    <button type="button" onClick={() => onView(p)} className="rounded border border-border px-3 py-1.5 text-sm hover:bg-accent">
                      Print
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button type="button" onClick={onBack} className="mt-6 rounded border border-border px-4 py-2 text-sm hover:bg-accent">
          ← {save.gameComplete ? "Back to mission summary" : "Back to menu"}
        </button>
      </div>
    </div>
  );
}
