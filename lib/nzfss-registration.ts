/**
 * Who counts as NZFSS-registered for scoring.
 *
 * Registration is what earns points. A driver with no NZFSS registration and a
 * dog with no NZFSS registration both score zero, even though they still race,
 * still appear in the results and still count towards the size of the field
 * everyone else is ranked against.
 *
 * Driver registration used to be guessed from the typed name — anything that
 * did not literally contain "unregistered" scored — so a hand-entered driver
 * who is not in the registry at all was awarded points. It is now read from the
 * musher registry: a driver scores only when a registry musher of that name
 * holds an NZFSS registration number.
 */

/**
 * Values recorded in a registration field that mean "there is no registration".
 * Registration numbers are typed by hand, so a blank is spelt many ways.
 */
const BLANK_REGISTRATION_VALUES = new Set([
  "-",
  "--",
  "n/a",
  "n.a.",
  "na",
  "nil",
  "none",
  "not registered",
  "null",
  "tba",
  "tbc",
  "undefined",
  "unknown",
  "unregistered",
]);

/** True when a registration field holds an actual NZFSS registration number. */
export function hasNzfssRegistration(registration?: string | null): boolean {
  const value = (registration || "").trim().toLowerCase();
  return value !== "" && !BLANK_REGISTRATION_VALUES.has(value);
}

/** Driver names are typed by hand on results, so they are matched loosely. */
export function musherNameKey(name?: string | null): string {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export interface RegistryMusher {
  name?: string | null;
  registrationNo?: string | null;
}

export interface MusherRegistryIndex {
  /** Names of mushers holding an NZFSS registration number — these can score. */
  registered: Set<string>;
  /** Names of every registry musher, whether or not a number is recorded. */
  known: Set<string>;
}

export const EMPTY_MUSHER_REGISTRY: MusherRegistryIndex = {
  registered: new Set<string>(),
  known: new Set<string>(),
};

export function buildMusherRegistryIndex(
  mushers?: RegistryMusher[] | null
): MusherRegistryIndex {
  const registered = new Set<string>();
  const known = new Set<string>();

  for (const musher of mushers || []) {
    const key = musherNameKey(musher?.name);
    if (!key) continue;
    known.add(key);
    if (hasNzfssRegistration(musher?.registrationNo)) registered.add(key);
  }

  return { registered, known };
}

/** False until the registry has actually loaded — nobody can be checked before then. */
export function isRegistryLoaded(registry: MusherRegistryIndex): boolean {
  return registry.known.size > 0;
}

/** True when this driver holds an NZFSS registration and so can earn points. */
export function isRegisteredMusher(
  name: string | null | undefined,
  registry: MusherRegistryIndex
): boolean {
  const key = musherNameKey(name);
  return key !== "" && registry.registered.has(key);
}

export type MusherRegistrationStatus =
  | "registered"
  /** A registry record exists but no registration number has been entered on it. */
  | "no-registration-number"
  /** The name typed on the result matches no registry musher at all. */
  | "not-in-registry";

/**
 * Why a driver does or does not score. The two unregistered cases need
 * different fixes — filling in a registration number versus correcting the
 * spelling of a hand-typed name — so they are reported separately.
 */
export function musherRegistrationStatus(
  name: string | null | undefined,
  registry: MusherRegistryIndex
): MusherRegistrationStatus {
  const key = musherNameKey(name);
  if (key !== "" && registry.registered.has(key)) return "registered";
  if (key !== "" && registry.known.has(key)) return "no-registration-number";
  return "not-in-registry";
}

/** True when this dog holds an NZFSS registration and so can earn dog points. */
export function isRegisteredDog(dog?: { NZFSSRegistration?: string | null } | null): boolean {
  return hasNzfssRegistration(dog?.NZFSSRegistration);
}
