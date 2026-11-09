"use strict";

const designGrid = document.querySelector("#design-grid");
const designCards = Array.from(document.querySelectorAll(".design-card"));
const searchInput = document.querySelector("#design-search");
const filterButtons = Array.from(document.querySelectorAll(".filter-chip"));
const savedCount = document.querySelector("#saved-count");
const noResults = document.querySelector("#no-results");
const pageHeading = document.querySelector("#page-heading");
const featuredLink = document.querySelector(".featured-link");
const sortButton = document.querySelector("#sort-button");
const sidebar = document.querySelector("#sidebar");
const mobileMenu = document.querySelector(".mobile-menu");
const boardDialog = document.querySelector("#board-dialog");
const boardForm = document.querySelector("#board-form");
const boardName = document.querySelector("#board-name");
const formError = document.querySelector("#form-error");
const boardList = document.querySelector("#board-list");
const createdBoards = document.querySelector("#created-boards");
const emptyBoardPanel = document.querySelector("#empty-board-panel");
const savedDesigns = new Set();
const moodboards = [];

let selectedCategory = "All";
let currentView = "discover";
let activeBoardId = null;
let newestFirst = true;

function getActiveBoard() {
  return moodboards.find((board) => board.id === activeBoardId) || null;
}

function cardMatches(card) {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase();
  const text = `${card.dataset.title} ${card.dataset.designer} ${card.dataset.category}`.toLocaleLowerCase();
  const matchesSearch = !searchTerm || text.includes(searchTerm);
  const matchesCategory = selectedCategory === "All" || card.dataset.category === selectedCategory;
  const activeBoard = getActiveBoard();
  const matchesView = currentView === "discover"
    || (activeBoard ? activeBoard.designIds.has(card.dataset.title) : savedDesigns.has(card.dataset.title));

  return matchesSearch && matchesCategory && matchesView;
}

function renderDesigns() {
  const visibleCards = designCards.filter(cardMatches);

  for (const card of designCards) {
    card.hidden = !visibleCards.includes(card);
  }

  noResults.hidden = visibleCards.length > 0;
  if (currentView === "saved" && !visibleCards.length) {
    if (getActiveBoard()) {
      noResults.replaceChildren(
        document.createTextNode("This moodboard is ready for its first design. "),
        Object.assign(document.createElement("button"), {
          className: "inline-action",
          type: "button",
          textContent: "Browse designs"
        }),
        document.createTextNode(" to start collecting.")
      );
    } else {
      noResults.textContent = "No saved designs yet. Browse the vault and tap the heart on anything you love.";
    }
  } else {
    noResults.textContent = "No designs found. Try another search or category.";
  }

  if (designGrid) {
    designGrid.setAttribute("aria-label", `${visibleCards.length} of ${designCards.length} designs shown`);
  }
}

function setCategory(category) {
  selectedCategory = category;
  for (const button of filterButtons) {
    button.classList.toggle("is-selected", button.dataset.category === category);
  }
  renderDesigns();
}

function setView(view) {
  currentView = view;
  activeBoardId = null;
  selectedCategory = "All";
  for (const button of filterButtons) {
    button.classList.toggle("is-selected", button.dataset.category === "All");
  }
  document.querySelectorAll(".side-link[data-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
  document.querySelectorAll(".board-nav-link").forEach((button) => button.classList.remove("is-active"));
  const isSaved = view === "saved";
  pageHeading.innerHTML = isSaved
    ? "Your <span>saved designs.</span>"
    : "Find your next <span>inspiration.</span>";
  document.querySelector(".breadcrumbs strong").textContent = isSaved ? "Saved designs" : "Discover";
  document.querySelector("#designs-heading").textContent = isSaved ? "Your saved designs" : "Made to move you";
  renderDesigns();
}

function updateSavedCount() {
  savedCount.textContent = String(savedDesigns.size);
  for (const card of designCards) {
    const isSaved = savedDesigns.has(card.dataset.title);
    const button = card.querySelector(".save-button");
    button.setAttribute("aria-pressed", String(isSaved));
    button.textContent = isSaved ? "♥" : "♡";
    const activeBoard = getActiveBoard();
    const isInBoard = activeBoard && activeBoard.designIds.has(card.dataset.title);
    const action = activeBoard
      ? (isInBoard ? "Remove from" : "Add to")
      : (isSaved ? "Remove" : "Save");
    button.setAttribute("aria-label", `${action} ${activeBoard ? `${activeBoard.name}: ` : ""}${card.dataset.title}`);
  }
}

function renderMoodboards() {
  boardList.replaceChildren();
  createdBoards.replaceChildren();
  emptyBoardPanel.hidden = moodboards.length > 0;

  if (!moodboards.length) {
    const empty = document.createElement("p");
    empty.className = "empty-boards";
    empty.textContent = "Your collections will show up here.";
    boardList.append(empty);
    return;
  }

  for (const board of moodboards) {
    const navButton = document.createElement("button");
    navButton.className = "board-nav-link";
    navButton.type = "button";
    navButton.dataset.boardId = board.id;
    navButton.classList.toggle("is-active", board.id === activeBoardId);
    navButton.innerHTML = `<span class="board-nav-icon" aria-hidden="true">▤</span><span></span><span class="board-nav-count"></span>`;
    navButton.querySelector("span:nth-child(2)").textContent = board.name;
    navButton.querySelector(".board-nav-count").textContent = String(board.designIds.size);
    boardList.append(navButton);

    const boardButton = document.createElement("button");
    boardButton.className = "created-board";
    boardButton.type = "button";
    boardButton.dataset.boardId = board.id;
    boardButton.classList.toggle("is-active", board.id === activeBoardId);
    boardButton.innerHTML = `<span class="created-board-cover" aria-hidden="true">✦ &nbsp; DESIGNVAULT &nbsp; ✦</span><span class="created-board-info"><strong></strong><span></span></span>`;
    boardButton.querySelector("strong").textContent = board.name;
    boardButton.querySelector(".created-board-info span").textContent = `${board.designIds.size} designs`;
    createdBoards.append(boardButton);
  }
}

function openBoard(boardId) {
  activeBoardId = boardId;
  currentView = "saved";
  selectedCategory = "All";
  for (const button of filterButtons) {
    button.classList.toggle("is-selected", button.dataset.category === "All");
  }
  document.querySelectorAll(".side-link[data-view]").forEach((button) => button.classList.remove("is-active"));
  const board = getActiveBoard();
  const headingAccent = document.createElement("span");
  headingAccent.textContent = board.name;
  pageHeading.replaceChildren(headingAccent);
  document.querySelector(".breadcrumbs strong").textContent = board.name;
  document.querySelector("#designs-heading").textContent = `In ${board.name}`;
  renderMoodboards();
  updateSavedCount();
  renderDesigns();
  document.querySelector("#designs-heading").scrollIntoView({ behavior: "smooth", block: "start" });
}

function addDesignToActiveBoard(title) {
  const board = getActiveBoard();
  if (!board) return;
  board.designIds.add(title);
  renderMoodboards();
}

function browseActiveBoard() {
  const board = getActiveBoard();
  if (!board) return;
  currentView = "discover";
  selectedCategory = "All";
  for (const button of filterButtons) {
    button.classList.toggle("is-selected", button.dataset.category === "All");
  }
  document.querySelectorAll(".side-link[data-view]").forEach((button) => button.classList.remove("is-active"));
  document.querySelectorAll(".board-nav-link").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.boardId === activeBoardId);
  });
  document.querySelector(".breadcrumbs strong").textContent = "Discover";
  document.querySelector("#designs-heading").textContent = `Add designs to ${board.name}`;
  const headingAccent = document.createElement("span");
  headingAccent.textContent = board.name;
  pageHeading.replaceChildren(document.createTextNode("Collect for "), headingAccent, document.createTextNode("."));
  updateSavedCount();
  renderDesigns();
  document.querySelector("#designs-heading").scrollIntoView({ behavior: "smooth", block: "start" });
}

function removeDesignFromBoards(title) {
  for (const board of moodboards) {
    board.designIds.delete(title);
  }
  renderMoodboards();
}

function updateSort() {
  const sortedCards = [...designCards].sort((a, b) => {
    const difference = Number(b.dataset.date) - Number(a.dataset.date);
    return newestFirst ? difference : -difference;
  });
  for (const card of sortedCards) {
    designGrid.append(card);
  }
  sortButton.innerHTML = `${newestFirst ? "Recently added" : "Oldest first"} <span aria-hidden="true">⌄</span>`;
}

for (const button of filterButtons) {
  button.addEventListener("click", () => setCategory(button.dataset.category));
}

searchInput.addEventListener("input", renderDesigns);

document.querySelectorAll(".side-link[data-view]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

designGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".save-button");
  if (!button) return;

  const card = button.closest(".design-card");
  const title = card.dataset.title;
  const activeBoard = getActiveBoard();
  if (activeBoard) {
    if (activeBoard.designIds.has(title)) {
      activeBoard.designIds.delete(title);
    } else {
      savedDesigns.add(title);
      addDesignToActiveBoard(title);
    }
    renderMoodboards();
  } else if (savedDesigns.has(title)) {
    savedDesigns.delete(title);
    removeDesignFromBoards(title);
  } else {
    savedDesigns.add(title);
  }

  updateSavedCount();
  renderDesigns();
});

noResults.addEventListener("click", (event) => {
  if (event.target.closest(".inline-action")) {
    browseActiveBoard();
  }
});

featuredLink.addEventListener("click", () => {
  setView("discover");
  setCategory("Eveningwear");
  document.querySelector("#designs-heading").scrollIntoView({ behavior: "smooth", block: "start" });
});

sortButton.addEventListener("click", () => {
  newestFirst = !newestFirst;
  updateSort();
});

document.addEventListener("click", (event) => {
  const boardButton = event.target.closest("[data-board-id]");
  if (boardButton) {
    openBoard(boardButton.dataset.boardId);
  }
});

document.querySelectorAll("[data-open-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    boardDialog.showModal();
    formError.hidden = true;
    boardName.focus();
  });
});

document.querySelector("[data-close-dialog]").addEventListener("click", () => boardDialog.close());

boardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = boardName.value.trim();
  if (!name) {
    formError.hidden = false;
    boardName.focus();
    return;
  }

  const board = {
    id: `board-${Date.now()}-${moodboards.length}`,
    name,
    designIds: new Set()
  };
  moodboards.unshift(board);
  boardForm.reset();
  boardDialog.close();
  renderMoodboards();
  openBoard(board.id);
});

boardName.addEventListener("input", () => {
  if (boardName.value.trim()) formError.hidden = true;
});

mobileMenu.addEventListener("click", () => {
  const isOpen = mobileMenu.getAttribute("aria-expanded") === "true";
  mobileMenu.setAttribute("aria-expanded", String(!isOpen));
  mobileMenu.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  sidebar.classList.toggle("is-open", !isOpen);
});

sidebar.addEventListener("click", (event) => {
  if (event.target.closest(".side-link, .board-nav-link")) {
    sidebar.classList.remove("is-open");
    mobileMenu.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-label", "Open navigation");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey
    && !(event.target instanceof HTMLInputElement)) {
    event.preventDefault();
    searchInput.focus();
  }

  if (event.key === "Escape" && sidebar.classList.contains("is-open")) {
    sidebar.classList.remove("is-open");
    mobileMenu.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-label", "Open navigation");
    mobileMenu.focus();
  }
});

updateSort();
updateSavedCount();
renderMoodboards();
renderDesigns();
