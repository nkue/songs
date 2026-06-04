(function () {
  const list = document.getElementById('item-list');
  const btn = document.getElementById('pick-button');
  const resetBtn = document.getElementById('reset-button');
  const pickedSpan = document.getElementById('picked');
  const STORAGE_KEY = 'songs_app_state_v1';
  const SPIN_DURATION = 3000;
  const CENTER_TIME = 0.75;
  const DELAY_STEP = 0.075;
  let isSpinning = false;
  let spinTimeout = null;
  let previousChosen = null;

  const initialItems = [
    'One Name / Word Artist',
    '80s Banger',
    'Love Song',
    'Break-Up Anthem',
    'A Capella Cover',
    'TV Theme Song',
    'Song from a Movie',
    'Title said in the Song',
    '2000s Dance Hit',
    'Spooky Tune',
    '"Good" / "Bad" in the Song',
    'Song about a City',
    'Teenage Angst Song',
    '00s HipHop / RnB Track',
    'One Hit Wonder',
    'Number in Song / Band',
    'Disney (or similar) Song',
    'Dad / Mum Song',
    'Went Solo',
    'Musical Number',
    'Foreign Language',
    'Made-up Band',
    'Problematic Banger',
    'Road Trip Banger',
    'Eurovision Hit',
    'Iconic Cover',
    'Best Music Video',
    'Stadium Anthem',
    'Nonsense Lyrics',
    'Comedy Song',
    'Filthy Lyrics',
    '90s Banger',
    'Wedding Floor Filler',
    'Song to get pumped to',
    'First Dance Song',
    'One Song forever',
    'Irish Banger',
    'Go-to Karaoke',
    'Undiscovered / Underrated',
    'Major Artist - Lesser-known Song',
    'Song from an Advert',
    'Instrumental hit',
    'Ultimate Country Song',
    'Name in the Song Title',
    'Girl Group Anthem',
    'Boy Band Anthem',
    'Colour in the Song Title',
    'Animal in the Song Title'
  ];

  function createLine(text) {
    const li = document.createElement('div');
    li.className = 'line';
    const p = document.createElement('p');
    p.textContent = text;
    li.appendChild(p);
    return li;
  }

  function updateButtonState() {
    btn.disabled = isSpinning || list.querySelectorAll('.line').length === 0;
  }

  function setWheelDelays(centerIndex = 0) {
    const lines = Array.from(list.querySelectorAll('.line'));
    lines.forEach((line, idx) => {
      const delay = -(CENTER_TIME + (idx - centerIndex) * DELAY_STEP);
      const delayValue = `${delay}s`;
      line.style.animationDelay = delayValue;
      const p = line.querySelector('p');
      if (p) p.style.animationDelay = delayValue;
      line.classList.remove('highlighted');
    });
  }

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
    const items = Array.from(list.querySelectorAll('.line p')).map(p => p.textContent);
    const state = { items, picked: pickedSpan.textContent || null };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save state', e);
    }
  }

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
      list.innerHTML = '';
      state.items.forEach(text => list.appendChild(createLine(text)));
      pickedSpan.textContent = state.picked || '';
      setWheelDelays(0);
      previousChosen = null;
      return true;
    } catch (e) {
      console.warn('Could not load state', e);
      return false;
    }
  }

  function removePreviousChosen() {
    if (previousChosen && previousChosen.parentNode) {
      previousChosen.remove();
    }
    previousChosen = null;
  }

  function pickAndRemove() {
    if (isSpinning) return;
    if (previousChosen) {
      removePreviousChosen();
    }

    const lines = Array.from(list.querySelectorAll('.line'));
    if (lines.length === 0) return;

    const chosenIndex = Math.floor(Math.random() * lines.length);
    const chosen = lines[chosenIndex];

    if (!chosen) return;

    setWheelDelays(chosenIndex);

    isSpinning = true;
    list.classList.add('spinning');
    updateButtonState();

    if (spinTimeout) clearTimeout(spinTimeout);
    spinTimeout = setTimeout(() => {
      list.classList.remove('spinning');
      chosen.classList.add('highlighted');
      previousChosen = chosen;
      pickedSpan.textContent = chosen.textContent;
      isSpinning = false;
      updateButtonState();
      saveState();
    }, SPIN_DURATION);
  }

  btn.addEventListener('click', pickAndRemove);

  function resetList() {
    if (!confirm('Reset the list to its original items? This will clear saved state.')) return;
    if (spinTimeout) clearTimeout(spinTimeout);
    list.innerHTML = '';
    initialItems.forEach(text => list.appendChild(createLine(text)));
    pickedSpan.textContent = '';
    setWheelDelays(0);
    previousChosen = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    isSpinning = false;
    list.classList.remove('spinning');
    updateButtonState();
  }

  resetBtn.addEventListener('click', resetList);

  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    loadState();
    updateButtonState();
  });

  window.addEventListener('beforeunload', () => {
    if (typeof _doSave === 'function') {
      try { _doSave(); } catch (_) {}
    }
  });

  if (storageAvailable()) {
    if (!loadState()) {
      initialItems.forEach(text => list.appendChild(createLine(text)));
      setWheelDelays(0);
      _doSave();
    }
  } else {
    initialItems.forEach(text => list.appendChild(createLine(text)));
    setWheelDelays(0);
  }

  updateButtonState();
})();
