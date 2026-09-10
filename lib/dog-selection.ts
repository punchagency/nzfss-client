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
}

function registrationOf(dog: SelectableDog): string {
  const reg = dog.NZFSSRegistration ?? dog.nzfssNo ?? "";
  return reg.trim();
}

/**
 * A stable identity for a dog in the pickers. Two dogs are the same selection
 * iff their keys are equal.
 *
 * Registered dogs key on their (normalised) registration number, so two dogs
 * that merely share a name and breed stay distinct. Unregistered dogs — no
 * number, or a blank spelt "Unknown"/"n/a"/etc. — key on name + breed, since
 * that is all there is to go on.
 */
export function selectableDogKey(dog: SelectableDog): string {
  const reg = registrationOf(dog);
  if (hasNzfssRegistration(reg)) {
    return `reg:${reg.toLowerCase()}`;
  }
  const name = (dog.name || "").trim().toLowerCase();
  const breed = (dog.breed || "").trim().toLowerCase();
  return `nb:${name}|${breed}`;
}

/** True when two picker dogs refer to the same selectable dog. */
export function isSameSelectableDog(a: SelectableDog, b: SelectableDog): boolean {
  return selectableDogKey(a) === selectableDogKey(b);
}
