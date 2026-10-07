// "Run JumpStart when I sign in": exactly one value in the per-user Run key (the same one the installer writes).
const { execFile } = require('child_process');

const KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const NAME = 'JumpStart';

function reg(args) {
  return new Promise(resolve => {
    execFile('reg', args, { windowsHide: true }, (err, stdout) => resolve({ ok: !err, out: stdout || '' }));
  });
}

async function isOn() {
  const r = await reg(['query', KEY, '/v', NAME]);
  return r.ok;
}

async function set(on, exePath) {
  if (on) await reg(['add', KEY, '/v', NAME, '/t', 'REG_SZ', '/d', `"${exePath}" --autostart`, '/f']);
  else await reg(['delete', KEY, '/v', NAME, '/f']);
}

module.exports = { isOn, set };
