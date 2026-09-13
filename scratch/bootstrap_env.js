const memStore = {};
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: (k) => memStore[k] || null,
  setItem: (k, v) => { memStore[k] = String(v); },
  removeItem: (k) => { delete memStore[k]; },
  clear: () => { Object.keys(memStore).forEach(k => delete memStore[k]); },
};
