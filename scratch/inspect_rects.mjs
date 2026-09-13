(async () => {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/65B00D2EF07416EF9D285989B986E8E9');
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
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const aside = document.querySelector('aside[aria-label="Main Navigation"]');
      const header = document.querySelector('header');
      const btn = document.getElementById('btn-collapse-sidebar');
      return {
        asideRect: aside ? aside.getBoundingClientRect() : null,
        headerRect: header ? header.getBoundingClientRect() : null,
        btnRect: btn ? btn.getBoundingClientRect() : null,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      };
    })()`,
    returnByValue: true,
  });
  console.log('Rects:', res.result?.result?.value);
  ws.close();
})();
