const gameItemsEi = [
  { id: "bij", label: "bij", rhymes: true, image: "assets/minigames/ei/items/bij.png", audio: "assets/audio/words/bij.mp3" },
  { id: "klei", label: "klei", rhymes: true, image: "assets/minigames/ei/items/klei.png", audio: "assets/audio/words/klei.mp3" },
  { id: "mij", label: "mij", rhymes: true, image: "assets/minigames/ei/items/mij.png", audio: "assets/audio/words/mij.mp3" },
  { id: "trui", label: "trui", rhymes: false, image: "assets/minigames/ei/items/trui.png", audio: "assets/audio/words/trui.mp3" },
  { id: "boom", label: "boom", rhymes: false, image: "assets/minigames/ei/items/boom.png", audio: "assets/audio/words/boom.mp3" },
  { id: "vis", label: "vis", rhymes: false, image: "assets/minigames/ei/items/vis.png", audio: "assets/audio/words/vis.mp3" },
  { id: "muis", label: "muis", rhymes: false, image: "assets/minigames/ei/items/muis.png", audio: "assets/audio/words/muis.mp3" },
];

const gameAudio = {
  success: "assets/audio/game/goed.mp3",
  wrong: "assets/audio/game/fout.mp3",
  win: "assets/audio/game/winnen.mp3",
};

const pairSets = [
  ["schaap", "aap"],
  ["wol", "bol"],
  ["wei", "bij"],
  ["geit", "bijt"],
  ["peer", "veer"],
  ["boek", "koek"],
];

const state = {
  currentPage: "home",
  eiItems: [],
  pairItems: [],
  matchedPairs: [],
  memoryItems: [],
  memorySelection: [],
  memoryLocked: false,
  draggingId: null,
  audioReady: false,
  audioContext: null,
  celebrationTimeout: null,
  confettiTimeout: null,
  activeAudio: null,
  memoryTimer: null,
};

const elements = {
  pages: [...document.querySelectorAll(".page")],
  homeLink: document.querySelector("#home-link"),
  backHomeButtons: [...document.querySelectorAll('[data-action="back-home"]')],
  openButtons: [...document.querySelectorAll("[data-open-game]")],
  correctList: document.querySelector("#correct-list"),
  scatterArea: document.querySelector("#scatter-area"),
  dropZone: document.querySelector("#drop-zone"),
  playArea: document.querySelector(".play-area"),
  resetEiButton: document.querySelector('[data-action="reset-ei"]'),
  resetKleurButton: document.querySelector('[data-action="reset-kleur"]'),
  resetVormButton: document.querySelector('[data-action="reset-vorm"]'),
  celebrationLayer: document.querySelector("#celebration-layer"),
  confettiLayer: document.querySelector("#confetti-layer"),
  pairGrid: document.querySelector("#pair-grid"),
  pairResultList: document.querySelector("#pair-result-list"),
  memoryGrid: document.querySelector("#memory-grid"),
  fullscreenButton: document.querySelector("#fullscreen-button"),
  fullscreenEnterIcon: document.querySelector(".fullscreen-icon--enter"),
  fullscreenExitIcon: document.querySelector(".fullscreen-icon--exit"),
};

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
}

function setupAudioUnlock() {
  const unlock = () => {
    if (state.audioReady) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    state.audioContext = new AudioContextClass();
    if (state.audioContext.state === "suspended") {
      state.audioContext.resume().catch(() => {});
    }
    state.audioReady = true;
    window.removeEventListener("pointerdown", unlock);
  };

  window.addEventListener("pointerdown", unlock, { once: true });
}

function playTone({ frequency = 440, duration = 0.12, type = "sine", gain = 0.04, ramp = 0.01 }) {
  if (!state.audioReady || !state.audioContext) return;
  const ctx = state.audioContext;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const volume = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(gain, now + ramp);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(volume);
  volume.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

function playUiHoverSound() {
  playTone({ frequency: 720, duration: 0.08, type: "triangle", gain: 0.025 });
}

function playUiClickSound() {
  playTone({ frequency: 520, duration: 0.12, type: "square", gain: 0.04 });
}

function playGoodSound() {
  playTone({ frequency: 660, duration: 0.11, type: "triangle", gain: 0.05 });
  setTimeout(() => playTone({ frequency: 880, duration: 0.16, type: "triangle", gain: 0.04 }), 70);
}

function playBadSound() {
  playTone({ frequency: 220, duration: 0.12, type: "sawtooth", gain: 0.035 });
  setTimeout(() => playTone({ frequency: 180, duration: 0.18, type: "sawtooth", gain: 0.03 }), 60);
}

function stopActiveAudio() {
  if (!state.activeAudio) return;
  state.activeAudio.pause();
  state.activeAudio.currentTime = 0;
  state.activeAudio = null;
}

function playAudioClip(src, fallback) {
  stopActiveAudio();

  const audio = new Audio(src);
  state.activeAudio = audio;
  audio.addEventListener("ended", () => {
    if (state.activeAudio === audio) {
      state.activeAudio = null;
    }
  });
  audio.addEventListener("error", () => {
    if (state.activeAudio === audio) {
      state.activeAudio = null;
    }
    fallback();
  }, { once: true });
  audio.play().catch(() => {
    if (state.activeAudio === audio) {
      state.activeAudio = null;
    }
    fallback();
  });
}

function playWordAudio(item) {
  playAudioClip(item.audio, () => {
    playTone({ frequency: 420, duration: 0.12, type: "triangle", gain: 0.035 });
    setTimeout(() => playTone({ frequency: 360, duration: 0.14, type: "triangle", gain: 0.028 }), 90);
  });
}

function playSuccessCue() {
  playAudioClip(gameAudio.success, playGoodSound);
}

function playWrongCue() {
  playAudioClip(gameAudio.wrong, playBadSound);
}

function playWinCue() {
  playAudioClip(gameAudio.win, () => {
    playTone({ frequency: 660, duration: 0.16, type: "triangle", gain: 0.05 });
    setTimeout(() => playTone({ frequency: 880, duration: 0.2, type: "triangle", gain: 0.045 }), 100);
    setTimeout(() => playTone({ frequency: 990, duration: 0.24, type: "triangle", gain: 0.04 }), 220);
  });
}

function attachUiSounds() {
  const interactive = [...document.querySelectorAll("button")];
  interactive.forEach((element) => {
    element.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") {
        playUiHoverSound();
      }
    });
    element.addEventListener("click", playUiClickSound);
  });
}

function showPage(pageId) {
  if (pageId !== "ei") {
    clearCelebrations();
  }
  if (pageId !== "vorm") {
    clearTimeout(state.memoryTimer);
    state.memoryTimer = null;
    state.memoryLocked = false;
    state.memorySelection = [];
  }
  state.currentPage = pageId;
  elements.pages.forEach((page) => {
    page.classList.toggle("page-active", page.id === `page-${pageId}`);
  });
}

function openGame(gameId) {
  showPage(gameId);
  if (gameId === "ei") {
    resetEiGame();
  }
  if (gameId === "kleur") {
    resetPairGame();
  }
  if (gameId === "vorm") {
    resetMemoryGame();
  }
}

function createImageMarkup(item, className = "") {
  const wrapper = document.createElement("div");
  wrapper.className = className;

  const image = document.createElement("img");
  image.src = item.image;
  image.alt = item.label;
  image.loading = "eager";
  image.addEventListener("error", () => {
    image.hidden = true;
    fallback.hidden = false;
  });

  const fallback = document.createElement("div");
  fallback.className = "result-thumb";
  fallback.textContent = item.label;
  fallback.hidden = true;

  wrapper.append(image, fallback);
  return wrapper;
}

function createPolaroidCard(item) {
  const card = document.createElement("div");
  card.className = "polaroid-card";

  const media = createImageMarkup(item, "polaroid-card__media");
  const label = document.createElement("span");
  label.className = "polaroid-card__label";
  label.textContent = item.label;

  card.append(media, label);
  return card;
}

function buildPairItems() {
  const selectedPairs = shuffle([...pairSets]).slice(0, 3);
  return shuffle(
    selectedPairs.flatMap(([first, second], pairIndex) => [
      {
        id: `${first}-${pairIndex}`,
        label: first,
        image: `assets/minigames/kleur/items/${first}.png`,
        audio: `assets/audio/words/${first}.mp3`,
        pairKey: `${pairIndex}`,
      },
      {
        id: `${second}-${pairIndex}`,
        label: second,
        image: `assets/minigames/kleur/items/${second}.png`,
        audio: `assets/audio/words/${second}.mp3`,
        pairKey: `${pairIndex}`,
      },
    ])
  );
}

function shuffle(items) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

function resetEiGame() {
  clearCelebrations();
  stopActiveAudio();
  state.eiItems = shuffle(gameItemsEi).map((item, index) => ({
    ...item,
    state: "field",
    x: 0,
    y: 0,
    originX: 0,
    originY: 0,
    index,
  }));

  elements.correctList.innerHTML = "";
  elements.scatterArea.innerHTML = "";

  layoutScatterItems();
  renderScatterItems();
}

function resetPairGame() {
  clearCelebrations();
  stopActiveAudio();
  state.pairItems = buildPairItems();
  state.matchedPairs = [];
  renderPairGrid();
  renderPairResults();
}

function resetMemoryGame() {
  clearCelebrations();
  stopActiveAudio();
  clearTimeout(state.memoryTimer);
  state.memoryTimer = null;
  state.memoryLocked = false;
  state.memorySelection = [];
  state.memoryItems = buildMemoryItems();
  renderMemoryGrid();
}

function layoutScatterItems() {
  const area = elements.scatterArea.getBoundingClientRect();
  const zone = elements.dropZone.getBoundingClientRect();
  const itemWidth = clamp(area.width * 0.145, 128, 174);
  const itemHeight = clamp(itemWidth * 1.08, 138, 188);
  const gap = 22;
  const leftStart = 18;
  const leftEnd = Math.max(leftStart, zone.left - area.left - itemWidth - gap);
  const rightStart = zone.right - area.left + gap;
  const rightEnd = Math.max(rightStart, area.width - itemWidth - 14);
  const rowCapacity = Math.max(1, Math.floor((area.height - 40) / (itemHeight + gap)));

  const leftItems = shuffle(state.eiItems.filter((_, index) => index % 2 === 0));
  const rightItems = shuffle(state.eiItems.filter((_, index) => index % 2 !== 0));
  const leftColumns = determineColumns(leftEnd - leftStart + itemWidth, itemWidth, gap, leftItems.length, rowCapacity);
  const rightColumns = determineColumns(rightEnd - rightStart + itemWidth, itemWidth, gap, rightItems.length, rowCapacity);

  const leftSlots = buildSideSlots({
    sideStart: leftStart,
    sideEnd: leftEnd,
    itemWidth,
    itemHeight,
    areaHeight: area.height,
    gap,
    columnsWanted: leftColumns,
  });
  const rightSlots = buildSideSlots({
    sideStart: rightStart,
    sideEnd: rightEnd,
    itemWidth,
    itemHeight,
    areaHeight: area.height,
    gap,
    columnsWanted: rightColumns,
  });

  leftItems.forEach((item) => {
    const slot = leftSlots.pop() || rightSlots.pop();
    if (!slot) return;
    item.x = slot.x;
    item.y = slot.y;
    item.originX = item.x;
    item.originY = item.y;
  });

  rightItems.forEach((item) => {
    const slot = rightSlots.pop() || leftSlots.pop();
    if (!slot) return;
    item.x = slot.x;
    item.y = slot.y;
    item.originX = item.x;
    item.originY = item.y;
  });
}

function determineColumns(sideWidth, itemWidth, gap, itemCount, rowCapacity) {
  const maxColumnsByWidth = Math.max(1, Math.floor((Math.max(sideWidth, itemWidth) + gap) / (itemWidth + gap)));
  const neededColumns = Math.max(1, Math.ceil(itemCount / rowCapacity));
  return Math.min(maxColumnsByWidth, neededColumns);
}

function buildSideSlots({ sideStart, sideEnd, itemWidth, itemHeight, areaHeight, gap, columnsWanted }) {
  const slots = [];
  const availableWidth = Math.max(itemWidth, sideEnd - sideStart + itemWidth);
  const maxColumns = Math.max(1, Math.floor((availableWidth + gap) / (itemWidth + gap)));
  const columns = clamp(columnsWanted, 1, maxColumns);
  const xStep = columns === 1 ? 0 : (availableWidth - itemWidth) / Math.max(1, columns - 1);
  const maxRows = Math.max(1, Math.floor((areaHeight - 32) / (itemHeight + gap)));

  for (let row = 0; row < maxRows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const x = clamp(sideStart + col * xStep, sideStart, sideEnd);
      const y = clamp(20 + row * (itemHeight + gap), 18, areaHeight - itemHeight - 12);
      slots.push({ x, y });
    }
  }

  return shuffle(slots);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function renderScatterItems() {
  elements.scatterArea.innerHTML = "";

  state.eiItems
    .filter((item) => item.state === "field")
    .forEach((item) => {
      const node = document.createElement("div");
      node.className = "draggable-item";
      node.dataset.id = item.id;
      node.style.transform = `translate(${item.x}px, ${item.y}px)`;

      node.append(createPolaroidCard(item));

      bindDragHandlers(node, item.id);
      elements.scatterArea.append(node);
    });
}

function renderPairGrid() {
  elements.pairGrid.innerHTML = "";

  state.pairItems.forEach((item) => {
    const node = document.createElement("div");
    node.className = "draggable-item";
    node.dataset.id = item.id;
    node.append(createPolaroidCard(item));
    bindPairHandlers(node, item.id);
    elements.pairGrid.append(node);
  });
}

function renderPairResults() {
  elements.pairResultList.innerHTML = "";

  state.matchedPairs.forEach((pair) => {
    const row = document.createElement("div");
    row.className = "pair-result-card";
    row.append(createPolaroidCard(pair.first));

    const link = document.createElement("div");
    link.className = "pair-link";
    link.textContent = "+";

    row.append(link, createPolaroidCard(pair.second));
    elements.pairResultList.append(row);
  });
}

function renderMemoryGrid() {
  const currentIds = [...elements.memoryGrid.children].map((node) => node.dataset.id).join("|");
  const nextIds = state.memoryItems.map((item) => item.id).join("|");

  if (elements.memoryGrid.children.length !== state.memoryItems.length || currentIds !== nextIds) {
    elements.memoryGrid.innerHTML = "";

    state.memoryItems.forEach((item) => {
      const button = document.createElement("button");
      button.className = "memory-card";
      button.type = "button";
      button.dataset.id = item.id;
      button.dataset.pairKey = item.pairKey;

      const inner = document.createElement("div");
      inner.className = "memory-card__inner";

      const back = document.createElement("div");
      back.className = "memory-card__face memory-card__face--back";

      const front = document.createElement("div");
      front.className = "memory-card__face memory-card__face--front";
      front.append(createPolaroidCard(item));

      inner.append(back, front);
      button.append(inner);
      button.addEventListener("click", () => handleMemoryCardClick(item.id));
      elements.memoryGrid.append(button);
    });
  }

  requestAnimationFrame(() => {
    state.memoryItems.forEach((item) => {
      const button = elements.memoryGrid.querySelector(`[data-id="${item.id}"]`);
      if (!button) return;
      button.classList.toggle("is-revealed", item.revealed);
      button.classList.toggle("is-matched", item.matched);
      button.classList.toggle("is-gone", item.matched);
      button.setAttribute("aria-label", item.revealed || item.matched ? item.label : "Verborgen kaart");
      button.disabled = item.matched;
    });
  });
}

function bindDragHandlers(node, itemId) {
  const onPointerDown = (event) => {
    event.preventDefault();
    state.draggingId = itemId;
    node.dataset.state = "dragging";
    node.setPointerCapture(event.pointerId);

    const item = state.eiItems.find((entry) => entry.id === itemId);
    const bounds = node.getBoundingClientRect();
    const area = elements.scatterArea.getBoundingClientRect();
    const startX = item.x;
    const startY = item.y;
    let moved = false;
    const offsetX = event.clientX - bounds.left;
    const offsetY = event.clientY - bounds.top;

    const onPointerMove = (moveEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - event.clientX);
      const deltaY = Math.abs(moveEvent.clientY - event.clientY);
      if (deltaX > 8 || deltaY > 8) {
        moved = true;
      }
      item.x = clamp(moveEvent.clientX - area.left - offsetX, 0, area.width - bounds.width);
      item.y = clamp(moveEvent.clientY - area.top - offsetY, 0, area.height - bounds.height);
      node.style.transform = `translate(${item.x}px, ${item.y}px)`;
    };

    const onPointerUp = (upEvent) => {
      node.releasePointerCapture(upEvent.pointerId);
      node.dataset.state = "field";
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerup", onPointerUp);
      node.removeEventListener("pointercancel", onPointerUp);
      if (!moved) {
        item.x = startX;
        item.y = startY;
        node.style.transform = `translate(${startX}px, ${startY}px)`;
        playWordAudio(item);
        return;
      }
      handleDrop(itemId, node, startX, startY);
    };

    node.addEventListener("pointermove", onPointerMove);
    node.addEventListener("pointerup", onPointerUp);
    node.addEventListener("pointercancel", onPointerUp);
  };

  node.addEventListener("pointerdown", onPointerDown);
}

function bindPairHandlers(node, itemId) {
  const onPointerDown = (event) => {
    event.preventDefault();
    playUiClickSound();
    node.dataset.state = "dragging";
    node.setPointerCapture(event.pointerId);

    let moved = false;
    let deltaX = 0;
    let deltaY = 0;

    const onPointerMove = (moveEvent) => {
      deltaX = moveEvent.clientX - event.clientX;
      deltaY = moveEvent.clientY - event.clientY;
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        moved = true;
      }
      node.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${deltaX * 0.02}deg)`;
    };

    const onPointerUp = (upEvent) => {
      node.releasePointerCapture(upEvent.pointerId);
      node.dataset.state = "field";
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerup", onPointerUp);
      node.removeEventListener("pointercancel", onPointerUp);

      const item = state.pairItems.find((entry) => entry.id === itemId);
      if (!item) return;

      if (!moved) {
        node.style.transform = "";
        playWordAudio(item);
        return;
      }

      const target = findPairDropTarget(itemId, upEvent.clientX, upEvent.clientY);
      node.style.transform = "";

      if (!target) {
        return;
      }

      if (target.pairKey === item.pairKey) {
        handlePairMatch(item, target);
      } else {
        playWrongCue();
      }
    };

    node.addEventListener("pointermove", onPointerMove);
    node.addEventListener("pointerup", onPointerUp);
    node.addEventListener("pointercancel", onPointerUp);
  };

  node.addEventListener("pointerdown", onPointerDown);
}

function findPairDropTarget(draggedId, clientX, clientY) {
  return state.pairItems.find((item) => {
    if (item.id === draggedId) return false;
    const candidate = elements.pairGrid.querySelector(`[data-id="${item.id}"]`);
    if (!candidate) return false;
    const bounds = candidate.getBoundingClientRect();
    return clientX >= bounds.left && clientX <= bounds.right && clientY >= bounds.top && clientY <= bounds.bottom;
  });
}

function handlePairMatch(firstItem, secondItem) {
  playSuccessCue();
  const firstNode = elements.pairGrid.querySelector(`[data-id="${firstItem.id}"]`);
  const secondNode = elements.pairGrid.querySelector(`[data-id="${secondItem.id}"]`);
  if (firstNode && secondNode) {
    const firstBounds = firstNode.getBoundingClientRect();
    const secondBounds = secondNode.getBoundingClientRect();
    spawnBurst({
      left: (firstBounds.left + secondBounds.left) / 2,
      top: (firstBounds.top + secondBounds.top) / 2,
      width: Math.max(firstBounds.width, secondBounds.width),
      height: Math.max(firstBounds.height, secondBounds.height),
    });
  }
  state.pairItems = state.pairItems.filter((item) => item.id !== firstItem.id && item.id !== secondItem.id);
  state.matchedPairs.push(orderPair(firstItem, secondItem));
  renderPairGrid();
  renderPairResults();
  if (state.pairItems.length === 0) {
    playWinCue();
    spawnConfetti();
  }
}

function orderPair(firstItem, secondItem) {
  return firstItem.label.localeCompare(secondItem.label, "nl") <= 0
    ? { first: firstItem, second: secondItem }
    : { first: secondItem, second: firstItem };
}

function buildMemoryItems() {
  const selectedPairs = shuffle([...pairSets]).slice(0, 3);
  return shuffle(
    selectedPairs.flatMap(([first, second], pairIndex) => [
      {
        id: `memory-${first}-${pairIndex}`,
        label: first,
        image: `assets/minigames/kleur/items/${first}.png`,
        audio: `assets/audio/words/${first}.mp3`,
        pairKey: `memory-${pairIndex}`,
        revealed: false,
        matched: false,
      },
      {
        id: `memory-${second}-${pairIndex}`,
        label: second,
        image: `assets/minigames/kleur/items/${second}.png`,
        audio: `assets/audio/words/${second}.mp3`,
        pairKey: `memory-${pairIndex}`,
        revealed: false,
        matched: false,
      },
    ])
  );
}

function handleMemoryCardClick(itemId) {
  if (state.memoryLocked) return;
  const item = state.memoryItems.find((entry) => entry.id === itemId);
  if (!item || item.matched || item.revealed) return;

  item.revealed = true;
  state.memorySelection.push(item.id);
  playWordAudio(item);
  renderMemoryGrid();

  if (state.memorySelection.length < 2) {
    return;
  }

  state.memoryLocked = true;
  const [firstId, secondId] = state.memorySelection;
  const firstItem = state.memoryItems.find((entry) => entry.id === firstId);
  const secondItem = state.memoryItems.find((entry) => entry.id === secondId);

  if (!firstItem || !secondItem) {
    resetMemorySelection();
    return;
  }

  const matched = firstItem.pairKey === secondItem.pairKey;
  if (matched) {
    playSuccessCue();
    const firstNode = elements.memoryGrid.querySelector(`[data-id="${firstItem.id}"]`);
    const secondNode = elements.memoryGrid.querySelector(`[data-id="${secondItem.id}"]`);
    if (firstNode && secondNode) {
      const firstBounds = firstNode.getBoundingClientRect();
      const secondBounds = secondNode.getBoundingClientRect();
      spawnBurst(firstBounds);
      spawnBurst(secondBounds);
    }

    state.memoryTimer = setTimeout(() => {
      firstItem.matched = true;
      secondItem.matched = true;
      resetMemorySelection();
      renderMemoryGrid();
      if (state.memoryItems.every((entry) => entry.matched)) {
        playWinCue();
        spawnConfetti();
      }
    }, 3000);
  } else {
    playWrongCue();
    state.memoryTimer = setTimeout(() => {
      firstItem.revealed = false;
      secondItem.revealed = false;
      resetMemorySelection();
      renderMemoryGrid();
    }, 3000);
  }
}

function resetMemorySelection() {
  clearTimeout(state.memoryTimer);
  state.memorySelection = [];
  state.memoryLocked = false;
  state.memoryTimer = null;
}

function handleDrop(itemId, node, startX, startY) {
  const item = state.eiItems.find((entry) => entry.id === itemId);
  if (!item || item.state !== "field") return;

  const nodeBounds = node.getBoundingClientRect();
  const zoneBounds = elements.dropZone.getBoundingClientRect();
  const nodeCenterX = nodeBounds.left + nodeBounds.width / 2;
  const nodeCenterY = nodeBounds.top + nodeBounds.height / 2;
  const insideDropZone =
    nodeCenterX >= zoneBounds.left &&
    nodeCenterX <= zoneBounds.right &&
    nodeCenterY >= zoneBounds.top &&
    nodeCenterY <= zoneBounds.bottom;

  if (!insideDropZone) {
    snapItemBack(itemId, node, startX, startY);
    return;
  }

  if (item.rhymes) {
    item.state = "correct";
    addResultChip(item);
    playSuccessCue();
    spawnBurst(nodeBounds);
    renderScatterItems();
    checkEiCompletion();
  } else {
    playWrongCue();
    snapItemBack(itemId, node, startX, startY);
  }
}

function addResultChip(item) {
  const chip = document.createElement("div");
  chip.className = "result-chip";
  chip.append(createPolaroidCard(item));
  elements.correctList.append(chip);
}

function checkEiCompletion() {
  const remainingRhymes = state.eiItems.some((item) => item.rhymes && item.state === "field");
  if (!remainingRhymes) {
    playWinCue();
    spawnConfetti();
  }
}

function snapItemBack(itemId, node, targetX, targetY) {
  const item = state.eiItems.find((entry) => entry.id === itemId);
  if (!item) return;
  item.x = targetX;
  item.y = targetY;
  node.animate(
    [
      { transform: node.style.transform },
      { transform: `translate(${targetX}px, ${targetY}px) scale(1.04)` },
      { transform: `translate(${targetX}px, ${targetY}px) scale(1)` },
    ],
    { duration: 280, easing: "ease-out" }
  );
  node.style.transform = `translate(${targetX}px, ${targetY}px)`;
}

function spawnBurst(nodeBounds) {
  const layer = elements.celebrationLayer;
  layer.classList.remove("hidden");

  const centerX = nodeBounds.left + nodeBounds.width / 2;
  const centerY = nodeBounds.top + nodeBounds.height / 2;
  const colors = ["#ffcf5a", "#79d8b6", "#ff8d5f", "#7ac7ff", "#ffffff"];
  const burst = document.createElement("div");
  burst.className = "burst-group";
  burst.style.setProperty("--x", `${centerX}px`);
  burst.style.setProperty("--y", `${centerY}px`);

  for (let index = 0; index < 30; index += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    const angle = (Math.PI * 2 * index) / 30;
    const distance = 58 + Math.random() * 110;
    particle.style.setProperty("--x", `${centerX}px`);
    particle.style.setProperty("--y", `${centerY}px`);
    particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--particle-color", colors[index % colors.length]);
    burst.append(particle);
  }
  layer.append(burst);

  window.setTimeout(() => {
    burst.remove();
    if (!layer.children.length) {
      layer.classList.add("hidden");
    }
  }, 1100);
}

function spawnConfetti() {
  clearTimeout(state.confettiTimeout);
  const layer = elements.confettiLayer;
  layer.innerHTML = "";
  layer.classList.remove("hidden");

  const colors = ["#ff8d5f", "#79d8b6", "#ffcf5a", "#7ac7ff", "#ffffff", "#ef6a47"];
  for (let index = 0; index < 170; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.setProperty("--x", `${Math.random() * 100}%`);
    piece.style.setProperty("--drift", `${-180 + Math.random() * 360}px`);
      piece.style.setProperty("--rotate", `${Math.random() * 360}deg`);
      piece.style.setProperty("--duration", `${4600 + Math.random() * 2800}ms`);
      piece.style.setProperty("--particle-color", colors[index % colors.length]);
      piece.style.animationDelay = `${Math.random() * 900}ms`;
      piece.style.opacity = "0.95";
      layer.append(piece);
    }

  state.confettiTimeout = setTimeout(() => {
    clearCelebrations();
  }, 8600);
}

function clearCelebrations() {
  clearTimeout(state.celebrationTimeout);
  clearTimeout(state.confettiTimeout);
  stopActiveAudio();
  elements.celebrationLayer.innerHTML = "";
  elements.confettiLayer.innerHTML = "";
  elements.celebrationLayer.classList.add("hidden");
  elements.confettiLayer.classList.add("hidden");
}

function setupNavigation() {
  elements.openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openGame(button.dataset.openGame);
    });
  });

  elements.homeLink.addEventListener("click", () => {
    showPage("home");
  });
  elements.backHomeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showPage("home");
    });
  });

  elements.resetEiButton.addEventListener("click", resetEiGame);
  elements.resetKleurButton.addEventListener("click", resetPairGame);
  elements.resetVormButton.addEventListener("click", resetMemoryGame);
}

function setupFullscreenToggle() {
  const syncFullscreenUi = () => {
    const active = Boolean(document.fullscreenElement);
    elements.fullscreenEnterIcon.classList.toggle("hidden", active);
    elements.fullscreenExitIcon.classList.toggle("hidden", !active);
    elements.fullscreenButton.setAttribute("aria-label", active ? "Volledig scherm verlaten" : "Volledig scherm");
  };

  elements.fullscreenButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (_) {
      return;
    }
    syncFullscreenUi();
  });

  document.addEventListener("fullscreenchange", syncFullscreenUi);
  syncFullscreenUi();
}

function setupResponsiveRelayout() {
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (state.currentPage === "ei") {
        layoutScatterItems();
        renderScatterItems();
      }
    }, 120);
  });
}

function init() {
  registerServiceWorker();
  setupAudioUnlock();
  attachUiSounds();
  setupNavigation();
  setupFullscreenToggle();
  setupResponsiveRelayout();

  const eggImage = document.querySelector("#egg-image");
  eggImage.addEventListener("error", () => {
    eggImage.hidden = true;
  });
}

init();
