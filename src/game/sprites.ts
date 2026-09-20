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

// Solar Arcade sprites use bold ink outlines, two-tone shading, and bright highlights.
// Oscar's ship points right (angle 0 = facing +x).
export const SHIP: Sprite = {
  rows: [
    "......KK........",
    ".....KTTK.......",
    "....KTTTTK......",
    "...KTTWWTTKK....",
    "..KTTWGGWTTTK...",
    "KKTTWGGGWTTTTK..",
    "KYYTTWWWWTTTTTK.",
    "KKTTTTTTTTTKKK..",
    "..KTTTYYTTK.....",
    "...KKKYYKK......",
    ".....KCCK.......",
    "......CC........",
  ],
  palette: {
    K: "#071019",
    T: "#19d3c5",
    W: "#e9fff9",
    G: "#ffd166",
    Y: "#f3a93b",
    C: "#f45b69",
  },
};

// Enemy drone — 10x8
export const DRONE: Sprite = {
  rows: [
    "..KK....KK..",
    ".KRRK..KRRK.",
    "KRRRKKKRRRK.",
    "KRRRRRRRRRRK",
    "KRRYRRRRYRRK",
    ".KRRKKKKRRK.",
    "..KK....KK..",
    ".K........K.",
  ],
  palette: { K: "#071019", R: "#f45b69", Y: "#ffd166" },
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
  palette: { P: "#f45b69", W: "#e9fff9", G: "#ffd166" },
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
  palette: { A: "#60788a", a: "#263947" },
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
