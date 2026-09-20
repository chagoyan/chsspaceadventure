import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher")({
  head: () => ({
    meta: [
      { title: "Teacher Concept Map — Git Space Adventure" },
      { name: "description", content: "How each Git Space Adventure game mechanic maps to a real Git concept, for educators." },
      { property: "og:title", content: "Teacher Concept Map — Git Space Adventure" },
      { property: "og:description", content: "How each game mechanic maps to a real Git concept." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeacherPage,
});

const MAP: { mechanic: string; concept: string; commands: string }[] = [
  {
    mechanic: "Mission initialization before launch",
    concept: "A repository must be initialized before anything is tracked. init alone saves nothing.",
    commands: "git init",
  },
  {
    mechanic: "Ship damage, fuel use, ammo use, collected supplies",
    concept: "Changes in the working directory — visible to status but not yet protected.",
    commands: "git status",
  },
  {
    mechanic: "Staging the ship's configuration at the terminal",
    concept: "Preparing changes for the next commit. Staging is not saving; staged work is still lost on destruction.",
    commands: "git add .",
  },
  {
    mechanic: "Checkpoints that survive ship destruction",
    concept: "Commits are permanent snapshots with meaningful messages describing what changed.",
    commands: 'git commit -m "..."',
  },
  {
    mechanic: "The mission timeline screen / terminal history",
    concept: "Readable commit history with short hashes, most recent first.",
    commands: "git log --oneline",
  },
  {
    mechanic: "Ship destroyed → restore at most recent checkpoint; staged-but-uncommitted upgrades lost",
    concept: "Only committed work is recoverable. Working/staged changes are ephemeral.",
    commands: "(demonstrated consequence)",
  },
  {
    mechanic: "Rewinding the nebula sector to an earlier checkpoint",
    concept: "reset --hard moves HEAD to an earlier commit, discarding later commits and all uncommitted changes. Requires explicit confirmation.",
    commands: "git reset --hard <hash>",
  },
  {
    mechanic: "Turbo Core corruption reversed by a NEW checkpoint that undoes that one change",
    concept: "revert adds a new commit that inverts a selected commit. History is preserved, not erased.",
    commands: "git revert <hash>",
  },
  {
    mechanic: "Part 1 / Part 2 printable certificates with verification evidence",
    concept: "Gradable deliverables: demonstrated commands, commit hashes, timestamps, play time.",
    commands: "—",
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
          Git Space Adventure teaches the working-tree → staging → commit → history → reversal mental
          model through arcade gameplay. Each mechanic below maps to the real Git concept it builds.
          Students type real commands in a simulated ship terminal; no Git installation is required.
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
