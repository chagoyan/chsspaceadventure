// Top-down arcade engine: movement, shooting, asteroids, drones, pickups,
// nebula hazards, beacon goals, boss. Delta-time, frame-rate independent.
import type { ShipState } from "./types";
import { drawSprite, preloadSprites, SHIP, SHIP_BOOST, DRONE, BOSS, ASTEROIDS, IMPACT, EXPLOSION, PICKUP_SPRITES, type Sprite } from "./sprites";
import { sfx } from "./audio";

export const WORLD_W = 1280;
export const WORLD_H = 760;

export interface StageSpec {
  mode: "asteroids" | "combat" | "nebula" | "corrupt" | "boss";
  title: string;
  objective: string;
  asteroids?: number;
  drones?: number;
  killTarget?: number;
  beacon?: { x: number; y: number; r: number };
  nebulae?: { x: number; y: number; r: number }[];
  boss?: boolean;
  drain?: boolean; // turbo corruption: constant energy drain
  upgradePickup?: { id: string; x: number; y: number };
  pickups?: { kind: "repair" | "fuel" | "ammo" | "energy"; x: number; y: number }[];
  spawnUpgradeAtKills?: { id: string; kills: number };
  safeZone?: { x: number; y: number; r: number }; // terminal beacon
  exitAfterKills?: boolean; // keep the arena open for pickups, then leave through beacon
}

export type EngineEvent =
  | { type: "destroyed" }
  | { type: "objective" }
  | { type: "upgrade"; id: string }
  | { type: "safeZone" };

export interface EngineEvents {
  onShip: (
    ship: ShipState,
    extras: { kills: number; score: number; bombs: number; shield: boolean; boostReady: boolean; shieldReady: boolean },
  ) => void;
  onEvent: (e: EngineEvent) => void;
}

interface Ent {
  kind: "asteroid" | "drone" | "pickup" | "bullet" | "ebullet" | "boss" | "spark" | "effect" | "barrier";
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  sprite?: Sprite;
  pickup?: string;
  fireCd?: number;
  rot?: number;
  rotSpd?: number;
  life?: number;
  color?: string;
  maxLife?: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private ship: ShipState;
  private spec: StageSpec;
  private events: EngineEvents;
  private keys = new Set<string>();
  private mouse = { x: WORLD_W / 2, y: 0 };
  private firing = false;
  private px = 120;
  private py = WORLD_H / 2;
  private pvx = 0;
  private pvy = 0;
  private shipAngle = 0;
  private shipFlipped = false;
  private aimAngle = 0;
  private fireCd = 0;
  private invuln = 0;
  private ents: Ent[] = [];
  private kills = 0;
  private score: number;
  private running = false;
  private paused = false;
  private raf = 0;
  private last = 0;
  private lastSync = 0;
  private stars: { x: number; y: number; s: number }[] = [];
  private objectiveSent = false;
  private safeZoneSent = false;
  private upgradeSpawned = false;
  private reducedMotion: boolean;
  private hitFlash = 0;
  private thrusting = false;
  private mouseActive = false;
  private bombs = 2;
  private boostTimer = 0;
  private boostCd = 0;
  private shieldTimer = 0;
  private shieldCd = 0;
  // Boss encounter: fight -> retreat off screen -> drone waves (power-ups) -> return.
  private bossPhase: "fight" | "retreat" | "waves" | "return" = "fight";
  private bossThresholds: number[] = [];
  private bossWaveRemaining = 0;
  private bossPhaseTimer = 0;
  private bossHomeX = WORLD_W - 220;

  constructor(
    canvas: HTMLCanvasElement,
    ship: ShipState,
    startScore: number,
    spec: StageSpec,
    events: EngineEvents,
    reducedMotion = false,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.ship = { ...ship, upgrades: [...ship.upgrades] };
    this.score = startScore;
    this.spec = spec;
    this.events = events;
    this.reducedMotion = reducedMotion;
    for (let i = 0; i < 140; i++) {
      this.stars.push({ x: rand(0, WORLD_W), y: rand(0, WORLD_H), s: rand(0.5, 2.2) });
    }
    preloadSprites();
    this.populate();
    this.attach();
  }

  private populate() {
    const s = this.spec;
    for (let i = 0; i < (s.asteroids ?? 0); i++) {
      this.ents.push({
        kind: "asteroid",
        x: rand(300, WORLD_W - 60),
        y: rand(60, WORLD_H - 60),
        vx: rand(-30, 30),
        vy: rand(-20, 20),
        r: rand(16, 30),
        hp: 2,
        sprite: ASTEROIDS[i % ASTEROIDS.length] ?? ASTEROIDS[0],
        rot: rand(0, 6),
        rotSpd: rand(-1, 1),
      });
    }
    for (let i = 0; i < (s.drones ?? 0); i++) this.spawnDrone();
    if (s.boss) {
      this.ents.push({
        kind: "boss",
        x: WORLD_W - 220,
        y: WORLD_H / 2,
        vx: 0,
        vy: 0,
        r: 46,
        hp: 60,
        fireCd: 1.5,
      });
      // Two retreats: at 40 hp and at 20 hp the MERGE CONFLICT withdraws and sends waves.
      this.bossThresholds = [40, 20];
      // Cover to hide behind while the guns track you.
      for (const b of [
        { x: 430, y: 170, r: 52 },
        { x: 430, y: WORLD_H - 170, r: 52 },
        { x: 700, y: WORLD_H / 2, r: 62 },
        { x: 960, y: 210, r: 46 },
        { x: 960, y: WORLD_H - 210, r: 46 },
      ]) {
        this.ents.push({ kind: "barrier", x: b.x, y: b.y, vx: 0, vy: 0, r: b.r, hp: Number.POSITIVE_INFINITY });
      }
      for (const p of [
        { kind: "repair", x: 240, y: 150 },
        { kind: "ammo", x: 240, y: WORLD_H - 150 },
        { kind: "bomb", x: 560, y: WORLD_H / 2 },
      ] as const) {
        this.ents.push({
          kind: "pickup",
          x: p.x,
          y: p.y,
          vx: 0,
          vy: 0,
          r: 13,
          hp: 1,
          sprite: PICKUP_SPRITES[p.kind]!,
          pickup: p.kind,
        });
      }
    }
    for (const p of s.pickups ?? []) {
      this.ents.push({
        kind: "pickup",
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        r: 13,
        hp: 1,
        sprite: PICKUP_SPRITES[p.kind]!,
        pickup: p.kind,
      });
    }
    if (s.upgradePickup) {
      this.ents.push({
        kind: "pickup",
        x: s.upgradePickup.x,
        y: s.upgradePickup.y,
        vx: 0,
        vy: 0,
        r: 16,
        hp: 1,
        sprite: PICKUP_SPRITES["upgrade"]!,
        pickup: `upgrade:${s.upgradePickup.id}`,
      });
    }
  }

  private spawnDrone() {
    this.ents.push({
      kind: "drone",
      x: rand(WORLD_W * 0.55, WORLD_W - 80),
      y: rand(60, WORLD_H - 60),
      vx: 0,
      vy: 0,
      r: 15,
      hp: 2,
      fireCd: rand(1, 2.5),
    });
  }

  private keyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key === " ") e.preventDefault();
    if (key === "a" && !this.keys.has("a")) this.tryBoost();
    if (key === "f" && !this.keys.has("f")) this.tryShield();
    this.keys.add(key);
  };
  private keyUp = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
  private mouseMove = (e: MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * WORLD_W;
    this.mouse.y = ((e.clientY - rect.top) / rect.height) * WORLD_H;
    this.mouseActive = true;
  };
  private mouseDown = (e: MouseEvent) => {
    if (e.button === 0) this.firing = true;
    if (e.button === 2) {
      e.preventDefault();
      this.trySmartBomb();
    }
  };
  private mouseUp = () => (this.firing = false);
  private contextMenu = (e: MouseEvent) => e.preventDefault();

  private attach() {
    window.addEventListener("keydown", this.keyDown);
    window.addEventListener("keyup", this.keyUp);
    const canvas = this.ctx.canvas;
    canvas.addEventListener("mousemove", this.mouseMove);
    canvas.addEventListener("mousedown", this.mouseDown);
    canvas.addEventListener("contextmenu", this.contextMenu);
    window.addEventListener("mouseup", this.mouseUp);
  }

  destroy() {
    this.stop();
    window.removeEventListener("keydown", this.keyDown);
    window.removeEventListener("keyup", this.keyUp);
    const canvas = this.ctx.canvas;
    canvas.removeEventListener("mousemove", this.mouseMove);
    canvas.removeEventListener("mousedown", this.mouseDown);
    canvas.removeEventListener("contextmenu", this.contextMenu);
    window.removeEventListener("mouseup", this.mouseUp);
  }

  private tryBoost() {
    if (this.boostCd > 0 || this.boostTimer > 0) return;
    this.boostTimer = 0.5;
    this.boostCd = 3.5;
    sfx.pickup();
  }

  private tryShield() {
    if (this.shieldCd > 0 || this.shieldTimer > 0 || this.ship.energy < 15) return;
    this.ship.energy = Math.max(0, this.ship.energy - 15);
    this.shieldTimer = 3;
    this.shieldCd = 8;
    sfx.commit();
  }

  private trySmartBomb() {
    if (this.bombs <= 0) return;
    this.bombs -= 1;
    sfx.explosion();
    this.burst(this.px, this.py, "#ffd166", 24);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      this.ents.push({
        kind: "bullet",
        x: this.px + Math.cos(a) * 40,
        y: this.py + Math.sin(a) * 40,
        vx: Math.cos(a) * 620,
        vy: Math.sin(a) * 620,
        r: 5,
        hp: 1,
      });
    }
  }

  start() {
    this.running = true;
    this.last = performance.now();
    const loop = (t: number) => {
      if (!this.running) return;
      const dt = Math.min((t - this.last) / 1000, 0.05);
      this.last = t;
      if (!this.paused) this.update(dt);
      this.render(t / 1000);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
    this.last = performance.now();
  }
  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  getShip(): ShipState {
    return { ...this.ship, upgrades: [...this.ship.upgrades] };
  }
  getScore(): number {
    return this.score;
  }
  setDrain(on: boolean) {
    this.spec.drain = on;
  }

  private damage(amount: number) {
    if (this.invuln > 0 || this.shieldTimer > 0) return;
    let remaining = amount;
    if (this.ship.armor > 0) {
      const absorbed = Math.min(this.ship.armor, amount * 0.6);
      this.ship.armor -= absorbed;
      remaining = amount - absorbed;
    }
    this.ship.hull = Math.max(0, this.ship.hull - remaining);
    this.invuln = 0.6;
    this.hitFlash = 0.25;
    this.burst(this.px, this.py, "#f45b69", 7);
    sfx.hit();
    if (this.ship.hull <= 0) {
      sfx.explosion();
      this.events.onEvent({ type: "destroyed" });
      this.stop();
    }
  }

  private plasmaDamage(amount: number) {
    if (this.shieldTimer > 0) return;
    let remaining = amount;
    if (this.ship.armor > 0) {
      const absorbed = Math.min(this.ship.armor, amount * 0.6);
      this.ship.armor -= absorbed;
      remaining -= absorbed;
    }
    this.ship.hull = Math.max(0, this.ship.hull - remaining);
    this.hitFlash = Math.max(this.hitFlash, 0.08);
    if (this.ship.hull <= 0) {
      sfx.explosion();
      this.events.onEvent({ type: "destroyed" });
      this.stop();
    }
  }

  private nebulaState(n: { x: number; y: number; r: number }, index: number, t: number) {
    if (this.reducedMotion) return n;
    return {
      x: n.x + Math.sin(t * 0.42 + index * 1.7) * 34,
      y: n.y + Math.cos(t * 0.35 + index * 1.3) * 26,
      r: n.r * (0.82 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.75 + index * 2.1))),
    };
  }

  private update(dt: number) {
    const s = this.ship;
    this.invuln = Math.max(0, this.invuln - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.fireCd = Math.max(0, this.fireCd - dt);

    // --- movement ---
    // Mouse steers, space thrusts, left click fires, A boosts, F raises the shield.
    this.boostTimer = Math.max(0, this.boostTimer - dt);
    this.boostCd = Math.max(0, this.boostCd - dt);
    this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    this.shieldCd = Math.max(0, this.shieldCd - dt);
    const boosting = this.boostTimer > 0 && s.fuel > 0;
    // Empty tank never soft-locks the player: reserve thrusters still limp along.
    const ACCEL = s.fuel <= 0 ? 320 : boosting ? 2100 : 900;
    const mouseAngle = this.mouseActive
      ? Math.atan2(this.mouse.y - this.py, this.mouse.x - this.px)
      : null;
    const headingAngle = mouseAngle ?? this.shipAngle;
    const thrusting = this.keys.has(" ") || boosting;
    this.thrusting = thrusting;
    this.shipFlipped = Math.cos(headingAngle) < 0;
    this.shipAngle = this.shipFlipped
      ? headingAngle >= 0
        ? headingAngle - Math.PI
        : headingAngle + Math.PI
      : headingAngle;
    if (thrusting) {
      this.pvx += Math.cos(headingAngle) * ACCEL * dt;
      this.pvy += Math.sin(headingAngle) * ACCEL * dt;
      s.fuel = Math.max(0, s.fuel - (boosting ? 5 : 2.2) * dt);
    }
    // exp damping
    const damp = Math.exp(-3.2 * dt);
    this.pvx *= damp;
    this.pvy *= damp;
    this.px = Math.max(24, Math.min(WORLD_W - 24, this.px + this.pvx * dt));
    this.py = Math.max(24, Math.min(WORLD_H - 24, this.py + this.pvy * dt));
    if (mouseAngle !== null) this.aimAngle = mouseAngle;
    else {
      const target = this.nearestThreat();
      this.aimAngle = target ? Math.atan2(target.y - this.py, target.x - this.px) : this.shipAngle;
    }

    // energy regen / corruption drain
    s.energy = Math.min(100, s.energy + 6 * dt);
    s.ammo = Math.min(100, s.ammo + 0.8 * dt);
    if (this.spec.drain) {
      s.energy = Math.max(0, s.energy - 9 * dt);
      s.hull = Math.max(1, s.hull - 0.8 * dt); // corruption flicker, not fatal
    }

    // --- shooting ---
    const wantFire = this.firing && this.fireCd <= 0;
    if (wantFire && s.ammo >= 1 && s.energy >= 4) {
      s.ammo -= 1;
      s.energy -= 4;
      this.fireCd = this.ship.upgrades.includes("Rapid Cycler") ? 0.12 : 0.2;
      const spread = 0.04;
      this.ents.push({
        kind: "bullet",
        x: this.px + Math.cos(this.aimAngle) * 38,
        y: this.py + Math.sin(this.aimAngle) * 38,
        vx: Math.cos(this.aimAngle + rand(-spread, spread)) * 640,
        vy: Math.sin(this.aimAngle + rand(-spread, spread)) * 640,
        r: 4,
        hp: 1,
      });
      sfx.shoot();
    }

    // --- nebula damage ---
    for (const [index, nebula] of (this.spec.nebulae ?? []).entries()) {
      const n = this.nebulaState(nebula, index, performance.now() / 1000);
      const d = Math.hypot(this.px - n.x, this.py - n.y);
      if (d < n.r) this.plasmaDamage(16 * dt);
    }
    // invuln would block continuous nebula damage; nebula uses raw application:
    // (kept simple: invuln mainly for impacts)

    // --- safe zone ---
    if (this.spec.safeZone && !this.safeZoneSent) {
      const z = this.spec.safeZone;
      if (Math.hypot(this.px - z.x, this.py - z.y) < z.r) {
        this.safeZoneSent = true;
        this.events.onEvent({ type: "safeZone" });
      }
    }

    // --- beacon objective ---
    if (this.spec.beacon && !this.objectiveSent && (!this.spec.exitAfterKills || (this.spec.killTarget != null && this.kills >= this.spec.killTarget))) {
      const b = this.spec.beacon;
      if (Math.hypot(this.px - b.x, this.py - b.y) < b.r) {
        this.objectiveSent = true;
        sfx.commit();
        this.events.onEvent({ type: "objective" });
      }
    }

    // --- entities ---
    const remove = new Set<Ent>();
    for (const e of this.ents) {
      if (e.kind === "asteroid") {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.rot = (e.rot ?? 0) + (e.rotSpd ?? 0) * dt;
        if (e.x < -40) e.x = WORLD_W + 40;
        if (e.x > WORLD_W + 40) e.x = -40;
        if (e.y < -40) e.y = WORLD_H + 40;
        if (e.y > WORLD_H + 40) e.y = -40;
        if (Math.hypot(e.x - this.px, e.y - this.py) < e.r + 18) {
          this.damage(7);
          e.vx = -e.vx * 1.4;
          e.vy = -e.vy * 1.4;
        }
      } else if (e.kind === "drone") {
        const d = Math.hypot(this.px - e.x, this.py - e.y) || 1;
        const speed = 64;
        e.vx = ((this.px - e.x) / d) * speed;
        e.vy = ((this.py - e.y) / d) * speed;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.fireCd = (e.fireCd ?? 1) - dt;
        if (e.fireCd <= 0 && d < 520) {
          e.fireCd = rand(2.4, 3.5);
          this.ents.push({
            kind: "ebullet",
            x: e.x,
            y: e.y,
            vx: ((this.px - e.x) / d) * 230,
            vy: ((this.py - e.y) / d) * 230,
            r: 5,
            hp: 1,
          });
        }
        if (d < e.r + 18) {
          this.damage(9);
          e.hp = 0;
        }
      } else if (e.kind === "boss") {
        e.y = WORLD_H / 2 + Math.sin(performance.now() / 900) * 200;
        e.fireCd = (e.fireCd ?? 1) - dt;
        if (e.fireCd <= 0) {
          e.fireCd = 1.35;
          for (let k = -1; k <= 1; k++) {
            const a = Math.atan2(this.py - e.y, this.px - e.x) + k * 0.25;
            this.ents.push({
              kind: "ebullet",
              x: e.x,
              y: e.y,
              vx: Math.cos(a) * 250,
              vy: Math.sin(a) * 250,
              r: 6,
              hp: 1,
            });
          }
        }
        if (Math.random() < dt * 0.12 && this.ents.filter((x) => x.kind === "drone").length < 2) {
          this.spawnDrone();
        }
      } else if (e.kind === "bullet") {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (e.x < 0 || e.x > WORLD_W || e.y < 0 || e.y > WORLD_H) remove.add(e);
        for (const t of this.ents) {
          if (t.kind !== "asteroid" && t.kind !== "drone" && t.kind !== "boss") continue;
          if (Math.hypot(e.x - t.x, e.y - t.y) < t.r + e.r) {
            remove.add(e);
            t.hp -= 1;
            if (t.hp <= 0) {
              remove.add(t);
              sfx.explosion();
              this.burst(t.x, t.y, t.kind === "boss" ? "#ffd166" : "#f45b69", t.kind === "boss" ? 24 : 12);
              if (t.kind === "drone") {
                this.kills++;
                this.score += 100;
              } else if (t.kind === "boss") {
                this.kills++;
                this.score += 1500;
              } else {
                this.score += 25;
              }
              if (Math.random() < 0.4 && t.kind !== "boss") this.dropPickup(t.x, t.y);
              if (t.kind === "boss") {
                this.dropPickup(t.x - 30, t.y);
                this.dropPickup(t.x + 30, t.y);
              }
            }
            break;
          }
        }
      } else if (e.kind === "ebullet") {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (e.x < 0 || e.x > WORLD_W || e.y < 0 || e.y > WORLD_H) remove.add(e);
        if (Math.hypot(e.x - this.px, e.y - this.py) < e.r + 16) {
          remove.add(e);
          this.damage(e.r > 5 ? 7 : 4);
        }
      } else if (e.kind === "pickup") {
        if (Math.hypot(e.x - this.px, e.y - this.py) < e.r + 34) {
          remove.add(e);
          this.applyPickup(e.pickup ?? "repair");
        }
      } else if (e.kind === "spark" || e.kind === "effect") {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.life = (e.life ?? 0) - dt;
        e.vx *= Math.exp(-2.5 * dt);
        e.vy *= Math.exp(-2.5 * dt);
        if ((e.life ?? 0) <= 0) remove.add(e);
      }
    }
    for (const e of remove) this.ents.splice(this.ents.indexOf(e), 1);

    // Combat stages arrive in manageable waves until the full target is available.
    if (this.spec.mode === "combat" && this.spec.killTarget && this.kills < this.spec.killTarget) {
      const activeDrones = this.ents.filter((e) => e.kind === "drone").length;
      const remaining = this.spec.killTarget - this.kills;
      const waveSize = Math.min(this.spec.drones ?? 1, remaining);
      for (let i = activeDrones; i < waveSize; i++) this.spawnDrone();
    }

    // spawn scripted upgrade mid-stage
    const sup = this.spec.spawnUpgradeAtKills;
    if (sup && !this.upgradeSpawned && this.kills >= sup.kills) {
      this.upgradeSpawned = true;
      this.ents.push({
        kind: "pickup",
        x: WORLD_W / 2,
        y: WORLD_H / 2,
        vx: 0,
        vy: 0,
        r: 16,
        hp: 1,
        sprite: PICKUP_SPRITES["upgrade"]!,
        pickup: `upgrade:${sup.id}`,
      });
    }

    // kill-target objective
    if (this.spec.killTarget && !this.spec.exitAfterKills && !this.objectiveSent && this.kills >= this.spec.killTarget) {
      const bossAlive = this.ents.some((e) => e.kind === "boss");
      if (!bossAlive) {
        this.objectiveSent = true;
        sfx.commit();
        this.events.onEvent({ type: "objective" });
      }
    }

    // HUD sync ~5x/sec
    const now = performance.now();
    if (now - this.lastSync > 200) {
      this.lastSync = now;
      this.events.onShip(this.getShip(), this.extras());
    }
  }

  private extras() {
    return {
      kills: this.kills,
      score: this.score,
      bombs: this.bombs,
      shield: this.shieldTimer > 0,
      boostReady: this.boostCd <= 0,
      shieldReady: this.shieldCd <= 0 && this.ship.energy >= 15,
    };
  }

  private dropPickup(x: number, y: number) {
    const kinds = ["repair", "fuel", "ammo", "energy", "bomb"] as const;
    const k = kinds[Math.floor(Math.random() * kinds.length)]!;
    this.ents.push({
      kind: "pickup",
      x,
      y,
      vx: 0,
      vy: 0,
      r: 13,
      hp: 1,
      sprite: PICKUP_SPRITES[k]!,
      pickup: k,
    });
  }

  private nearestThreat(): Ent | null {
    let best: Ent | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const ent of this.ents) {
      if (ent.kind !== "asteroid" && ent.kind !== "drone" && ent.kind !== "boss") continue;
      const distance = Math.hypot(ent.x - this.px, ent.y - this.py);
      if (distance < bestDistance) {
        best = ent;
        bestDistance = distance;
      }
    }
    return best;
  }

  private burst(x: number, y: number, color: string, count: number) {
    const duration = count >= 20 ? 0.55 : 0.3;
    this.ents.push({
      kind: "effect",
      x,
      y,
      vx: 0,
      vy: 0,
      r: count >= 20 ? 78 : 38,
      hp: 1,
      life: duration,
      maxLife: duration,
      sprite: count >= 20 ? EXPLOSION : IMPACT,
    });
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(70, 240);
      this.ents.push({
        kind: "spark",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: rand(2, 5),
        hp: 1,
        life: rand(0.2, 0.55),
        color,
      });
    }
  }

  private applyPickup(p: string) {
    sfx.pickup();
    if (p.startsWith("upgrade:")) {
      const id = p.slice(8);
      if (!this.ship.upgrades.includes(id)) this.ship.upgrades.push(id);
      if (id === "Turbo Core") {
        this.ship.fuel = Math.min(100, this.ship.fuel + 20);
      }
      this.events.onEvent({ type: "upgrade", id });
      this.events.onShip(this.getShip(), this.extras());
      return;
    }
    if (p === "repair") this.ship.hull = Math.min(100, this.ship.hull + 20);
    if (p === "fuel") this.ship.fuel = Math.min(100, this.ship.fuel + 25);
    if (p === "ammo") this.ship.ammo = Math.min(100, this.ship.ammo + 25);
    if (p === "energy") this.ship.energy = Math.min(100, this.ship.energy + 25);
    if (p === "bomb") this.bombs = Math.min(5, this.bombs + 1);
    this.score += 20;
  }

  private render(t: number) {
    const ctx = this.ctx;
    ctx.fillStyle = "#08111f";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    // stars
    for (const st of this.stars) {
      const tw = this.reducedMotion ? 0.8 : 0.5 + 0.5 * Math.sin(t * 2 + st.x);
      const drift = (t * (8 + st.s * 8)) % WORLD_W;
      const sx = (st.x - drift + WORLD_W) % WORLD_W;
      ctx.fillStyle = `rgba(214,255,249,${0.2 + 0.55 * tw * st.s * 0.3})`;
      ctx.fillRect(sx, st.y, st.s, st.s);
    }
    // nebulae
    for (const [index, nebula] of (this.spec.nebulae ?? []).entries()) {
      const n = this.nebulaState(nebula, index, t);
      const g = ctx.createRadialGradient(n.x, n.y, 10, n.x, n.y, n.r);
      g.addColorStop(0, "rgba(255,80,120,0.35)");
      g.addColorStop(1, "rgba(255,80,120,0.02)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,80,120,0.5)";
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // beacon
    if (this.spec.beacon && (!this.spec.exitAfterKills || (this.spec.killTarget != null && this.kills >= this.spec.killTarget))) {
      const b = this.spec.beacon;
      const pulse = this.reducedMotion ? 1 : 1 + 0.15 * Math.sin(t * 4);
      ctx.strokeStyle = "#19d3c5";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(25,211,197,0.13)";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd166";
      ctx.font = "24px 'Bebas Neue', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(this.spec.exitAfterKills ? "EXTRACT WHEN READY" : "GOAL", b.x, b.y - b.r - 12);
    }
    // safe zone
    if (this.spec.safeZone) {
      const z = this.spec.safeZone;
      ctx.strokeStyle = "#19d3c5";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#19d3c5";
      ctx.font = "18px 'Bebas Neue', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SAFE TERMINAL", z.x, z.y - z.r - 10);
    }
    // entities
    for (const e of this.ents) {
      if (e.kind === "asteroid") {
        if (e.sprite) drawSprite(ctx, e.sprite, e.x, e.y, e.r * 2.45, e.rot ?? 0);
      } else if (e.kind === "drone") {
        drawSprite(ctx, DRONE, e.x, e.y, 58, Math.atan2(this.py - e.y, this.px - e.x));
      } else if (e.kind === "boss") {
        drawSprite(ctx, BOSS, e.x, e.y, 178, Math.PI);
        // boss hp bar
        ctx.fillStyle = "#31122e";
        ctx.fillRect(e.x - 60, e.y - 70, 120, 8);
        ctx.fillStyle = "#ff4757";
        ctx.fillRect(e.x - 60, e.y - 70, (120 * Math.max(0, e.hp)) / 60, 8);
      } else if (e.kind === "bullet") {
        ctx.fillStyle = "rgba(255,209,102,0.3)";
        ctx.fillRect(e.x - e.vx * 0.025, e.y - e.vy * 0.025, 12, 5);
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(e.x - 3, e.y - 2, 12, 5);
      } else if (e.kind === "ebullet") {
        ctx.fillStyle = "#ff6b6b";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.kind === "pickup" && e.sprite) {
        const bob = this.reducedMotion ? 0 : Math.sin(t * 3 + e.x) * 3;
        const pickupWidth = e.pickup?.startsWith("upgrade:") ? 50 : 40;
        ctx.save();
        ctx.shadowColor = "rgba(255,183,67,0.7)";
        ctx.shadowBlur = 14;
        drawSprite(ctx, e.sprite, e.x, e.y + bob, pickupWidth);
        ctx.restore();
      } else if (e.kind === "spark") {
        ctx.globalAlpha = Math.min(1, (e.life ?? 0) * 3);
        ctx.fillStyle = e.color ?? "#ffd166";
        ctx.fillRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
        ctx.globalAlpha = 1;
      } else if (e.kind === "effect" && e.sprite) {
        const progress = 1 - (e.life ?? 0) / (e.maxLife ?? 1);
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - progress);
        drawSprite(ctx, e.sprite, e.x, e.y, e.r * (1.1 + progress * 1.3), progress * 0.18);
        ctx.restore();
      }
    }
    // player ship
    const blink = this.invuln > 0 && Math.floor(t * 12) % 2 === 0;
    if (!blink) {
      const boostFrame = this.reducedMotion ? 0 : Math.floor(t * 12) % SHIP_BOOST.length;
      const shipSprite = this.boostTimer > 0 ? SHIP_BOOST[boostFrame] ?? SHIP_BOOST[0] : SHIP;
      drawSprite(ctx, shipSprite, this.px, this.py, 112, this.shipAngle, this.shipFlipped);
    }
    if (this.shieldTimer > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(25,211,197,0.85)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.px, this.py, 72 + Math.sin(t * 9) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(25,211,197,0.12)";
      ctx.fill();
      ctx.restore();
    }
    if (this.spec.drain) {
      // corruption glitch overlay
      ctx.fillStyle = `rgba(255,60,90,${0.04 + 0.05 * Math.abs(Math.sin(t * 7))})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(255,80,80,${this.hitFlash * 0.7})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
  }
}
