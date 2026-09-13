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
      const el = document.elementFromPoint(208.7, 31.6);
      const btn = document.getElementById('btn-collapse-sidebar');
      return {
        elementFromPoint: el ? (el.tagName + ' ' + el.id + ' ' + el.className) : null,
        btnTag: btn ? btn.tagName : null,
        btnText: btn ? btn.innerText : null,
        btnHtml: btn ? btn.innerHTML : null,
        btnComputedStylePointerEvents: btn ? getComputedStyle(btn).pointerEvents : null,
        elComputedStylePointerEvents: el ? getComputedStyle(el).pointerEvents : null,
      };
    })()`,
    returnByValue: true,
  });
  console.log('Result:', res.result?.result?.value);
  ws.close();
})();
