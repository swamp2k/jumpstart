# NOW

## Doing

Initial repository review and session continuity setup complete; awaiting the user's direction before implementation.

## State

- Reviewed `README.md`, launcher JavaScript/HTML, Store discovery PowerShell, AutoHotkey helper, installer configuration, release workflow, recent commits, and open pull requests on 2026-11-02.
- Reviewed baseline: `main` at `c6ee6eeb2b844d68d6bfe2980db223db206bac06` (2026-10-23, README documentation and Markdown release filtering). Earlier October 7 changes added the assisted installer, sign-in option, serialized scans, and Store refresh guards.
- Neither root instruction file existed. Created identical `AGENTS.md` and `CLAUDE.md`; root `NOW.md` was also absent. No `HANDOVER.md` or nested instruction files were present in the complete repository tree.
- Windows Electron launcher supports Start Menu apps, Steam/Epic/Xbox discovery, visibility settings, autostart, tray controls, and an AutoHotkey Windows-key helper.
- No open PRs at review time. `main` is unprotected, repository rulesets are empty, and existing development uses direct commits to `main`; publish this documentation-only checkpoint there.
- Latest published release: `v0.1.5` (2026-10-23), with `JumpStart-Setup.exe`. Latest build run 39913561437 succeeded. Package source version remains `0.1.0`; CI supplies `0.1.<run_number>` during packaging.
- Only start/dist npm scripts exist; no automated test suite or PR validation workflow is present. Release workflow ignores Markdown-only changes.
- Source finding: `refreshStoreApps()` rejects any result with fewer Xbox games than the cached list and retries after eight seconds. This can retain uninstalled games indefinitely; Windows runtime reproduction remains unverified.
- Source finding: README local installer build instructions omit compiling `launcher/helper/JumpStartKeys.exe`, although packaging requires it and CI builds it explicitly.
- Shell clone failed because the configured proxy was unreachable; review and publication use the GitHub connector. No Windows runtime or installer tests were run.

## Next step

Await user direction. Proposed next implementation: reproduce the stale Xbox/Store cache behavior after uninstalling a game on Windows, then design a bounded retry/reconciliation fix that still protects against incomplete first-run discovery, with focused regression coverage. Also consider documenting the local helper compilation prerequisite.

## Blocked by

No blocker to the documentation checkpoint. Further implementation awaits user direction. Windows runtime behavior and installer validation require a Windows environment; current findings are from source inspection and GitHub build/release records.

## Updated

2026-11-02
