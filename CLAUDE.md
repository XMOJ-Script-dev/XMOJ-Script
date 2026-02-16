# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XMOJ-Script is a browser userscript that enhances the XMOJ online judge platform (xmoj.tech). This repository consists of:
- **Main userscript** (`XMOJ.user.js`): ~5000 line single-file userscript with all features. **See "Working with XMOJ.user.js" section below for CRITICAL instructions on using the xmoj-code-navigator agent.**
- **Update/version management scripts** (`Update/`): Automation for version bumping and releases
- **Metadata and documentation**: `Update.json` tracks version history, README and contributing guides

The `backend/` directory is a git submodule pointing to https://github.com/XMOJ-Script-dev/XMOJ-bbs and should be modified in that repository, not here.

## Working with XMOJ.user.js (CRITICAL)

**IMPORTANT: Due to the large size of XMOJ.user.js (~5000 lines), you MUST use the xmoj-code-navigator agent whenever you need to explore, search, or understand any part of this file.**

### When to use xmoj-code-navigator

Use the Task tool with `subagent_type="xmoj-code-navigator"` for:

- **Finding specific functions or features**: "Where is the auto-refresh functionality implemented?"
- **Understanding code sections**: "How does the login authentication work?"
- **Locating code patterns**: "Find all API calls to the backend"
- **Searching for specific implementations**: "Show me the dark mode toggle implementation"
- **Verifying if code exists**: "Does XMOJ.user.js have a function for parsing XML?"
- **ANY exploration task involving XMOJ.user.js**

### Why use this agent

Loading the entire XMOJ.user.js file into context:
- Wastes context window space
- Makes responses slower
- Is unnecessary when you only need specific sections

The xmoj-code-navigator agent efficiently locates and retrieves only the relevant code sections you need.

### Example usage

```
Instead of: Read tool on XMOJ.user.js (loads entire 5000 lines)
Use: Task tool with xmoj-code-navigator agent to find specific sections
```

**Exception**: Only use Read tool on XMOJ.user.js when:
- You need to edit a specific line number you already know
- You're making targeted edits and already know the exact location
- You need to verify a small, specific section (use offset and limit parameters)

## Development Workflow

### Branch Structure and PR Requirements

- `master`: Production branch - **DO NOT make PRs directly to master**
- `dev`: Development branch - **ALL PRs must be based on and target this branch**
- `extern-contrib`: External contributors must submit PRs to this branch

**CRITICAL: All pull requests must:**
1. Be based on the `dev` branch (branch off from `dev`)
2. Target the `dev` branch (not `master`)
3. Merge latest `dev` into your branch before submitting to resolve conflicts

The workflow is: `dev` → (when ready) → `master` for releases. Direct PRs to `master` are not accepted.
You should follow the PR template that can be found [here](https://raw.githubusercontent.com/XMOJ-Script-dev/.github/refs/heads/main/.github/PULL_REQUEST_TEMPLATE.md).

### Version Management (CRITICAL - Fully Automated)

Version updates are **fully automated** via GitHub Actions. When a PR to `dev` modifies `XMOJ.user.js`:

1. The `UpdateVersion` workflow runs `Update/UpdateVersion.js` which automatically:
   - Bumps patch version in `package.json`
   - Updates `@version` in `XMOJ.user.js` metadata block
   - Adds/updates entry in `Update.json` with PR number, title, and timestamp
   - Commits changes back to the PR branch with `github-actions[bot]`

2. Version sync is enforced between:
   - `package.json` → `"version": "x.y.z"`
   - `XMOJ.user.js` → `// @version x.y.z` (in metadata block)
   - `Update.json` → `UpdateHistory["x.y.z"]` (JSON key)

**Never manually edit version numbers** - the automation handles this based on PR metadata.

### Release Notes in PRs

To add release notes to a PR that will appear in the release, include an HTML comment block in the PR description:

```markdown
<!-- release-notes
Your release notes here in markdown format
-->
```

The `UpdateVersion.js` script extracts this and adds it to `Update.json` as the `Notes` field.

### Bypassing Automation

To prevent CI from touching your PR (e.g., during merge conflicts or debugging), add `//!ci-no-touch` anywhere in `Update.json`. The automation will remove it and exit without making other changes.

### Release Process

- **Pre-release**: Push to `dev` triggers a pre-release with `"Prerelease": true` in Update.json
- **Release**: Merge `dev` to `master` triggers a production release
- Releases are created by `Update/GetVersion.js` reading the version from XMOJ.user.js
- Both workflows deploy to Cloudflare Pages and GitHub Pages

## Code Structure

### Main Userscript (`XMOJ.user.js`)

A single-file userscript (~5000 lines) organized as:

1. **Metadata block** (lines 1-50): Userscript headers
   - `@name`, `@version`, `@description`, `@author`
   - `@match` patterns for xmoj.tech and 116.62.212.172
   - `@require` declarations for external libraries (CryptoJS, CodeMirror, FileSaver, marked, DOMPurify)
   - `@grant` permissions for GM APIs

2. **Main script body**: Direct DOM manipulation and feature injection
   - Page detection and routing based on URL patterns
   - UI enhancements using Bootstrap classes
   - Feature implementations (auto-refresh, code checking, test data fetching, dark mode, etc.)
   - API calls to backend at `api.xmoj-bbs.tech` / `api.xmoj-bbs.me`

Key classes/functions:
- `compareVersions()` (line 112): Version comparison logic
- `NavbarStyler` class (line 589): Navigation bar styling
- `replaceMarkdownImages()` (line 715): Markdown image processing

### Update Scripts (`Update/`)

Node.js scripts run by GitHub Actions (not for local development):

- **`UpdateVersion.js`**: Automated version bumping for PRs to `dev`
  - Reads PR number, title, body from command line args
  - Uses `gh` CLI to check out PR branch
  - Parses `<!-- release-notes -->` blocks from PR body
  - Updates version in all three locations
  - Pushes changes back to PR branch

- **`GetVersion.js`**: Extracts current version from XMOJ.user.js for release workflows

- **`UpdateToRelease.js`**: Changes `"Prerelease": false` when promoting to production

- **`AutoLabel.js`**: Auto-labels PRs based on content

These scripts directly manipulate `Update.json` and `XMOJ.user.js` using Node.js fs module.

## Coding Standards

### Style Guidelines (from CONTRIBUTING.md)

- **Variables**: camelCase
- **Functions**: PascalCase
- **Classes**: TitleCase
- **Line endings**: Unix (LF)
- **Do NOT run code formatters** - maintain original formatting
- **Use Bootstrap classes** instead of custom CSS
- **No external libraries** without permission (script already includes many via `@require`)

### Development Principles

- **Stability before features**: Bug fixes take priority
- Respect the original code style, even if inconsistent
- New features require prior discussion in an issue
- Before submitting PRs, merge `dev` into your branch and resolve conflicts

## Testing

No automated test suite exists. Manual testing workflow:

1. Install the userscript in Tampermonkey/ScriptCat/Violentmonkey
2. Navigate to xmoj.tech (or 116.62.212.172)
3. Test features on relevant pages:
   - Problem lists
   - Problem detail pages
   - Status/submission pages
   - Contest pages
   - User profiles

Observe browser console for errors and verify UI enhancements appear correctly.

## Common Issues

### Version Sync Errors

If you see "XMOJ.user.js and Update.json have different patch versions":
- The automation keeps these in sync normally
- If manually editing (not recommended), update both files
- Use `//!ci-no-touch` if you need to bypass automation temporarily

### PR Requirements

- **All PRs must be based on and target `dev` branch, not `master`**
- Only PRs from the same repository (not forks) trigger auto-versioning
- PRs must modify `XMOJ.user.js` to trigger version bumps
- Must merge `dev` into your branch before submitting
- External contributors must target `extern-contrib` branch

### Single-File Architecture

The entire userscript is intentionally in one file - do not split into modules. Userscript managers load it as a single file, with external dependencies via `@require` headers in the metadata block.
