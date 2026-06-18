/**
 * render.js — Pure DOM rendering.
 * Takes current game state and rebuilds the UI. No game logic here.
 */
import { DRUGS } from "../data/drugs.js";
import { currentLoad, netWorth } from "../engine/state.js";
import { getStreetBuyPrice } from "../engine/market.js";
import { fmtMoney, fmtWeight, fmtPriceUnit, LOCALE } from "../data/locale.js";

// ── Element refs (set once on boot) ──────────────────────────────────────────
let els = {};

// ── Previous market prices — used to calculate flash direction ───────────────
let prevMarket = {};

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

    // Realism stats (may not exist)
    repStat: document.getElementById("stat-rep"),
    heatStat: document.getElementById("stat-heat"),
  };
}

// ── Main render ───────────────────────────────────────────────────────────────

export function render(state) {
  renderHeader(state);
  renderStats(state);
  renderInventory(state);
  renderMarket(state);
  renderTravelList(state);

  if (state.isHustler || state.isRealism) {
    renderHpBar(state);
    renderItems(state);
  }

  if (state.isRealism) {
    renderRealismStats(state);
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
    if ((state.isHustler || state.isRealism) && state.scannerActive) {
      const loc = state.locations.find((l) => l.id === locId);
      let heat;
      if (state.isRealism) {
        // Use dynamic borough heat + base heatMod
        const bHeat = state.boroughHeat[locId] ?? 0;
        heat = (loc ? loc.heatMod : 1) + bHeat;
      } else {
        heat = loc ? loc.heatMod : 1;
      }
      const heatLabel =
        heat >= 1.3 ? "[HOT]" : heat >= 1.0 ? "[WARM]" : "[COOL]";
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

  // Clinic button visibility (Hustler/Realism + correct location)
  const clinicBtn = document.getElementById("btn-visit-clinic");
  if (clinicBtn) {
    const CLINIC_LOCS = ["bronx", "manhattan"];
    if (
      (state.isHustler || state.isRealism) &&
      CLINIC_LOCS.includes(state.location.id)
    ) {
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
  const load = fmtWeight(currentLoad(state), state.isRealism);
  const maxH = fmtWeight(state.maxHold, state.isRealism);
  els.holdCounter.textContent = state.isRealism
    ? `hold: ${load} / ${maxH}`
    : `hold: ${currentLoad(state)} / ${state.maxHold}`;
  if (els.playerNameDisplay) {
    els.playerNameDisplay.textContent = state.playerName || "---";
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function renderStats(state) {
  els.cash.textContent = fmtMoney(state.cash);
  els.bank.textContent = fmtMoney(state.bank);
  els.debt.textContent = fmtMoney(state.debt);
  els.guns.textContent = state.guns;
  els.netWorth.textContent = fmtMoney(netWorth(state));
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

  if (state.items.length === 0 && !state.vinnieJob && !state.pendingFavour) {
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
    badges += `<span class="item-badge item-badge-job" title="Vinnie's Job">JOB: ${j.amount}× ${j.drugId} → ${j.locationName} (${daysLeft}d)</span>`;
  }

  // Show active favour (Realism — Tommy Bags unlock)
  if (state.isRealism && state.pendingFavour) {
    const f = state.pendingFavour;
    const daysLeft = f.deadline - state.day;
    badges += `<span class="item-badge item-badge-favour" title="Tommy's Favour">FAVOUR: ${f.amount}oz ${f.drugId} → ${f.locationName} (${daysLeft}d)</span>`;
  }

  els.itemsList.innerHTML = badges;
}

// ── Inventory tables ──────────────────────────────────────────────────────────

function renderInventory(state) {
  els.stashBody.innerHTML = DRUGS.map(
    (drug) => `
    <tr>
      <td class="drug-name">${drug.name}</td>
      <td class="drug-qty">${fmtWeight(state.stash[drug.id], state.isRealism)}</td>
      <td class="drug-actions">
        ${
          state.stash[drug.id] > 0
            ? `<button class="btn-sm" data-action="pick-stash" data-drug="${drug.id}">Pick up</button>`
            : ""
        }
      </td>
    </tr>`,
  ).join("");

  els.coatBody.innerHTML = DRUGS.map((drug) => {
    const qty = state.trenchCoat[drug.id];
    const purityLabel =
      state.isRealism && qty > 0 ? ` (${state.coatPurity[drug.id]}%)` : "";
    const cuttable = state.isRealism && qty > 0 && drug.cuttable;
    return `
    <tr>
      <td class="drug-name">${drug.name}${purityLabel}</td>
      <td class="drug-qty">${fmtWeight(qty, state.isRealism)}</td>
      <td class="drug-actions">
        ${
          qty > 0
            ? `<button class="btn-sm" data-action="drop-stash" data-drug="${drug.id}">Stash</button>`
            : ""
        }
        ${
          qty > 0
            ? `<button class="btn-sm btn-sell" data-action="${state.isRealism ? "sell-street" : "sell"}" data-drug="${drug.id}">Sell</button>`
            : ""
        }
        ${
          cuttable
            ? `<button class="btn-sm btn-cut" data-action="cut" data-drug="${drug.id}">Cut</button>`
            : ""
        }
      </td>
    </tr>`;
  }).join("");
}

// ── Market table ──────────────────────────────────────────────────────────────

function trendArrow(drugId, current) {
  const prev = prevMarket[drugId];
  if (prev === undefined || prev === current) {
    return '<span class="price-trend price-trend-flat">—</span>';
  }
  return current > prev
    ? '<span class="price-trend price-trend-up">▲</span>'
    : '<span class="price-trend price-trend-down">▼</span>';
}

function supplyBadge(drug, state) {
  const evtData = state.supplyEvents?.[drug.id];
  if (!evtData || evtData.endsOn <= state.day) return "";
  return evtData.type === "drought"
    ? '<span class="supply-badge supply-badge-drought">DROUGHT</span>'
    : '<span class="supply-badge supply-badge-flood">FLOOD</span>';
}

function renderMarket(state) {
  const snapshot = { ...prevMarket }; // capture before we overwrite

  if (state.isRealism) {
    const priceUnit = fmtPriceUnit(true);
    const divisor = LOCALE.useMetricWeight ? 28.35 : 1;

    els.marketBody.innerHTML = DRUGS.map((drug) => {
      const sellPrice = state.market[drug.id];
      const buyPrice = getStreetBuyPrice(drug.id, state.market);
      return `
      <tr data-drug-row="${drug.id}">
        <td class="drug-name">${drug.name}${supplyBadge(drug, state)}</td>
        <td class="drug-price" data-drug-price="${drug.id}">${fmtMoney(sellPrice / divisor)}${priceUnit}${trendArrow(drug.id, sellPrice)}</td>
        <td class="drug-buy-price">${fmtMoney(buyPrice / divisor)}${priceUnit}</td>
        <td class="drug-actions">
          <button class="btn-sm btn-buy" data-action="buy-street" data-drug="${drug.id}">Buy Street</button>
        </td>
      </tr>`;
    }).join("");
  } else {
    els.marketBody.innerHTML = DRUGS.map((drug) => {
      const price = state.market[drug.id];
      return `
      <tr data-drug-row="${drug.id}">
        <td class="drug-name">${drug.name}${supplyBadge(drug, state)}</td>
        <td class="drug-price" data-drug-price="${drug.id}">
          ${fmtMoney(price)}${trendArrow(drug.id, price)}
        </td>
        <td class="drug-actions">
          <button class="btn-sm btn-buy" data-action="buy" data-drug="${drug.id}">Buy</button>
        </td>
      </tr>`;
    }).join("");
  }

  // Flash cells that changed price
  DRUGS.forEach((drug) => {
    const current = state.market[drug.id];
    const previous = snapshot[drug.id];
    if (previous === undefined || previous === current) return;
    const cell = els.marketBody.querySelector(`[data-drug-price="${drug.id}"]`);
    if (!cell) return;
    const cls = current > previous ? "flash-up" : "flash-down";
    cell.classList.remove("flash-up", "flash-down");
    // Force reflow so re-adding the class always restarts the animation
    void cell.offsetWidth;
    cell.classList.add(cls);
    cell.addEventListener("animationend", () => cell.classList.remove(cls), {
      once: true,
    });
  });

  // Save current prices for next render cycle
  DRUGS.forEach((drug) => {
    prevMarket[drug.id] = state.market[drug.id];
  });
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
      const tipClass = m.startsWith("[TIP]") ? ' class="log-tip"' : "";
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
  // Re-trigger the slide-in animation each time the modal opens
  const box = els.overlay.querySelector(".modal-box");
  if (box) {
    box.style.animation = "none";
    void box.offsetWidth; // force reflow
    box.style.animation = "";
  }
}

export function hideModal() {
  els.overlay.classList.add("hidden");
  els.modalBody.innerHTML = "";
}

// ── Realism stats row ─────────────────────────────────────────────────────

function renderRealismStats(state) {
  const repEl = document.getElementById("stat-rep");
  const heatEl = document.getElementById("stat-heat");

  if (repEl) repEl.textContent = Math.floor(state.reputation);
  if (heatEl) {
    const bHeat = state.boroughHeat[state.location.id] ?? 0;
    const heatPct = Math.min(100, Math.round(bHeat * 100));
    heatEl.textContent = `${heatPct}%`;
    heatEl.classList.toggle("stat-heat-high", heatPct >= 50);
  }
}

// ── End screen ────────────────────────────────────────────────────────────────

export function showEndScreen(state) {
  els.gameScreen.classList.add("hidden");
  els.endScreen.classList.remove("hidden");
  els.endScreen.classList.remove("screen-fade");
  void els.endScreen.offsetWidth;
  els.endScreen.classList.add("screen-fade");

  const nw = netWorth(state);

  if (state.won) {
    els.endTitle.textContent = "YOU WIN";
    els.endMessage.textContent = state.isRealism
      ? "Debt cleared. You made it off the streets."
      : "Debt cleared. You made it out alive.";
  } else if ((state.isHustler || state.isRealism) && state.hp <= 0) {
    els.endTitle.textContent = "GAME OVER";
    els.endMessage.textContent = "You didn't survive the streets.";
  } else {
    els.endTitle.textContent = "GAME OVER";
    els.endMessage.textContent = `You still owe ${fmtMoney(state.debt)} to the shark.`;
  }

  els.endNetWorth.textContent = `Final net worth: ${fmtMoney(nw)}`;
}

// ── Utility ───────────────────────────────────────────────────────────────────

// fmt is an alias kept so any surviving template literal usages still work
const fmt = fmtMoney;
