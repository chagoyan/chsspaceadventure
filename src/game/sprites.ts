import shipAsset from "../assets/voyage-ship.png.asset.json";
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
  for (const sprite of [SHIP, DRONE, BOSS, ...ASTEROIDS, ...Object.values(PICKUP_SPRITES)]) {
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
): void {
  const image = getImage(sprite.src);
  if (!image?.complete || image.naturalWidth === 0) return;
  const height = width / sprite.aspect;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
}

export const SHIP: Sprite = { src: shipAsset.url, aspect: 873 / 450 };
export const DRONE: Sprite = { src: droneUrl, aspect: 350 / 295 };
export const BOSS: Sprite = { src: bossUrl, aspect: 1090 / 350 };
export const ASTEROIDS: Sprite[] = [
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
};