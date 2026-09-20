# Guided Terminal Lessons and Expanded First Half

## What will change

- Make the terminal's **Hint:** label flash exactly three times whenever a terminal opens, while respecting reduced-motion settings.
- Make the first `git status` show the ship's full current condition—hull, armor, energy, fuel, ammo, upgrades, and score—before listing what changed.
- Rewrite KOMM's first checkpoint lesson so the player completes one clear prompt at a time:
  1. Run `git add .` and press Enter.
  2. After it succeeds, reveal `git commit -m "Repaired and refueled after the Shatter Field"` and explain that the quoted words describe the checkpoint.
- Rewrite **Secure Your Progress** as three progressive prompts: status, add, then commit. Only the current command will be shown, while the terminal still explains that all three form one process.
- Replace the unclear hash explanation with a direct definition: a hash is a unique short code identifying one checkpoint; the player copies it from the left side of `git log --oneline` when a command asks for `<hash>`.
- Keep Sector 2 open after the fifth drone is destroyed. Spawn an extraction beacon and let the player collect dropped supplies and the Shield Booster before choosing to leave.
- Add two combat-focused missions before the midpoint:
  - **Sector 3:** escalating drone waves with supply drops and an extraction beacon.
  - **Sector 4:** a tougher mixed drone-and-asteroid battle with a useful upgrade and an extraction beacon.
- Move the midpoint certificate after Sector 4 and update its milestone text.
- Renumber the existing Crimson Nebula, Turbo Core, and Void Gate content to Sectors 5, 6, and 7 without changing their Git lessons or outcomes.

## Technical details

- Extend terminal tasks with ordered hint steps tied to completed commands, so hints advance only after the previous command succeeds.
- Add a terminal-entry animation class for three flashes rather than a repeating animation.
- Extend combat stages with a post-combat extraction beacon; completion occurs when the player enters it after reaching the kill target, not immediately on the final kill.
- Keep existing save step IDs stable. New missions receive new IDs, so current saved games remain compatible.
- Update stage-range documentation and certificate labels to reflect seven sectors.

## Verification

- Play through initialization, first status, first checkpoint, Sector 2 extraction, progressive Secure Your Progress hints, both new combat missions, and the midpoint certificate.
- Confirm command completion reveals the next hint, ship statistics are visible, exactly three hint flashes occur, pickups remain collectible, and no console errors appear.
- Check the revised flow at desktop and compact widths.
