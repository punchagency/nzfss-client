/**
 * Telling apart two dogs in the "Add entrants" pickers.
 *
 * Eric's bug: a driver's result is edited, a dog is removed and another added,
 * and the "Other Dogs Available" search turns up two dogs that share a name and
 * breed (two "OCEAN" Siberian Huskies owned by different mushers). Ticking one
 * ticked both, because the checkbox state matched selected rows on name + breed
 * alone — which cannot distinguish two same-named dogs of the same breed.
 *
 * A dog's NZFSS registration number is its unique identity, so selection is
 * keyed on that. Only when neither dog carries a registration number (a
 * hand-entered dog, or a blank spelt "Unknown"/"-"/etc.) do we fall back to
 * name + breed — the best that can be done with no registration, and no worse
 * than the previous behaviour for that case.
 */
import { hasNzfssRegistration } from "./nzfss-registration";

/**
 * A dog as seen by the entrant pickers. Registration lives under two different
 * field names depending on the source: registry dogs from the musher query use
 * `nzfssNo`, while rows already collected into the form use `NZFSSRegistration`.
 * Either may be supplied; both are read.
 */
export interface SelectableDog {
  name?: string | null;
  breed?: string | null;
  /** Registration on a row already added to the form. */
  NZFSSRegistration?: string | null;
  /** Registration on a dog straight from the musher registry. */
  nzfssNo?: string | null;
  /**
   * Pedigree name on a dog straight from the musher registry, where `name` is
   * its pet name. Rows already collected into the form carry only `name`.
   */
  pedigreeName?: string | null;
}

function registrationOf(dog: SelectableDog): string {
  const reg = dog.NZFSSRegistration ?? dog.nzfssNo ?? "";
  return reg.trim();
}

/**
 * A stable identity for a dog in the pickers. Two dogs with equal keys are the
 * same selection (isSameSelectableDog also accepts a pedigree-name match).
 *
 * A registration number is NOT unique per dog in this data — a musher's dogs
 * often share one kennel number (e.g. all six of a musher's dogs registered
 * "CS/091", or two dogs sharing "RR/098"). So the key combines registration
 * AND name: that tells apart same-registration dogs with different names (a
 * musher's own team) as well as same-name dogs with different registrations
 * (two "OCEAN"s owned by different people). Unregistered dogs — no number, or
 * a blank spelt "Unknown"/"n/a"/etc. — fall back to name + breed.
 */
export function selectableDogKey(dog: SelectableDog): string {
  const reg = registrationOf(dog);
  const name = (dog.name || "").trim().toLowerCase();
  if (hasNzfssRegistration(reg)) {
    return `reg:${reg.toLowerCase()}|${name}`;
  }
  const breed = (dog.breed || "").trim().toLowerCase();
  return `nb:${name}|${breed}`;
}

/**
 * True when two picker dogs refer to the same selectable dog: the same key, or
 * the same registration (breed, for unregistered dogs) under either of a
 * registry dog's names. A row added to a result may be recorded under the pet
 * name or the pedigree name, so both have to find the registry dog.
 */
export function isSameSelectableDog(a: SelectableDog, b: SelectableDog): boolean {
  if (selectableDogKey(a) === selectableDogKey(b)) return true;
  if (identityOf(a) !== identityOf(b)) return false;
  const bNames = namesOf(b);
  return namesOf(a).some((n) => bNames.includes(n));
}

/** The selectableDogKey without its name part. */
function identityOf(dog: SelectableDog): string {
  const reg = registrationOf(dog);
  if (hasNzfssRegistration(reg)) return `reg:${reg.toLowerCase()}`;
  return `nb:${(dog.breed || "").trim().toLowerCase()}`;
}

function namesOf(dog: SelectableDog): string[] {
  return [dog.name, dog.pedigreeName]
    .map((n) => (n || "").trim().toLowerCase())
    .filter(Boolean);
}

/**
 * The name a dog is recorded under in race results: its pedigree name when it
 * has one, otherwise its pet name. The entry form has always saved results
 * this way; the edit screen has to match it or the public results show the
 * same kennel's dogs under a mix of pet and pedigree names.
 */
export function dogResultName(dog: {
  name?: string | null;
  pedigreeName?: string | null;
}): string {
  const pedigree = (dog.pedigreeName || "").trim();
  return pedigree || dog.name || "";
}

/** True when a registry dog goes by `name`, as either its pet or pedigree name. */
export function registryDogHasName(
  registryDog: { name?: string | null; pedigreeName?: string | null },
  name: string | null | undefined
): boolean {
  const wanted = (name || "").trim().toLowerCase();
  return wanted !== "" && namesOf(registryDog).includes(wanted);
}
