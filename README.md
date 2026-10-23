# JumpStart

A fullscreen Start launcher for Windows 11. Tap the Windows key, type a few letters, press Enter.

## Features

- **Instant Launcher**: Tap the <kbd>Windows</kbd> key to open/close or press <kbd>Esc</kbd>. Native Windows key combinations (<kbd>Win</kbd>+<kbd>E</kbd>, <kbd>Win</kbd>+<kbd>D</kbd>, <kbd>Win</kbd>+<kbd>L</kbd>, etc.) continue to work normally.
- **Fast Keyboard Navigation**: Type to filter apps instantly. Use arrow keys to navigate the grid and press <kbd>Enter</kbd> to launch.
- **Game Library Integration**: Automatically detects and indexes installed games from **Steam**, **Epic Games**, and **Xbox / PC Game Pass**.
- **System Tools Toggle**: Press <kbd>Tab</kbd> (or click the gear icon) to show or hide administrative and Windows system tools.
- **Customizable App Visibility**: Right-click any app in the grid to hide it or keep it always visible.
- **Settings & Autostart**: Click the menu icon (<kbd>☰</kbd>) to configure game library sources or toggle starting JumpStart on Windows sign-in.
- **System Tray Controls**: Right-click the tray icon to pause Windows-key takeover or quit JumpStart.

## Install

1. Download `JumpStart-Setup.exe` from the newest entry under **[Releases](https://github.com/swamp2k/jumpstart/releases)** on this page.
2. Double-click it. It installs for your user only (no admin prompt). Windows may say "unknown publisher" because the installer is not code-signed: choose **More info**, then **Run anyway**.
3. JumpStart starts automatically, and starts again every time you log in (can be toggled in settings).
4. Tap the **Windows key** to open it, tap it again (or press **Esc**) to close it.

## Usage & Shortcuts

| Action | Shortcut / Control |
| --- | --- |
| **Open / Close JumpStart** | Tap <kbd>Win</kbd> (or <kbd>Esc</kbd> to close) |
| **Search apps** | Type immediately |
| **Navigate grid** | <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> |
| **Launch selected app** | <kbd>Enter</kbd> or click |
| **Toggle system / hidden tools** | <kbd>Tab</kbd> or click the ⚙ icon |
| **Hide / Show app context menu** | Right-click any app |
| **Open Settings panel** | Click <kbd>☰</kbd> next to search bar |
| **Pause takeover or Quit** | Right-click the JumpStart tray icon |

## Settings & Customization

Click the **`☰`** icon next to the search bar to toggle:
- **Steam games** integration
- **Epic games** integration
- **Xbox / Game Pass games** integration
- **Show hidden apps by default**
- **Run JumpStart when I sign in**

Right-click any app to toggle its visibility (**Hide this app** or **Always show this app**).

## Uninstall

Open **Settings > Apps > Installed apps**, find **JumpStart**, and choose **Uninstall**. This removes the program, the start-at-login entry, the key helper, and your JumpStart settings.

## Development

### Prerequisites
- Node.js (v20+)
- Windows 10/11
- [AutoHotkey v2](https://www.autohotkey.com/v2/) (only required if modifying and recompiling the key helper)

### Running Locally
```powershell
cd launcher
npm install
npm start
```

### Building the Installer
```powershell
cd launcher
npm run dist
```
The output installer will be created in `dist/JumpStart-Setup.exe`.

## Repository Structure

- `launcher/` - Electron app (grid, search, app scanning, settings) and NSIS installer configuration.
- `winkey-helper/winkey.ahk` - AutoHotkey v2 script that hooks solitary Windows-key taps. Compiled into `JumpStartKeys.exe` during build.
- `.github/workflows/release.yml` - GitHub Actions workflow that builds the installer and publishes releases on push to `main`.
