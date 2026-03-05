# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-03-06

### Added
- Initial standalone release extracted from claudeclaw
- 6 skills: `/sdlc`, `/sdlc start`, `/sdlc score`, `/sdlc status`, `/sdlc doctor`, gate-check
- 1 agent: spec-scorer (LLM-as-judge for spec quality)
- 3 rubrics: spec-quality, code-quality, acceptance-criteria
- 2 templates: spec template, scorecard template
- Pre-commit hook for gate enforcement warnings
- Spec resolution library with worktree awareness
- `/sdlc doctor --init` for bootstrapping new projects

### Changed
- Generalized memory wiring to work with any Claude Code project (not just claudeclaw)
- Removed claudeclaw-specific checks (SOUL.md, memory file validation)
- Simplified plugin wiring check for marketplace installs
- Added beads CLI availability check
