/**
 * locale.js — Locale detection and formatting helpers.
 *
 * Detects the player's region from the browser's Intl API and derives:
 *   - currency  (USD / EUR / GBP / …)
 *   - symbol    ($  / €  / £  / …)
 *   - weightUnit ("oz" | "g")  — classic units stay as-is; realism uses this
 *   - exchangeRate — multiply USD internal prices by this to display locally
 *
 * All prices are stored internally in USD. Conversion happens at display time.
 *
 * Supported locales / currency clusters:
 *   EUR  — Eurozone (de, fr, nl, es, it, pt, be, at, fi, …)
 *   GBP  — United Kingdom
 *   SEK  — Sweden
 *   NOK  — Norway
 *   DKK  — Denmark
 *   CHF  — Switzerland
 *   CAD  — Canada
 *   AUD  — Australia / NZ
 *   BRL  — Brazil
 *   USD  — United States (and fallback)
 */

// ── Exchange rates vs USD (approximate, intentionally "street" ballpark) ──────
const RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  SEK: 10.4,
  NOK: 10.6,
  DKK: 6.88,
  CHF: 0.9,
  CAD: 1.36,
  AUD: 1.55,
  NZD: 1.64,
  BRL: 5.05,
  JPY: 149.0,
  KRW: 1325.0,
  MXN: 17.1,
  PLN: 4.0,
  CZK: 23.2,
  HUF: 358.0,
  RON: 4.58,
  BGN: 1.8,
  HRK: 6.95,
  RUB: 91.0,
  TRY: 32.0,
  INR: 83.0,
  CNY: 7.24,
};

// ── Currency symbol lookup ────────────────────────────────────────────────────
const SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  CHF: "Fr",
  CAD: "C$",
  AUD: "A$",
  NZD: "NZ$",
  BRL: "R$",
  JPY: "¥",
  KRW: "₩",
  MXN: "$",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  RON: "lei",
  BGN: "лв",
  HRK: "kn",
  RUB: "₽",
  TRY: "₺",
  INR: "₹",
  CNY: "¥",
};

// ── Locale tag → currency code ─────────────────────────────────────────────────
const LOCALE_CURRENCY = {
  // Eurozone countries (ISO 3166-1 alpha-2)
  DE: "EUR",
  AT: "EUR",
  FR: "EUR",
  NL: "EUR",
  BE: "EUR",
  ES: "EUR",
  PT: "EUR",
  IT: "EUR",
  IE: "EUR",
  FI: "EUR",
  GR: "EUR",
  LU: "EUR",
  MT: "EUR",
  SK: "EUR",
  SI: "EUR",
  EE: "EUR",
  LV: "EUR",
  LT: "EUR",
  CY: "EUR",
  // Other Europe
  GB: "GBP",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  CH: "CHF",
  PL: "PLN",
  CZ: "CZK",
  HU: "HUF",
  RO: "RON",
  BG: "BGN",
  HR: "HRK",
  // Americas
  CA: "CAD",
  MX: "MXN",
  BR: "BRL",
  // Asia-Pacific
  AU: "AUD",
  NZ: "NZD",
  JP: "JPY",
  KR: "KRW",
  IN: "INR",
  CN: "CNY",
  // Russia / Turkey
  RU: "RUB",
  TR: "TRY",
};

// ── Weight: metric countries use grams, others oz ─────────────────────────────
// (classic mode always uses "units"; only realism has real weight)
const METRIC_WEIGHT_CURRENCIES = new Set([
  "EUR",
  "GBP",
  "SEK",
  "NOK",
  "DKK",
  "CHF",
  "PLN",
  "CZK",
  "HUF",
  "RON",
  "BGN",
  "HRK",
  "AUD",
  "NZD",
  "BRL",
  "JPY",
  "KRW",
  "INR",
  "CNY",
  "RUB",
  "TRY",
]);

// ── Detection ─────────────────────────────────────────────────────────────────

// Map IANA timezone prefixes/names → currency code
// Covers cases where browser language is "en-US" but TZ is European
const TZ_CURRENCY = {
  // Eurozone
  "Europe/Amsterdam": "EUR",
  "Europe/Athens": "EUR",
  "Europe/Berlin": "EUR",
  "Europe/Brussels": "EUR",
  "Europe/Bucharest": "RON",
  "Europe/Budapest": "HUF",
  "Europe/Copenhagen": "DKK",
  "Europe/Dublin": "EUR",
  "Europe/Helsinki": "EUR",
  "Europe/Kyiv": "EUR",
  "Europe/Lisbon": "EUR",
  "Europe/Ljubljana": "EUR",
  "Europe/Luxembourg": "EUR",
  "Europe/Madrid": "EUR",
  "Europe/Malta": "EUR",
  "Europe/Nicosia": "EUR",
  "Europe/Oslo": "NOK",
  "Europe/Paris": "EUR",
  "Europe/Prague": "CZK",
  "Europe/Riga": "EUR",
  "Europe/Rome": "EUR",
  "Europe/Sarajevo": "EUR",
  "Europe/Skopje": "EUR",
  "Europe/Sofia": "BGN",
  "Europe/Stockholm": "SEK",
  "Europe/Tallinn": "EUR",
  "Europe/Tirane": "EUR",
  "Europe/Vaduz": "CHF",
  "Europe/Vienna": "EUR",
  "Europe/Vilnius": "EUR",
  "Europe/Warsaw": "PLN",
  "Europe/Zagreb": "HRK",
  "Europe/Zurich": "CHF",
  // UK / Islands
  "Europe/London": "GBP",
  "Europe/Jersey": "GBP",
  "Europe/Guernsey": "GBP",
  "Europe/Isle_of_Man": "GBP",
  // Americas
  "America/Toronto": "CAD",
  "America/Vancouver": "CAD",
  "America/Edmonton": "CAD",
  "America/Winnipeg": "CAD",
  "America/Halifax": "CAD",
  "America/St_Johns": "CAD",
  "America/Mexico_City": "MXN",
  "America/Sao_Paulo": "BRL",
  "America/Manaus": "BRL",
  // Asia-Pacific
  "Australia/Sydney": "AUD",
  "Australia/Melbourne": "AUD",
  "Australia/Brisbane": "AUD",
  "Australia/Perth": "AUD",
  "Pacific/Auckland": "NZD",
  "Asia/Tokyo": "JPY",
  "Asia/Seoul": "KRW",
  "Asia/Kolkata": "INR",
  "Asia/Shanghai": "CNY",
  "Asia/Hong_Kong": "CNY",
  // Russia / Turkey
  "Europe/Moscow": "RUB",
  "Asia/Istanbul": "TRY",
};

function detectLocale() {
  // 1. Try all navigator.languages entries — pick the first one with a
  //    recognisable non-US/non-generic region code.
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language || "en-US"];

  let currency = null;

  for (const lang of langs) {
    const tag = lang.toUpperCase();
    const parts = tag.split("-");
    // A tag like "nl-BE" or "de-DE" has a region as the last segment
    if (parts.length >= 2) {
      const region = parts[parts.length - 1];
      if (LOCALE_CURRENCY[region]) {
        currency = LOCALE_CURRENCY[region];
        break;
      }
    }
  }

  // 2. Fall back to IANA timezone — much more reliable for Europeans whose
  //    browser UI language is set to English.
  if (!currency) {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && TZ_CURRENCY[tz]) {
        currency = TZ_CURRENCY[tz];
      } else if (tz) {
        // Broad continent prefix match — catches e.g. "Europe/Belgrade"
        const prefix = tz.split("/")[0];
        if (prefix === "Europe") currency = "EUR";
        else if (prefix === "Australia") currency = "AUD";
        else if (prefix === "America") currency = "USD";
      }
    } catch (_) {
      // Intl not available — stay null
    }
  }

  // 3. Final fallback
  if (!currency) {
    const tag = (navigator.language || "en-US").toUpperCase();
    const parts = tag.split("-");
    const region = parts.length >= 2 ? parts[parts.length - 1] : parts[0];
    currency = LOCALE_CURRENCY[region] ?? "USD";
  }

  const rate = RATES[currency] ?? 1.0;
  const symbol = SYMBOLS[currency] ?? "$";
  const useMetricWeight = METRIC_WEIGHT_CURRENCIES.has(currency);

  return {
    currency,
    symbol,
    exchangeRate: rate,
    useMetricWeight,
    /** Weight unit label for realism mode */
    weightUnit: useMetricWeight ? "g" : "oz",
    /** Large weight label (realism bulk) */
    weightUnitLarge: useMetricWeight ? "kg" : "oz",
    /** oz → display unit conversion factor (for realism prices per unit) */
    weightFactor: useMetricWeight ? 28.35 : 1, // 1 oz = 28.35 g
  };
}

// ── Singleton ─────────────────────────────────────────────────────────────────
export const LOCALE = detectLocale();

// ── Formatting helpers ────────────────────────────────────────────────────────

/**
 * Format a USD amount into the player's local currency string.
 * e.g.  fmtMoney(1000) → "$1,000" (US) or "€920" (DE) or "£790" (GB)
 * @param {number} usdAmount
 * @returns {string}
 */
export function fmtMoney(usdAmount) {
  const converted = Math.round(usdAmount * LOCALE.exchangeRate);
  const formatted = Math.abs(converted).toLocaleString();
  const sign = converted < 0 ? "-" : "";
  const sym = LOCALE.symbol;

  // For currencies that conventionally go after the number
  const postfix = new Set([
    "SEK",
    "NOK",
    "DKK",
    "PLN",
    "CZK",
    "HUF",
    "RON",
    "BGN",
    "HRK",
  ]);
  if (postfix.has(LOCALE.currency)) {
    return `${sign}${formatted} ${sym}`;
  }
  return `${sign}${sym}${formatted}`;
}

/**
 * Format a weight quantity for display.
 * In classic/hustler mode, qty is just "units" (no conversion needed).
 * In realism mode, qty is in oz — convert to g/kg for metric users.
 *
 * @param {number} qty — quantity in oz (realism) or units (classic)
 * @param {boolean} isRealism
 * @returns {string}  e.g. "10 oz" or "284 g"
 */
export function fmtWeight(qty, isRealism = false) {
  if (!isRealism) return String(qty);

  if (!LOCALE.useMetricWeight) {
    return `${qty} oz`;
  }

  // Convert oz → g
  const grams = Math.round(qty * 28.35);
  if (grams >= 1000) {
    const kg = (grams / 1000).toFixed(grams >= 10000 ? 1 : 2);
    return `${kg} kg`;
  }
  return `${grams} g`;
}

/**
 * Format a per-unit price label for realism mode.
 * e.g. "per oz" → "per g" for metric users.
 */
export function fmtPriceUnit(isRealism = false) {
  if (!isRealism) return "";
  return LOCALE.useMetricWeight ? "/g" : "/oz";
}
