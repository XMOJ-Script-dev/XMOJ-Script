# Contributing to XMOJ-Script

Hi, there! Welcome to XMOJ-Script!

We are happy to have you here with us!

We believe that you must be excited to contribute to our repo, but first, please read the contribution guidelines!

> [!IMPORTANT]
> 请注意, 外部开发者应向`extern-contrib`提交 pull requests。

## General Guidelines

- Our goal for `xmoj-script` is **stability before features**. This means we focus on squashing critical bugs before adding new features. Often, we can do both in tandem, but bugs will take priority over a new feature.
- We use Bootstrap in our project. Please use Bootstrap classes instead of writing your own CSS whenever possible.
- Do not use any external libraries without prior permission.
- For new features, open an issue first to discuss what you would like to change.
- Respect the original code style. Variables should be camelCase, functions should be PascalCase, and classes should be TitleCase. There is a bunch of old code that doesn't follow this rule, but new code should.
- Commit Unix line endings.
- Before Submitting your Pull Request, merge `dev` with your new branch and fix any conflicts. (Make sure you don't break anything in development!)
- Be patient. We are a small team and may not be able to review your PR immediately.
- Please be considerate towards the developers and other users when raising issues or presenting pull requests.
- Respect our decision(s), and do not be upset or abusive if your submission is not used.
- For release pull requests, include an HTML comment block starting with `<!-- release-notes` and ending with `-->` in the PR description. The automation will extract that block into the release notes.

## Development Setup

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install git hooks:
   ```bash
   npm run prepare
   ```

### Code Quality Tools

We use automated tools to maintain code quality:

#### ESLint

ESLint checks for code quality and common errors.

```bash
# Check for linting errors
npm run lint

# Automatically fix linting errors
npm run lint:fix
```

#### Prettier

Prettier ensures consistent code formatting.

```bash
# Check if code is formatted correctly
npm run format:check

# Automatically format code
npm run format
```

#### Pre-commit Hooks

Pre-commit hooks automatically run linting and formatting before each commit. If you need to bypass them (not recommended), use:

```bash
git commit --no-verify
```

### Code Style Guidelines

- **Equality**: Always use strict equality (`===` and `!==`) instead of loose equality (`==` and `!=`)
- **Variables**: Use `const` by default, `let` when reassignment is needed, never use `var`
- **Naming Conventions**:
  - Variables: `camelCase`
  - Functions: `PascalCase`
  - Classes: `TitleCase`
  - Constants: `UPPER_SNAKE_CASE` (for true constants)
- **Quotes**: Use double quotes (`"`) for strings
- **Semicolons**: Always use semicolons
- **Indentation**: 4 spaces (configured in Prettier)
- **Line Length**: Maximum 120 characters

### Security Best Practices

- Avoid using `innerHTML` with unsanitized content; use `DOMPurify.sanitize()` when necessary
- Never use `eval()` or similar functions
- Validate and sanitize all user inputs
- Use parameterized queries for any API calls

### Testing

Currently, we don't have automated tests, but this is a priority for future development. When writing code:
- Test your changes manually in the browser
- Verify that existing features still work
- Test edge cases and error conditions

### Pull Request Process

1. Fork the repository (external contributors should target `extern-contrib` branch)
2. Create a feature branch from `dev`
3. Make your changes
4. Run linting and formatting: `npm run lint:fix && npm run format`
5. Commit your changes with clear, descriptive messages
6. Push to your fork
7. Open a Pull Request to `extern-contrib` (external) or `dev` (team members)

### Commit Message Guidelines

- Use clear, descriptive commit messages
- Start with a verb in present tense (e.g., "Add feature", "Fix bug", "Update documentation")
- Keep the first line under 72 characters
- Add a detailed description if necessary

### Need Help?

If you have questions or need help:
- Open an issue on GitHub
- Check existing issues and pull requests
- Review the project documentation at https://docs.xmoj-bbs.me

Thank you for contributing to XMOJ-Script! 🎉
