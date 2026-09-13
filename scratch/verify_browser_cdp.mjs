import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('Starting headless Chrome on port 9222...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1280,800',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank',
  ]);

  await sleep(1500);

  try {
    const res = await fetch('http://127.0.0.1:9222/json/new?http://127.0.0.1:3000/search', {
      method: 'PUT',
    });
    const target = await res.json();
    console.log('Target created:', target.webSocketDebuggerUrl);

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('BROWSER CONSOLE:', ...msg.params.args.map(a => a.value || a.description));
      }
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise((resolve) => (ws.onopen = resolve));
    console.log('WebSocket connected to CDP');

    await send('Page.enable');
    await send('Runtime.enable');
    
    // Wait for hydration: wait until window is fully interactive and compiled
    console.log('Waiting for React hydration...');
    for (let i = 0; i < 20; i++) {
      const evalRes = await send('Runtime.evaluate', {
        expression: `(() => {
          return {
            readyState: document.readyState,
            hasBtn: !!document.getElementById('btn-collapse-sidebar'),
            // Next.js sets __next_f or similar when active
            hasReact: !!(window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || window.next),
          };
        })()`,
        returnByValue: true,
      });
      console.log('Hydration check', i, evalRes?.result?.result?.value);
      await sleep(1000);
    }

    // 1. Screenshot expanded
    let shot = await send('Page.captureScreenshot', { credentials: true });
    writeFileSync('scratch/cdp_sidebar_expanded.png', Buffer.from(shot.result.data, 'base64'));
    console.log('Saved scratch/cdp_sidebar_expanded.png');

    // 2. Click collapse button using real CDP mouse events
    const rectRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btn-collapse-sidebar');
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2, r };
      })()`,
      returnByValue: true,
    });
    console.log('Button coordinates:', rectRes.result.result.value);
    const coords = rectRes.result.result.value;

    if (coords) {
      await send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        button: 'left',
        clickCount: 1,
        x: coords.x,
        y: coords.y,
      });
      await send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        button: 'left',
        clickCount: 1,
        x: coords.x,
        y: coords.y,
      });
      console.log('Dispatched mouse click at', coords.x, coords.y);
    }

    await sleep(1000); // Wait for animation

    // 3. Screenshot collapsed
    shot = await send('Page.captureScreenshot', { credentials: true });
    writeFileSync('scratch/cdp_sidebar_collapsed.png', Buffer.from(shot.result.data, 'base64'));
    console.log('Saved scratch/cdp_sidebar_collapsed.png');

    // Check width
    const widthCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const aside = document.querySelector('aside[aria-label="Main Navigation"]');
        const expandBtn = document.getElementById('btn-expand-sidebar');
        return {
          asideWidth: aside ? aside.offsetWidth : null,
          hasExpandBtn: !!expandBtn,
          localStorageVal: localStorage.getItem('musicflow-sidebar-collapsed')
        };
      })()`,
      returnByValue: true,
    });
    console.log('Collapsed state measurement:', widthCheck.result.result.value);

    // 4. Click expand button
    const expandResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btn-expand-sidebar');
        if (btn) {
          btn.click();
          return { found: true };
        }
        return { found: false };
      })()`,
      returnByValue: true,
    });
    console.log('Expand click result:', expandResult.result.value);

    await sleep(700);

    const reexpandedCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const aside = document.querySelector('aside[aria-label="Main Navigation"]');
        return { asideWidth: aside ? aside.offsetWidth : null };
      })()`,
      returnByValue: true,
    });
    console.log('Re-expanded aside width:', reexpandedCheck.result.value);

    // 5. Test Bottom Player: trigger playback by setting sample track in player store
    await send('Runtime.evaluate', {
      expression: `(() => {
        // Find player store on window if available or click first song card
        const songCard = document.querySelector('.group.relative.cursor-pointer');
        if (songCard) songCard.click();
      })()`,
    });
    await sleep(2000);

    // If songCard click didn't trigger, let's play via store or click play button
    await send('Runtime.evaluate', {
      expression: `(() => {
        const playBtn = document.querySelector('button[aria-label="Play"]');
        if (playBtn) playBtn.click();
      })()`,
    });
    await sleep(1000);

    shot = await send('Page.captureScreenshot', { credentials: true });
    writeFileSync('scratch/cdp_bottom_player_desktop.png', Buffer.from(shot.result.data, 'base64'));
    console.log('Saved scratch/cdp_bottom_player_desktop.png');

    // 6. Mobile Viewport test
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(800);

    shot = await send('Page.captureScreenshot', { credentials: true });
    writeFileSync('scratch/cdp_mobile_view.png', Buffer.from(shot.result.data, 'base64'));
    console.log('Saved scratch/cdp_mobile_view.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch((e) => {
  console.error('CDP verification error:', e);
  process.exit(1);
});
