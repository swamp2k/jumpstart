const { app, BrowserWindow, ipcMain, shell, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

const toggleRequested = process.argv.includes('--toggle');
const autostart = process.argv.includes('--autostart');
const gotLock = app.requestSingleInstanceLock({ toggle: toggleRequested });
if (!gotLock) app.exit(0);   // a copy is already running: just pass it the request and leave

// Installed: user data lives in AppData\JumpStart, helper files in the install's resources folder.
// Dev (npm start): everything stays in this folder as before.
const resDir = app.isPackaged ? process.resourcesPath : __dirname;
const dataDir = app.isPackaged ? app.getPath('userData') : __dirname;
if (app.isPackaged) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    for (const f of ['system.txt', 'ignore.txt']) {   // sensible defaults on first run
      if (!fs.existsSync(path.join(dataDir, f))) fs.copyFileSync(path.join(resDir, f), path.join(dataDir, f));
    }
  } catch {}
}

// ---- Windows-key helper (AutoHotkey, compiled): started and stopped by this app ----
const { spawn } = require('child_process');
let helper = null, keysPaused = false;
function helperExe() { return app.isPackaged ? path.join(resDir, 'JumpStartKeys.exe') : ''; }
function startHelper() {
  const exe = helperExe();
  if (!exe || helper || keysPaused || process.env.BALDER_NO_KEYS || !fs.existsSync(exe)) return;
  helper = spawn(exe, [process.execPath, String(process.pid)], { windowsHide: true, stdio: 'ignore' });
  helper.on('exit', () => { helper = null; });
}
function stopHelper() { if (helper) { try { helper.kill(); } catch {} helper = null; } }
let quitting = false;
function quitAll() { quitting = true; stopHelper(); app.quit(); }

let win = null;
let apps = [];
const iconCache = new Map();

const folders = [
  path.join(process.env.ProgramData || '', 'Microsoft/Windows/Start Menu/Programs'),
  path.join(process.env.APPDATA || '', 'Microsoft/Windows/Start Menu/Programs'),
];

function loadIgnore() {
  try {
    return fs.readFileSync(path.join(dataDir, 'ignore.txt'), 'utf8')
      .split(/\r?\n/).map(s => s.trim().toLowerCase()).filter(s => s && !s.startsWith('#'));
  } catch { return []; }
}


// ---- settings (settings.json): which sources to show ----
const settingsFile = path.join(dataDir, 'settings.json');
const defaultSettings = { steam: true, epic: true, xbox: true, systemTools: false };
function loadSettings() {
  try { return { ...defaultSettings, ...JSON.parse(fs.readFileSync(settingsFile, 'utf8')) }; } catch { return { ...defaultSettings }; }
}
function steamPath() {
  try {
    const out = require('child_process').execFileSync('reg', ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'], { encoding: 'utf8', windowsHide: true });
    const m = out.match(/SteamPath\s+REG_SZ\s+(.+)/);
    return m ? path.normalize(m[1].trim()) : '';
  } catch { return ''; }
}
const notGames = /steamworks common|steam linux runtime|proton|steamvr|redistributable/i;
function steamGames() {
  const root = steamPath();
  if (!root) return [];
  const libs = new Set([root]);
  try {
    const txt = fs.readFileSync(path.join(root, 'steamapps', 'libraryfolders.vdf'), 'utf8');
    for (const m of txt.matchAll(/"path"\s+"([^"]+)"/g)) libs.add(path.normalize(m[1].split('\\\\').join('\\')));
  } catch {}
  const out = [];
  for (const lib of libs) {
    let files = [];
    try { files = fs.readdirSync(path.join(lib, 'steamapps')).filter(f => /^appmanifest_\d+\.acf$/.test(f)); } catch {}
    for (const f of files) {
      try {
        const t = fs.readFileSync(path.join(lib, 'steamapps', f), 'utf8');
        const id = (t.match(/"appid"\s+"(\d+)"/) || [])[1];
        const name = (t.match(/"name"\s+"([^"]*)"/) || [])[1];
        if (!id || !name || notGames.test(name)) continue;
        const dir = path.join(root, 'appcache', 'librarycache', id);
        let img = '';
        try {
          const j = fs.readdirSync(dir).filter(x => /^[0-9a-f]{20,}\.jpg$/.test(x));
          img = j.length ? path.join(dir, j[0]) : ['library_600x900.jpg', 'library_header.jpg'].map(x => path.join(dir, x)).find(fs.existsSync) || '';
        } catch {}
        out.push({ name, id: 'steam:' + id, uri: 'steam://rungameid/' + id, kind: 'steam', img });
      } catch {}
    }
  }
  return out;
}
function epicGames() {
  const dir = process.env.EPIC_MANIFESTS || path.join(process.env.ProgramData || '', 'Epic/EpicGamesLauncher/Data/Manifests');
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => f.endsWith('.item')); } catch { return []; }
  const out = [];
  for (const f of files) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (!j.DisplayName || !j.AppName || j.bIsIncompleteInstall) continue;
      const exe = j.InstallLocation && j.LaunchExecutable ? path.join(j.InstallLocation, j.LaunchExecutable) : '';
      out.push({ name: j.DisplayName, id: 'epic:' + j.AppName, uri: `com.epicgames.launcher://apps/${j.CatalogNamespace}%3A${j.CatalogItemId}%3A${j.AppName}?action=launch&silent=true`, kind: 'epic', exe });
    } catch {}
  }
  return out;
}
function storeLogo(img) {
  if (!img) return '';
  const dir = path.dirname(img), stem = path.basename(img).split('.')[0];
  let files = [img];
  try { files = files.concat(fs.readdirSync(dir).filter(f => f.startsWith(stem) && /\.png$/i.test(f)).map(f => path.join(dir, f))); } catch {}
  for (const f of files) {
    try { const n = nativeImage.createFromPath(f); if (!n.isEmpty()) return n.resize({ width: 64, height: 64 }).toDataURL(); } catch {}
  }
  return '';
}
async function gameItems(settings) {
  let list = [];
  if (settings.steam) list = list.concat(steamGames());
  if (settings.epic) list = list.concat(epicGames());
  for (const g of list) {
    g.system = false;
    if (!iconCache.has(g.id)) {
      let url = '';
      try {
        if (g.img) url = nativeImage.createFromPath(g.img).resize({ width: 64, height: 64 }).toDataURL();
        else if (g.exe && fs.existsSync(g.exe)) url = (await app.getFileIcon(g.exe, { size: 'large' })).toDataURL();
      } catch {}
      iconCache.set(g.id, url);
    }
    g.icon = iconCache.get(g.id);
  }
  return list;
}


// ---- Microsoft Store apps (Notepad, Snipping Tool, Calculator ...) ----
const storeCacheFile = path.join(dataDir, 'store-cache.json');
let storeCache = [];
try { storeCache = JSON.parse(fs.readFileSync(storeCacheFile, 'utf8')); } catch {}
let storeRefreshing = false;
function refreshStoreApps() {
  if (storeRefreshing) return;
  storeRefreshing = true;
  require('child_process').execFile('powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(resDir, 'list-store-apps.ps1')],
    { windowsHide: true, maxBuffer: 20e6 }, (err, stdout) => {
      storeRefreshing = false;
      try {
        let list = JSON.parse(stdout);
        if (!Array.isArray(list)) list = [list];
        if (JSON.stringify(list) !== JSON.stringify(storeCache)) {
          storeCache = list;
          fs.writeFileSync(storeCacheFile, JSON.stringify(list));
          scan();
        }
      } catch {}
    });
}
function storeItems(taken, rules, settings) {
  const out = [];
  for (const s of storeCache) {
    const key = (s.name || '').toLowerCase();
    if (!key || taken.has(key)) continue;
    if (s.game) {   // Xbox / Game Pass (GDK) game
      if (!settings.xbox) continue;
      out.push({ name: s.name, id: 'store:' + s.appId, appId: s.appId, kind: 'xbox', img: s.logo, system: false });
      taken.add(key);
      continue;
    }
    // Microsoft's own packages count as system tools unless in the always-show list
    const ms = /^(Microsoft\.|windows\.|MicrosoftWindows\.|MicrosoftCorporationII\.Windows)/i.test(s.family || '');
    out.push({ name: s.name, id: 'store:' + s.appId, appId: s.appId, kind: 'store', img: s.logo, system: ms && !rules.show.includes(key) });
    taken.add(key);
  }
  return out;
}

// ---- icons: shortcut's own icon first, skip Windows' generic blank icons ----
let genericIcons = null;
async function loadGenericIcons() {
  if (genericIcons) return genericIcons;
  genericIcons = new Set();
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'launcher-ref-'));
  for (const ext of ['exe', 'lnk', 'dll', 'bat', 'zzz']) {
    const f = path.join(dir, 'ref.' + ext);
    try { fs.writeFileSync(f, ''); genericIcons.add((await app.getFileIcon(f, { size: 'large' })).toDataURL()); } catch {}
  }
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  return genericIcons;
}
async function pickIcon(candidates) {
  const generic = await loadGenericIcons();
  for (const c of candidates) {
    if (!c || !fs.existsSync(c)) continue;
    try {
      if (/\.ico$/i.test(c)) {
        const n = nativeImage.createFromPath(c);
        const u = n.isEmpty() ? '' : n.resize({ width: 64, height: 64 }).toDataURL();
        if (u.length > 600) return u;
        continue;
      }
      const img = await app.getFileIcon(c, { size: 'large' });
      const url = img.toDataURL();
      if (!img.isEmpty() && !generic.has(url)) return url;
    } catch {}
  }
  return '';
}
// Last resort for exe/dll icons Electron reports as generic: let Windows/.NET extract them (one PowerShell call).
function extractIcons(paths) {
  return new Promise(resolve => {
    if (!paths.length) return resolve({});
    const list = path.join(require('os').tmpdir(), 'launcher-icon-list.json');
    try { fs.writeFileSync(list, JSON.stringify(paths)); } catch { return resolve({}); }
    require('child_process').execFile('powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(resDir, 'extract-icons.ps1'), list],
      { windowsHide: true, maxBuffer: 50e6 }, (_err, stdout) => {
        try { resolve(JSON.parse(stdout) || {}); } catch { resolve({}); }
      });
  });
}
function expandEnv(s) { return (s || '').replace(/%([^%]+)%/g, (_m, v) => process.env[v] || process.env[v.toUpperCase()] || ''); }

function findLinks(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) findLinks(p, out);
    else if (e.name.toLowerCase().endsWith('.lnk')) out.push(p);
  }
}

// system.txt: "folder: X" = Start Menu folder names; "name: X" = app names (substring). Editable.
function loadSystemRules() {
  const r = { folders: [], names: [], show: [] };
  try {
    for (const line of fs.readFileSync(path.join(dataDir, 'system.txt'), 'utf8').split(/\r?\n/)) {
      const m = line.trim().match(/^(folder|name|show)\s*:\s*(.+)$/i);
      if (m) r[{ folder: 'folders', name: 'names', show: 'show' }[m[1].toLowerCase()]].push(m[2].trim().toLowerCase());
    }
  } catch {}
  return r;
}

const overridesFile = path.join(dataDir, 'user-overrides.json');
function loadOverrides() { try { return JSON.parse(fs.readFileSync(overridesFile, 'utf8')); } catch { return {}; } }

function isSystem(lnk, name, rules, target) {
  if (rules.show.includes(name.toLowerCase())) return false;
  for (const root of folders) {
    const rel = path.relative(root, lnk);
    if (!rel.startsWith('..')) {
      const dirs = rel.split(path.sep).slice(0, -1).map(s => s.toLowerCase());
      if (dirs.some(d => rules.folders.includes(d))) return true;
    }
  }
  const n = name.toLowerCase();
  if (rules.names.includes(n)) return true;
  const t = (target || '').toLowerCase();
  if (t.startsWith((process.env.SystemRoot || 'c:\\windows').toLowerCase() + '\\')) return true;
  if (t.endsWith('.msc') || t.endsWith('.cpl')) return true;
  return false;
}
async function scan() {
  const ignore = loadIgnore();
  const links = [];
  folders.forEach(f => findLinks(f, links));
  const rules = loadSystemRules();
  const overrides = loadOverrides();
  const byName = new Map();
  for (const lnk of links) {
    const name = path.basename(lnk, '.lnk');
    const key = name.toLowerCase();
    if (byName.has(key) || ignore.some(i => key.includes(i))) continue;
    byName.set(key, { name, lnk });
  }
  const list = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  await Promise.all(list.map(async a => {
    let real = '', iconLoc = '';
    try { const sc = shell.readShortcutLink(a.lnk); real = sc.target || ''; iconLoc = expandEnv(sc.icon); } catch {}
    const ov = overrides[a.name.toLowerCase()];
    a.system = ov === 'show' ? false : ov === 'hide' ? true : isSystem(a.lnk, a.name, rules, real);
    a.id = a.lnk;
    if (!iconCache.get(a.lnk)) iconCache.set(a.lnk, await pickIcon([iconLoc && /\.ico$/i.test(iconLoc) ? iconLoc : '', real, iconLoc]));
    a.icon = iconCache.get(a.lnk);
    if (!a.icon) a.iconPath = [real, iconLoc].find(p => p && !/\.ico$/i.test(p) && fs.existsSync(p)) || '';
  }));
  const settings = loadSettings();
  const games = await gameItems(settings);
  const taken = new Set(list.concat(games).map(a => a.name.toLowerCase()));
  const storeApps = storeItems(taken, rules, settings);
  for (const a of storeApps) {
    if (!iconCache.has(a.id)) {
      let url = '';
      url = storeLogo(a.img);
      iconCache.set(a.id, url);
    }
    a.icon = iconCache.get(a.id);
  }
  const extra = games.concat(storeApps);
  for (const a of extra) { const ov = overrides[a.name.toLowerCase()]; if (ov) a.system = ov === 'hide'; }
  apps = list.concat(extra).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  try { fs.writeFileSync(path.join(dataDir, 'last-scan.txt'), JSON.stringify({ total: apps.length, steam: apps.filter(a => a.kind === 'steam').length, epic: apps.filter(a => a.kind === 'epic').length, system: apps.filter(a => a.system).length, steamNoIcon: apps.filter(a => a.kind === 'steam' && !a.icon).length, store: apps.filter(a => a.kind === 'store').length, storeNoIcon: apps.filter(a => a.kind === 'store' && !a.icon).length, xbox: apps.filter(a => a.kind === 'xbox').length, storeSystem: apps.filter(a => a.kind === 'store' && a.system).length })); } catch {}
  if (win && !win.isDestroyed()) win.webContents.send('apps', apps);
  const missing = apps.filter(a => !a.icon && a.iconPath);
  if (missing.length) {
    const got = await extractIcons([...new Set(missing.map(a => a.iconPath))]);
    let changed = false;
    for (const a of missing) {
      const b64 = got[a.iconPath];
      if (b64) { a.icon = 'data:image/png;base64,' + b64; iconCache.set(a.id, a.icon); changed = true; }
    }
    if (changed && win && !win.isDestroyed()) win.webContents.send('apps', apps);
  }
}

function createWindow() {
  win = new BrowserWindow({
    show: false, frame: false, fullscreen: true, alwaysOnTop: true, skipTaskbar: true,
    backgroundColor: '#14161a',
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.loadFile('index.html');
  win.on('close', e => { if (!quitting) { e.preventDefault(); hideLauncher(); } });
}

function showLauncher() {
  win.webContents.send('reset');
  win.show();
  win.focus();
  win.webContents.focus();
  scan();
  refreshStoreApps();
}
function hideLauncher() { if (win && win.isVisible()) win.hide(); }
function toggle() {
  try { fs.writeFileSync(path.join(dataDir, 'last-toggle.txt'), String(Date.now())); } catch {} win.isVisible() ? hideLauncher() : showLauncher(); }

app.on('second-instance', (_e, _argv, _cwd, data) => {
  if (data && data.toggle) toggle(); else showLauncher();
});

ipcMain.on('launch', (_e, id) => {
  hideLauncher();
  const a = apps.find(x => x.id === id);
  if (!a) return;
  if (a.uri) shell.openExternal(a.uri);
  else if (a.appId) require('child_process').spawn('explorer.exe', ['shell:AppsFolder\\' + a.appId], { detached: true, stdio: 'ignore' }).unref();
  else shell.openPath(a.lnk);
});
ipcMain.handle('get-settings', () => ({ ...loadSettings(), installed: { steam: !!steamPath(), epic: fs.existsSync(path.join(process.env.ProgramData || '', 'Epic/EpicGamesLauncher/Data/Manifests')), xbox: storeCache.some(s => s.game) } }));
ipcMain.on('set-settings', (_e, s) => {
  try { fs.writeFileSync(settingsFile, JSON.stringify({ ...loadSettings(), ...s }, null, 2)); } catch {}
  scan();
});
ipcMain.on('hide', hideLauncher);
ipcMain.on('set-override', (_e, name, mode) => {
  const o = loadOverrides();
  o[String(name).toLowerCase()] = mode;
  try { fs.writeFileSync(overridesFile, JSON.stringify(o, null, 2)); } catch {}
  scan();
});
ipcMain.handle('get-apps', () => apps);

let tray = null;
function createTray() {
  const { Tray, Menu } = require('electron');
  tray = new Tray(path.join(resDir, 'tray.png'));
  tray.setToolTip('');
  const build = () => Menu.buildFromTemplate([
    { label: 'Show launcher', click: () => showLauncher() },
    { label: 'Pause Windows-key takeover', type: 'checkbox', checked: keysPaused, click: item => {
      keysPaused = item.checked;
      if (keysPaused) stopHelper(); else startHelper();
    } },
    { type: 'separator' },
    { label: 'Quit', click: quitAll },
  ]);
  tray.setContextMenu(build());
  tray.on('click', () => toggle());
}

app.whenReady().then(async () => {
  if (!gotLock) return;
  createWindow();
  createTray();
  startHelper();
  await scan();
  refreshStoreApps();
  if (!autostart) showLauncher();
});
app.on('before-quit', () => { quitting = true; stopHelper(); });
app.on('window-all-closed', () => {});





