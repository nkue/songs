(function () {
  const list = document.getElementById("item-list");
  const wheel = document.querySelector(".wheel");
  const wrapper = document.querySelector(".wrapper");
  const btn = document.getElementById("pick-button");
  const resetBtn = document.getElementById("reset-button");
  const addItemBtn = document.getElementById("add-item-button");
  const newItemInput = document.getElementById("new-item-input");
  const STORAGE_KEY = "songs_app_state_v1";

  let currentRotation = 0;
  let isSpinning = false;
  let frontIndex = 0;
  let pendingRemoval = null;

  const initialItems = [
    "One Name / Word Artist",
    "80s Banger",
    "Love Song",
    "Break-Up Anthem",
    "A Capella Cover",
    "TV Theme Song",
    "Song from a Movie",
    "Title said in the Song",
    "Road Trip Banger",
    "Eurovision Hit",
    "Iconic Cover",
    "Best Music Video",
    "Stadium Anthem",
    "Nonsense Lyrics",
    "Comedy Song",
    "Filthy Lyrics",
    "90s Banger",
    "Wedding Floor Filler",
    "Song to get pumped to",
    "First Dance Song",
    "One Song forever",
    "Irish Banger",
    "Go-to Karaoke",
    "Undiscovered / Underrated",
    "Major Artist - Lesser-known Song",
    "Song from an Advert",
    "Instrumental hit",
    "Ultimate Country Song",
    "Name in the Song Title",
    "Girl Group Anthem",
    "Boy Band Anthem",
    "Colour in the Song Title",
    "Animal in the Song Title",
  ];

  function getLines() {
    return Array.from(list.querySelectorAll(".line"));
  }

  function createLine(text) {
    const div = document.createElement("div");
    div.className = "line";
    div.textContent = text;
    return div;
  }

  function populateList(items) {
    list.innerHTML = "";

    items.forEach((text) => {
      list.appendChild(createLine(text));
    });

    layoutWheel();
    saveState();
  }

  function saveState() {
    const items = getLines().map((item) => item.textContent);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  }

  function layoutWheel() {
    const lines = getLines();

    if (!lines.length) {
      wheel.style.transform = "rotateX(0deg)";
      return;
    }

    const itemCount = lines.length;
    const minHeight = 60;
    const maxHeight = 180;
    const growthFactor = Math.max(0, (30 - itemCount) / 25);
    const itemHeight = minHeight + growthFactor * (maxHeight - minHeight);

    document.documentElement.style.setProperty(
      "--item-height",
      `${itemHeight}px`,
    );

    const angle = 360 / itemCount;
    const idealRadius = itemHeight / 2 / Math.tan(Math.PI / itemCount);
    const radius = Math.max(220, Math.min(idealRadius, 420));

    lines.forEach((line, index) => {
      line.style.transform = `rotateX(${-index * angle}deg) translateZ(${radius}px) translateX(-50%)`;
    });

    wheel.style.transition = "none";
    currentRotation = frontIndex * angle;
    wheel.style.transform = `translate3D(0, 0, 0) rotateX(${currentRotation}deg)`;
  }

  function removePendingItem() {
    if (!pendingRemoval) {
      return;
    }

    const lines = getLines();
    const index = lines.indexOf(pendingRemoval);
    const remainingLines = getLines();

    pendingRemoval.remove();
    pendingRemoval = null;

    if (remainingLines.length === 0) {
      frontIndex = 0;
      saveState();
      return;
    }

    if (index >= remainingLines.length) {
      frontIndex = remainingLines.length - 1;
    } else {
      frontIndex = index;
    }

    layoutWheel();
    saveState();
  }

  function spinWheel() {
    if (isSpinning) {
      return;
    }

    removePendingItem();

    const lines = getLines();

    if (!lines.length) {
      alert("No categories remaining.");
      return;
    }

    isSpinning = true;

    lines.forEach((line) => line.classList.remove("highlighted"));

    const itemCount = lines.length;
    const angle = 360 / itemCount;
    const chosenIndex = Math.floor(Math.random() * itemCount);
    const delta = (chosenIndex - frontIndex + itemCount) % itemCount;
    const extraSpins = 2;

    currentRotation += extraSpins * 360 + delta * angle;
    frontIndex = chosenIndex;

    wrapper.classList.add("spinning");
    wheel.style.transition = "transform 4s cubic-bezier(.17,.67,.15,1)";
    wheel.style.transform = `translate3D(0, 0, 0) rotateX(${currentRotation}deg)`;
    wheel.addEventListener(
      "transitionend",
      () => {
        const selected = lines[chosenIndex];

        selected.classList.add("highlighted");
        pendingRemoval = selected;
        wrapper.classList.remove("spinning");
        isSpinning = false;
        wheel.style.transition = "none";
        wheel.style.transform = `translate3D(0, 0, 0) rotateX(${currentRotation - 720}deg)`;
      },
      { once: true },
    );
  }

  function addItem() {
    const text = newItemInput.value.trim();

    if (!text) {
      return;
    }

    list.appendChild(createLine(text));

    newItemInput.value = "";

    layoutWheel();
    saveState();
  }

  function resetList() {
    if (isSpinning) {
      return;
    }
    list.innerHTML = "";

    pendingRemoval = null;
    frontIndex = 0;
    currentRotation = 0;

    wheel.style.transition = "none";
    wheel.style.transform = "rotateX(0deg)";
    populateList(initialItems);
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return false;
    }

    try {
      const state = JSON.parse(raw);

      if (!Array.isArray(state.items)) {
        return false;
      }

      list.innerHTML = "";

      state.items.forEach((text) => {
        list.appendChild(createLine(text));
      });

      frontIndex = 0;
      currentRotation = 0;
      pendingRemoval = null;

      layoutWheel();

      return true;
    } catch {
      return false;
    }
  }

  btn.addEventListener("click", spinWheel);

  resetBtn.addEventListener("click", resetList);

  addItemBtn.addEventListener("click", addItem);

  newItemInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      addItem();
    }
  });

  if (!loadState()) {
    populateList(initialItems);
  }
})();
