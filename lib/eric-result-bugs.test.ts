/**
 * Regression suite for Eric's reported result bugs:
 *  - adding a dog creates duplicate Heat 1 rows
 *  - dog deletes don't persist
 *  - one dog in a team scores 0 (Rogue) while the other scores 10 (Juggernaut)
 *
 * Run: npx tsx lib/eric-result-bugs.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  dedupeEntrantsForEdit,
  findDriverCardToUpdate,
  findOrphanEntrants,
  planDriverDeletions,
  planOrphanCleanup,
  resolveEntrantForUpdate,
  simulateAddDogAndSubmit,
  type EditEntrantRow,
} from "./result-edit-matching";
import { hasNzfssRegistration, isRegisteredDog } from "./nzfss-registration";
import {
  buildNewClassConditions,
  buildNewClassHeatsData,
  findCollidingDriverCards,
  resolveDogRegistration,
  resolveDriverHeat,
  type NewClassContext,
} from "./new-class-submission";
import {
  buildMusherHeatGroups,
  dogKey,
  type ScoringEntrant,
} from "./heat-scoring";
import { buildMusherGroups } from "./race-result-grouping";

let failures = 0;
let passes = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    passes += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL  ${name}`);
    console.error(err);
  }
}

const ROGUE = {
  name: "Northernfore Rogue",
  NZFSSRegistration: "NZ-ROGUE-001",
};
const JUGGERNAUT = {
  name: "HAYSA BULLDOZN JUGGERNAUT",
  NZFSSRegistration: "NZ-JUG-002",
};

function makeRow(
  id: string,
  dogs: { name: string; NZFSSRegistration: string }[],
  overrides: Partial<EditEntrantRow> = {}
): EditEntrantRow {
  // Must be a 24-char hex string — production IDs are Mongo ObjectIds
  const hex = id.replace(/[^0-9a-f]/gi, "a").toLowerCase().padEnd(24, "0").slice(0, 24);
  return {
    name: "Hayden Franklin",
    class: "speed",
    customClass: "Single-Dog Scooter",
    heat: "Heat 1",
    raceFormat: "Single",
    associatedDog: dogs,
    ...overrides,
    _id: overrides._id || hex,
  };
}

function makeScoring(
  id: string,
  dogs: { name: string; NZFSSRegistration: string }[],
  overrides: Partial<ScoringEntrant> = {}
): ScoringEntrant {
  const hex = id.replace(/[^0-9a-f]/gi, "a").toLowerCase().padEnd(24, "0").slice(0, 24);
  return {
    name: "Hayden Franklin",
    class: "speed",
    customClass: "Single-Dog Scooter",
    heat: "Heat 1",
    raceTime: "00:10:00.00",
    raceType: "Started",
    associatedDog: dogs,
    ...overrides,
    _id: overrides._id || hex,
  };
}

console.log("\n=== Eric result-bug regression suite ===\n");

for (let run = 1; run <= 10; run++) {
  console.log(`\n--- Run ${run}/10 ---`);

  check(`run ${run}: add second dog does not create a duplicate row`, () => {
    const existing = [makeRow(`a${run}`, [ROGUE])];
    const after = simulateAddDogAndSubmit({
      existingRows: existing,
      className: "speed",
      customClass: "Single-Dog Scooter",
      isHeated: false,
      newDogs: [ROGUE, JUGGERNAUT],
    });
    assert.equal(after.length, 1);
    assert.equal(after[0].associatedDog?.length, 2);
    assert.deepEqual(
      after[0].associatedDog?.map((d) => d.name).sort(),
      [JUGGERNAUT.name, ROGUE.name].sort()
    );
  });

  check(`run ${run}: add/remove/add dog still ends as one row (Eric's 3-heat case)`, () => {
    // Replicates: save with 1 dog → add dog → delete dog → add again
    // which previously left 3 Heat 1 documents.
    let rows = [makeRow(`b${run}1`, [ROGUE])];

    rows = simulateAddDogAndSubmit({
      existingRows: rows,
      className: "speed",
      customClass: "Single-Dog Scooter",
      isHeated: false,
      newDogs: [ROGUE, JUGGERNAUT],
    });
    assert.equal(rows.length, 1);

    rows = simulateAddDogAndSubmit({
      existingRows: rows,
      className: "speed",
      customClass: "Single-Dog Scooter",
      isHeated: false,
      newDogs: [ROGUE],
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].associatedDog?.length, 1);

    rows = simulateAddDogAndSubmit({
      existingRows: rows,
      className: "speed",
      customClass: "Single-Dog Scooter",
      isHeated: false,
      newDogs: [ROGUE, JUGGERNAUT],
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].associatedDog?.length, 2);
  });

  check(`run ${run}: orphan cleanup removes legacy duplicate Heat 1 rows`, () => {
    const keep = makeRow(`c${run}1`, [ROGUE, JUGGERNAUT]);
    const orphan1 = makeRow(`c${run}2`, [ROGUE]);
    const orphan2 = makeRow(`c${run}3`, [ROGUE]);
    const existing = [keep, orphan1, orphan2];

    const after = simulateAddDogAndSubmit({
      existingRows: existing,
      className: "speed",
      customClass: "Single-Dog Scooter",
      isHeated: false,
      newDogs: [ROGUE, JUGGERNAUT],
    });

    assert.equal(after.length, 1);
    assert.equal(after[0]._id, keep._id);
  });

  check(`run ${run}: edit form dedupes 3 Heat 1 cards into 1 (fullest team wins)`, () => {
    const rows = [
      makeRow(`d${run}1`, [ROGUE]),
      makeRow(`d${run}2`, [ROGUE]),
      makeRow(`d${run}3`, [ROGUE, JUGGERNAUT]),
    ];
    const deduped = dedupeEntrantsForEdit(rows, {
      isWeightPull: false,
      isHeated: false,
    });
    assert.equal(deduped.length, 1);
    assert.equal(deduped[0].associatedDog?.length, 2);
  });

  check(`run ${run}: Add Dog merges into existing card (not by dog-set equality)`, () => {
    const cards = [
      {
        _id: makeRow(`e${run}`, [ROGUE])._id,
        name: "Hayden Franklin",
        dogs: [ROGUE],
        heat: "Heat 1",
        isNew: false,
      },
    ];
    const idx = findDriverCardToUpdate(cards, {
      driverName: "Hayden Franklin",
      selectedHeat: "Heat 1",
      isHeated: false,
      isWeightPull: false,
      editingDriverIndex: 0,
    });
    assert.equal(idx, 0);

    // Old buggy matcher required exact dog set — this would have been -1
    const dogSetChangedIdx = findDriverCardToUpdate(
      [{ ...cards[0], dogs: [ROGUE] }],
      {
        driverName: "Hayden Franklin",
        selectedHeat: "Heat 1",
        isHeated: false,
        isWeightPull: false,
        editingDriverIndex: null,
      }
    );
    assert.equal(dogSetChangedIdx, 0);
  });

  check(`run ${run}: submit resolves by _id even when dog set changed`, () => {
    const row = makeRow(`f${run}`, [ROGUE]);
    const driver = {
      _id: row._id,
      name: row.name,
      dogs: [ROGUE, JUGGERNAUT],
      heat: "Heat 1",
      isNew: false,
    };
    const resolved = resolveEntrantForUpdate(driver, [row], {
      className: "speed",
      customClass: "Single-Dog Scooter",
      isHeated: false,
      isWeightPull: false,
      selectedHeat: "Heat 1",
    });
    assert.ok(resolved);
    assert.equal(resolved!._id, row._id);
  });

  check(`run ${run}: heated Heat 1 + Heat 2 stay separate (not orphans of each other)`, () => {
    const heat1 = makeRow(`g${run}1`, [ROGUE, JUGGERNAUT], {
      heat: "Heat 1",
      raceFormat: "Heated",
      customClass: "4-dog rig",
    });
    const heat2 = makeRow(`g${run}2`, [ROGUE, JUGGERNAUT], {
      heat: "Heat 2",
      raceFormat: "Heated",
      customClass: "4-dog rig",
    });

    const orphans = findOrphanEntrants(heat1._id, {
      _id: heat1._id,
      name: heat1.name,
      dogs: [ROGUE, JUGGERNAUT],
      heat: "Heat 1",
    }, [heat1, heat2], {
      className: "speed",
      customClass: "4-dog rig",
      isHeated: true,
      isWeightPull: false,
      selectedHeat: "Heat 1",
    });

    assert.equal(orphans.length, 0);

    const deduped = dedupeEntrantsForEdit([heat1, heat2], {
      isWeightPull: false,
      isHeated: true,
    });
    assert.equal(deduped.length, 2);
  });

  check(`run ${run}: scoring — duplicate Heat 1 rows do not zero Rogue (Eric screenshot)`, () => {
    // Legacy corruption: row1=[Rogue], row2=[Rogue,Juggernaut], row3=[Rogue]
    // all labeled Heat 1. Old logic required dog on every ROW → Rogue only? or
    // Juggernaut only. New logic collapses to fullest team → both qualify.
    const entrants = [
      makeScoring(`h${run}1`, [ROGUE]),
      makeScoring(`h${run}2`, [ROGUE, JUGGERNAUT]),
      makeScoring(`h${run}3`, [ROGUE]),
    ];
    const groups = buildMusherHeatGroups(entrants);
    const group = groups.get("hayden franklin");
    assert.ok(group);
    assert.equal(group!.rows.length, 1, "duplicates collapsed to one heat row");
    assert.equal(group!.heatsRun.size, 1);
    assert.ok(group!.qualifyingDogKeys.has(dogKey(ROGUE)), "Rogue qualifies");
    assert.ok(
      group!.qualifyingDogKeys.has(dogKey(JUGGERNAUT)),
      "Juggernaut qualifies"
    );
    assert.equal(group!.totalSeconds, 600, "time not triple-counted");
  });

  check(`run ${run}: scoring — real heated race still requires dog in every heat`, () => {
    const entrants = [
      makeScoring(`i${run}1`, [ROGUE, JUGGERNAUT], { heat: "Heat 1", raceTime: "00:10:00.00" }),
      makeScoring(`i${run}2`, [JUGGERNAUT], { heat: "Heat 2", raceTime: "00:11:00.00" }),
    ];
    const groups = buildMusherHeatGroups(entrants);
    const group = groups.get("hayden franklin");
    assert.ok(group);
    assert.equal(group!.rows.length, 2);
    assert.ok(group!.qualifyingDogKeys.has(dogKey(JUGGERNAUT)));
    assert.equal(
      group!.qualifyingDogKeys.has(dogKey(ROGUE)),
      false,
      "Rogue dropped in Heat 2 must score 0"
    );
  });

  check(`run ${run}: display grouping collapses Heat 1 / Heat 1 / Run 1 duplicates`, () => {
    const rows = [
      {
        _id: makeRow(`j${run}1`, [ROGUE])._id,
        musherRank: 1,
        points: 1,
        dogPoints: [{ NZFSSRegistration: ROGUE.NZFSSRegistration, points: 0 }],
        entrant: {
          name: "Hayden Franklin",
          raceTime: "00:10:00.00",
          heat: "Heat 1",
          raceType: "Started",
          class: "speed",
          customClass: "Single-Dog Scooter",
          associatedDog: [ROGUE],
        },
      },
      {
        _id: makeRow(`j${run}2`, [ROGUE])._id,
        musherRank: 1,
        points: 0,
        dogPoints: [{ NZFSSRegistration: ROGUE.NZFSSRegistration, points: 0 }],
        entrant: {
          name: "Hayden Franklin",
          raceTime: "00:10:00.00",
          heat: "Heat 1",
          raceType: "Started",
          class: "speed",
          customClass: "Single-Dog Scooter",
          associatedDog: [ROGUE],
        },
      },
      {
        _id: makeRow(`j${run}3`, [ROGUE, JUGGERNAUT])._id,
        musherRank: 1,
        points: 1,
        dogPoints: [
          { NZFSSRegistration: ROGUE.NZFSSRegistration, points: 10 },
          { NZFSSRegistration: JUGGERNAUT.NZFSSRegistration, points: 10 },
        ],
        entrant: {
          name: "Hayden Franklin",
          raceTime: "00:10:00.00",
          heat: "", // became "Run N" in old UI
          raceType: "Started",
          class: "speed",
          customClass: "Single-Dog Scooter",
          associatedDog: [ROGUE, JUGGERNAUT],
        },
      },
    ];

    const groups = buildMusherGroups(rows);
    assert.equal(groups.length, 1);
    // Empty heat is treated as Heat 1, so all three duplicates collapse.
    assert.equal(groups[0].heatCount, 1);
    assert.equal(groups[0].heats[0].heat, "Heat 1");
    assert.ok(groups[0].associatedDog.some((d) => d.name === ROGUE.name));
    assert.ok(groups[0].associatedDog.some((d) => d.name === JUGGERNAUT.name));
    const roguePts = groups[0].dogPoints.find(
      (d) => d.NZFSSRegistration === ROGUE.NZFSSRegistration
    );
    assert.equal(roguePts?.points, 10);
  });

  check(`run ${run}: scoring — stray Heat 2 on one musher does not zero the rest of the class`, () => {
    const entrants = [
      makeScoring(`k${run}1`, [ROGUE], { name: "Alice", heat: "Heat 1" }),
      makeScoring(`k${run}2`, [JUGGERNAUT], { name: "Bob", heat: "Heat 1" }),
      // Corrupt stray label on only one musher
      makeScoring(`k${run}3`, [ROGUE], { name: "Alice", heat: "Heat 2", raceTime: "00:09:00.00" }),
    ];
    const groups = buildMusherHeatGroups(entrants);
    const bob = groups.get("bob");
    assert.ok(bob);
    assert.equal(bob!.complete, true, "Bob must still complete with only Heat 1");
    assert.ok(bob!.qualifyingDogKeys.has(dogKey(JUGGERNAUT)));
  });

  check(`run ${run}: two keep cards for same musher do not mutually orphan each other`, () => {
    const heat1 = makeRow(`l${run}1`, [ROGUE], {
      heat: "Heat 1",
      raceFormat: "Heated",
      customClass: "4-dog rig",
    });
    const heat2 = makeRow(`l${run}2`, [ROGUE], {
      heat: "Heat 2",
      raceFormat: "Heated",
      customClass: "4-dog rig",
    });
    const { keepIds, orphanIds } = planOrphanCleanup(
      [
        { _id: heat1._id, name: heat1.name, dogs: [ROGUE], heat: "Heat 1" },
        { _id: heat2._id, name: heat2.name, dogs: [ROGUE], heat: "Heat 2" },
      ],
      [heat1, heat2],
      {
        className: "speed",
        customClass: "4-dog rig",
        isHeated: true,
        isWeightPull: false,
        selectedHeat: "Heat 1",
      }
    );
    assert.equal(keepIds.size, 2);
    assert.equal(orphanIds.size, 0);
  });

  check(`run ${run}: removing one weight-pull entry keeps the musher's other entries`, () => {
    // Eric: "deleting drivers only works sometimes ... when you try to delete
    // multiple driver entries". Weight pull holds one row per dog entry, so a
    // name sweep deleted every entry the musher had in the class.
    const rows = [
      makeRow(`m${run}1`, [ROGUE], { customClass: "Unlimited Class", class: "weight pull" }),
      makeRow(`m${run}2`, [JUGGERNAUT], { customClass: "Unlimited Class", class: "weight pull" }),
      makeRow(`m${run}3`, [ROGUE], { customClass: "Unlimited Class", class: "weight pull" }),
    ];
    const original = rows.map((r) => ({ _id: r._id, name: r.name, heat: r.heat }));
    const current = [original[0], original[2]]; // middle entry removed

    const ids = planDriverDeletions(original, current, rows, {
      isHeated: false,
      isWeightPull: true,
    });

    assert.equal(ids.size, 1, "only the removed entry is deleted");
    assert.ok(ids.has(rows[1]._id));
    assert.equal(ids.has(rows[0]._id), false, "kept entry must survive");
    assert.equal(ids.has(rows[2]._id), false, "kept entry must survive");
  });

  check(`run ${run}: removing a driver still clears its legacy duplicate rows`, () => {
    const rows = [
      makeRow(`n${run}1`, [ROGUE]),
      makeRow(`n${run}2`, [ROGUE]), // legacy duplicate collapsed out of the form
    ];
    const original = [{ _id: rows[0]._id, name: rows[0].name, heat: "Heat 1" }];

    const ids = planDriverDeletions(original, [], rows, {
      isHeated: false,
      isWeightPull: false,
    });

    assert.equal(ids.size, 2, "both the row and its duplicate go");
  });

  check(`run ${run}: deleting a heated driver leaves the other heat alone`, () => {
    const heat1 = makeRow(`o${run}1`, [ROGUE], { heat: "Heat 1", raceFormat: "Heated" });
    const heat2 = makeRow(`o${run}2`, [ROGUE], { heat: "Heat 2", raceFormat: "Heated" });
    const original = [
      { _id: heat1._id, name: heat1.name, heat: "Heat 1" },
      { _id: heat2._id, name: heat2.name, heat: "Heat 2" },
    ];

    const ids = planDriverDeletions(original, [original[1]], [heat1, heat2], {
      isHeated: true,
      isWeightPull: false,
    });

    assert.equal(ids.size, 1);
    assert.ok(ids.has(heat1._id));
    assert.equal(ids.has(heat2._id), false, "Heat 2 must survive");
  });

  check(`run ${run}: add-class keeps each driver in the heat it was entered under`, () => {
    // Eric's report: enter Heat 1, add driver; add Heat 2, add same driver;
    // submit. Both rows used to be stamped with the selected heat, so the
    // second create overwrote the first and only one heat survived.
    const ctx: NewClassContext = {
      raceFormat: "Heated",
      className: "speed",
      customClass: "4-Dog Rig",
      heats: [
        { heat: "Heat 1", temperature: "1", distance: "11" },
        { heat: "Heat 2", temperature: "2", distance: "22" },
      ],
      // Selector left on Heat 2 at submit time — the state that caused the bug
      selectedHeat: "Heat 2",
    };

    const heat1Card = { name: "ERIC ALTERMANN", heat: "Heat 1" };
    const heat2Card = { name: "ERIC ALTERMANN", heat: "Heat 2" };

    assert.equal(resolveDriverHeat(heat1Card, ctx), "Heat 1");
    assert.equal(resolveDriverHeat(heat2Card, ctx), "Heat 2");
    assert.equal(findCollidingDriverCards([heat1Card, heat2Card], ctx).length, 0);
  });

  check(`run ${run}: add-class sends each heat its own temperature and distance`, () => {
    const ctx: NewClassContext = {
      raceFormat: "Heated",
      className: "speed",
      customClass: "4-Dog Rig",
      heats: [
        { heat: "Heat 1", temperature: "4", distance: "6.75" },
        { heat: "Heat 2", temperature: "8", distance: "5" },
      ],
      selectedHeat: "Heat 2",
    };

    const first = buildNewClassConditions({ name: "A", heat: "Heat 1" }, ctx);
    const second = buildNewClassConditions({ name: "A", heat: "Heat 2" }, ctx);

    assert.equal(first.temperature, "4");
    assert.equal(first.distance, "6.75");
    assert.equal(second.temperature, "8");
    assert.equal(second.distance, "5");
    // Every row carries the whole heat table so the class knows its heat count
    assert.equal(first.heatsData.length, 2);
    assert.deepEqual(
      first.heatsData.map((h) => h.heat),
      ["Heat 1", "Heat 2"]
    );
  });

  check(`run ${run}: add-class flags two cards that would overwrite each other`, () => {
    const ctx: NewClassContext = {
      raceFormat: "Heated",
      className: "speed",
      customClass: "4-Dog Rig",
      heats: [{ heat: "Heat 1", temperature: "1", distance: "11" }],
      selectedHeat: "Heat 1",
    };

    const collisions = findCollidingDriverCards(
      [
        { name: "ERIC ALTERMANN", heat: "Heat 1" },
        { name: "ERIC ALTERMANN", heat: "Heat 1" },
      ],
      ctx
    );
    assert.equal(collisions.length, 1);
    assert.equal(collisions[0].length, 2);
  });

  check(`run ${run}: add-class weight pull may repeat a musher (one row per dog)`, () => {
    const ctx: NewClassContext = {
      raceFormat: "Single",
      className: "weight pull",
      customClass: "Unlimited Class",
      heats: [],
      selectedHeat: "Heat 1",
      fallbackDistance: "",
    };

    assert.equal(
      findCollidingDriverCards(
        [{ name: "ERIC ALTERMANN" }, { name: "ERIC ALTERMANN" }],
        ctx
      ).length,
      0
    );
    // Weight pull distance is fixed regardless of what is typed
    assert.equal(buildNewClassConditions({ name: "A" }, ctx).distance, "10 metres");
  });

  check(`run ${run}: add-class single-format class always lands on Heat 1`, () => {
    const ctx: NewClassContext = {
      raceFormat: "Single",
      className: "speed",
      customClass: "Single-Dog Scooter",
      // Stale heats left over from a class edited earlier in the session
      heats: [
        { heat: "Heat 1", temperature: "1", distance: "11" },
        { heat: "Heat 2", temperature: "2", distance: "22" },
      ],
      selectedHeat: "Heat 2",
      fallbackTemperature: "7",
      fallbackDistance: "11",
    };

    const conditions = buildNewClassConditions({ name: "A", heat: "Heat 2" }, ctx);
    assert.equal(conditions.heat, "Heat 1");
    assert.equal(conditions.heatsData.length, 1);
    assert.equal(conditions.temperature, "7");
    assert.equal(conditions.distance, "11");
  });

  check(`run ${run}: add-class falls back to the selector only for cards with no heat`, () => {
    const ctx: NewClassContext = {
      raceFormat: "Heated",
      className: "speed",
      customClass: "4-Dog Rig",
      heats: [
        { heat: "Heat 1", temperature: "1", distance: "11" },
        { heat: "Heat 2", temperature: "2", distance: "22" },
      ],
      selectedHeat: "Heat 2",
    };

    assert.equal(resolveDriverHeat({ name: "A" }, ctx), "Heat 2");
    assert.equal(resolveDriverHeat({ name: "A", heat: "" }, ctx), "Heat 2");
  });

  check(`run ${run}: add-class heat with blank conditions borrows only the open heat's inputs`, () => {
    const ctx: NewClassContext = {
      raceFormat: "Heated",
      className: "speed",
      customClass: "4-Dog Rig",
      heats: [
        { heat: "Heat 1", temperature: "", distance: "" },
        { heat: "Heat 2", temperature: "", distance: "" },
      ],
      selectedHeat: "Heat 1",
      fallbackTemperature: "3",
      fallbackDistance: "5",
    };

    const rows = buildNewClassHeatsData(ctx);
    assert.equal(rows[0].temperature, "3");
    assert.equal(rows[0].distance, "5");
    assert.equal(rows[1].temperature, "", "Heat 2 must not inherit Heat 1 conditions");
    assert.equal(rows[1].distance, "");
  });

  check(`run ${run}: add-class keeps a hand-typed dog's registration number`, () => {
    // A dog typed in by hand is not in the musher registry, so the name lookup
    // returns nothing — the number entered on the form has to survive.
    assert.equal(resolveDogRegistration({ NZFSSRegistration: "RR/098" }, undefined), "RR/098");
    assert.equal(
      resolveDogRegistration({ NZFSSRegistration: "" }, { nzfssNo: "RR/099" }),
      "RR/099"
    );
    // Never write the sentinel — a blank registration must stay blank
    assert.equal(resolveDogRegistration({ NZFSSRegistration: "" }, { nzfssNo: "" }), "");
    assert.equal(
      resolveDogRegistration({ NZFSSRegistration: "Unknown" }, { nzfssNo: "Unknown" }),
      ""
    );
    assert.equal(hasNzfssRegistration(resolveDogRegistration(null, null)), false);
  });

  check(`run ${run}: blank registration is not treated as registered ("Unknown" coercion)`, () => {
    assert.equal(hasNzfssRegistration(""), false);
    assert.equal(hasNzfssRegistration("Unknown"), false);
    assert.equal(hasNzfssRegistration("unknown"), false);
    assert.equal(isRegisteredDog({ NZFSSRegistration: "" }), false);
    assert.equal(isRegisteredDog({ NZFSSRegistration: "Unknown" }), false);
    assert.equal(isRegisteredDog({ NZFSSRegistration: ROGUE.NZFSSRegistration }), true);
  });
}

console.log(`\n=== Results: ${passes} passed, ${failures} failed ===\n`);
if (failures > 0) process.exit(1);
