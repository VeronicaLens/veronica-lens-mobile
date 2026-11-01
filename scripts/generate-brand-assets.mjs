import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const Jimp = require('jimp-compact');

const BACKGROUND = '#080B14';

// markSize is the rendered SVG size; the artwork fills about 90% of it.
const targets = [
  {
    out: 'assets/icon.png',
    size: 1024,
    svg: 'logo-mark.svg',
    markSize: 860,
    background: BACKGROUND,
  },
  { out: 'assets/android-icon-foreground.png', size: 1024, svg: 'logo-mark.svg', markSize: 730 },
  {
    out: 'assets/android-icon-monochrome.png',
    size: 1024,
    svg: 'logo-mark-mono.svg',
    markSize: 730,
    color: '#FFFFFF',
  },
  { out: 'assets/splash-icon.png', size: 1024, svg: 'logo-mark.svg', markSize: 730 },
  { out: 'assets/favicon.png', size: 512, svg: 'logo-mark.svg', markSize: 500, resizeTo: 96 },
];

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const chrome = chromeCandidates.find((candidate) => candidate && existsSync(candidate));
if (!chrome) throw new Error('Chrome or Edge not found. Set CHROME_PATH.');

const workDir = mkdtempSync(join(tmpdir(), 'veronica-brand-'));

try {
  for (const target of targets) {
    const svg = readFileSync(resolve('assets/brand', target.svg), 'utf8').replace(
      'width="1200" height="1200"',
      `width="${target.markSize}" height="${target.markSize}"`,
    );
    const html = `<!doctype html><html><body style="margin:0;width:${target.size}px;height:${target.size}px;display:grid;place-items:center;background:${target.background ?? 'transparent'};color:${target.color ?? 'inherit'}">${svg}</body></html>`;
    const htmlPath = join(workDir, 'page.html');
    const outPath = resolve(target.out);
    writeFileSync(htmlPath, html);

    const result = spawnSync(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--default-background-color=00000000',
        `--window-size=${target.size},${target.size}`,
        `--screenshot=${outPath}`,
        pathToFileURL(htmlPath).href,
      ],
      { stdio: 'ignore' },
    );
    if (result.status !== 0 || !existsSync(outPath))
      throw new Error(`Failed to render ${target.out}`);

    if (target.resizeTo) {
      const image = await Jimp.read(outPath);
      await image.resize(target.resizeTo, target.resizeTo).writeAsync(outPath);
    }
    console.log(`Generated ${target.out}`);
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
