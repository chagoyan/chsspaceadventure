# Illustrated Space-Game Refresh

## Goal
Replace the current pixel look with the polished illustrated style used in Typing Voyage and Typing Exploration, while keeping the game easy to read and play.

## What will change
- Reuse the illustrated Typing Voyage ship as Oscar’s playable spacecraft.
- Replace pixel asteroids, drones, boss, pickups, projectiles, and explosions with cohesive high-resolution illustrated artwork.
- Refresh the playfield and interface colors to match the earlier games’ brighter, richer space palette while retaining clear danger, reward, and navigation colors.
- Reuse suitable music from the earlier games when available; otherwise preserve the existing sound effects and add a fitting lightweight music treatment.
- Keep all current controls, difficulty, Git lessons, saves, story progression, and certificates unchanged.

## Technical details
- Load transparent PNG artwork once and render it smoothly on the game canvas at stable collision-aligned sizes.
- Preserve keyboard movement, arrow-key aim/fire, mouse aiming, reduced-motion behavior, and mute support.
- Ensure the sound control governs both music and effects.
- Verify the opening, active combat, pickups, hazards, and interface at desktop and small-screen sizes.
