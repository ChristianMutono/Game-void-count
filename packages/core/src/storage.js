// Pluggable storage interface so @void-count/core stays platform-agnostic.
// Web installs `localStorage`; mobile installs an AsyncStorage-backed adapter.

const _memory = new Map();

let _storage = {
  getItem: (k) => (_memory.has(k) ? _memory.get(k) : null),
  setItem: (k, v) => { _memory.set(k, String(v)); },
  removeItem: (k) => { _memory.delete(k); },
};

export function setStorage(impl) {
  if (impl && typeof impl.getItem === 'function' && typeof impl.setItem === 'function') {
    _storage = {
      getItem: impl.getItem.bind(impl),
      setItem: impl.setItem.bind(impl),
      removeItem: (impl.removeItem || (() => {})).bind(impl),
    };
  }
}

export function getItem(key) {
  return _storage.getItem(key);
}
export function setItem(key, value) {
  _storage.setItem(key, value);
}
export function removeItem(key) {
  _storage.removeItem(key);
}
