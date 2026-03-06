/**
 * constants.js
 * Central game constants — tweak these to balance the game.
 */

export const GAME_CONSTANTS = {
  // ── Classic mode defaults ──────────────────────────────────────────────────
  TOTAL_DAYS: 30, // Game runs for this many days
  STARTING_CASH: 2000, // Cash at game start
  STARTING_DEBT: 5500, // Loan shark starting debt
  STARTING_HOLD: 100, // Trench coat capacity (units)
  INTEREST_RATE: 0.1, // Daily interest on shark debt (10 %)
  GUN_COST: 400, // Cost of one gun
  GUN_MAX: 10, // Maximum guns you can carry
  GUN_POLICE_BONUS: 0.05, // Each gun adds this to base police flee chance
  COAT_UPGRADE_COST: 500, // Cost per +10 capacity upgrade
  COAT_UPGRADE_SIZE: 10, // Units added per upgrade
  COAT_UPGRADE_MAX: 200, // Hard cap on coat capacity
  BANK_INTEREST_RATE: 0.05, // Daily interest earned on bank deposits (5 %)
  BASE_POLICE_CHANCE: 0.08, // Base chance of police event per travel
  POLICE_DRUG_SCALE: 0.002, // Extra police chance per unit carried

  // ── Debt / interest scaling (used by Choose Days + Hustler) ────────────────
  BASE_DEBT: 5500, // Reference debt for 30-day game
  BASE_DAYS: 30, // Reference day count for scaling

  // ── Hustler mode ───────────────────────────────────────────────────────────
  STARTING_HP: 100, // Health at game start
  MAX_HP: 100, // HP cap
  BANDAGE_COST: 200, // Cost to buy bandages
  BANDAGE_HEAL: 20, // HP restored by bandages
  CLINIC_COST: 1000, // Full heal at clinic
  HARDASS_DEPUTY_INTERVAL: 10, // Hardass gains a deputy every N days
  FIGHT_BASE_SUCCESS: 0.4, // Base chance to win a fight
  FIGHT_GUN_BONUS: 0.05, // Each gun adds this to fight success chance
  RUN_BASE_SUCCESS: 0.6, // Base chance to run successfully
  RUN_LOAD_PENALTY: 0.004, // Each unit carried reduces run chance
  RUN_DEPUTY_PENALTY: 0.05, // Each deputy reduces run chance
  FIGHT_HP_DAMAGE_MIN: 10, // Minimum HP lost in a fight (player)
  FIGHT_HP_DAMAGE_MAX: 30, // Maximum HP lost in a fight (player)
  FIGHT_DEPUTY_DAMAGE: 5, // Extra damage per deputy
  FIGHT_WIN_REWARD_MIN: 200, // Cash reward if you win a fight
  FIGHT_WIN_REWARD_MAX: 1200, // Cash reward if you win a fight
  RUN_FAIL_HP_DAMAGE: 10, // HP lost on failed run
  SURRENDER_JAIL_MIN: 1, // Min days in jail on surrender
  SURRENDER_JAIL_MAX: 3, // Max days in jail on surrender
  MUGGER_HP_DAMAGE_MIN: 5, // Mugger HP damage (min)
  MUGGER_HP_DAMAGE_MAX: 20, // Mugger HP damage (max)
  VENDOR_CHANCE: 0.15, // Chance of vendor appearing on travel
  TIP_ACCURACY: 0.7, // Chance a tip is accurate
  MAX_ITEMS: 5, // Maximum items in inventory
  VINNIE_DEBT_THRESHOLD: 10000, // Debt threshold for Vinnie's boys
  VINNIE_EXTRA_CHANCE: 0.12, // Extra visit chance when over threshold

  // ── Clinic ─────────────────────────────────────────────────────────────────
  CLINIC_LOCATIONS: ["bronx", "manhattan"], // Boroughs with hospitals

  // ── Vinnie's job ──────────────────────────────────────────────────────────
  VINNIE_JOB_CHANCE: 0.08, // Chance per travel that Vinnie offers a job
  VINNIE_JOB_DEBT_MIN: 8000, // Min debt before Vinnie offers a job
  VINNIE_JOB_DEADLINE: 3, // Days to complete the job
  VINNIE_JOB_REWARD_RATIO: 0.5, // Fraction of debt forgiven on success
  VINNIE_JOB_FAIL_HP: 25, // HP damage on failure
  VINNIE_JOB_FAIL_CASH: 500, // Cash stolen on failure
};
