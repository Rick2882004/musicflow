import http from 'http';

(async () => {
  const list = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = list.find((p) => p.type === 'page');
  if (!page) {
    console.error('No page found');
    process.exit(1);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(msg);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await new Promise((r) => (ws.onopen = r));

  // Set device metrics for mobile 375x667
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    mobile: true,
  });

  // Wait a bit
  await new Promise((r) => setTimeout(r, 500));

  const check = await send('Runtime.evaluate', {
    expression: `(() => {
      const aside = document.querySelector('aside[aria-label="Main Navigation"]');
      const mobileNav = document.querySelector('nav[aria-label="Mobile Bottom Navigation"]');
      const mobilePlayer = document.querySelector('.md\\\\:hidden.fixed.bottom-\\\\[60px\\\\]');
      return {
        asideDisplay: aside ? window.getComputedStyle(aside).display : null,
        mobileNavRect: mobileNav ? mobileNav.getBoundingClientRect() : null,
        mobilePlayerRect: mobilePlayer ? mobilePlayer.getBoundingClientRect() : null,
      };
    })()`,
    returnByValue: true,
  });
  console.log('Mobile Check:', JSON.stringify(check.result?.result?.value, null, 2));

  // Screenshot
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  import('fs').then(fs => {
    fs.writeFileSync('scratch/verify_mobile_view.png', Buffer.from(ss.result.data, 'base64'));
    console.log('Saved scratch/verify_mobile_view.png');
  });

  // Reset metrics to normal desktop
  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
})();
