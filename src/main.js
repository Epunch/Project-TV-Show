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
  buyFromConnect,
  buyFromStreet,
  sellOnStreet,
  cutDrug,
  upgradeCoatRealism,
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
import { DRUGS } from "./data/drugs.js";
import {
  resetConnectTrustOnArrest,
  checkConnectBurnt,
} from "./engine/reputation.js";
import { getStreetBuyPrice } from "./engine/market.js";
import { fmtMoney, fmtWeight, LOCALE } from "./data/locale.js";

// ── Bootstrap ───────────────────────────────────────────────────────────────────────────

let state;

// ── Theme ───────────────────────────────────────────────────────────────────────────

const THEME_KEY = "drugwars-theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  const btn = document.getElementById("btn-theme-toggle");
  if (btn) btn.textContent = theme === "light" ? "Dark" : "Light";
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
  // Hide intro + hustler + realism screens, show game
  document.getElementById("intro-screen").classList.add("hidden");
  document.getElementById("hustler-info-screen").classList.add("hidden");
  document.getElementById("realism-info-screen")?.classList.add("hidden");
  const gameScreen = document.getElementById("game-screen");
  gameScreen.classList.remove("hidden");
  gameScreen.classList.remove("screen-fade");
  void gameScreen.offsetWidth;
  gameScreen.classList.add("screen-fade");

  // Wire theme toggle (only available once game screen is visible)
  document
    .getElementById("btn-theme-toggle")
    .addEventListener("click", toggleTheme);

  // Boot engine
  bindElements();
  state = createInitialState(config);

  // Show / hide Hustler-specific UI
  if (state.isHustler || state.isRealism) {
    document.getElementById("stat-hp-row")?.classList.remove("hidden");
    document.getElementById("items-row")?.classList.remove("hidden");
    document.getElementById("btn-buy-bandages")?.classList.remove("hidden");
  }

  // Show / hide Realism-specific UI
  if (state.isRealism) {
    document.getElementById("realism-stats-row")?.classList.remove("hidden");
    // Update coat upgrade button for realism pricing
    const coatBtn = document.getElementById("btn-upgrade-coat");
    if (coatBtn)
      coatBtn.textContent = `Upgrade Coat (${fmtMoney(GAME_CONSTANTS.REALISM_COAT_UPGRADE_COST)})`;
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
    chooseDaysDebt.textContent = fmtMoney(scaledDebt(days));
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
    advDebtPreview.textContent = fmtMoney(scaledDebt(days));
    advRatePreview.textContent = (scaledRate(days) * 100).toFixed(1) + "%";
  });

  advCashSlider?.addEventListener("input", () => {
    advCashVal.textContent = fmtMoney(parseInt(advCashSlider.value, 10));
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
    hustlerDebtPreview.textContent = fmtMoney(scaledDebt(days));
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

  // ── Realism mode button ───────────────────────────────────────────────────
  document.getElementById("btn-realism-mode")?.addEventListener("click", () => {
    document.getElementById("intro-screen").classList.add("hidden");
    document.getElementById("realism-info-screen").classList.remove("hidden");
  });

  // ── Realism back button ───────────────────────────────────────────────────
  document.getElementById("btn-realism-back")?.addEventListener("click", () => {
    document.getElementById("realism-info-screen").classList.add("hidden");
    document.getElementById("intro-screen").classList.remove("hidden");
  });

  // ── Realism days slider ───────────────────────────────────────────────────
  const realismDaysSlider = document.getElementById("realism-days-slider");
  const realismDaysVal = document.getElementById("realism-days-val");

  realismDaysSlider?.addEventListener("input", () => {
    realismDaysVal.textContent = realismDaysSlider.value;
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

  // ── Start Realism Mode button ─────────────────────────────────────────────
  document
    .getElementById("btn-start-realism")
    ?.addEventListener("click", () => {
      const playerName = nameInput.value.trim() || "Anonymous";
      const days = parseInt(
        document.getElementById("realism-days-slider")?.value ?? "60",
        10,
      );
      startGame({
        playerName,
        mode: "realism",
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
    document.getElementById("realism-info-screen")?.classList.add("hidden");
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
      `Price: ${fmtMoney(price)} each`,
      maxQty,
    );
    if (qty === 0) return;

    const result = buyDrug(state, drugId, qty);
    flashLog(result.message);
    render(state);
  }

  // Realism: buy from street (expensive retail)
  if (btn.dataset.action === "buy-street") {
    const price = getStreetBuyPrice(drugId, state.market);
    const maxAfford = Math.floor(state.cash / price);
    const maxSpace = state.maxHold - currentLoad(state);
    const maxQty = Math.min(maxAfford, maxSpace);

    if (maxQty <= 0) {
      flashLog("Not enough cash or coat space.");
      return;
    }

    const qty = await promptQuantity(
      `Buy ${drugId} (Street)`,
      `Street price: ${fmtMoney(price)}${LOCALE.useMetricWeight ? "/g" : "/oz"} (expensive!)`,

      maxQty,
    );
    if (qty === 0) return;

    const result = buyFromStreet(state, drugId, qty);
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
      `Price: ${fmtMoney(price)} each`,
      carrying,
    );
    if (qty === 0) return;

    const result = sellDrug(state, drugId, qty);
    flashLog(result.message);
    render(state);
  }

  // Realism: sell on street (with tax, purity, rep)
  if (btn.dataset.action === "sell-street") {
    const basePrice = state.market[drugId];
    const purity = state.coatPurity[drugId] ?? 100;
    const purityMod = 0.5 + (purity / 100) * 0.5;
    const effectivePrice = Math.round(basePrice * purityMod);

    const qty = await promptQuantity(
      `Sell ${drugId} (${purity}% pure)`,
      `Effective price: ~${fmtMoney(effectivePrice)}${LOCALE.useMetricWeight ? "/g" : "/oz"} (tax applies)`,
      carrying,
    );
    if (qty === 0) return;

    const result = sellOnStreet(state, drugId, qty);
    flashLog(result.message);
    render(state);
  }

  // Realism: cut product
  if (btn.dataset.action === "cut") {
    const currentPurity = state.coatPurity[drugId] ?? 100;
    await showCutModal(drugId, currentPurity);
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

  // Vinnie visit prompt — Hustler / Realism only (classic has no named shark)
  if (
    (state.isHustler || state.isRealism) &&
    state.jailDays <= 0 &&
    state.debt > 0 &&
    Math.random() < 0.3
  ) {
    const visit = await promptYesNo(
      "Big Vinnie",
      "Would you like to visit Big Vinnie?",
    );
    if (visit) {
      await onPayDebt();
    }
  }

  // Process the turn
  const turnResult = processTurn(state, dest);
  appendLog(state, turnResult.messages);
  render(state);

  // Flash the newly-arrived location button
  const arrivedBtn = document.querySelector(
    `#travel-list [data-location="${state.location.id}"]`,
  );
  if (arrivedBtn) {
    arrivedBtn.classList.remove("btn-travel-arrived");
    void arrivedBtn.offsetWidth;
    arrivedBtn.classList.add("btn-travel-arrived");
    arrivedBtn.addEventListener(
      "animationend",
      () => arrivedBtn.classList.remove("btn-travel-arrived"),
      { once: true },
    );
  }

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
  }

  // ── Realism post-travel events ─────────────────────────────────────────
  if (state.isRealism && state.jailDays <= 0) {
    // Police encounter (shared with hustler)
    if (turnResult.policeEncounter) {
      await showPoliceEncounterModal();
      render(state);

      if (state.isOver) {
        showEndScreen(state);
        return;
      }
    }

    // Street vendor (shared with hustler)
    const vendorItem = rollVendorEncounter();
    if (vendorItem) {
      await showVendorModal(vendorItem);
      render(state);
    }

    // Vinnie job offer (realism has Vinnie too)
    if (state._pendingVinnieOffer) {
      await showVinnieJobModal(state._pendingVinnieOffer);
      delete state._pendingVinnieOffer;
      render(state);
    }

    // Tommy Bags favour offer (only if not completed and no pending favour)
    if (
      !state.favourCompleted &&
      !state.pendingFavour &&
      Math.random() < 0.12 &&
      state.reputation >= 15
    ) {
      // Pick a random drug & destination
      const favourDrugs = ["cocaine", "heroin", "crack", "weed", "speed"];
      const favDrug =
        favourDrugs[Math.floor(Math.random() * favourDrugs.length)];
      const drugDef = DRUGS.find((d) => d.id === favDrug);
      const destinations = state.locations.filter(
        (l) => l.id !== state.location.id,
      );
      const dest =
        destinations[Math.floor(Math.random() * destinations.length)];

      await showFavourModal({
        drugId: favDrug,
        drugName: drugDef?.name ?? favDrug,
        qty: GAME_CONSTANTS.FAVOUR_DRUG_QTY,
        locationId: dest.id,
        locationName: dest.name,
        deadline: GAME_CONSTANTS.FAVOUR_DEADLINE,
      });
      render(state);
    }

    // Check favour completion (arrived at target with goods)
    if (state.pendingFavour) {
      const f = state.pendingFavour;
      if (
        state.location.id === f.locationId &&
        (state.trenchCoat[f.drugId] ?? 0) >= f.amount
      ) {
        // Auto-complete favour
        state.trenchCoat[f.drugId] -= f.amount;
        state.favourCompleted = true;
        state.reputation += GAME_CONSTANTS.REP_FAVOUR_REWARD;
        state.pendingFavour = null;
        appendLog(state, [
          `Tommy Bags' favour COMPLETED! Delivered ${f.amount} oz of ${f.drugId}. Tommy's connect on Staten Island is now unlocked! (+${GAME_CONSTANTS.REP_FAVOUR_REWARD} rep)`,
        ]);
        render(state);
      }
    }

    // Connect encounter (Realism) — offer was rolled in processTurn
    if (state._pendingConnectOffer) {
      const offer = state._pendingConnectOffer;
      delete state._pendingConnectOffer;
      await showConnectEncounterModal(offer.connect, offer);
      render(state);
    }

    // Street intel tip
    const tip = generateTip(state);
    if (tip) {
      appendLog(state, [tip]);
      render(state);
    }
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
          <button id="police-fight" class="btn btn-danger">FIGHT</button>
          <button id="police-run" class="btn btn-warn">RUN</button>
          <button id="police-surrender" class="btn btn-cancel">SURRENDER</button>
        </div>
      </div>`;

    showModal("Officer Hardass", html);

    document.getElementById("police-fight").addEventListener("click", () => {
      hideModal();
      const result = resolveFight(state);
      appendLog(state, result.messages);
      // If fight results in jail (loss), reset connect trust
      if (state.isRealism && state.jailDays > 0) {
        resetConnectTrustOnArrest(state, state.location.id);
        checkConnectBurnt(state, state.location.id);
      }
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
        // Reset connect trust + check burnt connect on arrest
        if (state.isRealism) {
          resetConnectTrustOnArrest(state, state.location.id);
          checkConnectBurnt(state, state.location.id);
        }
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
        <p><strong>${item.name}</strong> — ${fmtMoney(item.cost)}</p>
        <p class="text-muted">${item.description}</p>
        <p class="text-muted">Cash: ${fmtMoney(state.cash)} | Items: ${state.items.length}/${GAME_CONSTANTS.MAX_ITEMS}</p>
        <div class="modal-btns">
          <button id="vendor-buy" class="btn btn-confirm">BUY</button>
          <button id="vendor-decline" class="btn btn-cancel">DECLINE</button>
        </div>
      </div>`;

    showModal("Street Vendor", html);

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
          <span>cash: ${fmtMoney(state.cash)}</span>
          <span>bank: ${fmtMoney(state.bank)}</span>
          <span>debt: ${fmtMoney(state.debt)}</span>
          <span>hp: ${state.hp}/${state.maxHp} (${hpPct}%)</span>
        </div>
        <div class="summary-events">
          <strong>Events:</strong>
          <ul>${eventsSummary}</ul>
        </div>
        <div class="modal-btns">
          <button id="summary-continue" class="btn btn-confirm">CONTINUE</button>
        </div>
      </div>`;

    showModal("Day Summary", html);

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
    `Debt: ${fmtMoney(state.debt)}. How much to pay?`,

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
    `Cost: ${fmtMoney(GAME_CONSTANTS.GUN_COST)}. Guns protect against muggers.`,
  );
  if (!confirm) return;
  const result = buyGun(state);
  flashLog(result.message);
  render(state);
}

async function onUpgradeCoat() {
  if (state.isRealism) {
    const confirm = await promptYesNo(
      "Upgrade Coat",
      `Cost: ${fmtMoney(GAME_CONSTANTS.REALISM_COAT_UPGRADE_COST)}. Adds +${GAME_CONSTANTS.REALISM_COAT_UPGRADE_SIZE}${LOCALE.useMetricWeight ? "g" : " oz"} carry space. (Max: ${GAME_CONSTANTS.REALISM_COAT_UPGRADE_MAX}${LOCALE.useMetricWeight ? "g" : " oz"})`,
    );
    if (!confirm) return;
    const result = upgradeCoatRealism(state);
    flashLog(result.message);
    render(state);
    return;
  }
  const confirm = await promptYesNo(
    "Upgrade Coat",
    `Cost: ${fmtMoney(GAME_CONSTANTS.COAT_UPGRADE_COST)}. Adds +${GAME_CONSTANTS.COAT_UPGRADE_SIZE} carry space.`,
  );
  if (!confirm) return;
  const result = upgradeCoat(state);
  flashLog(result.message);
  render(state);
}

async function onBuyBandages() {
  if (!state.isHustler && !state.isRealism) return;
  const confirm = await promptYesNo(
    "Buy Bandages",
    `Cost: ${fmtMoney(GAME_CONSTANTS.BANDAGE_COST)}. Heals ${GAME_CONSTANTS.BANDAGE_HEAL} HP. Current HP: ${state.hp}/${state.maxHp}.`,
  );
  if (!confirm) return;
  const result = buyBandages(state);
  flashLog(result.message);
  render(state);
}

async function onVisitClinic() {
  if (!state.isHustler && !state.isRealism) return;
  const confirm = await promptYesNo(
    "Visit Clinic",
    `Full heal for ${fmtMoney(GAME_CONSTANTS.CLINIC_COST)}. Current HP: ${state.hp}/${state.maxHp}.`,
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
        ${fmtMoney(forgiveAmt)} off your debt."</em></p>
        <p class="vinnie-job-details">
          Deliver <strong>${offer.amount}× ${offer.drugId}</strong> to
          <strong>${offer.locationName}</strong> within
          <strong>${GAME_CONSTANTS.VINNIE_JOB_DEADLINE} days</strong>.
        </p>
        <p class="text-muted">Fail and his boys will find you.
        (−${GAME_CONSTANTS.VINNIE_JOB_FAIL_HP} HP, −${fmtMoney(GAME_CONSTANTS.VINNIE_JOB_FAIL_CASH)})</p>
        <div class="modal-btns">
          <button id="vinnie-accept" class="btn btn-confirm">ACCEPT</button>
          <button id="vinnie-decline" class="btn btn-cancel">DECLINE</button>
        </div>
      </div>`;

    showModal("Big Vinnie's Offer", html);

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
        `Accepted Vinnie's job: deliver ${offer.amount}× ${offer.drugId} to ${offer.locationName} by day ${offer.deadline}.`,
      ]);
      resolve();
    });

    document.getElementById("vinnie-decline").addEventListener("click", () => {
      hideModal();
      appendLog(state, [
        "You turned down Vinnie's offer. He doesn't look pleased.",
      ]);
      resolve();
    });
  });
}

// ── Realism modals ──────────────────────────────────────────────────────────

/**
 * Show a connect encounter modal — triggered by travel, not a button.
 * Offer is pre-computed by rollConnectEncounter() in turn.js.
 *
 * @param {Object} connect — connect definition
 * @param {Object} offer — { drugId, quantity, unitPrice, advertisedPurity, realPurity, isSteppedOn, tier }
 */
function showConnectEncounterModal(connect, offer) {
  return new Promise((resolve) => {
    const drug = DRUGS.find((d) => d.id === offer.drugId);
    const drugName = drug?.name ?? offer.drugId;
    const totalCost = offer.unitPrice * offer.quantity;
    const spaceLeft = state.maxHold - currentLoad(state);
    const tier = offer.tier ?? 0;
    const tierLabel = ["Tier 0", "Tier 1", "Tier 2", "Tier 3"][tier];

    const canAfford = state.cash >= totalCost;
    const hasSpace = spaceLeft >= offer.quantity;
    const canTake = canAfford && hasSpace;

    const weightUnit = LOCALE.useMetricWeight ? "g" : "oz";
    const priceUnit = LOCALE.useMetricWeight ? "/g" : "/oz";

    // Build constraint warnings
    const warnings = [];
    if (!canAfford)
      warnings.push(
        `Not enough cash — need ${fmtMoney(totalCost)}, have ${fmtMoney(state.cash)}.`,
      );
    if (!hasSpace)
      warnings.push(
        `Not enough coat space — need ${offer.quantity} oz, have ${spaceLeft} oz.`,
      );

    const html = `
      <div class="connect-encounter">
        <p class="connect-flavour"><em>"${connect.flavour}"</em></p>
        <div class="connect-offer-block">
          <table class="connect-table">
            <thead>
              <tr><th>Drug</th><th>Qty</th><th>Price</th><th>Purity</th><th>Total</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${drugName}</strong></td>
                <td>${fmtWeight(offer.quantity, true)}</td>
                <td>${fmtMoney(offer.unitPrice)}${priceUnit}</td>
                <td>${offer.advertisedPurity}%</td>
                <td>${fmtMoney(totalCost)}</td>
              </tr>
            </tbody>
          </table>
          <p class="text-muted connect-offer-meta">
            ${connect.personality} &nbsp;|&nbsp; ${tierLabel} &nbsp;|&nbsp;
            Heat spike: +${connect.heatSpike ?? 8}
          </p>
          ${warnings.map((w) => `<p class="text-danger">${w}</p>`).join("")}
        </div>
        <div class="modal-btns">
          <button id="connect-take" class="btn btn-confirm" ${canTake ? "" : "disabled"}>TAKE THE DEAL</button>
          <button id="connect-pass" class="btn btn-cancel">PASS</button>
        </div>
      </div>`;

    showModal(`${connect.name} — ${connect.locationId.toUpperCase()}`, html);

    document.getElementById("connect-take").addEventListener("click", () => {
      hideModal();
      const result = buyFromConnect(state, connect, offer);
      appendLog(state, [result.message]);
      if (!result.ok) flashLog(result.message);
      render(state);
      resolve();
    });

    document.getElementById("connect-pass").addEventListener("click", () => {
      hideModal();
      appendLog(state, [`Passed on ${connect.name}'s deal.`]);
      resolve();
    });
  });
}

/**
 * Show the cut/dilute interface for a drug.
 */
function showCutModal(drugId, currentPurity) {
  return new Promise((resolve) => {
    const currentQty = state.trenchCoat[drugId] ?? 0;
    const drug = DRUGS.find((d) => d.id === drugId);
    const minPurity = GAME_CONSTANTS.CUT_MIN_PURITY;

    // Preview for the default (min purity)
    const defaultTarget = Math.max(minPurity, currentPurity - 10);
    const previewQty = Math.floor(currentQty * (currentPurity / defaultTarget));
    const previewGain = previewQty - currentQty;

    const html = `
      <div class="cut-modal">
        <p><strong>${drug?.name ?? drugId}</strong> — ${fmtWeight(currentQty, true)} @ ${currentPurity}% pure</p>
        <p class="text-muted">Cut it down to increase volume. Lower purity = more oz but buyers notice.</p>
        <div class="cut-slider-row">
          <label>Target purity: <strong id="cut-target-val">${defaultTarget}%</strong></label>
          <input id="cut-purity-slider" type="range" min="${minPurity}" max="${currentPurity - 1}" value="${defaultTarget}" />
        </div>
        <p class="cut-preview">New volume: <strong id="cut-new-qty">${fmtWeight(previewQty, true)}</strong> (+<span id="cut-gain">${fmtWeight(previewGain, true)}</span>)</p>
        <p class="text-muted" id="cut-warning">${defaultTarget < GAME_CONSTANTS.CUT_BAD_REP_THRESHOLD ? "Below " + GAME_CONSTANTS.CUT_BAD_REP_THRESHOLD + "% = reputation penalty on sale" : ""}</p>
        <div class="modal-btns">
          <button id="cut-confirm" class="btn btn-confirm">CUT IT</button>
          <button id="cut-cancel" class="btn btn-cancel">CANCEL</button>
        </div>
      </div>`;

    showModal(`Cut ${drug?.name ?? drugId}`, html);

    const slider = document.getElementById("cut-purity-slider");
    const targetVal = document.getElementById("cut-target-val");
    const newQtyEl = document.getElementById("cut-new-qty");
    const gainEl = document.getElementById("cut-gain");
    const warningEl = document.getElementById("cut-warning");

    slider.addEventListener("input", () => {
      const target = parseInt(slider.value, 10);
      targetVal.textContent = target + "%";
      const newQ = Math.floor(currentQty * (currentPurity / target));
      const gain = newQ - currentQty;
      newQtyEl.textContent = fmtWeight(newQ, true);
      gainEl.textContent = fmtWeight(gain, true);
      warningEl.textContent =
        target < GAME_CONSTANTS.CUT_BAD_REP_THRESHOLD
          ? `Below ${GAME_CONSTANTS.CUT_BAD_REP_THRESHOLD}% = reputation penalty on sale`
          : "";
    });

    document.getElementById("cut-confirm").addEventListener("click", () => {
      const targetPurity = parseInt(slider.value, 10);
      hideModal();
      const result = cutDrug(state, drugId, targetPurity);
      flashLog(result.message);
      resolve();
    });

    document.getElementById("cut-cancel").addEventListener("click", () => {
      hideModal();
      resolve();
    });
  });
}

/**
 * Show Tommy Bags favour offer modal.
 */
function showFavourModal(offer) {
  return new Promise((resolve) => {
    const html = `
      <div class="favour-modal">
        <p>A runner pulls you aside...</p>
        <p><em>"Tommy Bags is looking for someone he can trust.
        Do this for him and he'll set you up with his people on Staten Island."</em></p>
        <p class="favour-details">
          Deliver <strong>${fmtWeight(offer.qty, true)} of ${offer.drugName}</strong> to
          <strong>${offer.locationName}</strong> within
          <strong>${offer.deadline} days</strong>.
        </p>
        <p class="text-muted">Succeed: unlock Tommy Bags as a connect (+${GAME_CONSTANTS.REP_FAVOUR_REWARD} rep)</p>
        <p class="text-muted">Fail: lose the product and take a reputation hit.</p>
        <div class="modal-btns">
          <button id="favour-accept" class="btn btn-confirm">ACCEPT</button>
          <button id="favour-decline" class="btn btn-cancel">DECLINE</button>
        </div>
      </div>`;

    showModal("Tommy Bags' Favour", html);

    document.getElementById("favour-accept").addEventListener("click", () => {
      hideModal();
      state.pendingFavour = {
        drugId: offer.drugId,
        amount: offer.qty,
        locationId: offer.locationId,
        locationName: offer.locationName,
        deadline: state.day + offer.deadline,
      };
      appendLog(state, [
        `Accepted Tommy's favour: deliver ${fmtWeight(offer.qty, true)} of ${offer.drugName} to ${offer.locationName} by day ${state.day + offer.deadline}.`,
      ]);
      resolve();
    });

    document.getElementById("favour-decline").addEventListener("click", () => {
      hideModal();
      appendLog(state, ["You pass on Tommy's offer. Maybe next time."]);
      resolve();
    });
  });
}

/**
 * Show realism day summary modal (richer than hustler summary).
 */
function showRealismDaySummaryModal(turnResult) {
  return new Promise((resolve) => {
    const daysLeft = state.totalDays - state.day + 1;
    const hpPct = Math.round((state.hp / state.maxHp) * 100);
    const heat = state.boroughHeat[state.location.id] ?? 0;
    const heatPct = Math.round(heat * 100);

    let eventsSummary = "";
    if (turnResult.messages.length > 0) {
      eventsSummary = turnResult.messages.map((m) => `<li>${m}</li>`).join("");
    } else {
      eventsSummary = "<li>Quiet day on the streets.</li>";
    }

    // Active supply events
    let supplyInfo = "";
    for (const [drugId, evt] of Object.entries(state.supplyEvents)) {
      if (evt && evt.endsOn > state.day) {
        const label = evt.type === "drought" ? "DROUGHT" : "FLOOD";
        supplyInfo += `<li>[${label}] ${drugId}: ends day ${evt.endsOn}</li>`;
      }
    }
    if (supplyInfo) {
      supplyInfo = `<div class="summary-supply"><strong>Supply Events:</strong><ul>${supplyInfo}</ul></div>`;
    }

    // Favour status
    let favourInfo = "";
    if (state.pendingFavour) {
      const f = state.pendingFavour;
      const daysRemaining = f.deadline - state.day;
      favourInfo = `<p class="favour-status">Favour: ${f.amount} oz of ${f.drugId} → ${f.locationName} (${daysRemaining} days left)</p>`;
    }

    const html = `
      <div class="day-summary realism-summary">
        <div class="summary-header">
          <span class="summary-day">Day ${state.day}</span>
          <span class="summary-location">${state.location.name}</span>
          <span class="summary-days-left">${daysLeft} days left</span>
        </div>
        <div class="summary-stats">
          <span>cash: ${fmtMoney(state.cash)}</span>
          <span>bank: ${fmtMoney(state.bank)}</span>
          <span>debt: ${fmtMoney(state.debt)}</span>
          <span>hp: ${state.hp}/${state.maxHp} (${hpPct}%)</span>
          <span>rep: ${Math.floor(state.reputation)}</span>
          <span class="${heatPct >= 50 ? "stat-heat-high" : ""}">heat: ${heatPct}%</span>
        </div>
        ${supplyInfo}
        ${favourInfo}
        <div class="summary-events">
          <strong>Events:</strong>
          <ul>${eventsSummary}</ul>
        </div>
        <div class="modal-btns">
          <button id="summary-continue" class="btn btn-confirm">CONTINUE</button>
        </div>
      </div>`;

    showModal("Day Summary", html);

    document
      .getElementById("summary-continue")
      .addEventListener("click", () => {
        hideModal();
        resolve();
      });
  });
}

// ── Log helper ────────────────────────────────────────────────────────────────

function flashLog(message) {
  appendLog(state, [message]);
}
