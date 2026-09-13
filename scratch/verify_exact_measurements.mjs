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

  const testSizes = [
    { name: 'Normal Desktop', w: 1440, h: 900 },
    { name: 'Laptop Height', w: 1366, h: 768 },
    { name: 'Short Viewport', w: 1024, h: 540 },
  ];

  for (const s of testSizes) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: s.w,
      height: s.h,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 400));

    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const aside = document.querySelector('aside[aria-label="Main Navigation"]');
        const profile = document.querySelector('a[aria-label="Profile"]');
        const settings = document.querySelector('a[aria-label="Settings"]');
        const player = document.querySelector('.hidden.md\\\\:grid.fixed.bottom-0');
        const nav = document.querySelector('nav[aria-label="Sidebar Navigation"]');

        const getBox = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), left: Math.round(r.left), right: Math.round(r.right) };
        };

        return {
          window: { w: window.innerWidth, h: window.innerHeight },
          aside: getBox(aside),
          profile: getBox(profile),
          settings: getBox(settings),
          player: getBox(player),
          navScrollable: nav ? nav.scrollHeight > nav.clientHeight : false,
          navClientHeight: nav ? nav.clientHeight : 0,
          navScrollHeight: nav ? nav.scrollHeight : 0,
        };
      })()`,
      returnByValue: true,
    });

    console.log(`\n=== Viewport: ${s.name} (${s.w}x${s.h}) ===`);
    const val = res.result?.result?.value;
    console.log('Profile:', val.profile);
    console.log('Settings:', val.settings);
    console.log('Player:', val.player);
    console.log('Nav scrollable?:', val.navScrollable, `(client: ${val.navClientHeight}px, scroll: ${val.navScrollHeight}px)`);

    // Verify invariant: Settings bottom <= Player top
    if (val.settings && val.player) {
      const gap = val.player.top - val.settings.bottom;
      console.log(`Verification: Player top (${val.player.top}) - Settings bottom (${val.settings.bottom}) = ${gap}px clearance!`);
      if (gap >= 0) {
        console.log('SUCCESS: Zero overlap, Settings and Profile are 100% visible above Player!');
      } else {
        console.error('FAILURE: Negative clearance, overlap detected!');
      }
    }
  }

  // Also test collapsed mode
  console.log('\n=== Collapsed Sidebar Test ===');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 200));

  // Collapse
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-collapse-sidebar');
      if (btn) btn.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 400));

  const collapsedRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const aside = document.querySelector('aside[aria-label="Main Navigation"]');
      const profile = document.querySelector('a[aria-label="Profile"]');
      const settings = document.querySelector('a[aria-label="Settings"]');
      const player = document.querySelector('.hidden.md\\\\:grid.fixed.bottom-0');
      const getBox = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
      };
      return {
        aside: getBox(aside),
        profile: getBox(profile),
        settings: getBox(settings),
        player: getBox(player),
      };
    })()`,
    returnByValue: true,
  });
  const cVal = collapsedRes.result?.result?.value;
  console.log('Collapsed Aside width:', cVal.aside?.width);
  console.log('Collapsed Profile:', cVal.profile);
  console.log('Collapsed Settings:', cVal.settings);
  const cGap = cVal.player?.top - cVal.settings?.bottom;
  console.log(`Collapsed Clearance: Player top (${cVal.player?.top}) - Settings bottom (${cVal.settings?.bottom}) = ${cGap}px clearance!`);

  // Expand back
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-expand-sidebar');
      if (btn) btn.click();
    })()`,
  });

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
})();
