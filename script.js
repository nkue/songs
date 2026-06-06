(function () {
  const list = document.getElementById("item-list");
  const wheel = document.querySelector(".wheel");
  const wrapper = document.querySelector(".wrapper");
  const btn = document.getElementById("pick-button");
  const resetBtn = document.getElementById("reset-button");
  const newItemInput = document.getElementById("new-item-input");
  const STORAGE_KEY = "songs_app_state_v1";
  const editButton = document.getElementById("edit-button");
  const dialog = document.getElementById("editor-dialog");
  const editorList = document.getElementById("editor-list");
  const saveButton = document.getElementById("editor-save");
  const cancelButton = document.getElementById("editor-cancel");
  const editorNewItem = document.getElementById("editor-new-item");
  const editorAddButton = document.getElementById("editor-add-button");

  let currentRotation = 0;
  let isSpinning = false;
  let frontIndex = 0;
  let pendingRemoval = false;

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

  let items = [];

  function renderList() {
    list.innerHTML = "";

    items.forEach((text) => {
      list.appendChild(createLine(text));
    });

    layoutWheel();
  }

  function createLine(text) {
    const div = document.createElement("div");
    div.className = "line";
    div.textContent = text;
    return div;
  }

  function populateList(newItems) {
    items = [...newItems];

    renderList();
    saveState();
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  }

  function layoutWheel() {
    const itemCount = items.length;

    if (itemCount === 0) {
      wheel.style.transform = "rotateX(0deg)";
      return;
    }

    const lines = list.children;
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

    Array.from(lines).forEach((line, index) => {
      line.style.transform = `rotateX(${-index * angle}deg)
     translateZ(${radius}px)
     translateX(-50%)`;
    });

    wheel.style.transition = "none";
    currentRotation = frontIndex * angle;
    wheel.style.transform = `translate3D(0, 0, 0) rotateX(${currentRotation}deg)`;
  }

  function removePendingItem() {
    if (!pendingRemoval) {
      return;
    }

    items.splice(frontIndex, 1);

    pendingRemoval = false;

    if (items.length === 0) {
      frontIndex = 0;
    } else if (frontIndex >= items.length) {
      frontIndex = items.length - 1;
    }

    renderList();
    saveState();
  }

  function spinWheel() {
    if (isSpinning) {
      return;
    }

    removePendingItem();

    const itemCount = items.length;

    if (itemCount === 0) {
      alert("No categories remaining.");
      return;
    }

    isSpinning = true;

    Array.from(list.children).forEach((line) => {
      line.classList.remove("highlighted");
    });

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
        const selected = list.children[chosenIndex];

        selected.classList.add("highlighted");
        pendingRemoval = true;
        wrapper.classList.remove("spinning");
        isSpinning = false;
        wheel.style.transition = "none";
        wheel.style.transform = `translate3D(0, 0, 0) rotateX(${currentRotation - 720}deg)`;
      },
      { once: true },
    );
  }

  function resetList() {
    if (isSpinning) {
      return;
    }
    items = [];

    pendingRemoval = null;
    frontIndex = 0;
    currentRotation = 0;

    wheel.style.transition = "none";
    wheel.style.transform = "rotateX(0deg)";
    populateList(initialItems);
  }

  function openEditor() {
    if (isSpinning) {
      return;
    }

    editorList.innerHTML = "";

    items.forEach((text) => {
      const row = document.createElement("div");
      row.className = "editor-row";

      const input = document.createElement("input");
      input.value = text;

      const remove = document.createElement("button");
      remove.textContent = "x";

      remove.addEventListener("click", () => {
        row.remove();
      });

      row.append(input, remove);

      editorList.append(row);
    });

    dialog.showModal();
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

      items = [...state.items];

      frontIndex = 0;
      currentRotation = 0;
      pendingRemoval = null;

      renderList();

      return true;
    } catch {
      return false;
    }
  }

  editorAddButton.addEventListener("click", () => {
    const text = editorNewItem.value.trim();

    if (!text) {
      return;
    }

    const row = document.createElement("div");
    row.className = "editor-row";

    const input = document.createElement("input");
    input.value = text;

    const remove = document.createElement("button");
    remove.textContent = "×";

    remove.addEventListener("click", () => {
      row.remove();
    });

    row.append(input, remove);

    editorList.append(row);

    editorNewItem.value = "";
  });

  saveButton.addEventListener("click", () => {
    const values = [...editorList.querySelectorAll("input")]
      .map((i) => i.value.trim())
      .filter(Boolean);

    items = [...values];

    pendingRemoval = null;
    frontIndex = 0;
    currentRotation = 0;
    wheel.style.transition = "none";
    wheel.style.transform = "rotateX(0deg)";

    renderList();
    saveState();

    dialog.close();
  });

  cancelButton.addEventListener("click", () => {
    dialog.close();
  });

  editButton.addEventListener("click", openEditor);

  btn.addEventListener("click", spinWheel);

  resetBtn.addEventListener("click", resetList);

  if (!loadState()) {
    populateList(initialItems);
  }
})();
