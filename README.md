# JumpStart

A fullscreen Start launcher for Windows 11. Tap the Windows key, type a few letters, press Enter.

## Install

1. Download `JumpStart-Setup.exe` from the newest entry under **Releases** on this page.
2. Double-click it. It installs for your user only (no admin prompt). Windows may say "unknown publisher" because the installer is not code-signed: choose **More info**, then **Run anyway**.
3. JumpStart starts, and starts again by itself every time you log in.
4. Tap the **Windows key** to open it, tap it again (or press **Esc**) to close it. Windows key shortcuts such as Win+E, Win+D and Win+L keep working.

## Uninstall

Open **Settings > Apps > Installed apps**, find **JumpStart**, and choose **Uninstall**. This removes the program, the start-at-login entry, the key helper and your JumpStart settings.

## Quit or pause

Right-click the JumpStart tray icon (near the clock; it may be under the ^ arrow):

- **Pause Windows-key takeover**: the Windows key opens the normal Start menu again until you untick it.
- **Quit**: stops JumpStart and the key helper.

## What is in this repository

- `launcher/` - the Electron app (grid, search, settings) and the installer settings.
- `winkey-helper/winkey.ahk` - AutoHotkey v2 script that turns a Windows-key tap into "open JumpStart". It is compiled into `JumpStartKeys.exe` during the build.
- `.github/workflows/release.yml` - every push to `main` builds the installer and publishes a new release.
