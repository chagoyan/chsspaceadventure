import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher")({
  head: () => ({
    meta: [
      { title: "Teacher Concept Map — Oscar's Git Space Adventure" },
      { name: "description", content: "How each Oscar's Git Space Adventure mechanic maps to Git concepts, for educators." },
      { property: "og:title", content: "Teacher Concept Map — Oscar's Git Space Adventure" },
      { property: "og:description", content: "How each game mechanic maps to a real Git concept." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeacherPage,
});

const MAP: {
  where: string;
  concept: string;
  commands: string;
  before: string;
  after: string;
}[] = [
  {
    where: "Before launch — \"Initialize Mission Tracking\" terminal",
    concept: "A repository must be initialized before anything is tracked. init alone saves nothing.",
    commands: "git init",
    before: "Nothing is tracked; status, add and commit are all rejected by the terminal.",
    after: "Tracking begins and Sector 1 (The Shatter Field) unlocks. No checkpoint exists yet — a crash here restarts the mission.",
  },
  {
    where: "After Sector 1 — \"Run Ship Diagnostics\" terminal (status only)",
    concept: "Changes in the working directory — visible to status but not yet protected.",
    commands: "git status",
    before: "Asteroid damage, fuel burn and ammo use have altered the ship since launch.",
    after: "Full ship condition prints (hull, armor, energy, fuel, ammo, upgrades, score). Values that changed are highlighted in a warning color. add and commit are blocked here — they have not been taught yet.",
  },
  {
    where: "After the Supply Cache — \"Create Your First Checkpoint\" terminal",
    concept: "Staging prepares changes for the next commit. Staging is not saving; staged work is still lost on destruction.",
    commands: "git add .",
    before: "Repairs and supplies collected in Sector 1 are unprotected working changes.",
    after: "The same stats print in the normal color and are listed as staged. The checkpoint still does not exist until the commit runs.",
  },
  {
    where: "Same terminal, third guided step (status → add → commit)",
    concept: "Commits are permanent snapshots with meaningful messages describing what changed.",
    commands: 'git commit -m "..."',
    before: "Changes are staged only; the timeline has zero checkpoints.",
    after: "The first checkpoint is created with a 7-character hash. Crashes now restore here instead of restarting. Lazy messages (\"stuff\", \"update\") are rejected.",
  },
  {
    where: "Sectors 2, 5, 6, 8, 9, 10 — one checkpoint terminal after each mission",
    concept: "Repeating the inspect → stage → commit cycle; assistance fades from full hints to a hints button to none.",
    commands: 'git status → git add . → git commit -m "..."',
    before: "A sector has just been cleared with new damage, supplies or an upgrade.",
    after: "History grows to the several checkpoints later lessons depend on. \"Checkpoint Before the Gate\" (after Sector 10) offers no hints at all.",
  },
  {
    where: "After Sector 6 — \"Review Your Timeline\" terminal",
    concept: "Readable commit history with short hashes, most recent first.",
    commands: "git log --oneline",
    before: "Students have made several checkpoints but have never seen them listed.",
    after: "Each checkpoint prints hash + message; the hashes flash, and only now does KOMM explain what a hash is and how to copy it for <hash> commands.",
  },
  {
    where: "Any sector — ship destroyed",
    concept: "Only committed work is recoverable. Working and staged changes are ephemeral.",
    commands: "(demonstrated consequence)",
    before: "Upgrades or supplies collected since the last commit, possibly staged.",
    after: "The ship is restored to the most recent checkpoint's exact snapshot; everything gained since is gone. With no commits at all, the mission restarts.",
  },
  {
    where: "Sector 7, The Crimson Nebula → \"Rewind to Safety\" terminal",
    concept: "reset --hard moves HEAD to an earlier commit, discarding later commits and all uncommitted changes. Requires explicit confirmation.",
    commands: "git status → git log --oneline → git reset --hard <hash>",
    before: "An indestructible red kamikaze drone rams the ship, crippling hull, armor, fuel, energy and ammo to near zero. The ship survives but cannot finish the run.",
    after: "Students diagnose the damage, read the history, and pick an earlier healthy checkpoint (the recommended one keeps flashing). After a confirmation dialog, the ship's stats are restored to that snapshot and later checkpoints are discarded — then Nebula's Edge is winnable.",
  },
  {
    where: "Sector 8 Turbo Core → Sector 10 corruption → \"Reverse the Corruption\" terminal",
    concept: "revert adds a new commit that inverts a selected commit. History is preserved, not erased.",
    commands: "git revert <hash>",
    before: "The Turbo Core upgrade is collected in Sector 8 and committed in \"Lock In the Upgrade\" — its hidden firmware instability is committed with it. Two sectors later, energy drains uncontrollably and reset would throw away everything since.",
    after: "Reverting the Turbo Core checkpoint adds a NEW checkpoint that removes the upgrade, stops the drain, and leaves the harmful checkpoint visible in history. The lesson only completes if the correct hash was chosen.",
  },
  {
    where: "Main menu — \"View Git Log\" checkpoint screen",
    concept: "Reading history outside a lesson and moving the timeline to a chosen point.",
    commands: "(click a checkpoint hash)",
    before: "A saved game with several checkpoints.",
    after: "Clicking a hash restores that ship snapshot AND resumes at the mission that checkpoint belongs to.",
  },
  {
    where: "After Sector 4 (Part 1) and after Sector 11 (Part 2)",
    concept: "Gradable deliverables: demonstrated commands, commit hashes, timestamps, play time.",
    commands: "—",
    before: "Part 1 follows the init/status/add/commit block; Part 2 follows the Void Gate boss fight.",
    after: "A printable certificate lists the commands demonstrated, the last checkpoint hashes with messages, and total play time.",
  },
];


function TeacherPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm text-muted-foreground underline-offset-2 hover:underline">
          ← Back to game
        </Link>
        <h1 className="mt-4 font-pixel text-lg text-primary">TEACHER CONCEPT MAP</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Oscar's Git Space Adventure teaches the working-tree → staging → commit → history → reversal
          model through arcade gameplay. Each mechanic below maps to the Git concept it builds.
          Students type Git commands in a simulated ship terminal; no Git installation is required.
          Scope intentionally excludes branches, remotes, and merging (Version 1).
        </p>
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-card font-pixel text-[9px] text-muted-foreground">
              <tr>
                <th className="p-3">GAME MECHANIC</th>
                <th className="p-3">REAL GIT CONCEPT</th>
                <th className="p-3">COMMAND</th>
              </tr>
            </thead>
            <tbody>
              {MAP.map((row) => (
                <tr key={row.mechanic} className="border-t border-border align-top">
                  <td className="p-3 text-foreground">{row.mechanic}</td>
                  <td className="p-3 text-muted-foreground">{row.concept}</td>
                  <td className="whitespace-nowrap p-3 font-mono text-xs text-terminal-green">{row.commands}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Certificates are generated locally in the student's browser as classroom completion
          evidence. They are not cryptographically or server verified. Progress persists in
          localStorage on the same computer and browser only.
        </p>
      </div>
    </div>
  );
}
