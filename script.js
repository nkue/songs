(function () {
  const list = document.getElementById('item-list');
  const btn = document.getElementById('pick-button');
  const resetBtn = document.getElementById('reset-button');
  const pickedSpan = document.getElementById('picked');
  const STORAGE_KEY = 'songs_app_state_v1';

  // initial items fallback (keeps original order)
  const initialItems = Array.from(list.querySelectorAll('li')).map(li => li.textContent);

  function updateButtonState() {
    btn.disabled = list.children.length === 0;
  }

  // small utility to check storage availability
  function storageAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  function _doSave() {
    const items = Array.from(list.querySelectorAll('li')).map(li => li.textContent);
    const state = { items, picked: pickedSpan.textContent || null };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save state', e);
    }
  }

  // debounce wrapper to avoid frequent writes
  function debounce(fn, wait) {
    let t = null;
    return function (...args) {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        t = null;
        fn.apply(this, args);
      }, wait);
    };
  }

  const saveState = storageAvailable() ? debounce(_doSave, 200) : function () { /* no-op */ };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const state = JSON.parse(raw);
      if (!state || !Array.isArray(state.items)) return false;
      // clear current list
      list.innerHTML = '';
      state.items.forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        list.appendChild(li);
      });
      pickedSpan.textContent = state.picked || '';
      return true;
    } catch (e) {
      console.warn('Could not load state', e);
      return false;
    }
  }

  function pickAndRemove() {
    const items = Array.from(list.querySelectorAll('li'));
    if (items.length === 0) return;
    const idx = Math.floor(Math.random() * items.length);
    const chosen = items[idx];
    pickedSpan.textContent = chosen.textContent;
    // remove the chosen item from the DOM
    chosen.remove();
    updateButtonState();
    saveState();
  }

  btn.addEventListener('click', pickAndRemove);

  function resetList() {
    // restore from initialItems
    if (!confirm('Reset the list to its original items? This will clear saved state.')) return;
    list.innerHTML = '';
    initialItems.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      list.appendChild(li);
    });
    pickedSpan.textContent = '';
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    updateButtonState();
  }

  resetBtn.addEventListener('click', resetList);

  // cross-tab synchronization
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    // reload the state from storage when other tab changes it
    loadState();
    updateButtonState();
  });

  // flush pending save on unload
  window.addEventListener('beforeunload', () => {
    // call the underlying immediate save if debounced
    if (typeof _doSave === 'function') {
      try { _doSave(); } catch (_) {}
    }
  });

  // initialize: load state if available, otherwise persist the initial state
  if (storageAvailable()) {
    if (!loadState()) _doSave();
  }
  updateButtonState();
})();
