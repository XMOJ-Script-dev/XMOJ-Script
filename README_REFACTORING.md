# XMOJ-Script Refactoring

This project has been refactored to use a modular structure with a bundler (Rollup) for better maintainability.

## Project Structure

```
XMOJ-Script/
├── src/                      # Source code (modular)
│   ├── core/                 # Core application logic
│   │   ├── constants.js      # Constants and configuration values
│   │   ├── config.js         # Feature configuration (UtilityEnabled)
│   │   ├── bootstrap.js      # Main application logic and initialization
│   │   └── menu.js           # Greasemonkey menu commands
│   ├── utils/                # Utility modules
│   │   ├── alerts.js         # Alert utilities
│   │   ├── api.js            # API request utilities
│   │   ├── credentials.js    # Credential storage utilities
│   │   ├── format.js         # Size formatting utilities
│   │   ├── html.js           # HTML escaping and purifying
│   │   ├── mathjax.js        # MathJax rendering
│   │   ├── table.js          # Table styling utilities
│   │   ├── time.js           # Time formatting utilities
│   │   ├── user.js           # User information utilities
│   │   └── version.js        # Version comparison utilities
│   ├── features/             # Feature modules (to be extracted)
│   └── main.js               # Main entry point
├── dist/                     # Built output
│   └── XMOJ.user.js          # Bundled userscript (generated)
├── rollup.config.js          # Rollup bundler configuration
├── package.json              # NPM package configuration
└── XMOJ.user.js              # Original userscript (legacy)
```

## Building

```bash
# Install dependencies
npm install

# Build once
npm run build

# Watch for changes and rebuild automatically
npm run watch
```

The bundled output will be in `dist/XMOJ.user.js`.

## Features

The userscript includes the following features (controlled via `UtilityEnabled`):

- AddAnimation - Add animations to UI elements
- AddColorText - Add colored text
- AddUnits - Add units to numbers (KB, MB, etc.)
- ApplyData - Apply user data
- AutoCheat - Auto-cheat features
- AutoCountdown - Automatic countdown
- AutoLogin - Automatic login
- AutoO2 - Auto O2 compilation flag
- AutoRefresh - Auto-refresh pages
- BBSPopup - BBS popup notifications
- CompareSource - Compare source code
- CompileError - Compile error enhancements
- CopyMD - Copy as Markdown
- CopySamples - Copy sample inputs/outputs
- DarkMode - Dark mode theme
- DebugMode - Debug mode logging
- Discussion - Discussion features
- DownloadPlayback - Download playback
- ExportACCode - Export AC code
- IOFile - IO file handling
- ImproveACRate - Improve AC rate display
- LoginFailed - Login failure handling
- MessagePopup - Message popup notifications
- MoreSTD - More standard solutions
- NewBootstrap - New Bootstrap UI
- NewDownload - New download features
- NewTopBar - New top navigation bar
- OpenAllProblem - Open all problems
- ProblemSwitcher - Problem switcher
- Rating - User rating display
- RefreshSolution - Refresh solution display
- RemoveAlerts - Remove alert popups
- RemoveUseless - Remove useless elements
- ReplaceLinks - Replace links
- ReplaceXM - Replace "小明" with "高老师"
- ReplaceYN - Replace Y/N text
- ResetType - Reset type display
- SavePassword - Save password
- SuperDebug - Super debug mode
- Translate - Translation features
- UploadStd - Upload standard solutions

## Future Improvements

Individual features should be extracted into separate modules under `src/features/` for better organization and maintainability. Each feature module should:

1. Export an initialization function
2. Only activate when `UtilityEnabled("FeatureName")` returns true
3. Contain all code specific to that feature

This allows for:
- Better code organization
- Easier testing of individual features
- Ability to enable/disable features independently
- Simpler debugging

## Development

The codebase is now set up for easier development:

1. Edit files in `src/`
2. Run `npm run watch` to automatically rebuild on changes
3. Test the bundled output in `dist/XMOJ.user.js`

All original functionality has been preserved - the refactoring only changes the code structure, not the behavior.
