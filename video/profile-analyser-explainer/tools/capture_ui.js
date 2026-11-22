// Usage: node tools/capture_ui.js public/real   (needs Playwright; never submits the form)
// Captures real UI from the public Profile Analyser page at 3x. Never submits the form.
const { chromium } = require('playwright');
const OUT = process.argv[2];
const URL_TEXT = 'linkedin.com/in/your-name';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 3 });
  await p.goto('https://socialsprint.co/profile-analyzer', { waitUntil: 'networkidle', timeout: 45000 });
  const reject = p.getByRole('button', { name: 'Reject all' });
  if (await reject.count()) await reject.first().click();
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/hero.png`, clip: { x: 0, y: 0, width: 1280, height: 560 } });
  const input = p.locator('input[type=text]').first();
  const form = input.locator('xpath=ancestor::form[1]');
  const box = await form.boundingBox();
  console.log('form', JSON.stringify(box));
  const clip = { x: box.x - 16, y: box.y - 16, width: box.width + 32, height: box.height + 32 };
  await p.screenshot({ path: `${OUT}/form-00.png`, clip });
  await input.click();
  await p.mouse.move(0, 0);
  for (let i = 1; i <= URL_TEXT.length; i++) {
    await input.fill(URL_TEXT.slice(0, i));
    await p.screenshot({ path: `${OUT}/form-${String(i).padStart(2, '0')}.png`, clip });
  }
  const btn = form.locator('button').first();
  const bb = await btn.boundingBox();
  console.log('button', JSON.stringify({ x: bb.x - clip.x, y: bb.y - clip.y, w: bb.width, h: bb.height, clipW: clip.width, clipH: clip.height }));
  await btn.hover(); await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/form-hover.png`, clip });
  await b.close();
})();
