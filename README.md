# Agar.io Scripts

A collection of Tampermonkey userscripts for customizing Agar.io controls and gameplay.

## Scripts

| Script | Description | Category |
|---|---|---|
| [Extended Zoom](scripts/extended-zoom.user.js) | Extends the zoom-out range, allowing you to see more of the map. | Camera / Zoom |
| [Space to Right Click](scripts/space-to-right-click.user.js) | Maps the Space key to a simulated right-click action. | Controls |

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open the script you want to install from the table above.
3. Copy the script's source code.
4. Create a new userscript in Tampermonkey and paste the code.
5. Save the script and open Agar.io.

Install each script independently. You only need to install the features you want to use.

## Configuration

### Extended Zoom

**File:** `scripts/extended-zoom.user.js`

The minimum zoom level can be adjusted by changing the `ZOOM_FLOOR` constant in the script.

```javascript
const ZOOM_FLOOR = 0.10;
```

- `1.00` — Normal maximum zoom level.
- `0.25` — Allows approximately 4× more zoom-out.
- `0.10` — Allows approximately 10× more zoom-out.

Lower values allow you to see more of the map, provided the current game version supports the modification.

### Space to Right Click

**File:** `scripts/space-to-right-click.user.js`

No additional configuration is required.

Pressing Space attempts to trigger a simulated right-click action. The script uses synthetic mouse events, which may behave differently from a physical mouse click depending on how Agar.io handles input.

## Compatibility

These scripts are designed for Agar.io and may stop working after game updates.

- **Extended Zoom** modifies WebAssembly-related behavior and depends on the game's internal implementation.
- **Space to Right Click** depends on the game's handling of synthetic mouse events.

Compatibility may vary across browsers and game versions.

## Contributing

Contributions, bug reports, and improvements are welcome.

When submitting changes, include a clear description of the modification and any relevant testing or compatibility information.

## Disclaimer

This is an unofficial community project and is not affiliated with, endorsed by, or associated with Agar.io.

Use scripts responsibly and respect the game's applicable rules.

## License

See the repository's `LICENSE` file for the terms governing use, modification, and distribution.