/**
 * Random events that can fire on travel.
 * Each event has:
 *   - id          : unique key
 *   - message     : display text shown to the player
 *   - type        : 'police' | 'market' | 'windfall' | 'loss' | 'shark' | 'mugger'
 *   - probability : base chance per travel (0–1); can be scaled externally
 *   - apply(state): mutates game state and returns a result message string
 */
export const EVENTS = [
  // ── Police encounters ─────────────────────────────────────────────────────
  {
    id: "police_small",
    message: "A cop spots you! You drop some product and run.",
    type: "police",
    probability: 0.12,
    apply(state) {
      const drugIds = Object.keys(state.trenchCoat).filter(
        (id) => state.trenchCoat[id] > 0,
      );
      if (drugIds.length === 0) return "They found nothing on you. Lucky.";
      const drugId = drugIds[Math.floor(Math.random() * drugIds.length)];
      const lost = Math.ceil(state.trenchCoat[drugId] * 0.3);
      state.trenchCoat[drugId] -= lost;
      return `You lost ${lost} units of ${drugId}.`;
    },
  },
  {
    id: "police_large",
    message: "Police raid! You barely escape but lose most of your stash.",
    type: "police",
    probability: 0.05,
    apply(state) {
      let totalLost = 0;
      for (const id of Object.keys(state.trenchCoat)) {
        const lost = Math.ceil(state.trenchCoat[id] * 0.6);
        state.trenchCoat[id] -= lost;
        totalLost += lost;
      }
      return `You lost ${totalLost} units total in the raid.`;
    },
  },
  {
    id: "police_gun_seized",
    message: "Cops stop and frisk you. They find a gun.",
    type: "police",
    probability: 0.04,
    apply(state) {
      if (state.guns > 0) {
        state.guns -= 1;
        return "They confiscated one of your guns.";
      }
      return "They found nothing. Move along.";
    },
  },

  // ── Market events ─────────────────────────────────────────────────────────
  {
    id: "market_spike_up",
    message: "Word on the street: prices are spiking today!",
    type: "market",
    probability: 0.08,
    apply(state) {
      // Mark a random drug for a price spike (handled by market generator)
      const ids = Object.keys(state.market);
      const drugId = ids[Math.floor(Math.random() * ids.length)];
      state.market[drugId] = Math.round(state.market[drugId] * 2.5);
      return `${drugId} prices went through the roof.`;
    },
  },
  {
    id: "market_crash",
    message: "The feds flooded the streets with cheap product.",
    type: "market",
    probability: 0.06,
    apply(state) {
      const ids = Object.keys(state.market);
      const drugId = ids[Math.floor(Math.random() * ids.length)];
      state.market[drugId] = Math.round(state.market[drugId] * 0.3);
      return `${drugId} prices crashed hard.`;
    },
  },

  // ── Windfalls ─────────────────────────────────────────────────────────────
  {
    id: "found_cash",
    message: "You find a wallet stuffed with cash on the sidewalk.",
    type: "windfall",
    probability: 0.05,
    apply(state) {
      const amount = Math.floor(Math.random() * 800) + 200;
      state.cash += amount;
      return `You pocketed $${amount.toLocaleString()}.`;
    },
  },
  {
    id: "found_drugs",
    message: "You stumble on a stash someone left behind.",
    type: "windfall",
    probability: 0.04,
    apply(state) {
      const ids = Object.keys(state.trenchCoat);
      const drugId = ids[Math.floor(Math.random() * ids.length)];
      const amount = Math.floor(Math.random() * 8) + 2;
      const space =
        state.maxHold -
        Object.values(state.trenchCoat).reduce((a, b) => a + b, 0);
      const actual = Math.min(amount, space);
      if (actual <= 0) return "No space in your coat. You leave it.";
      state.trenchCoat[drugId] += actual;
      return `You grabbed ${actual} units of ${drugId}.`;
    },
  },

  // ── Losses ────────────────────────────────────────────────────────────────
  {
    id: "mugger",
    message: "You get mugged!",
    type: "mugger",
    probability: 0.07,
    apply(state) {
      if (state.guns > 0) {
        return "You pulled your piece and scared them off.";
      }
      const stolen = Math.floor(state.cash * 0.2);
      state.cash = Math.max(0, state.cash - stolen);
      return `They took $${stolen.toLocaleString()} from you.`;
    },
  },
  {
    id: "bad_deal",
    message: "A deal goes sideways. You got ripped off.",
    type: "loss",
    probability: 0.05,
    apply(state) {
      const amount = Math.floor(Math.random() * 500) + 100;
      state.cash = Math.max(0, state.cash - amount);
      return `You lost $${amount.toLocaleString()} in a bad deal.`;
    },
  },

  // ── Loan shark ───────────────────────────────────────────────────────────
  {
    id: "shark_visit",
    message: "The loan shark's boys pay you a visit.",
    type: "shark",
    probability: 0.06,
    apply(state) {
      if (state.debt <= 0) return "You owe nothing. They leave you alone.";
      const beatdown = Math.floor(Math.random() * 300) + 100;
      state.cash = Math.max(0, state.cash - beatdown);
      return `They roughed you up and took $${beatdown.toLocaleString()}.`;
    },
  },
];
