# AGENTS.md

## Repository Overview

This repository is a TypeScript static gallery framework for camera photos. It is intended to ingest photo files, preserve optional titles and descriptions, group photos into albums, analyze EXIF metadata, generate multiple thumbnail sizes, and publish a static site to Cloudflare Pages.

Detected stack: Node.js 22, npm, TypeScript, Vitest, ESLint flat config, Prettier, Knip, Wrangler, Cloudflare Pages, `sharp` for image transforms, `exifr` for EXIF parsing, `fast-glob` for file discovery, and `zod` for schema validation.

## Engineering Standards

- Follow modern TypeScript, Node.js ESM, and Cloudflare Pages practices.
- Prefer strict types, small modules, pure functions, explicit data boundaries, and dependency injection for filesystem-heavy behavior.
- Match repository-local patterns, naming, architecture, and helper APIs before introducing new abstractions.
- Keep code high-cohesion, low-coupling, readable, maintainable, and consistent.
- Avoid over-engineering, speculative abstractions, hidden global state, broad refactors, dead code, and code smells.
- Use Cloudflare's official docs or MCP tools before changing `wrangler.jsonc`, Pages deploy scripts, compatibility dates, bindings, or Cloudflare-specific runtime assumptions.

## Language Policy

- Code, comments, documentation, agent notes, plans, and subagent communication must be English.
- i18n strings and user-facing product copy may use the target product language.
- Reply to users in the language they use.

## Subagent Workflow

- Use subagents for separable investigation, repository exploration, implementation, validation, and review tasks.
- Split independent work to preserve the main agent's context window.
- Use the same model and comparable effort level as the main agent unless the user says otherwise.
- Give subagents English prompts and require English reports.

## Quality Commands

Run the relevant commands after every code edit and before every commit:

- Install dependencies: `npm install`
- Lint: `npm run lint`
- Format: `npm run format` or check only with `npm run format:check`
- Static analysis/type check: `npm run typecheck`
- Dead-code/code-smell cleanup: `npm run deadcode`
- Tests: `npm test`
- Clean generated output: `npm run clean`
- Production build: `npm run build`
- Cloudflare Pages local preview: `npm run preview`
- Cloudflare Pages deploy: `npm run deploy`
- Cloudflare binding types, after config/binding changes: `npm run wrangler:types`

## Testing Expectations

- Add or update meaningful tests for new behavior and bug fixes.
- Cover happy paths, edge cases, and error paths.
- Follow existing Vitest style and keep filesystem tests isolated with temporary directories.
- Prefer testing public behavior over implementation details.
- For image and EXIF work, include small fixtures and assert metadata/thumbnail outputs without committing large camera originals.

## Cloudflare Agent Resources

- Use Cloudflare Docs for Agents when Cloudflare behavior is relevant: `https://developers.cloudflare.com/docs-for-agents/`.
- Prefer the Cloudflare Docs MCP server for documentation lookup: `https://docs.mcp.cloudflare.com/mcp`.
- Prefer the Cloudflare API MCP server for account/API operations when authenticated access is needed: `https://mcp.cloudflare.com/mcp`.
- Re-check Cloudflare docs before relying on limits, Wrangler flags, Pages configuration, bindings, or compatibility behavior.

## Commits

- Use Conventional Commits.
- Examples: `feat: add import flow`, `fix: handle missing exif`, `docs: initialize agent guidance`.

## Recommended Skills

- If not already installed, consider installing Superpowers: `https://github.com/obra/Superpowers`.
