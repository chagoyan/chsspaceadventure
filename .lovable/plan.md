# Match Space Explorer’s Smart Bomb and Exhaust

## Goal
Bring the two recent Space Explorer combat effects into Space Adventure without changing its missions, controls, Git lessons, or other mechanics.

## Changes
- Add the same instant 170px smart-bomb shockwave used in Space Explorer.
- Apply heavy point-blank damage to nearby drones and asteroids, including normal score, kill-count, explosion, and pickup behavior when they are destroyed.
- Preserve this game’s special protections: the first-run invulnerable kamikaze remains immune, and the Merge Conflict cannot be damaged while off-screen between phases.
- Increase each of the 24 outward smart-bomb shots from 1 damage to 3 damage so ordinary swarm drones are reliably destroyed.
- Use the existing two full-ship flame frames whenever the ship is thrusting, alternating at 10 fps during normal thrust and 16 fps during the A-key boost.
- Keep the idle ship on its no-flame image and preserve reduced-motion behavior.

## Verification
- Confirm a smart bomb immediately clears nearby ordinary drones and asteroids, while its outer ring damages distant targets.
- Confirm normal thrust alternates the flame frames, boost alternates them faster, and idle flight shows the base ship.
- Confirm the invulnerable kamikaze and Merge Conflict phase rules still behave as designed.
- Check the current game for build and browser errors after the change.

## Technical details
- Extend projectile entities with an optional damage value and use it during collision handling, defaulting ordinary shots to 1.
- Reuse the current `SHIP`, `SHIP_BOOST`, explosion effects, scoring, and pickup systems rather than adding parallel systems or new assets.
