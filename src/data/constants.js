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

  // ── Realism mode ───────────────────────────────────────────────────────────
  REALISM_STARTING_CASH: 500, // Start low — you're a nobody
  REALISM_STARTING_DEBT: 2000, // Smaller debt but steeper interest
  REALISM_INTEREST_RATE: 0.15, // 15% daily interest
  REALISM_TOTAL_DAYS: 60, // Default game length
  REALISM_STARTING_HOLD: 10, // 10 oz coat capacity
  REALISM_COAT_UPGRADE_SIZE: 5, // +5 oz per upgrade
  REALISM_COAT_UPGRADE_COST: 300, // Cheaper per upgrade
  REALISM_COAT_UPGRADE_MAX: 50, // Max 50 oz

  // ── Realism: Connect system ────────────────────────────────────────────────
  CONNECT_BASE_STOCK_MIN: 3, // Minimum oz a connect has per day
  CONNECT_BASE_STOCK_MAX: 12, // Maximum oz a connect has per day
  CONNECT_LOYALTY_DISCOUNT: 0.02, // 2% discount per loyalty level (max 10)
  CONNECT_LOYALTY_MAX: 10, // Max loyalty level per connect
  CONNECT_ARRESTED_CHANCE: 0.02, // 2% daily chance a connect goes dark
  CONNECT_ARRESTED_DAYS_MIN: 3, // Min days a connect is dark
  CONNECT_ARRESTED_DAYS_MAX: 7, // Max days a connect is dark

  // ── Realism: Reputation ────────────────────────────────────────────────────
  REP_PER_OZ_SOLD: 1, // Rep gained per oz sold on street
  REP_PER_OZ_BOUGHT: 0.5, // Rep gained per oz bought from connect
  REP_CUT_PENALTY: 5, // Rep lost when caught selling bad product
  REP_FAVOUR_REWARD: 50, // Rep gained for completing a favour

  // ── Realism: Heat ──────────────────────────────────────────────────────────
  HEAT_PER_SALE: 0.02, // Heat added per oz sold in a borough
  HEAT_PER_PURCHASE: 0.01, // Heat added per oz bought from connect
  HEAT_DECAY_RATE: 0.05, // Heat decays 5% per day passively
  HEAT_STASH_RAID_BASE: 0.03, // Base 3% daily raid chance
  HEAT_STASH_RAID_SCALE: 0.1, // Each 0.1 heat adds to raid %

  // ── Realism: Territory tax ─────────────────────────────────────────────────
  TERRITORY_TAX_MIN: 0.02, // 2% minimum territory tax
  TERRITORY_TAX_MAX: 0.08, // 8% maximum territory tax
  TERRITORY_TAX_SKIP_CHANCE: 0.15, // Chance of trouble if you skip paying

  // ── Realism: Cutting ──────────────────────────────────────────────────────
  CUT_MIN_PURITY: 30, // Can't cut below 30% purity
  CUT_BAD_REP_THRESHOLD: 40, // Selling below 40% = bad reputation event

  // ── Realism: Supply events ────────────────────────────────────────────────
  DROUGHT_CHANCE: 0.04, // 4% daily chance of drought per drug
  DROUGHT_DURATION_MIN: 2, // Min days of drought
  DROUGHT_DURATION_MAX: 4, // Max days of drought
  DROUGHT_PRICE_MULT: 2.5, // Prices spike 2.5× during drought
  FLOOD_CHANCE: 0.03, // 3% daily chance of flood
  FLOOD_DURATION_MIN: 2,
  FLOOD_DURATION_MAX: 3,
  FLOOD_PRICE_MULT: 0.5, // Prices drop 50% during flood

  // ── Realism: Tommy Bags favour ────────────────────────────────────────────
  FAVOUR_DRUG_QTY: 5, // Deliver 5 oz of a specific drug
  FAVOUR_DEADLINE: 5, // Days to complete

  // ── Realism: Connect encounter system ─────────────────────────────────────
  // Connects find the player via travel — there is no "Visit Connect" button.
  CONNECT_ENCOUNTER_BASE: 0.15,         // 15% base chance per travel
  CONNECT_ENCOUNTER_REP_MAX: 0.20,      // reputation adds up to +20% chance
  CONNECT_ENCOUNTER_HEAT_MAX: 0.10,     // high heat reduces chance by up to -10%
  CONNECT_ENCOUNTER_MIN_DAY: 10,        // no encounters before day 10
  CONNECT_COOLDOWN_DAYS: 3,             // days before same connect can appear again
  // Trust tier progression (index = tier level 0–3)
  CONNECT_TIER_REP: [0, 15, 35, 60],   // min rep to access each tier
  CONNECT_TIER_LOT_OZ: [10, 25, 50, 100], // lot size in oz per tier
  CONNECT_TIER_DISCOUNT: [0.15, 0.25, 0.35, 0.45], // fraction off street price
  CONNECT_TIER_BAD_DEAL: [0.10, 0.05, 0.02, 0.00], // chance product is stepped-on
  CONNECT_BAD_DEAL_PURITY_PENALTY: 25, // actual purity is this many % lower when bad deal
  CONNECT_TRUST_MAX: 3,                // highest trust tier
};
