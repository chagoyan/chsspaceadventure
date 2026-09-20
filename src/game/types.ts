// Core state model for Git Space Adventure.
// Separates: 1) working state, 2) staged changes, 3) committed history, 4) narrative progress.

export interface ShipState {
  hull: number; // 0-100
  armor: number; // 0-100
  energy: number; // 0-100
  fuel: number; // 0-100
  ammo: number; // 0-100
  upgrades: string[];
}

export interface GameSnapshot {
  ship: ShipState;
  score: number;
  stage: number; // 1..7 story stage
  stepId: string; // story step this snapshot belongs to
  flags: Record<string, boolean>;
}

export interface Commit {
  hash: string; // 7-char simulated short hash
  message: string;
  timestamp: number;
  parent: string | null;
  snapshot: GameSnapshot;
  kind?: "normal" | "revert" | "midpoint";
}

export interface Repo {
  initialized: boolean;
  working: GameSnapshot; // current live state
  staged: GameSnapshot | null; // prepared by `git add .`
  commits: Commit[];
}

export interface CertificateData {
  part: 1 | 2;
  studentName: string;
  completedAt: number;
  verificationCode: string;
  commandsDemonstrated: string[];
  milestone: string;
  commitEvidence: { hash: string; message: string }[];
  playTimeSeconds: number;
}

export interface SaveData {
  version: 1;
  studentName: string;
  repo: Repo;
  storyStep: string; // step to resume at (always a committed-safe boundary)
  certificates: CertificateData[];
  playTimeSeconds: number;
  gameComplete: boolean;
  settings: { reducedMotion: boolean; muted: boolean };
}

export const DEFAULT_SHIP: ShipState = {
  hull: 100,
  armor: 50,
  energy: 100,
  fuel: 100,
  ammo: 80,
  upgrades: [],
};

export function freshSnapshot(stepId: string): GameSnapshot {
  return {
    ship: { ...DEFAULT_SHIP, upgrades: [] },
    score: 0,
    stage: 1,
    stepId,
    flags: {},
  };
}

export function freshRepo(stepId: string): Repo {
  return {
    initialized: false,
    working: freshSnapshot(stepId),
    staged: null,
    commits: [],
  };
}
