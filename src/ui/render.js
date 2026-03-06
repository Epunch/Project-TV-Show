/**
 * render.js — Pure DOM rendering.
 * Takes current game state and rebuilds the UI. No game logic here.
 */
import { DRUGS } from "../data/drugs.js";
import { currentLoad, netWorth } from "../engine/state.js";

// ── Element refs (set once on boot) ──────────────────────────────────────────
let els = {};

export function bindElements() {
  els = {
    // Header
    locationName: document.getElementById("location-name"),
    dayCounter: document.getElementById("day-counter"),
    holdCounter: document.getElementById("hold-counter"),
    playerNameDisplay: document.getElementById("player-name-display"),

    // Stats panel
    cash: document.getElementById("stat-cash"),
    bank: document.getElementById("stat-bank"),
    debt: document.getElementById("stat-debt"),
    guns: document.getElementById("stat-guns"),
    netWorth: document.getElementById("stat-networth"),

    // HP / Items (Hustler mode — may not exist)
    hpItem: document.querySelector(".stat-hp-item"),
    hpBar: document.getElementById("stat-hp-bar"),
    hpText: document.getElementById("stat-hp-text"),
    itemsRow: document.querySelector(".items-row"),
    itemsList: document.getElementById("items-list"),
    btnBuyBandages: document.getElementById("btn-buy-bandages"),

    // Inventory tables
    stashBody: document.getElementById("stash-body"),
    coatBody: document.getElementById("coat-body"),

    // Market table
    marketBody: document.getElementById("market-body"),

    // Log
    logList: document.getElementById("log-list"),

    // Modals / overlays
    overlay: document.getElementById("modal-overlay"),
    modalTitle: document.getElementById("modal-title"),
    modalBody: document.getElementById("modal-body"),

    // Screens
    gameScreen: document.getElementById("game-screen"),
    endScreen: document.getElementById("end-screen"),
    endTitle: document.getElementById("end-title"),
    endMessage: document.getElementById("end-message"),
    endNetWorth: document.getElementById("end-networth"),
  };
}

// ── Main render ───────────────────────────────────────────────────────────────

export function render(state) {
  renderHeader(state);
  renderStats(state);
  renderInventory(state);
  renderMarket(state);
  renderTravelList(state);

  if (state.isHustler) {
    renderHpBar(state);
    renderItems(state);
  }
}

// ── Travel list (highlight current location) ─────────────────────────────────

function renderTravelList(state) {
  const buttons = document.querySelectorAll("#travel-list .btn-travel");
  buttons.forEach((btn) => {
    const locId = btn.dataset.location;
    if (locId === state.location.id) {
      btn.classList.add("btn-travel-current");
    } else {
      btn.classList.remove("btn-travel-current");
    }

    // Police scanner: show heat indicators
    const heatSpan = btn.querySelector(".heat-indicator");
    if (state.isHustler && state.scannerActive) {
      const loc = state.locations.find((l) => l.id === locId);
      const heat = loc ? loc.heatMod : 1;
      const heatLabel =
        heat >= 1.3 ? "🔴" : heat >= 1.0 ? "🟡" : "🟢";
      if (heatSpan) {
        heatSpan.textContent = heatLabel;
      } else {
        const span = document.createElement("span");
        span.className = "heat-indicator";
        span.textContent = heatLabel;
        btn.appendChild(span);
      }
    } else if (heatSpan) {
      heatSpan.remove();
    }
  });

  // Clinic button visibility (Hustler + correct location)
  const clinicBtn = document.getElementById("btn-visit-clinic");
  if (clinicBtn) {
    const CLINIC_LOCS = ["bronx", "manhattan"];
    if (state.isHustler && CLINIC_LOCS.includes(state.location.id)) {
      clinicBtn.classList.remove("hidden");
    } else {
      clinicBtn.classList.add("hidden");
    }
  }
}

// ── Header ────────────────────────────────────────────────────────────────────

function renderHeader(state) {
  els.locationName.textContent = state.location.name.toUpperCase();
  els.dayCounter.textContent = `days left: ${state.totalDays - state.day + 1}`;
  els.holdCounter.textContent = `hold: ${currentLoad(state)} / ${state.maxHold}`;
  if (els.playerNameDisplay) {
    els.playerNameDisplay.textContent = state.playerName || "---";
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function renderStats(state) {
  els.cash.textContent = fmt(state.cash);
  els.bank.textContent = fmt(state.bank);
  els.debt.textContent = fmt(state.debt);
  els.guns.textContent = state.guns;
  els.netWorth.textContent = fmt(netWorth(state));
}

// ── HP Bar (Hustler only) ────────────────────────────────────────────────────

function renderHpBar(state) {
  if (!els.hpBar || !els.hpText) return;

  const pct = Math.round((state.hp / state.maxHp) * 100);
  els.hpBar.style.width = pct + "%";
  els.hpText.textContent = `${state.hp} / ${state.maxHp}`;

  // Color states
  els.hpBar.classList.remove("hp-mid", "hp-low");
  if (pct <= 30) {
    els.hpBar.classList.add("hp-low");
  } else if (pct <= 60) {
    els.hpBar.classList.add("hp-mid");
  }
}

// ── Items row (Hustler only) ────────────────────────────────────────────────

function renderItems(state) {
  if (!els.itemsList) return;

  if (state.items.length === 0) {
    els.itemsList.innerHTML = '<span class="text-muted">No items</span>';
    return;
  }

  let badges = state.items
    .map((item) => {
      const usesText = item.uses > 1 ? ` (${item.uses})` : "";
      return `<span class="item-badge" title="${item.name}">${item.icon} ${item.name}${usesText}</span>`;
    })
    .join("");

  // Show active Vinnie job
  if (state.vinnieJob) {
    const j = state.vinnieJob;
    const daysLeft = j.deadline - state.day;
    badges += `<span class="item-badge item-badge-job" title="Vinnie's Job">📦 ${j.amount}× ${j.drugId} → ${j.locationName} (${daysLeft}d)</span>`;
  }

  els.itemsList.innerHTML = badges;
}

// ── Inventory tables ──────────────────────────────────────────────────────────

function renderInventory(state) {
  els.stashBody.innerHTML = DRUGS.map(
    (drug) => `
    <tr>
      <td class="drug-name">${drug.name}</td>
      <td class="drug-qty">${state.stash[drug.id]}</td>
      <td class="drug-actions">
        ${
          state.stash[drug.id] > 0
            ? `<button class="btn-sm" data-action="pick-stash" data-drug="${drug.id}">Pick up</button>`
            : ""
        }
      </td>
    </tr>`,
  ).join("");

  els.coatBody.innerHTML = DRUGS.map(
    (drug) => `
    <tr>
      <td class="drug-name">${drug.name}</td>
      <td class="drug-qty">${state.trenchCoat[drug.id]}</td>
      <td class="drug-actions">
        ${
          state.trenchCoat[drug.id] > 0
            ? `<button class="btn-sm" data-action="drop-stash" data-drug="${drug.id}">Stash</button>`
            : ""
        }
        ${
          state.trenchCoat[drug.id] > 0
            ? `<button class="btn-sm btn-sell" data-action="sell" data-drug="${drug.id}">Sell</button>`
            : ""
        }
      </td>
    </tr>`,
  ).join("");
}

// ── Market table ──────────────────────────────────────────────────────────────

function renderMarket(state) {
  els.marketBody.innerHTML = DRUGS.map((drug) => {
    const price = state.market[drug.id];
    return `
    <tr>
      <td class="drug-name">${drug.name}</td>
      <td class="drug-price">${fmt(price)}</td>
      <td class="drug-actions">
        <button class="btn-sm btn-buy" data-action="buy" data-drug="${drug.id}">Buy</button>
      </td>
    </tr>`;
  }).join("");
}

// ── Log ───────────────────────────────────────────────────────────────────────

export function appendLog(state, messages) {
  // Push new messages into state log
  for (const msg of messages) {
    const isTip = typeof msg === "object" && msg.isTip;
    const text = isTip ? msg.text : msg;
    state.log.unshift(text);
  }
  // Keep log at max 50 entries
  if (state.log.length > 50) state.log.length = 50;

  els.logList.innerHTML = state.log
    .map((m) => {
      const tipClass = m.startsWith("💡") ? ' class="log-tip"' : "";
      return `<li${tipClass}>${m}</li>`;
    })
    .join("");
}

// ── Modal ─────────────────────────────────────────────────────────────────────

/**
 * Show a generic modal.
 * @param {string}   title
 * @param {string}   bodyHTML  — innerHTML for the modal body
 */
export function showModal(title, bodyHTML) {
  els.modalTitle.textContent = title;
  els.modalBody.innerHTML = bodyHTML;
  els.overlay.classList.remove("hidden");
}

export function hideModal() {
  els.overlay.classList.add("hidden");
  els.modalBody.innerHTML = "";
}

// ── End screen ────────────────────────────────────────────────────────────────

export function showEndScreen(state) {
  els.gameScreen.classList.add("hidden");
  els.endScreen.classList.remove("hidden");

  const nw = netWorth(state);

  if (state.won) {
    els.endTitle.textContent = "🏆 YOU WIN";
    els.endMessage.textContent = "Debt cleared. You made it out alive.";
  } else if (state.isHustler && state.hp <= 0) {
    els.endTitle.textContent = "💀 GAME OVER";
    els.endMessage.textContent = "You didn't survive the streets.";
  } else {
    els.endTitle.textContent = "💀 GAME OVER";
    els.endMessage.textContent = `You still owe $${state.debt.toLocaleString()} to the shark.`;
  }

  els.endNetWorth.textContent = `Final net worth: ${fmt(nw)}`;
}

// ── Utility ───────────────────────────────────────────────────────────────────

function fmt(n) {
  return "$" + Math.round(n).toLocaleString();
}
