# Improve dialogue and flight controls

## What will change
- Replace KOMM’s alien portrait with a clear ship-computer display, keeping Oscar as the only character portrait.
- Present dialogue and answer choices in a larger centered communication panel instead of a small bottom overlay.
- Use the attached round spacecraft as the visual reference for Oscar’s ship.
- Make the ship face its movement direction at all times.
- Keep aiming and firing independent from the ship’s facing direction, so keyboard and trackpad controls remain usable.
- Remove the extra drawn thrust flame because the ship artwork already includes its own exhaust.

## Technical details
- Update the dialogue portrait and responsive layout while preserving the existing read-again and manual-next behavior.
- Separate movement heading from weapon aim in the flight engine.
- Update the control instructions to accurately describe movement and firing.
- Prepare a transparent in-game ship sprite from the supplied reference, then use it in the canvas renderer.
- Test dialogue choices and directional movement at desktop and compact viewport sizes.
