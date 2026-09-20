// Procedural pixel-art sprites drawn from string grids — crisp, asset-free.

export interface Sprite {
  rows: string[];
  palette: Record<string, string>;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  scale: number,
  angle = 0,
): void {
  const rows = sprite.rows;
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.imageSmoothingEnabled = false;
  for (let r = 0; r < h; r++) {
    const row = rows[r]!;
    for (let c = 0; c < row.length; c++) {
      const ch = row[c]!;
      const color = sprite.palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect((c - w / 2) * scale, (r - h / 2) * scale, scale, scale);
    }
  }
  ctx.restore();
}

export function spriteSize(sprite: Sprite, scale: number): { w: number; h: number } {
  return { w: (sprite.rows[0]?.length ?? 0) * scale, h: sprite.rows.length * scale };
}

// Git's ship — 12x10, points right (angle 0 = facing +x)
export const SHIP: Sprite = {
  rows: [
    "....WW......",
    "...WSSW.....",
    "..WSSSSW....",
    ".WSCCSSWW...",
    "WWSCCCSSSW..",
    "WWSCGCCSSW..",
    ".WSCCCSSSW..",
    "..WSSSSW....",
    "...WSSW..OO.",
    "....WW...OO.",
  ],
  palette: {
    W: "#e8f4ff",
    S: "#7fb4d8",
    C: "#2c5f8a",
    G: "#ffd94d",
    O: "#ff9d3b",
  },
};

// Enemy drone — 10x8
export const DRONE: Sprite = {
  rows: [
    "..R....R..",
    "..RR..RR..",
    "...RRRR...",
    "..RRRRRR..",
    ".RRGRRGRR.",
    ".RRRRRRRR.",
    "..R.RR.R..",
    "..R....R..",
  ],
  palette: { R: "#c0392b", G: "#ff6b6b" },
};

// Boss — 16x14
export const BOSS: Sprite = {
  rows: [
    ".....PPPPP......",
    "...PPPPPPPPP....",
    "..PPPPPPPPPPP...",
    ".PPPWWPPPWWPPP..",
    ".PPPWPPPPPWPPP..",
    "PPPPPPPPPPPPPPP.",
    "PPPGGPPPPPGGPPP.",
    "PPPGGPPPPPGGPPP.",
    "PPPPPPPPPPPPPPP.",
    ".PPPPPPPPPPPPP..",
    "..PP.PP.PP.PP...",
    "..P...P.P...P...",
  ],
  palette: { P: "#8e44ad", W: "#f5e6ff", G: "#ff4757" },
};

// Asteroid — 10x10
export const ASTEROID: Sprite = {
  rows: [
    "...AAAA...",
    "..AAAAAA..",
    ".AAAaAAAA.",
    "AAaAAAAaA.",
    "AAAAAAAAAA",
    "AAAAaAAAAA",
    ".AAAAAAAA.",
    ".AAaAAAA..",
    "..AAAAA...",
    "...AAA....",
  ],
  palette: { A: "#8d7b68", a: "#6b5d4f" },
};

// Git the astronaut portrait — 16x16
export const GIT_PORTRAIT: Sprite = {
  rows: [
    ".....WWWWWW.....",
    "...WWWWWWWWWW...",
    "..WWWWWWWWWWWW..",
    "..WWOOWWWWOOWW..",
    ".WWOYYWWWWYYOWW.",
    ".WWOYYWWWWYYOWW.",
    ".WWOOWWWWWWOOWW.",
    ".WWWWWWSSWWWWWW.",
    "..WWWWWSSWWWWW..",
    "..WWWWWWWWWWWW..",
    "...WWBBBBBBWW...",
    "....WBBBBBBW....",
    "...WWBBBBBBWW...",
    "..WWWBWWWWBWWW..",
    "..WBWBWWWWBWBW..",
    "..WWWBWWWWBWWW..",
  ],
  palette: {
    W: "#eef6ff",
    O: "#1b2a3a",
    Y: "#ffd94d",
    S: "#7fd4ff",
    B: "#ff8c42",
  },
};

// Guide AI "KOMM" — 12x12 floating bot
export const KOMM_PORTRAIT: Sprite = {
  rows: [
    "....GGGG....",
    "..GGGGGGGG..",
    ".GGGGGGGGGG.",
    ".GGBBGGBBGG.",
    ".GGBBGGBBGG.",
    ".GGGGGGGGGG.",
    ".GGGCCCCGGG.",
    "..GGGGGGGG..",
    "....GGGG....",
    ".....GG.....",
    "....G..G....",
    "............",
  ],
  palette: { G: "#57d9a3", B: "#0b3d2e", C: "#0b3d2e" },
};

export const PICKUP_SPRITES: Record<string, Sprite> = {
  repair: {
    rows: [".WW.", "WGGW", "WGGW", ".WW."],
    palette: { W: "#eef6ff", G: "#2ecc71" },
  },
  fuel: {
    rows: [".YY.", "YOOY", "YOOY", ".YY."],
    palette: { Y: "#ffd94d", O: "#ff9d3b" },
  },
  ammo: {
    rows: [".RR.", "RYYR", "RYYR", ".RR."],
    palette: { R: "#c0392b", Y: "#ffd94d" },
  },
  energy: {
    rows: [".BB.", "BWWB", "BWWB", ".BB."],
    palette: { B: "#3498db", W: "#eaf6ff" },
  },
  upgrade: {
    rows: ["..PP..", ".PPPP.", "PPWWPP", "PPWWPP", ".PPPP.", "..PP.."],
    palette: { P: "#b06ee8", W: "#f5e6ff" },
  },
};
