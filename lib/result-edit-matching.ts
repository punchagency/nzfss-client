/**
 * Pure helpers for View Result edit/save identity matching.
 * Kept free of React so Eric's dog-team / heat bugs can be regression-tested.
 */

export interface EditDog {
  name: string;
  NZFSSRegistration?: string;
}

export interface EditDriverCard {
  _id?: string;
  name: string;
  dogs: EditDog[];
  heat?: string;
  isNew?: boolean;
}

export interface EditEntrantRow {
  _id: string;
  name: string;
  class: string;
  customClass?: string;
  heat?: string;
  raceFormat?: string;
  associatedDog?: EditDog[];
}

const MONGO_ID = /^[0-9a-fA-F]{24}$/;

export function isMongoId(id?: string | null): id is string {
  return !!id && MONGO_ID.test(id);
}

export function heatOf(value?: string | null): string {
  return (value || "").trim() || "Heat 1";
}

/** Same detection the server uses for weight-pull entrant identity. */
export function isWeightPullClass(
  className?: string | null,
  customClass?: string | null
): boolean {
  const haystack = `${className || ""} ${customClass || ""}`.toLowerCase();
  return haystack.includes("weight") || haystack.includes("pull");
}

export function isHeatedFormat(raceFormat?: string | null): boolean {
  return (raceFormat || "").trim() === "Heated";
}

/**
 * Collapse legacy duplicate Heat 1 rows when opening the edit form.
 * Heat is always part of identity when any row carries a non-default heat,
 * or when the class is explicitly heated.
 */
export function dedupeEntrantsForEdit(
  rows: EditEntrantRow[],
  opts: { isWeightPull: boolean; isHeated: boolean }
): EditEntrantRow[] {
  if (opts.isWeightPull) return rows;

  const anyDistinctHeat = rows.some(
    (r) => (r.heat || "").trim() !== "" && heatOf(r.heat) !== "Heat 1"
  );
  const useHeat = opts.isHeated || anyDistinctHeat;

  const byIdentity = new Map<string, EditEntrantRow>();
  for (const row of rows) {
    const heatPart = useHeat ? heatOf(row.heat) : "single";
    const key = `${row.name}::${heatPart}`;
    const existing = byIdentity.get(key);
    if (!existing) {
      byIdentity.set(key, row);
      continue;
    }
    const existingDogs = existing.associatedDog?.length || 0;
    const nextDogs = row.associatedDog?.length || 0;
    // Prefer fuller dog team; on a tie keep the later row (usually the edit).
    if (nextDogs >= existingDogs) byIdentity.set(key, row);
  }
  return Array.from(byIdentity.values());
}

/**
 * Find which driver card "Add Dog" / "Add Driver" should update.
 * Match by musher (+ heat when heated) — never by exact dog set.
 */
export function findDriverCardToUpdate(
  cards: EditDriverCard[],
  opts: {
    driverName: string;
    selectedHeat: string;
    isHeated: boolean;
    isWeightPull: boolean;
    editingDriverIndex: number | null;
  }
): number {
  if (opts.isWeightPull) return -1;

  if (
    opts.editingDriverIndex !== null &&
    opts.editingDriverIndex >= 0 &&
    opts.editingDriverIndex < cards.length &&
    cards[opts.editingDriverIndex]?.name === opts.driverName
  ) {
    return opts.editingDriverIndex;
  }

  return cards.findIndex(
    (d) =>
      d.name === opts.driverName &&
      (!opts.isHeated || heatOf(d.heat) === heatOf(opts.selectedHeat))
  );
}

/** Resolve which DB entrant a driver card should update on submit. */
export function resolveEntrantForUpdate(
  driver: EditDriverCard,
  results: EditEntrantRow[],
  opts: {
    className: string;
    customClass: string;
    isHeated: boolean;
    isWeightPull: boolean;
    selectedHeat: string;
  }
): EditEntrantRow | undefined {
  if (isMongoId(driver._id)) {
    const byId = results.find((r) => r._id === driver._id);
    if (byId) return byId;
  }

  if (opts.isWeightPull) {
    const driverDogNames = driver.dogs
      .map((d) => d.name)
      .sort()
      .join(",");
    return results.find((entrant) => {
      if (
        entrant.name !== driver.name ||
        entrant.class !== opts.className ||
        (entrant.customClass || "") !== opts.customClass
      ) {
        return false;
      }
      const entrantDogNames = (entrant.associatedDog || [])
        .map((d) => d.name)
        .sort()
        .join(",");
      return driverDogNames === entrantDogNames;
    });
  }

  const driverHeat = opts.isHeated
    ? heatOf(driver.heat || opts.selectedHeat)
    : undefined;

  return results.find((entrant) => {
    if (
      entrant.name !== driver.name ||
      entrant.class !== opts.className ||
      (entrant.customClass || "") !== opts.customClass
    ) {
      return false;
    }
    if (driverHeat && heatOf(entrant.heat) !== driverHeat) return false;
    return true;
  });
}

/** Other rows for the same musher/class(/heat) that should be deleted as orphans. */
export function findOrphanEntrants(
  keepId: string,
  driver: EditDriverCard,
  results: EditEntrantRow[],
  opts: {
    className: string;
    customClass: string;
    isHeated: boolean;
    isWeightPull: boolean;
    selectedHeat: string;
  }
): EditEntrantRow[] {
  if (opts.isWeightPull) return [];

  const driverHeat = opts.isHeated
    ? heatOf(driver.heat || opts.selectedHeat)
    : undefined;

  return results.filter((entrant) => {
    if (entrant._id === keepId) return false;
    if (
      entrant.name !== driver.name ||
      entrant.class !== opts.className ||
      (entrant.customClass || "") !== opts.customClass
    ) {
      return false;
    }
    if (driverHeat && heatOf(entrant.heat) !== driverHeat) return false;
    // Non-heated: only treat same-heat (or blank→Heat 1) duplicates as orphans,
    // so a mis-flagged raceFormat never deletes a real Heat 2 sibling.
    if (!driverHeat && heatOf(entrant.heat) !== heatOf(driver.heat)) return false;
    return true;
  });
}

/**
 * Build keep/orphan sets once before the submit loop so two cards for the
 * same musher cannot mutually delete each other.
 */
export function planOrphanCleanup(
  drivers: EditDriverCard[],
  results: EditEntrantRow[],
  opts: {
    className: string;
    customClass: string;
    isHeated: boolean;
    isWeightPull: boolean;
    selectedHeat: string;
  }
): { keepIds: Set<string>; orphanIds: Set<string> } {
  const keepIds = new Set<string>();
  const orphanIds = new Set<string>();

  if (opts.isWeightPull) {
    for (const d of drivers) {
      if (isMongoId(d._id)) keepIds.add(d._id);
    }
    return { keepIds, orphanIds };
  }

  for (const driver of drivers) {
    const target = resolveEntrantForUpdate(driver, results, opts);
    if (!target || !isMongoId(target._id)) continue;
    keepIds.add(target._id);

    for (const orphan of findOrphanEntrants(target._id, driver, results, opts)) {
      if (isMongoId(orphan._id) && !keepIds.has(orphan._id)) {
        orphanIds.add(orphan._id);
      }
    }
  }

  // Never delete something we also plan to keep
  for (const id of keepIds) orphanIds.delete(id);

  return { keepIds, orphanIds };
}

/**
 * Simulate one "add dog to existing team then submit" cycle.
 * Returns the final DB rows after update + orphan cleanup.
 */
export function simulateAddDogAndSubmit(args: {
  existingRows: EditEntrantRow[];
  className: string;
  customClass?: string;
  isHeated: boolean;
  selectedHeat?: string;
  newDogs: EditDog[];
  editingDriverIndex?: number | null;
}): EditEntrantRow[] {
  const customClass = args.customClass || "";
  const selectedHeat = args.selectedHeat || "Heat 1";

  const cards = dedupeEntrantsForEdit(args.existingRows, {
    isWeightPull: false,
    isHeated: args.isHeated,
  }).map((row) => ({
    _id: row._id,
    name: row.name,
    dogs: [...(row.associatedDog || [])],
    heat: row.heat || "Heat 1",
    isNew: false,
  }));

  const editingIndex =
    args.editingDriverIndex === undefined ? 0 : args.editingDriverIndex;

  const idx = findDriverCardToUpdate(cards, {
    driverName: cards[0]?.name || "",
    selectedHeat,
    isHeated: args.isHeated,
    isWeightPull: false,
    editingDriverIndex: editingIndex,
  });

  if (idx < 0) throw new Error("Expected to find existing driver card");

  cards[idx] = {
    ...cards[idx],
    dogs: args.newDogs,
  };

  const driver = cards[idx];
  const opts = {
    className: args.className,
    customClass,
    isHeated: args.isHeated,
    isWeightPull: false,
    selectedHeat,
  };

  const { orphanIds } = planOrphanCleanup(cards, args.existingRows, opts);
  const target = resolveEntrantForUpdate(driver, args.existingRows, opts);
  if (!target) throw new Error("Expected to resolve existing entrant");

  return args.existingRows
    .filter((row) => !orphanIds.has(row._id))
    .map((row) =>
      row._id === target._id
        ? { ...row, associatedDog: args.newDogs, heat: row.heat || "Heat 1" }
        : row
    );
}
