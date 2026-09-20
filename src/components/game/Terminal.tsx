// Ship terminal overlay: parses real git commands against the simulated repo.
import { useEffect, useRef, useState } from "react";
import type { Repo } from "../../game/types";
import { execCommand, applyResult, type StatusLine, type ExecResult } from "../../game/git";
import { sfx } from "../../game/audio";
import type { TerminalTask } from "../../game/story";

interface Props {
  repo: Repo;
  task: TerminalTask;
  commitsAtOpen: number;
  onRepoChange: (repo: Repo) => void;
  onAdvance: () => void;
  onClose?: () => void;
  showHelpPanel?: boolean;
}

interface PendingReset {
  hash: string;
  message: string;
  input: string;
}

export function Terminal({ repo, task, commitsAtOpen, onRepoChange, onAdvance, showHelpPanel }: Props) {
  const [history, setHistory] = useState<StatusLine[]>([
    { text: "GIT SHIP TERMINAL v3.0.26 — timeline control online", kind: "info" },
    { text: `Mission: ${task.title}`, kind: "info" },
  ]);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [committedHere, setCommittedHere] = useState(false);
  const [pendingReset, setPendingReset] = useState<PendingReset | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history, pendingReset]);

  const requirementsMet = task.requires.every((r) => done.has(r));
  const commitRequirementMet = !task.requireCommit || committedHere;
  const canAdvance = requirementsMet && commitRequirementMet;

  function run(raw: string, resetConfirmed = false) {
    const result: ExecResult = execCommand(repo, raw, { resetConfirmed });
    // clear screen
    if (result.lines.some((l) => l.text === "__CLEAR__")) {
      setHistory([]);
      return;
    }
    if (result.needsResetConfirm) {
      setPendingReset({ hash: result.needsResetConfirm.hash, message: result.needsResetConfirm.message, input: raw });
      return;
    }
    setPendingReset(null);

    const echo: StatusLine = { text: `git@ship:~$ ${raw}`, kind: "echo" as StatusLine["kind"] };
    const newLines = [echo, ...result.lines];

    if (result.ok) {
      if (result.didInit) setDone((d) => new Set(d).add("init"));
      if (result.lines.some((l) => l.text.startsWith("On mission timeline")) || raw.trim().startsWith("git status"))
        setDone((d) => new Set(d).add("status"));
      if (result.didStage) setDone((d) => new Set(d).add("add"));
      if (result.commit) {
        setDone((d) => new Set(d).add("commit"));
        setCommittedHere(true);
        sfx.commit();
      }
      if (result.lines.length > 1 && raw.trim().startsWith("git log")) setDone((d) => new Set(d).add("log"));
      if (result.didReset) setDone((d) => new Set(d).add("reset"));
      if (result.didRevert) setDone((d) => new Set(d).add("revert"));
      if (result.didInit || result.didStage || result.commit || result.didReset || result.didRevert) {
        onRepoChange(applyResult(repo, result));
      }
    } else {
      sfx.error();
    }
    setHistory((h) => [...h, ...newLines]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const cmd = input;
    setInput("");
    setCmdHistory((c) => [...c, cmd]);
    setHistIdx(-1);
    run(cmd);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!cmdHistory.length) return;
      const idx = histIdx === -1 ? cmdHistory.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setInput(cmdHistory[idx] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx === -1) return;
      const idx = histIdx + 1;
      if (idx >= cmdHistory.length) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(idx);
        setInput(cmdHistory[idx] ?? "");
      }
    }
  }

  function confirmReset(yes: boolean) {
    const pr = pendingReset;
    setPendingReset(null);
    if (!pr) return;
    if (yes) {
      const result = execCommand(repo, pr.input, { resetConfirmed: true });
      if (result.didReset) {
        setDone((d) => new Set(d).add("reset"));
        onRepoChange(applyResult(repo, result));
        sfx.commit();
      }
      setHistory((h) => [
        ...h,
        { text: `git@ship:~$ ${pr.input}`, kind: "info" },
        ...result.lines,
      ]);
    } else {
      setHistory((h) => [...h, { text: "Reset cancelled. Timeline unchanged.", kind: "info" }]);
    }
    inputRef.current?.focus();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-label="Ship terminal">
      <div className="terminal-shell w-full max-w-3xl">
        <div className="terminal-titlebar">
          <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
          <span className="inline-block h-3 w-3 rounded-full bg-yellow-400" />
          <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
          <span className="ml-3 text-xs tracking-widest text-muted-foreground">SHIP TERMINAL — {task.title}</span>
        </div>
        <div className="border-b border-border bg-card/60 px-4 py-3 text-sm">
          <p className="text-foreground">{task.briefing}</p>
          {task.hint && (
            <p className="mt-2 font-mono text-terminal-green">
              <span className="text-muted-foreground">Hint: </span>
              {task.hint}
            </p>
          )}
          {task.help === "panel" && (
            <button
              type="button"
              className="mt-2 rounded border border-border px-2 py-1 text-xs text-accent-foreground hover:bg-accent"
              onClick={() => setHelpOpen((o) => !o)}
            >
              {helpOpen ? "Hide Command Reference" : "Show Command Reference"}
            </button>
          )}
          {helpOpen && (
            <pre className="mt-2 rounded bg-background p-2 font-mono text-xs text-muted-foreground">
{`git status                    what changed? what is staged?
git add .                     stage everything (not saved yet!)
git commit -m "message"       permanent checkpoint
git log --oneline             your checkpoint history
git reset --hard <hash>       move timeline back (destructive!)
git revert <hash>             undo one checkpoint, safely`}
            </pre>
          )}
        </div>

        <div ref={scrollRef} className="terminal-scroll" aria-live="polite">
          {history.map((l, i) => (
            <div key={i} className={`terminal-line terminal-${l.kind}`}>
              {l.text}
            </div>
          ))}
          {pendingReset && (
            <div className="mt-2 rounded border-2 border-destructive bg-destructive/10 p-3">
              <p className="font-bold text-destructive">WARNING — git reset --hard is destructive:</p>
              <ul className="mt-1 list-inside list-disc text-sm text-foreground">
                <li>The timeline will move back to {pendingReset.hash} "{pendingReset.message}".</li>
                <li>Ship and mission return to that committed snapshot.</li>
                <li>All staged and uncommitted changes will be discarded.</li>
                <li>Checkpoints after {pendingReset.hash} disappear from the normal git log timeline.</li>
              </ul>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => confirmReset(true)} className="rounded bg-destructive px-3 py-1.5 text-sm font-bold text-destructive-foreground hover:opacity-90">
                  Yes, reset the timeline
                </button>
                <button type="button" onClick={() => confirmReset(false)} className="rounded border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="terminal-input-row">
          <span className="text-terminal-green">git@ship:~$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value.length % 3 === 0) sfx.typing();
            }}
            onKeyDown={handleKey}
            className="terminal-input"
            placeholder='type a command, e.g. git status'
            aria-label="Terminal command input"
            autoComplete="off"
            spellCheck={false}
          />
        </form>

        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
          <div className="text-xs text-muted-foreground">
            {task.requires.length > 0 && !canAdvance && (
              <span>
                Required: {task.requires.filter((r) => !done.has(r)).map((r) => `git ${r}`).join(", ")}
                {task.requireCommit && !committedHere ? " (+ a new commit)" : ""}
              </span>
            )}
            {canAdvance && <span className="text-terminal-green">✓ Objectives complete</span>}
          </div>
          <button
            type="button"
            disabled={!canAdvance}
            onClick={onAdvance}
            className="rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {task.advanceLabel} →
          </button>
        </div>
      </div>
    </div>
  );
}
