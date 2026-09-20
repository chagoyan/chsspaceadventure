# Lesson-Specific Commands and Clearer Diagnostics

## What will change

- Restrict each guided terminal lesson to the commands taught at that point during the first terminal. During **Run Ship Diagnostics**, only `git status` will be accepted, so players cannot stage or commit early.
- Add `git status` as the first required step in **Create Your First Checkpoint**, followed by `git add .`, then `git commit -m "Initial checkpoint after Shatter Field"`. Each command appears only after the prior step succeeds.
- Show the complete ship condition every time `git status` runs: hull, armor, energy, fuel, ammo, upgrades, and score.
- Before staging, color only values changed since the current checkpoint or initial ship state. After `git add .`, show the same values in the normal color while separately identifying the staged changes.
- Let's discuss what you mean by "Apply ordered, lesson-appropriate command permissions to later guided terminals as well, while keeping the final free-form terminal unrestricted."
- Rewrite dialogue so commands always use two literal minus signs, including `git log --oneline`, without a nearby em dash that could look like part of the command.

## Technical details

- Add lesson-level command permissions and enforce ordered requirements in the terminal before running a valid but premature command.  Once a command is learned or taught, allow it thereafter.
- Centralize full ship-stat rendering in the status report and assign each stat its color based on whether it differs from the active comparison point.
- Keep `help` and `clear` available at every terminal.

## Verification

- Confirm `git add .` and `git commit` are rejected during **Run Ship Diagnostics**.
- Confirm the first checkpoint requires status, add, and commit in order with three progressive hints.
- Confirm changed stats are highlighted before staging and return to the normal color after staging.
- Check all visible command text for literal `--oneline` and `--hard`, then replay the affected terminal lessons.