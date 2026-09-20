// Story beats: ordered steps for the full adventure.
import type { StageSpec } from "./engine";

export type HelpLevel = "full" | "partial" | "none" | "panel";

export interface DialogueLine {
  speaker: "oscar" | "komm" | "narrator";
  text: string;
  choices?: { label: string; response: string }[];
}

export interface DialogueStep {
  kind: "dialogue";
  id: string;
  lines: DialogueLine[];
}

export interface TerminalTask {
  title: string;
  briefing: string;
  help: HelpLevel;
  hint: string; // shown for full/partial
  hintSteps?: { after?: "status" | "add"; text: string }[];
  requires: ("init" | "status" | "add" | "commit" | "log" | "reset" | "revert")[];
  advanceLabel: string;
  requireCommit?: boolean; // advance only after a NEW commit in this session
  freeForm?: boolean; // optional terminal, no required commands
}

export interface TerminalStep {
  kind: "terminal";
  id: string;
  task: TerminalTask;
}

export interface ActionStep {
  kind: "action";
  id: string;
  stage: number;
  spec: StageSpec;
  // event id fired when objective completes → advance
}

export interface CertificateStep {
  kind: "certificate";
  id: string;
  part: 1 | 2;
}

export interface ArchiveStep {
  kind: "archive";
  id: string;
}

export type Step = DialogueStep | TerminalStep | ActionStep | CertificateStep | ArchiveStep;

export const STEPS: Step[] = [
  {
    kind: "dialogue",
    id: "d_intro",
    lines: [
      { speaker: "narrator", text: "Year 3026. Oscar the horned toad reports for his first solo mission: cross five sectors and deliver the Starlight Beacon to the Void Gate." },
      { speaker: "komm", text: "Good morning, Oscar! I'm KOMM, your ship computer. Before launch I must warn you: this ship has NO timeline protection yet.", choices: [
        { label: "\"Timeline protection? Sounds serious.\"", response: "It is! If anything goes wrong out there, every repair, every drop of fuel you gain — gone. Unless we track the mission with Git." },
        { label: "\"I'm sure it'll be fine.\"", response: "Famous last words, pilot. Space is full of asteroids and drones. We need a way to save our progress — properly." },
      ]},
      { speaker: "komm", text: "This ship uses Git to track its status and changes. With the right commands, we can record checkpoints in time. First, we must initialize mission tracking." },
    ],
  },
  {
    kind: "terminal",
    id: "t_init",
    task: {
      title: "Initialize Mission Tracking",
      briefing: "KOMM: The terminal is open. Initialize Git tracking so the ship can start recording our timeline. Nothing is protected until we do this.",
      help: "full",
      hint: "Type exactly: git init",
      requires: ["init"],
      advanceLabel: "Launch Mission",
    },
  },
  {
    kind: "action",
    id: "a_field",
    stage: 1,
    spec: {
      mode: "asteroids",
      title: "Sector 1 — The Shatter Field",
      objective: "Fly to the green beacon. Watch out for asteroids and drones!",
      asteroids: 5,
      drones: 1,
      beacon: { x: 1180, y: 380, r: 46 },
    },
  },
  {
    kind: "dialogue",
    id: "d_status",
    lines: [
      { speaker: "oscar", text: "Whew! That asteroid clipped us, KOMM. How bad is the damage? And how much fuel did we burn?" },
      { speaker: "komm", text: "I... don't know. My sensors track the present, but we initialized timeline tracking — Git can compare the ship NOW against how it started.", choices: [
        { label: "\"Show me how.\"", response: "Open the terminal and ask for the ship's status. Git will report everything that changed: damage, fuel burned, ammo spent." },
        { label: "\"Can't you just guess?\"", response: "Guessing is how missions end. Git knows exactly what changed — we just have to ask with the status command." },
      ]},
    ],
  },
  {
    kind: "terminal",
    id: "t_status",
    task: {
      title: "Run Ship Diagnostics",
      briefing: "KOMM: Ask Git what changed since the mission began. The status command compares our current state against the tracked baseline.",
      help: "full",
      hint: "Type exactly: git status",
      requires: ["status"],
      advanceLabel: "Continue to Supply Cache",
    },
  },
  {
    kind: "action",
    id: "a_supply",
    stage: 1,
    spec: {
      mode: "asteroids",
      title: "Sector 1 — Supply Cache",
      objective: "Reach the supply beacon. Collect the supply caches on the way!",
      asteroids: 3,
      drones: 0,
      pickups: [
        { kind: "repair", x: 480, y: 300 },
        { kind: "fuel", x: 700, y: 500 },
        { kind: "ammo", x: 900, y: 280 },
        { kind: "energy", x: 820, y: 620 },
      ],
      beacon: { x: 1180, y: 200, r: 46 },
    },
  },
  {
    kind: "dialogue",
    id: "d_commit",
    lines: [
      { speaker: "komm", text: "Repairs done, tanks topped up. THIS is a moment worth keeping. If disaster strikes later, wouldn't it be nice to return to exactly this condition?" },
      { speaker: "komm", text: "In Git, that's a two-step process. First we STAGE everything with git add . — that prepares the changes. Then we COMMIT with a message — that records a permanent checkpoint.", choices: [
        { label: "\"Why two steps?\"", response: "Staging lets you choose exactly what goes into the checkpoint. For now, git add . stages everything — but committing is what actually protects it." },
        { label: "\"Let's do it!\"", response: "Right! Remember: staging alone protects NOTHING. Only the commit creates the checkpoint." },
      ]},
      { speaker: "komm", text: "One more thing about the commit: the -m means \"message\". Whatever you type in quotes after it becomes the checkpoint's label — like a note in the ship's log.", choices: [
        { label: "\"Why does the message matter?\"", response: "The message tells you what was saved at that checkpoint. A clear label like \"Repaired hull after asteroid field\" helps you choose the right checkpoint later. Lazy messages like \"stuff\" are useless — the terminal will reject them!" },
        { label: "\"Got it.\"", response: "Then describe what actually changed. Something like: git commit -m \"Repaired and refueled after the Shatter Field\"" },
      ]},
    ],
  },
  {
    kind: "terminal",
    id: "t_commit",
    task: {
      title: "Create Your First Checkpoint",
      briefing: "KOMM: Creating a checkpoint is one two-step process. Complete the first command, then I will show you the second.",
      help: "full",
      hint: "",
      hintSteps: [
        { text: "Type git add . and press Enter. This prepares the ship's current state." },
        { after: "add", text: 'Now type git commit -m "Repaired and refueled after the Shatter Field" and press Enter. The quoted words are the checkpoint message.' },
      ],
      requires: ["add", "commit"],
      advanceLabel: "Enter Sector 2",
    },
  },
  {
    kind: "dialogue",
    id: "d_stage2",
    lines: [
      { speaker: "narrator", text: "Sector 2: The Drone Hive. Hostile salvage drones patrol the wreck fields. They are NOT happy to see Oscar." },
      { speaker: "komm", text: "This sector is dangerous. My advice: whenever you gain something valuable — an upgrade, repairs, supplies — stage and commit it. Uncommitted gains can be lost forever if we're destroyed." },
    ],
  },
  {
    kind: "action",
    id: "a_swarm",
    stage: 2,
    spec: {
      mode: "combat",
      title: "Sector 2 — The Drone Hive",
      objective: "Destroy 5 drones. Grab the Shield Booster when it appears!",
      drones: 2,
      asteroids: 2,
      killTarget: 5,
      spawnUpgradeAtKills: { id: "Shield Booster", kills: 3 },
      beacon: { x: 1160, y: 380, r: 52 },
      exitAfterKills: true,
    },
  },
  {
    kind: "dialogue",
    id: "d_stage2b",
    lines: [
      { speaker: "oscar", text: "That was intense! We're still in one piece... mostly." },
      { speaker: "komm", text: "Before we push on: check what changed, stage anything worth keeping, and commit it. You remember the workflow — I'll only give you a partial hint this time.", choices: [
        { label: "\"status, add, commit. Got it.\"", response: "Exactly right. Check status first — always inspect before you commit. A checkpoint of a wrecked ship is still just a wreck." },
        { label: "\"Remind me why?\"", response: "Because anything not committed vanishes if we're destroyed. The commit is the only thing that survives." },
      ]},
    ],
  },
  {
    kind: "terminal",
    id: "t_stage2",
    task: {
      title: "Secure Your Progress",
      briefing: "KOMM: Securing progress is one three-step process. Complete each command and I will reveal the next one.",
      help: "partial",
      hint: "",
      hintSteps: [
        { text: "First, type git status and press Enter to inspect the ship." },
        { after: "status", text: "Next, type git add . and press Enter to stage everything you inspected." },
        { after: "add", text: 'Finally, type git commit -m "Secured Drone Hive supplies" and press Enter. The message describes this checkpoint.' },
      ],
      requires: ["status", "add", "commit"],
      requireCommit: true,
      advanceLabel: "Continue",
    },
  },
  {
    kind: "dialogue",
    id: "d_stage3_combat",
    lines: [
      { speaker: "narrator", text: "Sector 3: The Relay Gauntlet. A drone squadron has seized the navigation relays ahead." },
      { speaker: "komm", text: "Clear six drones in escalating waves. Their supply pods may keep us fighting. When the extraction beacon appears, collect what you need before leaving." },
    ],
  },
  {
    kind: "action",
    id: "a_relay_gauntlet",
    stage: 3,
    spec: {
      mode: "combat",
      title: "Sector 3 — The Relay Gauntlet",
      objective: "Destroy 6 drones, collect supplies, then enter the extraction beacon.",
      drones: 2,
      asteroids: 3,
      killTarget: 6,
      pickups: [
        { kind: "ammo", x: 520, y: 170 },
        { kind: "repair", x: 760, y: 600 },
      ],
      beacon: { x: 1160, y: 180, r: 52 },
      exitAfterKills: true,
    },
  },
  {
    kind: "dialogue",
    id: "d_stage4_combat",
    lines: [
      { speaker: "narrator", text: "Sector 4: The Iron Ring. Armored drones guard a volatile belt of wreckage." },
      { speaker: "komm", text: "One more battle before the midpoint station. Destroy seven drones and recover the Rapid Cycler. The extraction beacon will wait while you gather the remaining power-ups." },
    ],
  },
  {
    kind: "action",
    id: "a_iron_ring",
    stage: 4,
    spec: {
      mode: "combat",
      title: "Sector 4 — The Iron Ring",
      objective: "Destroy 7 drones, recover the Rapid Cycler, then extract.",
      drones: 3,
      asteroids: 5,
      killTarget: 7,
      spawnUpgradeAtKills: { id: "Rapid Cycler", kills: 5 },
      pickups: [
        { kind: "energy", x: 470, y: 590 },
        { kind: "fuel", x: 820, y: 150 },
      ],
      beacon: { x: 1160, y: 600, r: 52 },
      exitAfterKills: true,
    },
  },
  {
    kind: "certificate",
    id: "c_midpoint",
    part: 1,
  },
  {
    kind: "dialogue",
    id: "d_stage3",
    lines: [
      { speaker: "narrator", text: "Sector 5: The Crimson Nebula. Clouds of ionized plasma eat through hull plating. The only safe path threads between them." },
      { speaker: "komm", text: "Oscar, we've made several checkpoints now. If things go badly, we can ask Git for our checkpoint history — every commit we've ever made — with git log --oneline." },
      { speaker: "komm", text: "A hash is a unique short code that identifies one exact checkpoint. In git log --oneline, it appears at the far left of each checkpoint — for example, a3f9c21." },
      { speaker: "komm", text: "When a command shows <hash>, replace <hash> with the short code beside the checkpoint you want. For example: git reset --hard a3f9c21." },
      { speaker: "komm", text: "You don't need to memorize or fully type the long version — the short hash from git log --oneline is enough. Copy it exactly as shown." },
      { speaker: "komm", text: "And here's the powerful part: git reset --hard <hash> can move our whole timeline BACK to an earlier checkpoint. Dangerous but powerful — it discards everything after that point." },
    ],
  },
  {
    kind: "terminal",
    id: "t_log",
    task: {
      title: "Review Your Timeline",
      briefing: "KOMM: Look at the history you've built. Each line is a checkpoint YOU created, with its short hash.",
      help: "partial",
      hint: "git log --oneline",
      requires: ["log"],
      advanceLabel: "Enter the Nebula",
    },
  },
  {
    kind: "action",
    id: "a_nebula",
    stage: 5,
    spec: {
      mode: "nebula",
      title: "Sector 5 — The Crimson Nebula",
      objective: "Thread the nebula clouds and reach the beacon. Plasma clouds damage your hull!",
      asteroids: 2,
      drones: 1,
      beacon: { x: 1180, y: 620, r: 46 },
      nebulae: [
        { x: 500, y: 200, r: 120 },
        { x: 700, y: 480, r: 140 },
        { x: 950, y: 240, r: 110 },
        { x: 400, y: 560, r: 90 },
      ],
      safeZone: { x: 640, y: 120, r: 60 },
    },
  },
  {
    kind: "terminal",
    id: "t_reset",
    task: {
      title: "Rewind to Safety (Optional but wise)",
      briefing: "KOMM: That nebula chewed us up. Our hull is in bad shape for the final stretch. Use git log --oneline to find an earlier, healthier checkpoint, then move the timeline back with git reset --hard <hash>. Read the warning carefully before confirming.",
      help: "partial",
      hint: "git log --oneline, then git reset --hard <hash>",
      requires: ["reset"],
      advanceLabel: "Fly On",
    },
  },
  {
    kind: "action",
    id: "a_nebula2",
    stage: 5,
    spec: {
      mode: "nebula",
      title: "Sector 5 — Nebula's Edge",
      objective: "Final stretch — reach the far beacon!",
      asteroids: 2,
      drones: 2,
      beacon: { x: 1180, y: 160, r: 46 },
      nebulae: [
        { x: 550, y: 380, r: 130 },
        { x: 850, y: 550, r: 120 },
        { x: 900, y: 180, r: 100 },
      ],
    },
  },
  {
    kind: "dialogue",
    id: "d_turbo",
    lines: [
      { speaker: "narrator", text: "Sector 6: The wreck of the UNS Commit. Its experimental Turbo Core still hums with power." },
      { speaker: "komm", text: "That Turbo Core would boost our engines... My scans show a minor firmware instability, but the efficiency gains look worth it. Shall we take it?", choices: [
        { label: "\"Take it — speed wins missions.\"", response: "Agreed! We'll grab it ahead. And afterwards we should commit — if it works, that checkpoint captures our upgrade." },
        { label: "\"Instability? Risky...\"", response: "True — but remember, we have Git now. If we commit carefully, we always have a way to deal with a bad change. Let's take it." },
      ]},
    ],
  },
  {
    kind: "action",
    id: "a_turbo",
    stage: 6,
    spec: {
      mode: "asteroids",
      title: "Sector 6 — The Wreck",
      objective: "Collect the Turbo Core, then dock at the beacon.",
      asteroids: 4,
      drones: 0,
      beacon: { x: 1180, y: 380, r: 46 },
      upgradePickup: { id: "Turbo Core", x: 640, y: 380 },
    },
  },
  {
    kind: "terminal",
    id: "t_turbocommit",
    task: {
      title: "Lock In the Upgrade",
      briefing: "KOMM: The Turbo Core is installed and purring. Protect this progress — you know the workflow. No hints this time: inspect, stage, commit.",
      help: "none",
      hint: "",
      requires: ["add", "commit"],
      requireCommit: true,
      advanceLabel: "Engage Turbo Core",
    },
  },
  {
    kind: "dialogue",
    id: "d_corrupt",
    lines: [
      { speaker: "narrator", text: "ALERT. The Turbo Core's firmware instability cascades. Energy is draining fast — the core is corrupting the ship's systems!" },
      { speaker: "komm", text: "Oscar, this is bad! The corruption started when we installed that core — and we COMMITTED it. Resetting would throw away everything else we did since... There must be a better way.", choices: [
        { label: "\"Can't we just delete that commit?\"", response: "Rewriting shared history is dangerous. But Git has a safe reversal: git revert <hash> creates a NEW checkpoint that undoes exactly that one change — and keeps the rest of our history intact." },
        { label: "\"Help! What do we do?\"", response: "Stay calm. Find the commit where we installed the Turbo Core — then git revert <hash> will create a new checkpoint that undoes exactly that change, without erasing our history." },
      ]},
    ],
  },
  {
    kind: "action",
    id: "a_corrupt",
    stage: 6,
    spec: {
      mode: "corrupt",
      title: "Sector 6 — System Corruption",
      objective: "SURVIVE: energy is draining! Reach the emergency dock beacon to access the terminal.",
      asteroids: 3,
      drones: 0,
      drain: true,
      beacon: { x: 1100, y: 600, r: 50 },
    },
  },
  {
    kind: "terminal",
    id: "t_revert",
    task: {
      title: "Reverse the Corruption",
      briefing: "KOMM: Find the checkpoint that installed the Turbo Core and reverse THAT change with a new checkpoint. No hints — inspect the history and choose the right command.",
      help: "none",
      hint: "",
      requires: ["revert"],
      advanceLabel: "Systems Restored — Continue",
    },
  },
  {
    kind: "dialogue",
    id: "d_final",
    lines: [
      { speaker: "narrator", text: "Sector 7: The Void Gate. Its guardian — the dread warship MERGE CONFLICT — blocks the way." },
      { speaker: "komm", text: "This is it, Oscar. Everything you've learned: check your status, stage what matters, commit often, read your history. I'll be here if you need help — but the flying is all you.", choices: [
        { label: "\"For every commit we've made!\"", response: "That's the spirit. One more thing: commit BEFORE the big fight. If we fall, we rise again at that checkpoint." },
        { label: "\"Let's end this.\"", response: "Right behind you. And remember — a checkpoint before the battle is a pilot's best friend." },
      ]},
    ],
  },
  {
    kind: "terminal",
    id: "t_final",
    task: {
      title: "Pre-Battle Check (Recommended)",
      briefing: "KOMM: Final preparations, pilot. Use whatever commands you judge wise. The help panel is available if you need a reminder.",
      help: "panel",
      hint: "",
      requires: [],
      freeForm: true,
      advanceLabel: "Face the MERGE CONFLICT",
    },
  },
  {
    kind: "action",
    id: "a_boss",
    stage: 7,
    spec: {
      mode: "boss",
      title: "Sector 7 — The Void Gate",
      objective: "Destroy the MERGE CONFLICT!",
      boss: true,
      drones: 0,
      asteroids: 1,
      killTarget: 1,
    },
  },
  {
    kind: "certificate",
    id: "c_final",
    part: 2,
  },
  { kind: "archive", id: "c_archive" },
];

export function stepById(id: string): Step | undefined {
  return STEPS.find((s) => s.id === id);
}

export function nextStepId(id: string): string | null {
  const i = STEPS.findIndex((s) => s.id === id);
  return i >= 0 && i < STEPS.length - 1 ? (STEPS[i + 1]?.id ?? null) : null;
}
