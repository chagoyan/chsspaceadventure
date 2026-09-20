import shipUrl from "../assets/oscar-round-ship.png";
import shipBoost1Url from "../assets/oscar-round-ship-boost-1.png";
import shipBoost2Url from "../assets/oscar-round-ship-boost-2.png";
import droneUrl from "../assets/game-art/drone.png";
import bossUrl from "../assets/game-art/boss.png";
import asteroid1Url from "../assets/game-art/asteroid-1.png";
import asteroid2Url from "../assets/game-art/asteroid-2.png";
import asteroid3Url from "../assets/game-art/asteroid-3.png";
import repairUrl from "../assets/game-art/repair.png";
import fuelUrl from "../assets/game-art/fuel.png";
import energyUrl from "../assets/game-art/energy.png";
import ammoUrl from "../assets/game-art/ammo.png";
import upgradeUrl from "../assets/game-art/upgrade.png";
import bombUrl from "../assets/game-art/bomb.png";
import impactUrl from "../assets/game-art/impact.png";
import explosionUrl from "../assets/game-art/explosion.png";

export interface Sprite {
  src: string;
  aspect: number;
}

const imageCache = new Map<string, HTMLImageElement>();

function getImage(src: string): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  const cached = imageCache.get(src);
  if (cached) return cached;
  const image = new Image();
  image.src = src;
  imageCache.set(src, image);
  return image;
}

export function preloadSprites(): void {
  for (const sprite of [SHIP, ...SHIP_BOOST, DRONE, BOSS, IMPACT, EXPLOSION, ...ASTEROIDS, ...Object.values(PICKUP_SPRITES)]) {
    getImage(sprite.src);
  }
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  width: number,
  angle = 0,
  flipX = false,
): void {
  const image = getImage(sprite.src);
  if (!image?.complete || image.naturalWidth === 0) return;
  const height = width / sprite.aspect;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (flipX) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
}

export const SHIP: Sprite = { src: shipUrl, aspect: 971 / 543 };
export const SHIP_BOOST: [Sprite, Sprite] = [
  { src: shipBoost1Url, aspect: 971 / 543 },
  { src: shipBoost2Url, aspect: 971 / 543 },
];
export const DRONE: Sprite = { src: droneUrl, aspect: 350 / 295 };
export const BOSS: Sprite = { src: bossUrl, aspect: 1090 / 350 };
export const IMPACT: Sprite = { src: impactUrl, aspect: 410 / 435 };
export const EXPLOSION: Sprite = { src: explosionUrl, aspect: 620 / 540 };
export const ASTEROIDS: [Sprite, Sprite, Sprite] = [
  { src: asteroid1Url, aspect: 415 / 355 },
  { src: asteroid2Url, aspect: 370 / 315 },
  { src: asteroid3Url, aspect: 395 / 335 },
];

export const PICKUP_SPRITES: Record<string, Sprite> = {
  repair: { src: repairUrl, aspect: 228 / 270 },
  fuel: { src: fuelUrl, aspect: 235 / 270 },
  energy: { src: energyUrl, aspect: 240 / 270 },
  ammo: { src: ammoUrl, aspect: 240 / 270 },
  upgrade: { src: upgradeUrl, aspect: 285 / 370 },
  bomb: { src: bombUrl, aspect: 512 / 576 },
};