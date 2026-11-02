# Repository instructions

## Session continuity

- Read root `NOW.md` at the start of every session, before implementation. Also read `README.md` and `HANDOVER.md` where present, and applicable nested instruction files.
- Update root `NOW.md` before ending every session and keep it current as work progresses. Preserve relevant content and use the fields: Doing, State, Next step, Blocked by, Updated (YYYY-MM-DD). Base entries on verified findings and explicitly mark uncertainties.
- Root `AGENTS.md` and `CLAUDE.md` must have identical contents. Whenever either root instruction file changes, update both identically and preserve useful existing instructions. Leave nested instruction files unchanged unless the user explicitly requests changes to them.

## Project and validation

- JumpStart is a Windows Electron launcher in `launcher/`, with an AutoHotkey v2 Windows-key helper in `winkey-helper/`.
- Follow the development and build instructions in `README.md`. Windows-specific launcher, registry, PowerShell, helper, and installer behavior requires Windows validation; distinguish source inspection from runtime verification.
- The release workflow builds and publishes on pushes to `main`, ignoring Markdown-only changes. Check the workflow before publishing changes that may trigger a release.
- Keep changes within the user's authorized scope. After the initial repository review and continuity documentation, wait for the user's direction before implementing further changes.
