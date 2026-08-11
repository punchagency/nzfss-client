/**
 * Heat completion rules for scoring.
 *
 * A heated race stores one entrant row per heat, all sharing a musher name,
 * class and event. Scoring is per musher across the whole race, not per row:
 *
 *  - A team scores only if it ran every heat the class ran, and finished each
 *    one. A missing heat, a "did not finish" or a "did not start" in any heat
 *    means no musher points and no dog points.
 *  - A dog scores only if it ran every heat the team ran. Dogs dropped partway
 *    through earn nothing, even though the team itself may still score.
 *
 * The race time used for ranking is the sum of the team's heat times.
 */

export interface ScoringDog {
  name?: string | null;
  dogId?: string | null;
  NZFSSRegistration?: string | null;
}

export interface ScoringEntrant {
  _id: string;
  name: string;
  class?: string | null;
  customClass?: string | null;
  eventId?: string | null;
  heat?: string | null;
  raceTime?: string | null;
  raceType?: string | null;
  associatedDog?: ScoringDog[];
}

/** Statuses that mean the run was not completed. */
const NON_FINISHING_STATUSES = [
  "did not finish",
  "did not start",
  "did not qualify",
  "disqualified",
];

/** True when this row represents a completed run. */
export function isFinishedRun(entrant: ScoringEntrant): boolean {
  const status = (entrant.raceType || "").trim().toLowerCase();
  return !NON_FINISHING_STATUSES.includes(status);
}

/** Groups sharing a musher are keyed case-insensitively, as names are typed by hand. */
export function musherKey(entrant: ScoringEntrant): string {
  return (entrant.name || "").trim().toLowerCase();
}

/** A row with no heat recorded is treated as the sole heat of a single-heat race. */
export function heatLabel(entrant: ScoringEntrant): string {
  return (entrant.heat || "").trim() || "Heat 1";
}

/** Identifies a dog across heats: registration when present, else the name. */
export function dogKey(dog: ScoringDog): string {
  const reg = (dog.NZFSSRegistration || "").trim().toLowerCase();
  if (reg && reg !== "unknown") return `reg:${reg}`;
  if (dog.dogId) return `id:${dog.dogId}`;
  return `name:${(dog.name || "").trim().toLowerCase()}`;
}

export interface MusherHeatGroup {
  key: string;
  name: string;
  /** Every row for this musher, one per heat. */
  rows: ScoringEntrant[];
  /** Distinct heats this musher has a row for. */
  heatsRun: Set<string>;
  /** True when every row finished and no heat is missing. */
  complete: boolean;
  /** Combined time across heats, in seconds. */
  totalSeconds: number;
  /** Dogs that appear in every heat the musher ran. */
  qualifyingDogKeys: Set<string>;
  /** The row that carries this musher's points, so totals are not counted twice. */
  scoringRowId: string;
}

function toSeconds(time?: string | null): number {
  if (!time || !/^\d{1,2}:\d{2}:\d{2}(\.\d+)?$/.test(time)) return Number.MAX_VALUE;
  const [h, m, rest] = time.split(":");
  const seconds = parseFloat(rest);
  return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + (isNaN(seconds) ? 0 : seconds);
}

/** Heats are ordered by their trailing number so "Heat 2" follows "Heat 10" correctly. */
function heatSortValue(label: string): number {
  const digits = label.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : Number.MAX_SAFE_INTEGER;
}

/**
 * How many heats the class ran, taken as the number of distinct heats recorded
 * across every entrant in it. A class where everyone ran once stays a valid
 * single-heat race; if any musher has a second heat, the class ran two.
 */
export function expectedHeatsForClass(entrantsInClass: ScoringEntrant[]): Set<string> {
  const heats = new Set<string>();
  for (const entrant of entrantsInClass) heats.add(heatLabel(entrant));
  return heats;
}

/** Builds one group per musher, applying the completion rules above. */
export function buildMusherHeatGroups(
  entrantsInClass: ScoringEntrant[]
): Map<string, MusherHeatGroup> {
  const expectedHeats = expectedHeatsForClass(entrantsInClass);
  const groups = new Map<string, MusherHeatGroup>();

  for (const entrant of entrantsInClass) {
    const key = musherKey(entrant);
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        name: entrant.name,
        rows: [],
        heatsRun: new Set<string>(),
        complete: false,
        totalSeconds: 0,
        qualifyingDogKeys: new Set<string>(),
        scoringRowId: entrant._id,
      };
      groups.set(key, group);
    }
    group.rows.push(entrant);
    group.heatsRun.add(heatLabel(entrant));
  }

  for (const group of groups.values()) {
    // The lowest-numbered heat carries the points; the others are stored at
    // zero so season aggregation, which sums every points row, stays correct.
    const ordered = [...group.rows].sort(
      (a, b) => heatSortValue(heatLabel(a)) - heatSortValue(heatLabel(b))
    );
    group.scoringRowId = ordered[0]._id;

    const ranEveryHeat = [...expectedHeats].every((heat) => group.heatsRun.has(heat));
    const finishedEveryRun = group.rows.every(isFinishedRun);
    const times = group.rows.map((row) => toSeconds(row.raceTime));
    const everyRunTimed = times.every((seconds) => seconds < Number.MAX_VALUE);

    group.complete = ranEveryHeat && finishedEveryRun && everyRunTimed;
    group.totalSeconds = everyRunTimed
      ? times.reduce((sum, seconds) => sum + seconds, 0)
      : Number.MAX_VALUE;

    // A dog qualifies only by appearing in every heat this musher ran.
    const appearances = new Map<string, number>();
    for (const row of group.rows) {
      const seen = new Set<string>();
      for (const dog of row.associatedDog || []) {
        const key = dogKey(dog);
        if (seen.has(key)) continue; // guard against a dog listed twice on one row
        seen.add(key);
        appearances.set(key, (appearances.get(key) || 0) + 1);
      }
    }
    for (const [key, count] of appearances) {
      if (count === group.rows.length) group.qualifyingDogKeys.add(key);
    }
  }

  return groups;
}
