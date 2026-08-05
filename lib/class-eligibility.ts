/**
 * Which race classes are allowed to earn points.
 *
 * This lived as a duplicated literal in both the results-entry screen and the
 * musher ranking page, so a change to one silently left the other behind. Keep
 * it here and import it — there should only ever be one copy of these rules.
 */

export interface EligibilityEntrant {
  class?: string | null;
  customClass?: string | null;
}

/**
 * Approved classes per race type, as described in the race regulations.
 * A class outside these lists is a custom class and earns no points.
 */
export const approvedClassesByRaceType: Record<string, string[]> = {
  speed: [
    "bikejoring",
    "canicross",
    "single-dog scooter",
    "two-dog scooter",
    "2-dog rig",
    "3-dog rig",
    "4-dog rig",
    "6-dog rig",
    "8-dog rig",
  ],
  freight: [
    "single-dog scooter",
    "two-dog scooter",
    "3-dog rig",
    "4-dog rig",
    "6-dog rig",
    "8-dog rig",
    "open class rig",
  ],
  snow: [
    "skijoring",
    "2-dog rig",
    "3-dog rig",
    "4-dog rig",
    "6-dog rig",
    "8-dog rig",
    "open class rig",
  ],
  "weight pull": [
    "27kg (60 pound) class",
    "36kg (80 pound) class",
    "50kg (110 pounds) class",
    "unlimited class",
  ],
};

/**
 * Approved classes that still never award points — neither musher placing
 * points nor Championship Harness Dog points. They remain valid classes to
 * enter and appear in results; they just do not score.
 *
 * Matched on a word starting with "bike" or "cani" so the many recorded
 * spellings are covered: "Bikejoring", "2 Dog Bikejor", "1 Dog Bikejour"
 * (misspelt), "VETERAN 1 DOG BIKE", "Canicross - Long", "CANICROSS MENS".
 * An earlier "bikejor" substring missed both "Bikejour" and "... DOG BIKE".
 * No scoring class contains either word.
 */
export const NON_SCORING_CLASS_PATTERN = /\b(bike|cani)/i;

/** Race type is recorded loosely (e.g. "speed", "weight pull"). */
function normalizeRaceType(rawClass?: string | null): string {
  const value = (rawClass || "").trim().toLowerCase();
  if (value.includes("weight") || value.includes("pull")) return "weight pull";
  if (value.includes("freight")) return "freight";
  if (value.includes("snow")) return "snow";
  if (value.includes("speed")) return "speed";
  return value;
}

/** True when the class sits outside the approved classes in the regulations. */
export function isCustomClassEntrant(entrant: EligibilityEntrant): boolean {
  const className = (entrant.customClass || "").trim().toLowerCase();
  if (!className) return false;

  const approvedClasses = approvedClassesByRaceType[normalizeRaceType(entrant.class)];
  // Unknown race type: keep existing behaviour rather than guessing.
  if (!approvedClasses) return false;

  return !approvedClasses.includes(className);
}

/** True for an approved class that is nevertheless excluded from scoring. */
export function isNonScoringClass(entrant: EligibilityEntrant): boolean {
  const className = (entrant.customClass || "").trim();
  if (!className) return false;
  return NON_SCORING_CLASS_PATTERN.test(className);
}

/**
 * Whether an entrant's class earns points at all.
 *
 * Note this governs calculation only. Points are written to the database when
 * results are submitted, so already-saved results keep whatever was stored
 * until they are submitted again.
 */
export function classEarnsPoints(entrant: EligibilityEntrant): boolean {
  return !isCustomClassEntrant(entrant) && !isNonScoringClass(entrant);
}
