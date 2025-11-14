# XMOJ-Script Project Documentation for Claude

## Project Overview

XMOJ-Script is a Greasemonkey/Tampermonkey userscript that enhances the XMOJ (小明 Online Judge) platform. The project has been refactored from a monolithic 5000-line file into a modular, maintainable architecture using Rollup bundler.

**Original File**: XMOJ.user.js (~5000 lines, unmaintainable)
**Current Structure**: Modular ES6 with features, pages, utilities, and core modules
**Build Output**: dist/XMOJ.user.js (preserves userscript header)

## Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FEATURES LAYER                       │
│  (20 modules) - User-facing functionality controlled     │
│  by UtilityEnabled() flags in localStorage              │
│  Examples: AutoLogin, DarkMode, Discussion, etc.        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      PAGES LAYER                         │
│  (8 modules) - Page-specific styling and DOM            │
│  manipulation, routed by location.pathname               │
│  Examples: problem.js, contest.js, userinfo.js          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  UTILITIES & CORE LAYER                  │
│  Shared utilities (10 modules) + core application logic │
│  bootstrap.js contains legacy code being refactored     │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── core/                # Core application logic
│   ├── bootstrap.js     # Main app (LEGACY - being refactored out)
│   ├── config.js        # UtilityEnabled() feature flags
│   ├── constants.js     # Global constants
│   └── menu.js          # Greasemonkey menu commands
│
├── features/            # Feature modules (by UtilityEnabled name)
│   ├── index.js         # Feature loader (routes to features)
│   ├── auto-login.js    # AutoLogin feature
│   ├── dark-mode.js     # DarkMode feature
│   └── ... (20 total)   # Each feature is self-contained
│
├── pages/               # Page-specific modules (by pathname)
│   ├── index.js         # Page loader (routes to pages)
│   ├── problem.js       # /problem.php
│   ├── contest.js       # /contest.php
│   └── ... (8 total)    # Each page handles its own styling
│
├── utils/               # Shared utilities
│   ├── html.js          # HTML escaping, sanitization
│   ├── time.js          # Time formatting
│   ├── api.js           # API requests
│   └── ... (10 total)   # Pure utility functions
│
└── main.js              # Entry point (ties everything together)
```

## Key Concepts

### 1. Features

Features are user-facing functionality controlled by `UtilityEnabled()` flags stored in localStorage.

**Pattern:**
```javascript
import { UtilityEnabled } from '../core/config.js';

export function init(context) {
    if (!UtilityEnabled("FeatureName")) {
        return; // Feature disabled, do nothing
    }

    // Feature implementation here
}
```

**Key Points:**
- Each feature checks `UtilityEnabled()` before executing
- Features are initialized in `src/features/index.js`
- Features run BEFORE page modules (early in page load)
- Most features default to enabled (except DebugMode, SuperDebug, ReplaceXM)

**Current Features (20):**
AutoLogin, Discussion, CopySamples, CompareSource, RemoveUseless, ReplaceXM, ReplaceYN, AddAnimation, AddColorText, SavePassword, RemoveAlerts, ReplaceLinks, AutoO2, Translate, AutoCountdown, MoreSTD, ExportACCode, OpenAllProblem, DarkMode, ImproveACRate

### 2. Pages

Pages are route-specific modules that handle page styling and DOM manipulation.

**Pattern:**
```javascript
export async function init(context) {
    // Access utilities from context
    const { SearchParams, RenderMathJax, RequestAPI } = context;

    // Page-specific initialization here
}
```

**Key Points:**
- Pages are routed by `location.pathname` in `src/pages/index.js`
- Pages receive a context object with utilities
- Pages run AFTER bootstrap.js setup (on window.load event)
- Pages handle styling that doesn't belong to features

**Current Pages (8 modules, 9 routes):**
- `/problem.php` - Problem view
- `/contest.php` - Contest list/view
- `/status.php` - Submission status
- `/submitpage.php` - Code submission
- `/problemset.php` - Problem list
- `/userinfo.php` - User profile
- `/loginpage.php` - Login form
- `/contestrank-oi.php` - OI ranking
- `/contestrank-correct.php` - Correct ranking

### 3. Context Object

The context object is passed to page modules and provides access to utilities:

```javascript
const pageContext = {
    SearchParams: new URLSearchParams(location.search),
    RenderMathJax,      // MathJax rendering
    RequestAPI,         // API requests
    TidyTable,          // Table styling
    GetUserInfo,        // User information
    GetUserBadge,       // User badges
    GetUsernameHTML,    // Username formatting
    GetRelativeTime,    // Relative time formatting
    SmartAlert,         // Alert system
    Style,              // Global style element
    IsAdmin,            // Admin flag
};
```

## Development Workflow

### Building

```bash
npm install           # Install dependencies
npm run build         # Build once
npm run watch         # Watch mode (auto-rebuild)
```

**Output:** `dist/XMOJ.user.js` (includes userscript header)

### Adding a New Feature

1. Create `src/features/feature-name.js`:
```javascript
import { UtilityEnabled } from '../core/config.js';

export function init(context) {
    if (!UtilityEnabled("FeatureName")) return;
    // Implementation
}
```

2. Add to `src/features/index.js`:
```javascript
import { init as initFeatureName } from './feature-name.js';

// In initializeFeatures():
initFeatureName();

// In getExtractedFeatures():
return [..., 'FeatureName'];
```

3. Test build and commit

### Adding a New Page

1. Create `src/pages/page-name.js`:
```javascript
export async function init(context) {
    const { SearchParams } = context;
    // Page-specific code
}
```

2. Add to `src/pages/index.js`:
```javascript
import { init as initPageName } from './page-name.js';

const PAGE_ROUTES = {
    ...
    '/page-name.php': initPageName,
};
```

3. Test build and commit

## Important Patterns & Conventions

### 1. Feature Extraction Pattern

When extracting a feature from bootstrap.js:
- Search for `UtilityEnabled("FeatureName")`
- Extract ALL related code (search entire file)
- Create self-contained module
- Document extracted line numbers in comments
- Update feature loader
- Test build

### 2. Page Extraction Pattern

When extracting a page from bootstrap.js:
- Search for `location.pathname == "/page.php"`
- Extract page-specific code (styling, DOM manipulation)
- Preserve feature flag checks (features handle their own checks)
- Create module with context parameter
- Update page loader
- Test build

### 3. Utility Functions

Utilities are made globally available via `window` for compatibility:
```javascript
// In main.js
window.RequestAPI = RequestAPI;
window.GetUserInfo = GetUserInfo;
// etc.
```

This allows bootstrap.js (legacy code) to call utilities.

### 4. Error Handling

Always wrap page/feature initialization in try-catch:
```javascript
try {
    // Implementation
} catch (error) {
    console.error('[ModuleName] Error:', error);
}
```

### 5. Async Operations

Many operations are async (MathJax, API calls, user info):
```javascript
export async function init(context) {
    await RenderMathJax();
    const userInfo = await GetUserInfo(userId);
    // ...
}
```

## Important Technical Details

### 1. localStorage Keys

The script uses localStorage extensively:
- `UserScript-Setting-{FeatureName}` - Feature flags (true/false)
- `UserScript-User-{UserID}-*` - User data cache
- `UserScript-Problem-{PID}-*` - Problem data cache
- `UserScript-Contest-{CID}-*` - Contest data cache
- `UserScript-LastPage` - Last visited page (for AutoLogin)

### 2. Feature Flags Default

Most features default to enabled. Exceptions:
- `DebugMode` - false by default
- `SuperDebug` - false by default
- `ReplaceXM` - false by default (changes "小明" to "高老师")

### 3. External Libraries

The script uses these external libraries (loaded by bootstrap.js):
- **Bootstrap 5** - UI framework
- **jQuery** - DOM manipulation (legacy)
- **CodeMirror** - Code editor (for submit page)
- **MathJax** - Math rendering
- **DOMPurify** - HTML sanitization
- **CryptoJS** - MD5 hashing (for passwords)
- **FileSaver.js** - File downloads
- **marked.js** - Markdown rendering

### 4. Greasemonkey APIs

The script uses these GM APIs:
- `GM_registerMenuCommand` - Menu commands
- `GM_xmlhttpRequest` - Cross-origin requests
- `GM_setClipboard` - Clipboard access
- `GM_setValue` / `GM_getValue` - Persistent storage (optional)
- `GM_cookie` - Cookie access

### 5. API Endpoints

The script communicates with XMOJ backend via `RequestAPI()`:
- `GetUserInfo` - User information
- `GetUserBadge` - User badges
- `GetPostCount` - Discussion counts
- `GetMailMentionList` - Mail/mention notifications
- `LastOnline` - Last online time
- And many more...

### 6. Time Synchronization

The script syncs with server time:
```javascript
window.diff // Global time difference with server
```

Used by countdown timers (AutoCountdown feature, contest timers).

### 7. Dark Mode

DarkMode feature sets `data-bs-theme` attribute:
```javascript
document.querySelector("html").setAttribute("data-bs-theme", "dark");
```

Many components check this for conditional styling.

## Remaining Refactoring Work

### Features Still in bootstrap.js (21 remaining)

These features have NOT been extracted yet:
- AddUnits
- ApplyData, AutoCheat, AutoRefresh
- BBSPopup, CompileError, CopyMD
- DebugMode, DownloadPlayback
- IOFile, LoginFailed, MessagePopup
- NewBootstrap, NewDownload, NewTopBar
- ProblemSwitcher, Rating
- RefreshSolution, ResetType
- UploadStd

### Pages That Could Be Extracted

Additional pages that could benefit from extraction:
- `/index.php` - Home page
- `/modifypage.php` - Settings/changelog
- `/reinfo.php` - Test case info
- `/ceinfo.php` - Compile error info
- `/showsource.php` - Source code view
- `/problem_std.php` - Standard solution
- `/comparesource.php` - Source comparison (partially in features)
- `/downloads.php` - Downloads page
- `/problemstatus.php` - Problem statistics
- `/problem_solution.php` - Problem solution
- `/open_contest.php` - Open contests
- `/mail.php` - Mail system
- `/contest_video.php` - Contest video
- `/problem_video.php` - Problem video

### Legacy Code in bootstrap.js

The `bootstrap.js` file still contains:
- ~4400 lines of legacy code
- All remaining features (see above)
- All remaining page handlers
- Some duplicate code (features extracted but not removed from bootstrap)

**Strategy:** Continue extracting features and pages until bootstrap.js only contains:
- Initial setup (theme, navbar, resources)
- Core application logic that doesn't fit elsewhere
- Minimal glue code

## Git Workflow

**Branch:** `claude/refactor-userscript-structure-011CUxWM4EozUNd9os4Da49N`

**Commit Message Pattern:**
```
Extract N features/pages: Name1, Name2, Name3

Description of what was extracted and why.

New features/pages:
- Name1: Description
- Name2: Description

Updated:
- Files that changed
- Build output size

Total extracted: X
Remaining: Y
```

**Push Pattern:**
```bash
git add -A
git commit -m "..."
git push -u origin claude/refactor-userscript-structure-011CUxWM4EozUNd9os4Da49N
```

## Testing

**Manual Testing Required:**
- Build completes without errors
- Output file has userscript header
- File size is reasonable (~500-600KB currently)
- No obvious syntax errors in output

**No Automated Tests:** This project has no test suite. Changes must be tested manually on the XMOJ website.

## Common Pitfalls

1. **Don't remove code from bootstrap.js** until confirming it's fully extracted and working in the new module
2. **Preserve userscript header** - Rollup config handles this, don't modify without checking
3. **Check UtilityEnabled logic** - Features must self-check if enabled
4. **Context object** - Pages need utilities passed via context
5. **Async/await** - Many operations are async, handle properly
6. **localStorage keys** - Use existing patterns, don't create new schemes
7. **Global window vars** - Utilities must be on window for bootstrap.js compatibility
8. **Line number references** - When extracting, note original line numbers in comments

## Success Metrics

**Started with:**
- 1 file: XMOJ.user.js (5000 lines)
- No organization
- Impossible to maintain

**Currently:**
- 20 feature modules (organized by functionality)
- 8 page modules (organized by route)
- 10 utility modules (shared code)
- 4 core modules (application logic)
- Clean architecture
- Easy to find and modify code
- ~549KB build output (reasonable)

**Goal:**
- Extract all remaining 21 features
- Extract all remaining pages
- Reduce bootstrap.js to <1000 lines of essential code
- Maintain or reduce bundle size
- Keep all functionality working

## Contact & Resources

**Documentation:**
- README_REFACTORING.md - Detailed refactoring guide
- This file (Claude.md) - AI assistant documentation

**Key Files to Understand:**
1. `src/main.js` - Entry point, shows initialization flow
2. `src/features/index.js` - Feature loader, shows all features
3. `src/pages/index.js` - Page loader, shows all pages
4. `src/core/config.js` - UtilityEnabled implementation
5. `rollup.config.js` - Build configuration

**External Resources:**
- XMOJ Website: https://www.xmoj.tech
- Rollup Docs: https://rollupjs.org
- Greasemonkey API: https://wiki.greasespot.net/Greasemonkey_Manual:API
