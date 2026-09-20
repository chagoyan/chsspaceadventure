# Make Git Space Adventure Fun First

## Goal
Turn the flight sections into an approachable arcade game that works comfortably with one keyboard and a trackpad. Keep the terminal lessons, but make them short breaks between satisfying game stages rather than the main experience.

## Gameplay changes
- Replace mouse-dependent combat with keyboard-first controls:
  - WASD or arrow keys move the ship directly with quick stopping and no drifting.
  - The ship automatically aims at the nearest threat.
  - Space fires; holding Space continues firing.
  - Shift gives a short speed boost.
  - Mouse aiming and click-to-fire remain optional.
- Add a brief control card before the first flight, with a clear “Start flying” button.
- Make the ship easier to read and control with stronger acceleration, tighter braking, a larger pickup range, and clearer goal guidance.
- Reduce incoming damage, enemy speed, enemy fire rate, asteroid density, and large combat targets.
- Add gentle recovery: slow ammo regeneration, more frequent useful pickups, and forgiving collision windows.

## Visual upgrade
- Redraw the ship, enemies, boss, asteroids, pickups, beacon, projectiles, and effects with a cleaner neon arcade style and stronger silhouettes.
- Add layered star movement, engine trails, impact sparks, projectile glow, enemy health feedback, objective arrows, and a clearer safe route through hazards.
- Simplify the HUD so the objective, health, score, and controls are readable without covering the playfield.
- Refresh the surrounding game presentation to feel cohesive and polished while preserving the space-adventure identity.

## Terminal balance
- Keep command mechanics unchanged, including staging, commits, reset, and revert.
- Shorten repeated instructions and keep the terminal as a paced intermission after action.
- Preserve the manual Next/Continue controls and reread option already added.

## Verification
- Play through the opening flight and a combat stage using keyboard-only controls.
- Check mouse aiming still works as an optional control.
- Verify the game remains readable and playable at desktop and compact viewport sizes.
- Confirm no console errors and no regressions in terminal progression.
