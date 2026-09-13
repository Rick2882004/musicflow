import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const tmpProfile = mkdtempSync(join(tmpdir(), 'chrome-test-'));
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--user-data-dir=' + tmpProfile,
    '--window-size=1280,800',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank',
  ]);

  await sleep(1500);

  try {
    const targetRes = await fetch('http://127.0.0.1:9225/json/new?http://127.0.0.1:3000/search', { method: 'PUT' });
    const target = await targetRes.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);

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
    await send('Page.enable');
    await send('Runtime.enable');

    console.log('Page loaded, waiting 3s for React hydration...');
    await sleep(3000);

    const initial = await send('Runtime.evaluate', {
      expression: `(() => {
        const aside = document.querySelector('aside[aria-label="Main Navigation"]');
        const btn = document.getElementById('btn-collapse-sidebar');
        const r = btn ? btn.getBoundingClientRect() : null;
        return {
          asideWidth: aside ? aside.offsetWidth : null,
          btnRect: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null,
          topEl: r ? document.elementFromPoint(r.x + r.width/2, r.y + r.height/2).tagName : null,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Initial state:', JSON.stringify(initial.result?.result?.value));

    // Capture screenshot expanded
    let shot = await send('Page.captureScreenshot', { credentials: true });
    writeFileSync('scratch/test_exp.png', Buffer.from(shot.result.data, 'base64'));

    // Click collapse button
    console.log('Clicking collapse button via dispatchEvent and CDP mouse...');
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button: 'left',
      clickCount: 1,
      x: 208.5,
      y: 31.5,
    });
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button: 'left',
      clickCount: 1,
      x: 208.5,
      y: 31.5,
    });

    const clickRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btn-collapse-sidebar');
        if (btn) {
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          return true;
        }
        return false;
      })()`,
      returnByValue: true,
    });
    console.log('Dispatched click:', clickRes.result?.result?.value);

    await sleep(800);

    const afterClick = await send('Runtime.evaluate', {
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
    console.log('After collapse:', JSON.stringify(afterClick.result?.result?.value));

    shot = await send('Page.captureScreenshot', { credentials: true });
    writeFileSync('scratch/test_col.png', Buffer.from(shot.result.data, 'base64'));

    // Click expand button
    console.log('Clicking expand button...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const expandBtn = document.getElementById('btn-expand-sidebar');
        if (expandBtn) expandBtn.click();
      })()`,
    });

    await sleep(800);

    const afterExpand = await send('Runtime.evaluate', {
      expression: `(() => {
        const aside = document.querySelector('aside[aria-label="Main Navigation"]');
        return {
          asideWidth: aside ? aside.offsetWidth : null,
          localStorageVal: localStorage.getItem('musicflow-sidebar-collapsed')
        };
      })()`,
      returnByValue: true,
    });
    console.log('After expand back:', JSON.stringify(afterExpand.result?.result?.value));

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
