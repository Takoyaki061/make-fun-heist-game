// Take the THAW screenshots: serves game/ on :8080, opens each ?shot= scene
// in headless Chromium, waits for window.__shotReady, saves a JPEG into the
// entry's screenshots/ dir. Reports page errors, if any.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const shots = JSON.parse(readFileSync('/home/hatch/workspace/makefun/best-heist-game-20261122-0559-entry/shots.json', 'utf8'));
const outDir = '/home/hatch/workspace/makefun/best-heist-game-20261122-0559-entry/screenshots';

const server = spawn('node', ['serve.ts'], {
  cwd: '/home/hatch/workspace/makefun/best-heist-game-20261122-0559-entry',
  stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((r) => setTimeout(r, 1200));

const browser = await chromium.launch({
  executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome`,
  args: ['--no-sandbox'],
});
try {
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(`http://127.0.0.1:8080/${shot.query}`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__shotReady === true, { timeout: 120000 });
    await page.screenshot({ path: `${outDir}/${shot.name}`, type: 'jpeg', quality: 82 });
    console.log(shot.name, 'saved', errors.length ? `ERRORS: ${errors.join(' | ')}` : 'no page errors');
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log('done');
