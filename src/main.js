/**
 * main.js — Entry point. Wires everything together.
 * Handles all click events and delegates to engine + UI.
 */
import {
  createInitialState,
  currentLoad,
  scaledDebt,
  scaledRate,
} from "./engine/state.js";
import { processTurn } from "./engine/turn.js";
import {
  buyDrug,
  sellDrug,
  dropToStash,
  pickFromStash,
  bankDeposit,
  bankWithdraw,
  payDebt,
  borrowFromShark,
  buyGun,
  upgradeCoat,
  buyBandages,
  visitClinic,
} from "./engine/actions.js";
import {
  bindElements,
  render,
  appendLog,
  showModal,
  hideModal,
  showEndScreen,
} from "./ui/render.js";
import { promptQuantity, promptYesNo, promptAmount } from "./ui/modal.js";
import { GAME_CONSTANTS } from "./data/constants.js";
import {
  resolveFight,
  resolveRun,
  resolveSurrender,
  getDeputyCount,
  getEncounterText,
} from "./engine/combat.js";
import { rollVendorEncounter, buyVendorItem } from "./engine/vendor.js";
import { generateTip } from "./engine/tips.js";

// ── Bootstrap ───────────────────────────────────────────────────────────────────────────

let state;

// ── Theme ───────────────────────────────────────────────────────────────────────────

const THEME_KEY = "drugwars-theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  const btn = document.getElementById("btn-theme-toggle");
  if (btn)
    btn.textContent =
      theme === "light" ? "\uD83C\uDF19 Dark" : "\u2600\uFE0F Light";
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
}

// ── Intro screen ───────────────────────────────────────────────────────────────────

/**
 * Build config from whichever mode is active and start the game.
 */
function startGame(config) {
  // Hide intro + hustler screens, show game
  document.getElementById("intro-screen").classList.add("hidden");
  document.getElementById("hustler-info-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");

  // Wire theme toggle (only available once game screen is visible)
  document
    .getElementById("btn-theme-toggle")
    .addEventListener("click", toggleTheme);

  // Boot engine
  bindElements();
  state = createInitialState(config);

  // Show / hide Hustler-specific UI
  if (state.isHustler) {
    document.getElementById("stat-hp-row")?.classList.remove("hidden");
    document.getElementById("items-row")?.classList.remove("hidden");
    document.getElementById("btn-buy-bandages")?.classList.remove("hidden");
  }

  render(state);
  appendLog(state, []);
  attachEventListeners();
}

// ── DOMContentLoaded — wire intro screen ─────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Apply persisted or default theme
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(savedTheme);

  const nameInput = document.getElementById("player-name-input");
  nameInput.focus();

  // ── Mode selector buttons ──────────────────────────────────────────────────
  const modeButtons = document.querySelectorAll(".btn-mode");
  const modePanels = {
    classic: document.getElementById("mode-classic"),
    "choose-days": document.getElementById("mode-choose-days"),
    advanced: document.getElementById("mode-advanced"),
  };
  let activeMode = "classic";

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Toggle active class
      modeButtons.forEach((b) => b.classList.remove("btn-mode-active"));
      btn.classList.add("btn-mode-active");

      // Show the right panel
      Object.values(modePanels).forEach((p) => p.classList.add("hidden"));
      const mode = btn.dataset.mode;
      modePanels[mode]?.classList.remove("hidden");
      activeMode = mode;
    });
  });

  // ── Toggle buttons (police/volatility in Advanced) ─────────────────────────
  document.querySelectorAll(".intro-toggle-row").forEach((row) => {
    row.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-toggle");
      if (!btn) return;
      row
        .querySelectorAll(".btn-toggle")
        .forEach((b) => b.classList.remove("btn-toggle-active"));
      btn.classList.add("btn-toggle-active");
    });
  });

  // ── Choose Days slider ─────────────────────────────────────────────────────
  const chooseDaysSlider = document.getElementById("choose-days-slider");
  const chooseDaysVal = document.getElementById("choose-days-val");
  const chooseDaysDebt = document.getElementById("choose-days-debt");
  const chooseDaysRate = document.getElementById("choose-days-rate");

  chooseDaysSlider?.addEventListener("input", () => {
    const days = parseInt(chooseDaysSlider.value, 10);
    chooseDaysVal.textContent = days;
    chooseDaysDebt.textContent = "$" + scaledDebt(days).toLocaleString();
    chooseDaysRate.textContent = (scaledRate(days) * 100).toFixed(1) + "%";
  });

  // ── Advanced sliders ──────────────────────────────────────────────────────
  const advDaysSlider = document.getElementById("adv-days-slider");
  const advDaysVal = document.getElementById("adv-days-val");
  const advDebtPreview = document.getElementById("adv-debt-preview");
  const advRatePreview = document.getElementById("adv-rate-preview");
  const advCashSlider = document.getElementById("adv-cash-slider");
  const advCashVal = document.getElementById("adv-cash-val");
  const advCoatSlider = document.getElementById("adv-coat-slider");
  const advCoatVal = document.getElementById("adv-coat-val");

  advDaysSlider?.addEventListener("input", () => {
    const days = parseInt(advDaysSlider.value, 10);
    advDaysVal.textContent = days;
    advDebtPreview.textContent = "$" + scaledDebt(days).toLocaleString();
    advRatePreview.textContent = (scaledRate(days) * 100).toFixed(1) + "%";
  });

  advCashSlider?.addEventListener("input", () => {
    advCashVal.textContent =
      "$" + parseInt(advCashSlider.value, 10).toLocaleString();
  });

  advCoatSlider?.addEventListener("input", () => {
    advCoatVal.textContent = advCoatSlider.value;
  });

  // ── Hustler days slider ───────────────────────────────────────────────────
  const hustlerDaysSlider = document.getElementById("hustler-days-slider");
  const hustlerDaysVal = document.getElementById("hustler-days-val");
  const hustlerDebtPreview = document.getElementById("hustler-debt-preview");
  const hustlerRatePreview = document.getElementById("hustler-rate-preview");

  hustlerDaysSlider?.addEventListener("input", () => {
    const days = parseInt(hustlerDaysSlider.value, 10);
    hustlerDaysVal.textContent = days;
    hustlerDebtPreview.textContent = "$" + scaledDebt(days).toLocaleString();
    hustlerRatePreview.textContent = (scaledRate(days) * 100).toFixed(1) + "%";
  });

  // ── Hustler mode button ───────────────────────────────────────────────────
  document.getElementById("btn-hustler-mode")?.addEventListener("click", () => {
    document.getElementById("intro-screen").classList.add("hidden");
    document.getElementById("hustler-info-screen").classList.remove("hidden");
  });

  // ── Hustler back button ───────────────────────────────────────────────────
  document.getElementById("btn-hustler-back")?.addEventListener("click", () => {
    document.getElementById("hustler-info-screen").classList.add("hidden");
    document.getElementById("intro-screen").classList.remove("hidden");
  });

  // ── Start Game button (Classic / Choose Days / Advanced) ──────────────────
  document.getElementById("btn-start-game").addEventListener("click", () => {
    const playerName = nameInput.value.trim() || "Anonymous";
    const config = buildClassicConfig(playerName, activeMode);
    startGame(config);
  });

  // Allow Enter key on intro input
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const playerName = nameInput.value.trim() || "Anonymous";
      const config = buildClassicConfig(playerName, activeMode);
      startGame(config);
    }
  });

  // ── Start Hustler Mode button ─────────────────────────────────────────────
  document
    .getElementById("btn-start-hustler")
    ?.addEventListener("click", () => {
      const playerName = nameInput.value.trim() || "Anonymous";
      const days = parseInt(hustlerDaysSlider.value, 10);
      startGame({
        playerName,
        mode: "hustler",
        totalDays: days,
      });
    });
});

/**
 * Build a config object for Classic / Choose Days / Advanced modes.
 */
function buildClassicConfig(playerName, mode) {
  const config = { playerName, mode };

  if (mode === "classic") {
    // All defaults — 30 days, $5500 debt, 10% interest
    return config;
  }

  if (mode === "choose-days") {
    const days = parseInt(
      document.getElementById("choose-days-slider").value,
      10,
    );
    config.totalDays = days;
    return config;
  }

  if (mode === "advanced") {
    const days = parseInt(document.getElementById("adv-days-slider").value, 10);
    const cash = parseInt(document.getElementById("adv-cash-slider").value, 10);
    const coat = parseInt(document.getElementById("adv-coat-slider").value, 10);

    // Read toggle values
    const policeVal = document.querySelector(
      '[data-group="police"].btn-toggle-active',
    )?.dataset.val;
    const volatilityVal = document.querySelector(
      '[data-group="volatility"].btn-toggle-active',
    )?.dataset.val;

    config.totalDays = days;
    config.startingCash = cash;
    config.startingHold = coat;
    config.policeMod = parseFloat(policeVal || "1");
    config.volatilityMod = parseFloat(volatilityVal || "1");
    return config;
  }

  return config;
}

// ── Event delegation ──────────────────────────────────────────────────────────

function attachEventListeners() {
  // ── Table action buttons (buy / sell / stash / pick-up) ────────────────
  document
    .getElementById("market-body")
    .addEventListener("click", onMarketClick);
  document.getElementById("coat-body").addEventListener("click", onCoatClick);
  document.getElementById("stash-body").addEventListener("click", onStashClick);

  // ── Travel buttons ────────────────────────────────────────────────────
  document
    .getElementById("travel-list")
    .addEventListener("click", onTravelClick);

  // ── Sidebar action buttons ────────────────────────────────────────────
  document
    .getElementById("btn-bank-deposit")
    .addEventListener("click", onBankDeposit);
  document
    .getElementById("btn-bank-withdraw")
    .addEventListener("click", onBankWithdraw);
  document.getElementById("btn-pay-debt").addEventListener("click", onPayDebt);
  document.getElementById("btn-borrow").addEventListener("click", onBorrow);
  document.getElementById("btn-buy-gun").addEventListener("click", onBuyGun);
  document
    .getElementById("btn-upgrade-coat")
    .addEventListener("click", onUpgradeCoat);

  // ── Bandages (Hustler) ────────────────────────────────────────────────
  document
    .getElementById("btn-buy-bandages")
    ?.addEventListener("click", onBuyBandages);

  // ── Clinic (Hustler) ──────────────────────────────────────────────────
  document
    .getElementById("btn-visit-clinic")
    ?.addEventListener("click", onVisitClinic);

  // ── Restart ─────────────────────────────────────────────────────
  document.getElementById("btn-restart")?.addEventListener("click", () => {
    // Go back to intro screen
    document.getElementById("end-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("intro-screen").classList.remove("hidden");
    document.getElementById("player-name-input").focus();
  });
}

// ── Action handlers ───────────────────────────────────────────────────────────

async function onMarketClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const drugId = btn.dataset.drug;

  if (btn.dataset.action === "buy") {
    const price = state.market[drugId];
    const maxAfford = Math.floor(state.cash / price);
    const maxSpace = state.maxHold - currentLoad(state);
    const maxQty = Math.min(maxAfford, maxSpace);

    if (maxQty <= 0) {
      flashLog("Not enough cash or coat space to buy any.");
      return;
    }

    const qty = await promptQuantity(
      `Buy ${drugId}`,
      `Price: $${price.toLocaleString()} each`,
      maxQty,
    );
    if (qty === 0) return;

    const result = buyDrug(state, drugId, qty);
    flashLog(result.message);
    render(state);
  }
}

async function onCoatClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const drugId = btn.dataset.drug;
  const carrying = state.trenchCoat[drugId];

  if (btn.dataset.action === "sell") {
    const price = state.market[drugId];
    const qty = await promptQuantity(
      `Sell ${drugId}`,
      `Price: $${price.toLocaleString()} each`,
      carrying,
    );
    if (qty === 0) return;

    const result = sellDrug(state, drugId, qty);
    flashLog(result.message);
    render(state);
  }

  if (btn.dataset.action === "drop-stash") {
    const qty = await promptQuantity(
      `Stash ${drugId}`,
      `Units in coat: ${carrying}`,
      carrying,
    );
    if (qty === 0) return;

    const result = dropToStash(state, drugId, qty);
    flashLog(result.message);
    render(state);
  }
}

async function onStashClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const drugId = btn.dataset.drug;
  const inStash = state.stash[drugId];

  if (btn.dataset.action === "pick-stash") {
    const space = state.maxHold - currentLoad(state);
    const max = Math.min(inStash, space);

    if (max <= 0) {
      flashLog("No coat space left!");
      return;
    }

    const qty = await promptQuantity(
      `Pick up ${drugId}`,
      `In stash: ${inStash}`,
      max,
    );
    if (qty === 0) return;

    const result = pickFromStash(state, drugId, qty);
    flashLog(result.message);
    render(state);
  }
}

async function onTravelClick(e) {
  const btn = e.target.closest("[data-location]");
  if (!btn) return;
  const locId = btn.dataset.location;

  if (locId === state.location.id) {
    flashLog("You're already here.");
    return;
  }

  const dest = state.locations.find((l) => l.id === locId);
  if (!dest) return;

  // Check if shark visit is appropriate (only if not in jail)
  if (state.jailDays <= 0 && state.debt > 0 && Math.random() < 0.3) {
    const sharkName = state.isHustler ? "Big Vinnie" : "Loan Shark";
    const visit = await promptYesNo(
      sharkName,
      `Would you like to visit ${sharkName.toLowerCase()}?`,
    );
    if (visit) {
      await onPayDebt();
    }
  }

  // Process the turn
  const turnResult = processTurn(state, dest);
  appendLog(state, turnResult.messages);
  render(state);

  // Check for death (Hustler)
  if (state.isOver) {
    showEndScreen(state);
    return;
  }

  // ── Hustler post-travel events ─────────────────────────────────────────
  if (state.isHustler && state.jailDays <= 0) {
    // Police encounter → Fight / Run / Surrender modal
    if (turnResult.policeEncounter) {
      await showPoliceEncounterModal();
      render(state);

      // Death check after combat
      if (state.isOver) {
        showEndScreen(state);
        return;
      }
    }

    // Street vendor
    const vendorItem = rollVendorEncounter();
    if (vendorItem) {
      await showVendorModal(vendorItem);
      render(state);
    }

    // Vinnie job offer
    if (state._pendingVinnieOffer) {
      await showVinnieJobModal(state._pendingVinnieOffer);
      delete state._pendingVinnieOffer;
      render(state);
    }

    // Street intel tip
    const tip = generateTip(state);
    if (tip) {
      appendLog(state, [tip]);
      render(state);
    }

    // Day summary modal
    await showDaySummaryModal(turnResult);
  }

  // Check game-over after all events
  if (state.isOver) {
    showEndScreen(state);
  }
}

// ── Hustler modals ──────────────────────────────────────────────────────────

/**
 * Show Fight / Run / Surrender modal for Officer Hardass encounter.
 */
function showPoliceEncounterModal() {
  return new Promise((resolve) => {
    const deputies = getDeputyCount(state);
    const encounterText = getEncounterText(deputies);

    const html = `
      <div class="police-encounter">
        <p>${encounterText}</p>
        <p class="text-muted">Deputies: ${deputies} | Guns: ${state.guns} | Load: ${currentLoad(state)} units</p>
        <div class="police-btns">
          <button id="police-fight" class="btn btn-danger">⚔️ FIGHT</button>
          <button id="police-run" class="btn btn-warn">🏃 RUN</button>
          <button id="police-surrender" class="btn btn-cancel">🏳️ SURRENDER</button>
        </div>
      </div>`;

    showModal("🚔 Officer Hardass", html);

    document.getElementById("police-fight").addEventListener("click", () => {
      hideModal();
      const result = resolveFight(state);
      appendLog(state, result.messages);
      resolve();
    });

    document.getElementById("police-run").addEventListener("click", () => {
      hideModal();
      const result = resolveRun(state);
      appendLog(state, result.messages);
      resolve();
    });

    document
      .getElementById("police-surrender")
      .addEventListener("click", () => {
        hideModal();
        const result = resolveSurrender(state);
        appendLog(state, result.messages);
        resolve();
      });
  });
}

/**
 * Show vendor offer modal.
 */
function showVendorModal(item) {
  return new Promise((resolve) => {
    const html = `
      <div class="vendor-offer">
        <p>A shady vendor approaches you in the alley...</p>
        <p>${item.icon} <strong>${item.name}</strong> — $${item.cost.toLocaleString()}</p>
        <p class="text-muted">${item.description}</p>
        <p class="text-muted">Cash: $${state.cash.toLocaleString()} | Items: ${state.items.length}/${GAME_CONSTANTS.MAX_ITEMS}</p>
        <div class="modal-btns">
          <button id="vendor-buy" class="btn btn-confirm">BUY</button>
          <button id="vendor-decline" class="btn btn-cancel">DECLINE</button>
        </div>
      </div>`;

    showModal("🎲 Street Vendor", html);

    document.getElementById("vendor-buy").addEventListener("click", () => {
      hideModal();
      const result = buyVendorItem(state, item);
      appendLog(state, [result.message]);
      resolve();
    });

    document.getElementById("vendor-decline").addEventListener("click", () => {
      hideModal();
      appendLog(state, ["You wave off the vendor."]);
      resolve();
    });
  });
}

/**
 * Show end-of-day summary modal (Hustler mode).
 */
function showDaySummaryModal(turnResult) {
  return new Promise((resolve) => {
    const daysLeft = state.totalDays - state.day + 1;
    const hpPct = Math.round((state.hp / state.maxHp) * 100);

    let eventsSummary = "";
    if (turnResult.messages.length > 0) {
      eventsSummary = turnResult.messages.map((m) => `<li>${m}</li>`).join("");
    } else {
      eventsSummary = "<li>Quiet day on the streets.</li>";
    }

    const html = `
      <div class="day-summary">
        <div class="summary-header">
          <span class="summary-day">Day ${state.day}</span>
          <span class="summary-location">${state.location.name}</span>
          <span class="summary-days-left">${daysLeft} days left</span>
        </div>
        <div class="summary-stats">
          <span>💰 $${state.cash.toLocaleString()}</span>
          <span>🏦 $${state.bank.toLocaleString()}</span>
          <span>💳 $${state.debt.toLocaleString()}</span>
          <span>🏥 ${state.hp}/${state.maxHp} HP (${hpPct}%)</span>
        </div>
        <div class="summary-events">
          <strong>Events:</strong>
          <ul>${eventsSummary}</ul>
        </div>
        <div class="modal-btns">
          <button id="summary-continue" class="btn btn-confirm">CONTINUE</button>
        </div>
      </div>`;

    showModal("📅 Day Summary", html);

    document
      .getElementById("summary-continue")
      .addEventListener("click", () => {
        hideModal();
        resolve();
      });
  });
}

// ── Classic action handlers ───────────────────────────────────────────────────

async function onBankDeposit() {
  if (state.cash <= 0) {
    flashLog("No cash to deposit.");
    return;
  }
  const amount = await promptAmount(
    "Bank Deposit",
    "How much to deposit?",
    state.cash,
  );
  if (amount === 0) return;
  const result = bankDeposit(state, amount);
  flashLog(result.message);
  render(state);
}

async function onBankWithdraw() {
  if (state.bank <= 0) {
    flashLog("Nothing in the bank.");
    return;
  }
  const amount = await promptAmount(
    "Bank Withdrawal",
    "How much to withdraw?",
    state.bank,
  );
  if (amount === 0) return;
  const result = bankWithdraw(state, amount);
  flashLog(result.message);
  render(state);
}

async function onPayDebt() {
  if (state.debt <= 0) {
    flashLog("No debt to pay.");
    return;
  }
  if (state.cash <= 0) {
    flashLog("No cash to pay with.");
    return;
  }
  const max = Math.min(state.cash, state.debt);
  const amount = await promptAmount(
    "Pay Debt",
    `Debt: $${state.debt.toLocaleString()}. How much to pay?`,
    max,
  );
  if (amount === 0) return;
  const result = payDebt(state, amount);
  flashLog(result.message);
  render(state);
}

async function onBorrow() {
  const ratePct = (
    (state?.interestRate ?? GAME_CONSTANTS.INTEREST_RATE) * 100
  ).toFixed(1);
  const amount = await promptAmount(
    "Borrow from Shark",
    `How much to borrow? (${ratePct}% daily interest!)`,
    10000,
  );
  if (amount === 0) return;
  const result = borrowFromShark(state, amount);
  flashLog(result.message);
  render(state);
}

async function onBuyGun() {
  const confirm = await promptYesNo(
    "Buy Gun",
    `Cost: $${GAME_CONSTANTS.GUN_COST}. Guns protect against muggers.`,
  );
  if (!confirm) return;
  const result = buyGun(state);
  flashLog(result.message);
  render(state);
}

async function onUpgradeCoat() {
  const confirm = await promptYesNo(
    "Upgrade Coat",
    `Cost: $${GAME_CONSTANTS.COAT_UPGRADE_COST}. Adds +${GAME_CONSTANTS.COAT_UPGRADE_SIZE} carry space.`,
  );
  if (!confirm) return;
  const result = upgradeCoat(state);
  flashLog(result.message);
  render(state);
}

async function onBuyBandages() {
  if (!state.isHustler) return;
  const confirm = await promptYesNo(
    "Buy Bandages",
    `Cost: $${GAME_CONSTANTS.BANDAGE_COST}. Heals ${GAME_CONSTANTS.BANDAGE_HEAL} HP. Current HP: ${state.hp}/${state.maxHp}.`,
  );
  if (!confirm) return;
  const result = buyBandages(state);
  flashLog(result.message);
  render(state);
}

async function onVisitClinic() {
  if (!state.isHustler) return;
  const confirm = await promptYesNo(
    "🏥 Visit Clinic",
    `Full heal for $${GAME_CONSTANTS.CLINIC_COST.toLocaleString()}. Current HP: ${state.hp}/${state.maxHp}.`,
  );
  if (!confirm) return;
  const result = visitClinic(state);
  flashLog(result.message);
  render(state);
}

/**
 * Show Vinnie's job offer modal.
 */
function showVinnieJobModal(offer) {
  return new Promise((resolve) => {
    const forgiveAmt = Math.round(
      state.debt * GAME_CONSTANTS.VINNIE_JOB_REWARD_RATIO,
    );
    const html = `
      <div class="vinnie-job-offer">
        <p>Big Vinnie leans in close...</p>
        <p><em>"I got a job for you. Do this and I'll knock
        $${forgiveAmt.toLocaleString()} off your debt."</em></p>
        <p class="vinnie-job-details">
          📦 Deliver <strong>${offer.amount}× ${offer.drugId}</strong> to
          <strong>${offer.locationName}</strong> within
          <strong>${GAME_CONSTANTS.VINNIE_JOB_DEADLINE} days</strong>.
        </p>
        <p class="text-muted">Fail and his boys will find you.
        (−${GAME_CONSTANTS.VINNIE_JOB_FAIL_HP} HP, −$${GAME_CONSTANTS.VINNIE_JOB_FAIL_CASH})</p>
        <div class="modal-btns">
          <button id="vinnie-accept" class="btn btn-confirm">ACCEPT</button>
          <button id="vinnie-decline" class="btn btn-cancel">DECLINE</button>
        </div>
      </div>`;

    showModal("🏦 Big Vinnie's Offer", html);

    document.getElementById("vinnie-accept").addEventListener("click", () => {
      hideModal();
      state.vinnieJob = {
        drugId: offer.drugId,
        locationId: offer.locationId,
        locationName: offer.locationName,
        amount: offer.amount,
        deadline: offer.deadline,
      };
      appendLog(state, [
        `📦 Accepted Vinnie's job: deliver ${offer.amount}× ${offer.drugId} to ${offer.locationName} by day ${offer.deadline}.`,
      ]);
      resolve();
    });

    document.getElementById("vinnie-decline").addEventListener("click", () => {
      hideModal();
      appendLog(state, ["You turned down Vinnie's offer. He doesn't look pleased."]);
      resolve();
    });
  });
}

// ── Log helper ────────────────────────────────────────────────────────────────

function flashLog(message) {
  appendLog(state, [message]);
}
