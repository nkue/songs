(function () {
  const list = document.getElementById("item-list");
  const wheel = document.querySelector(".wheel");
  const wrapper = document.querySelector(".wrapper");
  const button = document.getElementById("pick-button");
  const resetButton = document.getElementById("reset-button");
  const STORAGE_KEY = "songs_app_state_v1";
  const editButton = document.getElementById("edit-button");
  const dialog = document.getElementById("editor-dialog");
  const editorList = document.getElementById("editor-list");
  const saveButton = document.getElementById("editor-save");
  const cancelButton = document.getElementById("editor-cancel");
  const editorNewItem = document.getElementById("editor-new-item");
  const editorAddButton = document.getElementById("editor-add-button");
  const headline = document.getElementById("headline");
  const editorHeadline = document.getElementById("editor-headline");

  let currentRotation = 0;
  let isSpinning = false;
  let frontIndex = 0;
  let pendingRemoval = false;

  const initialHeadline = constructHeadline("Songs");

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

  function constructHeadline(headline) {
    const headlineElement = document.createElement("span");
    const splitHeadline = headline.split("");
    splitHeadline.forEach((character, index) => {
      const characterElement = document.createElement("span");
      characterElement.textContent = character;
      const longHeadline = splitHeadline.length > 6;
      if (index === splitHeadline.length - 1) {
        characterElement.classList.add("tilt-left");
        characterElement.classList.add("blinking");
        if (longHeadline) {
          characterElement.classList.add("dim");
        }
      }
      if (index === 3 && longHeadline) {
        characterElement.classList.add("dead");
      }
      headlineElement.appendChild(characterElement);
    });
    return headlineElement;
  }

  function createEditorRow(text = "") {
    const row = document.createElement("div");
    row.className = "editor-row";

    const input = document.createElement("input");
    input.classList.add("editableItem");
    input.value = text;

    const remove = document.createElement("button");
    remove.classList.add("editor-button");
    remove.classList.add("editor-remove-button");
    remove.textContent = "×";

    remove.addEventListener("click", () => {
      row.remove();
    });

    row.append(input, remove);

    return row;
  }

  function populateList(newItems) {
    items = [...newItems];

    renderList();
    saveState();
  }

  function saveState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        headline: headline.textContent,
        items,
      }),
    );
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

  function resetWheelState() {
    pendingRemoval = false;
    frontIndex = 0;
    currentRotation = 0;

    wheel.style.transition = "none";
    wheel.style.transform = "rotateX(0deg)";
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
        wheel.style.transform = `translate3D(0, 0, 0) rotateX(${currentRotation - extraSpins * 360}deg)`;
      },
      { once: true },
    );
  }

  function resetList() {
    if (isSpinning) {
      return;
    }

    const userConfirmed = confirm(
      "Do you want to reset the whole list? This can not be undone.",
    );

    if (!userConfirmed) {
      event.preventDefault();
      console.log("reset cancelled by user");
      return;
    }

    items = [];

    resetWheelState();
    headline.replaceChildren(initialHeadline);
    populateList(initialItems);
    saveState();
  }

  function openEditor() {
    if (isSpinning) {
      return;
    }

    editorHeadline.innerHTML = "";

    const editorHeadlineInput = document.createElement("input");
    editorHeadlineInput.classList.add("editableHeadline");
    editorHeadlineInput.value = headline.textContent;
    editorHeadline.append(editorHeadlineInput);

    editorList.innerHTML = "";

    items.forEach((text) => {
      editorList.append(createEditorRow(text));
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
      if (!Array.isArray(state.items) || typeof state.headline !== "string") {
        return false;
      }

      items = [...state.items];

      if (typeof state.headline === "string") {
        headline.replaceChildren(constructHeadline(state.headline));
      }

      resetWheelState();

      renderList();

      return true;
    } catch {
      return false;
    }
  }

  const root = document.body;
  const radios = document.querySelectorAll('input[name="theme"]');

  function setTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem("theme", theme);

    radios.forEach((r) => {
      r.checked = r.value === theme;
    });
  }

  // init
  const saved = localStorage.getItem("theme") || "carnival";
  setTheme(saved);

  // listen for changes
  radios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      setTheme(e.target.value);
    });
  });

  editorAddButton.addEventListener("click", () => {
    const text = editorNewItem.value.trim();

    if (!text) {
      return;
    }

    editorList.append(createEditorRow(text));

    editorNewItem.value = "";
    editorNewItem.focus();
  });

  editorNewItem.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      editorAddButton.click();
    }
  });

  dialog.addEventListener("close", () => {
    editorHeadline.innerHTML = "";
  });

  saveButton.addEventListener("click", () => {
    const itemValues = [...editorList.querySelectorAll(".editableItem")]
      .map((i) => i.value.trim())
      .filter(Boolean);

    const newHeadline = editorHeadline
      .querySelector(".editableHeadline")
      .value.trim();

    if (newHeadline) {
      headline.replaceChildren(constructHeadline(newHeadline));
    } else {
      headline.replaceChildren(initialHeadline);
    }

    items = [...itemValues];

    resetWheelState();

    renderList();
    saveState();

    dialog.close();
  });

  cancelButton.addEventListener("click", () => {
    dialog.close();
  });

  editButton.addEventListener("click", openEditor);

  button.addEventListener("click", spinWheel);

  wheel.addEventListener("touchmove", spinWheel);

  resetButton.addEventListener("click", resetList);

  if (!loadState()) {
    headline.replaceChildren(initialHeadline);
    populateList(initialItems);
  }
})();
