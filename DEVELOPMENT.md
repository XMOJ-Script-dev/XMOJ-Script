# Development Guide

This guide will help you set up your development environment for XMOJ-Script.

## Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Comes with Node.js
- **Git**: For version control

## Initial Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/XMOJ-Script-dev/XMOJ-Script.git
   cd XMOJ-Script
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   This will:
   - Install all development dependencies (ESLint, Prettier, Husky, etc.)
   - Set up git hooks automatically via the `prepare` script

3. **Verify setup**

   ```bash
   # Check linting
   npm run lint

   # Check formatting
   npm run format:check
   ```

## Development Workflow

### Making Changes

1. Create a new branch from `dev`:

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. Make your changes to the code

3. Run linting and formatting:

   ```bash
   # Fix linting issues
   npm run lint:fix

   # Format code
   npm run format
   ```

4. Test your changes in a browser with a userscript manager (Tampermonkey, Violentmonkey, etc.)

### Committing Changes

When you commit, the pre-commit hook will automatically:

- Run ESLint on changed JavaScript files
- Run Prettier to format changed files
- Prevent the commit if there are errors

```bash
git add .
git commit -m "Add: descriptive commit message"
```

If the pre-commit hook fails, fix the issues and try again.

### Bypassing Hooks (Not Recommended)

Only in rare cases should you bypass the pre-commit hook:

```bash
git commit --no-verify -m "commit message"
```

## Available Scripts

| Script            | Description                                      |
| ----------------- | ------------------------------------------------ |
| `npm run lint`    | Check for linting errors                         |
| `npm run lint:fix`| Automatically fix linting errors                 |
| `npm run format`  | Format all code with Prettier                    |
| `npm run format:check` | Check if code is formatted correctly        |
| `npm run prepare` | Set up git hooks (runs automatically on install) |

## Code Quality Standards

### ESLint Rules

Key rules enforced by ESLint:

- **Strict equality**: Use `===` and `!==` instead of `==` and `!=`
- **No var**: Use `const` or `let` instead of `var`
- **Security**: No `eval()`, proper use of `innerHTML`
- **Code style**: Consistent quotes, semicolons, indentation

### Prettier Configuration

Prettier enforces:

- **Indentation**: 4 spaces for JavaScript, 2 for JSON/YAML
- **Quotes**: Double quotes for strings
- **Line length**: Maximum 120 characters
- **Semicolons**: Always required
- **Trailing commas**: In multiline structures

## Project Structure

```
XMOJ-Script/
├── .github/          # GitHub Actions workflows
│   └── workflows/
├── .husky/           # Git hooks
├── backend/          # Backend services (separate project)
├── Images/           # Project images
├── Update/           # Update and release scripts
├── XMOJ.user.js      # Main userscript file
├── AddonScript.js    # Entry point
├── package.json      # Project dependencies and scripts
├── eslint.config.js  # ESLint configuration
├── .prettierrc.json  # Prettier configuration
└── CONTRIBUTING.md   # Contribution guidelines
```

## Common Issues

### Husky hooks not working

If git hooks aren't running:

```bash
npm run prepare
```

### ESLint errors in existing code

The codebase is being gradually updated to meet modern standards. Focus on ensuring your new code passes linting.

### Installation fails

Make sure you have Node.js 20 or higher:

```bash
node --version
```

## Testing

Currently, the project doesn't have automated tests. Manual testing is required:

1. Install the userscript in your browser
2. Navigate to https://xmoj.tech
3. Verify that your changes work as expected
4. Test edge cases and error conditions

## Getting Help

- Check [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
- Open an issue on GitHub for bugs or feature requests
- Review existing issues and pull requests
- Visit the documentation at https://docs.xmoj-bbs.me

## Additional Resources

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Userscript Documentation](https://wiki.greasespot.net/Greasemonkey_Manual:API)
