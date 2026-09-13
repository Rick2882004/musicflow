const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // Set sample track in localStorage so now-playing has data
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1500);

  // Click first play button
  const playBtn = await page.locator('button').filter({ hasText: /play/i }).first();
  if (await playBtn.count() > 0) {
    try { await playBtn.click(); } catch(e) {}
  }
  await page.waitForTimeout(1000);

  // Navigate to now-playing
  await page.goto('http://localhost:3000/now-playing');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'scratch/desktop_1920.png' });
  console.log('Saved scratch/desktop_1920.png');

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/desktop_1280.png' });
  console.log('Saved scratch/desktop_1280.png');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/mobile_390.png' });
  console.log('Saved scratch/mobile_390.png');

  await browser.close();
})();
