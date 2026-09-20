// Simulated Git engine: parsing, status, staging, commits, log, reset --hard, revert.
import { DEFAULT_SHIP, type Commit, type GameSnapshot, type Repo, type ShipState } from "./types";

export function cloneSnapshot(s: GameSnapshot): GameSnapshot {
  return {
    ship: { ...s.ship, upgrades: [...s.ship.upgrades] },
    score: s.score,
    stage: s.stage,
    stepId: s.stepId,
    flags: { ...s.flags },
  };
}

// Stable short hash from content + index (deterministic within a run).
export function shortHash(input: string): string {
  let h1 = 0x811c9dc5;
  const str = input;
  for (let i = 0; i < str.length; i++) {
    h1 ^= str.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  let h2 = 0xdeadbeef;
  for (let i = str.length - 1; i >= 0; i--) {
    h2 ^= str.charCodeAt(i);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const hex = ((h1 >>> 0).toString(16) + (h2 >>> 0).toString(16)).padStart(16, "0");
  return hex.slice(0, 7);
}

export function makeCommit(
  repo: Repo,
  message: string,
  snapshot: GameSnapshot,
  kind: Commit["kind"] = "normal",
): Commit {
  const parent = repo.commits.length ? (repo.commits[repo.commits.length - 1]?.hash ?? null) : null;
  const hash = shortHash(
    JSON.stringify(snapshot) + message + repo.commits.length + String(parent),
  );
  return { hash, message, timestamp: Date.now(), parent, snapshot: cloneSnapshot(snapshot), kind };
}

export function head(repo: Repo): Commit | null {
  return repo.commits.length ? (repo.commits[repo.commits.length - 1] ?? null) : null;
}

export function findCommit(repo: Repo, hash: string): Commit | null {
  return repo.commits.find((c) => c.hash === hash || c.hash.startsWith(hash)) ?? null;
}

export interface StatusLine {
  text: string;
  kind: "staged" | "unstaged" | "clean" | "info" | "stat" | "changed" | "echo";
  hashFlash?: boolean; // highlight the leading checkpoint hash
}

export function normalizeCommandInput(value: string): string {
  const normalizedDashes = value
    .replace(/[–—]/g, "--")
    .replace(/[‐‑‒―−﹘﹣－]/g, "-");

  return normalizedDashes
    .replace(/\s-+oneline\b/gi, " --oneline")
    .replace(/\s-+hard\b/gi, " --hard");
}

function initialSnapshot(stepId: string): GameSnapshot {
  return {
    ship: { ...DEFAULT_SHIP, upgrades: [] },
    score: 0,
    stage: 1,
    stepId,
    flags: {},
  };
}

function shipStateLines(current: GameSnapshot, comparison: GameSnapshot): StatusLine[] {
  const stat = (label: string, value: number, changed: boolean): StatusLine => ({
    text: `  ${label} ${Math.round(value)}%`,
    kind: changed ? "changed" : "stat",
  });
  const upgradesChanged =
    current.ship.upgrades.length !== comparison.ship.upgrades.length ||
    current.ship.upgrades.some((upgrade) => !comparison.ship.upgrades.includes(upgrade));

  return [
    stat("Hull", current.ship.hull, current.ship.hull !== comparison.ship.hull),
    stat("Armor", current.ship.armor, current.ship.armor !== comparison.ship.armor),
    stat("Energy", current.ship.energy, current.ship.energy !== comparison.ship.energy),
    stat("Fuel", current.ship.fuel, current.ship.fuel !== comparison.ship.fuel),
    stat("Ammo", current.ship.ammo, current.ship.ammo !== comparison.ship.ammo),
    {
      text: `  Upgrades: ${current.ship.upgrades.join(", ") || "none"}`,
      kind: upgradesChanged ? "changed" : "stat",
    },
    {
      text: `  Mission score ${current.score}`,
      kind: current.score !== comparison.score ? "changed" : "stat",
    },
  ];
}

function diffShip(base: ShipState, cur: ShipState): string[] {
  const out: string[] = [];
  const fields: (keyof Omit<ShipState, "upgrades">)[] = ["hull", "armor", "energy", "fuel", "ammo"];
  const labels: Record<string, string> = {
    hull: "Hull",
    armor: "Armor",
    energy: "Energy",
    fuel: "Fuel",
    ammo: "Ammo",
  };
  for (const f of fields) {
    const d = Math.round(cur[f] - base[f]);
    if (d !== 0) {
      out.push(`${labels[f]} ${Math.round(cur[f])}% (${d > 0 ? "+" : ""}${d})`);
    }
  }
  const added = cur.upgrades.filter((u) => !base.upgrades.includes(u));
  const removed = base.upgrades.filter((u) => !cur.upgrades.includes(u));
  if (added.length) out.push(`Upgrades installed: +${added.join(", +")}`);
  if (removed.length) out.push(`Upgrades removed: -${removed.join(", -")}`);
  return out;
}

function diffSnapshot(base: GameSnapshot, cur: GameSnapshot): string[] {
  const lines = diffShip(base.ship, cur.ship);
  if (base.score !== cur.score) {
    lines.push(`Mission score ${cur.score} (${cur.score > base.score ? "+" : ""}${cur.score - base.score})`);
  }
  if (base.stage !== cur.stage) {
    lines.push(`Mission stage advanced: ${base.stage} → ${cur.stage}`);
  }
  return lines;
}

export function statusReport(repo: Repo): StatusLine[] {
  if (!repo.initialized) {
    return [
      { text: "fatal: not a git repository", kind: "info" },
      { text: "This mission is not being tracked yet. Run: git init", kind: "info" },
    ];
  }
  const h = head(repo);
  const lines: StatusLine[] = [
    { text: "On mission timeline 'main'", kind: "info" },
    {
      text: h
        ? `Checkpoints created: ${repo.commits.length} (latest: ${h.hash} "${h.message}")`
        : "No checkpoints yet — nothing is protected.",
      kind: "info",
    },
  ];
  const base = h?.snapshot ?? initialSnapshot(repo.working.stepId);
  const statComparison = repo.staged ?? base;
  lines.push({ text: "Current ship state:", kind: "info" });
  lines.push(...shipStateLines(repo.working, statComparison));
  if (!h) {
    if (repo.staged) {
      lines.push({ text: "Changes staged for first checkpoint:", kind: "staged" });
      for (const l of diffSnapshot(base, repo.staged).length
        ? diffSnapshot(base, repo.staged)
        : ["Initial mission configuration"]) {
        lines.push({ text: `  ${l}`, kind: "staged" });
      }
    } else {
      lines.push({ text: "Mission state has changed since tracking began.", kind: "unstaged" });
    }
    return lines;
  }
  const stagedDiffs = repo.staged ? diffSnapshot(base, repo.staged) : [];
  const workingDiffs = diffSnapshot(repo.staged ?? base, repo.working);
  if (stagedDiffs.length) {
    lines.push({ text: "Changes staged for next checkpoint (git commit to save):", kind: "staged" });
    for (const l of stagedDiffs) lines.push({ text: `  ${l}`, kind: "staged" });
  }
  if (workingDiffs.length) {
    lines.push({
      text: repo.staged
        ? "Further unstaged changes since staging (git add . to stage):"
        : "Changes not staged for checkpoint (git add . to stage):",
      kind: "unstaged",
    });
    for (const l of workingDiffs) lines.push({ text: `  ${l}`, kind: "unstaged" });
  }
  if (!stagedDiffs.length && !workingDiffs.length) {
    lines.push({ text: "Working state clean — matches latest checkpoint.", kind: "clean" });
  }
  return lines;
}

// ---- Command parsing ----

export interface ExecResult {
  lines: StatusLine[];
  ok: boolean;
  // Side-effect requests the host must perform on the repo, then persist:
  didInit?: boolean;
  didStage?: boolean;
  commit?: Commit;
  needsResetConfirm?: { hash: string; message: string };
  didReset?: { hash: string };
  didRevert?: { hash: string; newCommit: Commit };
}

const err = (text: string, hint?: string): ExecResult => ({
  ok: false,
  lines: hint
    ? [{ text, kind: "info" }, { text: hint, kind: "info" }]
    : [{ text, kind: "info" }],
});

function tokenize(input: string): string[] {
  return input.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
}

const LAME_MESSAGES = new Set(["stuff", "asdf", "test", "x", "ok", "idk", "commit", "save", "a", "hi"]);

export function execCommand(repo: Repo, rawInput: string, opts?: { resetConfirmed?: boolean }): ExecResult {
  const input = normalizeCommandInput(rawInput).trim();
  const tokens = tokenize(input);
  if (!tokens.length) return { ok: true, lines: [] };

  if (tokens[0] === "clear") return { ok: true, lines: [{ text: "__CLEAR__", kind: "info" }] };
  if (tokens[0] === "help") {
    return {
      ok: true,
      lines: [
        { text: "Ship terminal commands:", kind: "info" },
        { text: "  git init                    begin tracking this mission", kind: "info" },
        { text: "  git status                  show what changed & what is staged", kind: "info" },
        { text: "  git add .                   stage all current changes", kind: "info" },
        { text: '  git commit -m "message"     record staged changes as a checkpoint', kind: "info" },
        { text: "  git log --oneline           list your checkpoints", kind: "info" },
        { text: "  git reset --hard <hash>     return the timeline to a checkpoint (destructive)", kind: "info" },
        { text: "  git revert <hash>           undo one checkpoint with a NEW checkpoint", kind: "info" },
        { text: "  clear                       clear the screen", kind: "info" },
      ],
    };
  }
  if (tokens[0] !== "git") {
    return err(
      `${tokens[0]}: command not found`,
      "This terminal uses Git to track the ship's status and changes. Try 'help' or a command starting with git.",
    );
  }
  const sub = tokens[1];

  switch (sub) {
    case "init": {
      if (repo.initialized) {
        return {
          ok: true,
          didInit: true,
          lines: [{ text: "Reinitialized existing mission repository. Timeline tracking continues.", kind: "info" }],
        };
      }
      return {
        ok: true,
        didInit: true,
        lines: [
          { text: "Git tracking initialized for the ship's mission.", kind: "clean" },
          { text: "The mission is now being tracked — but no checkpoint exists yet.", kind: "info" },
        ],
      };
    }

    case "status":
      return { ok: true, lines: statusReport(repo) };

    case "add": {
      if (!repo.initialized) return err("fatal: not a git repository", "Run git init first.");
      if (tokens[2] !== ".") {
        return err(
          `Nothing specified to stage.`,
          'To stage every current change, type exactly: git add .',
        );
      }
      return {
        ok: true,
        didStage: true,
        lines: [
          { text: "Configuration staged.", kind: "staged" },
          {
            text: "Changes are prepared, but NO checkpoint has been created. Use git commit -m \"...\" to save permanently.",
            kind: "info",
          },
        ],
      };
    }

    case "commit": {
      if (!repo.initialized) return err("fatal: not a git repository", "Run git init first.");
      const mIndex = tokens.indexOf("-m");
      if (mIndex === -1 || !tokens[mIndex + 1]) {
        return err(
          "error: no commit message given",
          'A checkpoint needs a meaningful description: git commit -m "Repaired hull after asteroid field"',
        );
      }
      let message: string = tokens[mIndex + 1] ?? "";
      if (!message.startsWith('"')) {
        return err(
          "error: commit message must be wrapped in double quotes",
          'Type it like: git commit -m "Repaired hull and refueled"',
        );
      }
      if (!message.endsWith('"') || message.length < 2) {
        return err(
          "error: unterminated quote in commit message",
          'Close the message with a quote: git commit -m "Repaired hull"',
        );
      }
      message = message.slice(1, -1).trim();
      if (!message) {
        return err("error: empty commit message", "Describe what changed so future-you understands this checkpoint.");
      }
      if (LAME_MESSAGES.has(message.toLowerCase()) || message.length < 4) {
        return err(
          `error: "${message}" doesn't describe the changes`,
          'A useful message summarizes WHAT changed, e.g. git commit -m "Repaired hull and installed shield booster"',
        );
      }
      if (!repo.staged) {
        const h = head(repo);
        const pending = diffSnapshot(h ? h.snapshot : repo.working, repo.working);
        if (!h && !pending.length) {
          return err("nothing to commit", "Try git add . first to stage the initial mission state.");
        }
        return err(
          "nothing staged to commit",
          "git commit only saves STAGED changes. Run git add . first, then commit.",
        );
      }
      const commit = makeCommit(repo, message, repo.staged);
      return {
        ok: true,
        commit,
        lines: [
          { text: `[main ${commit.hash}] ${message}`, kind: "clean" },
          { text: "Checkpoint recorded. This state is now protected.", kind: "clean" },
        ],
      };
    }

    case "log": {
      if (!repo.initialized) return err("fatal: not a git repository", "Run git init first.");
      const oneline = tokens.includes("--oneline");
      if (!oneline && tokens.length > 2) {
        const typo = tokens.find((t) => /^-+o/i.test(t) && t !== "--oneline");
        return err(
          `error: unsupported log options`,
          typo ? `Did you mean --oneline? Type: git log --oneline` : "This terminal supports: git log --oneline",
        );
      }
      if (!repo.commits.length) {
        return { ok: true, lines: [{ text: "No checkpoints yet. Create one with git add . then git commit -m \"...\"", kind: "info" }] };
      }
      const lines: StatusLine[] = [];
      for (let i = repo.commits.length - 1; i >= 0; i--) {
        const c = repo.commits[i]!;
        const tag = i === repo.commits.length - 1 ? " (HEAD -> main)" : "";
        lines.push({ text: `${c.hash}${tag} ${c.message}`, kind: "info" });
      }
      return { ok: true, lines };
    }

    case "reset": {
      if (!repo.initialized) return err("fatal: not a git repository", "Run git init first.");
      // Strip anything that isn't a hex char — smart quotes/dashes can sneak into pasted hashes.
      const hashArg = (tokens[tokens.length - 1] ?? "").replace(/[^0-9a-f]/gi, "").toLowerCase();
      if (!tokens.includes("--hard")) {
        return err(
          "error: this ship terminal requires --hard for reset",
          "Use the full form: git reset --hard <commit-hash>",
        );
      }
      if (tokens.length < 4 || hashArg === "--hard") {
        return err("error: missing commit hash", "Find the hash with git log --oneline, then: git reset --hard <hash>");
      }
      const target = findCommit(repo, hashArg);
      if (!target) {
        return err(`fatal: no checkpoint matches "${hashArg}"`, "Check the exact short hash with git log --oneline.");
      }
      if (target.hash === head(repo)?.hash) {
        return err("That IS your current checkpoint.", "Pick an earlier hash from git log --oneline.");
      }
      if (!opts?.resetConfirmed) {
        return { ok: true, needsResetConfirm: { hash: target.hash, message: target.message }, lines: [] };
      }
      return {
        ok: true,
        didReset: { hash: target.hash },
        lines: [
          { text: `HEAD is now at ${target.hash} ${target.message}`, kind: "clean" },
          { text: "Timeline moved back. Later checkpoints are no longer in the normal log.", kind: "info" },
        ],
      };
    }

    case "revert": {
      if (!repo.initialized) return err("fatal: not a git repository", "Run git init first.");
      const hashArg = (tokens[2] ?? "").replace(/[^0-9a-f]/gi, "").toLowerCase();
      if (!hashArg) {
        return err("error: missing commit hash", "Use git log --oneline to find the harmful checkpoint, then: git revert <hash>");
      }
      const target = findCommit(repo, hashArg);
      if (!target) {
        return err(`fatal: no checkpoint matches "${hashArg}"`, "Check the exact short hash with git log --oneline.");
      }
      // Compute inverse of (target vs its parent) and apply to current working state.
      const parentCommit = target.parent ? findCommit(repo, target.parent) : null;
      const base = parentCommit ? parentCommit.snapshot : freshForRevert(repo);
      const working = cloneSnapshot(repo.working);
      const numFields: (keyof Omit<ShipState, "upgrades">)[] = ["hull", "armor", "energy", "fuel", "ammo"];
      for (const f of numFields) {
        const introduced = target.snapshot.ship[f] - base.ship[f];
        working.ship[f] = Math.max(0, Math.min(100, working.ship[f] - introduced));
      }
      working.score = Math.max(0, working.score - (target.snapshot.score - base.score));
      for (const u of target.snapshot.ship.upgrades) {
        if (!base.ship.upgrades.includes(u)) {
          working.ship.upgrades = working.ship.upgrades.filter((x) => x !== u);
        }
      }
      for (const u of base.ship.upgrades) {
        if (!target.snapshot.ship.upgrades.includes(u) && !working.ship.upgrades.includes(u)) {
          working.ship.upgrades.push(u);
        }
      }
      if (target.snapshot.flags["turboCorrupt"]) {
        delete working.flags["turboCorrupt"];
        working.flags["turboReverted"] = true;
      }
      const newCommit = makeCommit(repo, `Revert "${target.message}"`, working, "revert");
      return {
        ok: true,
        didRevert: { hash: target.hash, newCommit },
        lines: [
          { text: `[main ${newCommit.hash}] Revert "${target.message}"`, kind: "clean" },
          {
            text: `The change from ${target.hash} was reversed by a NEW checkpoint. The original checkpoint remains in history.`,
            kind: "info",
          },
        ],
      };
    }

    default:
      return err(
        `git: '${sub ?? ""}' is not a git command.`,
        "Available: init, status, add, commit, log, reset, revert. Or type help.",
      );
  }
}

function freshForRevert(repo: Repo): GameSnapshot {
  // Parentless first commit: base is the empty initial state.
  return cloneSnapshot(repo.working) && {
    ship: { hull: 100, armor: 50, energy: 100, fuel: 100, ammo: 80, upgrades: [] },
    score: 0,
    stage: 1,
    stepId: repo.working.stepId,
    flags: {},
  };
}

// Apply the side effects an ExecResult requests. Returns a NEW repo (immutable-ish).
export function applyResult(repo: Repo, result: ExecResult): Repo {
  const next: Repo = {
    ...repo,
    working: cloneSnapshot(repo.working),
    staged: repo.staged ? cloneSnapshot(repo.staged) : null,
    commits: [...repo.commits],
  };
  if (result.didInit) next.initialized = true;
  if (result.didStage) next.staged = cloneSnapshot(next.working);
  if (result.commit) {
    next.commits.push(result.commit);
    next.staged = null;
    next.working = cloneSnapshot(result.commit.snapshot);
  }
  if (result.didReset) {
    const target = findCommit(next, result.didReset.hash)!;
    const idx = next.commits.findIndex((c) => c.hash === target.hash);
    next.commits = next.commits.slice(0, idx + 1);
    next.working = cloneSnapshot(target.snapshot);
    next.staged = null;
  }
  if (result.didRevert) {
    next.commits.push(result.didRevert.newCommit);
    next.working = cloneSnapshot(result.didRevert.newCommit.snapshot);
    next.staged = null;
  }
  return next;
}
