/**
 * modal.js — Modal dialog builders.
 * Each builder calls showModal() with the right form HTML,
 * then returns a Promise that resolves with the player's input.
 */
import { showModal, hideModal } from "./render.js";
import { currentLoad } from "../engine/state.js";

// ── Generic quantity prompt ───────────────────────────────────────────────────

/**
 * Show a modal asking the player to enter a quantity.
 * Resolves with the integer the player entered, or 0 on cancel.
 */
export function promptQuantity(title, label, max) {
  return new Promise((resolve) => {
    const html = `
      <p class="modal-label">${label}</p>
      <input id="modal-qty-input" type="number" min="1" max="${max}" value="1" class="modal-input" />
      <p class="modal-max">Max: ${max}</p>
      <div class="modal-btns">
        <button id="modal-ok"     class="btn btn-confirm">CONFIRM</button>
        <button id="modal-cancel" class="btn btn-cancel">CANCEL</button>
        <button id="modal-max-btn" class="btn btn-max">MAX</button>
      </div>`;

    showModal(title, html);

    const input = document.getElementById("modal-qty-input");
    const okBtn = document.getElementById("modal-ok");
    const cancelBtn = document.getElementById("modal-cancel");
    const maxBtn = document.getElementById("modal-max-btn");

    input.focus();
    input.select();

    okBtn.addEventListener("click", () => {
      const val = Math.max(1, Math.min(max, parseInt(input.value, 10) || 1));
      hideModal();
      resolve(val);
    });

    cancelBtn.addEventListener("click", () => {
      hideModal();
      resolve(0);
    });

    maxBtn.addEventListener("click", () => {
      input.value = max;
    });

    // Enter key submits
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") okBtn.click();
      if (e.key === "Escape") cancelBtn.click();
    });
  });
}

// ── Yes / No prompt ──────────────────────────────────────────────────────────

/**
 * Show a yes/no modal. Resolves with true (yes) or false (no).
 */
export function promptYesNo(title, question) {
  return new Promise((resolve) => {
    const html = `
      <p class="modal-label">${question}</p>
      <div class="modal-btns">
        <button id="modal-yes" class="btn btn-confirm">YES</button>
        <button id="modal-no"  class="btn btn-cancel">NO</button>
      </div>`;

    showModal(title, html);

    document.getElementById("modal-yes").addEventListener("click", () => {
      hideModal();
      resolve(true);
    });
    document.getElementById("modal-no").addEventListener("click", () => {
      hideModal();
      resolve(false);
    });
  });
}

// ── Amount prompt ────────────────────────────────────────────────────────────

/**
 * Show a modal asking for a dollar amount.
 * Resolves with the integer, or 0 on cancel.
 */
export function promptAmount(title, label, max) {
  return new Promise((resolve) => {
    const html = `
      <p class="modal-label">${label}</p>
      <input id="modal-amt-input" type="number" min="1" max="${max}" value="${max}" class="modal-input" />
      <p class="modal-max">Max: $${max.toLocaleString()}</p>
      <div class="modal-btns">
        <button id="modal-ok"     class="btn btn-confirm">CONFIRM</button>
        <button id="modal-cancel" class="btn btn-cancel">CANCEL</button>
        <button id="modal-max-btn" class="btn btn-max">MAX</button>
      </div>`;

    showModal(title, html);

    const input = document.getElementById("modal-amt-input");
    const okBtn = document.getElementById("modal-ok");
    const cancelBtn = document.getElementById("modal-cancel");
    const maxBtn = document.getElementById("modal-max-btn");

    input.focus();
    input.select();

    okBtn.addEventListener("click", () => {
      const val = Math.max(1, Math.min(max, parseInt(input.value, 10) || 1));
      hideModal();
      resolve(val);
    });

    cancelBtn.addEventListener("click", () => {
      hideModal();
      resolve(0);
    });

    maxBtn.addEventListener("click", () => {
      input.value = max;
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") okBtn.click();
      if (e.key === "Escape") cancelBtn.click();
    });
  });
}
