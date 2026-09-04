import {
  dogKey,
  expectedHeatsForClass,
  isFresherHeatRow,
  type ScoringEntrant,
} from "./heat-scoring";

export interface HeatRun {
  entrantId: string;
  heat: string;
  raceTime: string;
  points: number;
  associatedDog: { name: string; NZFSSRegistration: string }[];
}

/** One dog's heat participation, so the public table can say why a dog scored 0. */
export interface DogParticipation {
  name: string;
  NZFSSRegistration: string;
  heatsRun: string[];
  missedHeats: string[];
  /** True when the dog ran every heat the musher ran and so is eligible for points. */
  ranEveryHeat: boolean;
  /** Points to display for this dog; always 0 when it missed a heat. */
  points: number;
}

export interface MusherResultGroup {
  groupKey: string;
  name: string;
  musherRank: number;
  totalTime: string;
  heatCount: number;
  heats: HeatRun[];
  dogsLabel: string;
  points: number;
  dogPoints: { NZFSSRegistration: string; points: number }[];
  associatedDog: { name: string; NZFSSRegistration: string }[];
  dogParticipation: DogParticipation[];
  raceType: string;
  class: string;
  customClass: string;
  dogWeight?: string;
  weightPulled?: string;
}

export function timeToSeconds(timeStr: string): number {
  if (!timeStr || !/^\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(timeStr)) {
    return Number.MAX_VALUE;
  }

  const [hoursStr, minutesStr, secondsWithMs] = timeStr.split(':');
  const hours = parseInt(hoursStr || '0', 10);
  const minutes = parseInt(minutesStr || '0', 10);

  let seconds = 0;
  let milliseconds = 0;

  if (secondsWithMs) {
    if (secondsWithMs.includes('.')) {
      const [secondsStr, millisecondsStr] = secondsWithMs.split('.');
      seconds = parseInt(secondsStr || '0', 10);
      milliseconds =
        parseInt(millisecondsStr || '0', 10) / Math.pow(10, millisecondsStr.length);
    } else {
      seconds = parseInt(secondsWithMs || '0', 10);
    }
  }

  return hours * 3600 + minutes * 60 + seconds + milliseconds;
}

export function secondsToRaceTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function musherKey(name: string): string {
  return name.trim().toLowerCase();
}

function mergeDogPoints(
  a: { NZFSSRegistration: string; points: number }[],
  b: { NZFSSRegistration: string; points: number }[]
): { NZFSSRegistration: string; points: number }[] {
  const byReg = new Map<string, { NZFSSRegistration: string; points: number }>();
  for (const dp of [...a, ...b]) {
    if (!dp?.NZFSSRegistration) continue;
    const existing = byReg.get(dp.NZFSSRegistration);
    if (!existing || dp.points > existing.points) {
      byReg.set(dp.NZFSSRegistration, dp);
    }
  }
  return Array.from(byReg.values());
}

function hasValidFinish(raceType: string): boolean {
  const status = raceType?.toLowerCase() || '';
  return !['did not start', 'did not finish', 'disqualified', 'did not qualify'].includes(
    status
  );
}

/**
 * Overall place by combined heat times. Only mushers who finished every heat
 * the class ran are placed; a one-heat entry in a two-heat class gets no rank.
 */
export function computeMusherRanks(
  entrants: {
    name: string;
    raceTime?: string;
    raceType: string;
    heat?: string | null;
    heatsData?: { heat?: string | null }[] | null;
  }[]
): Map<string, number> {
  const expectedHeats = expectedHeatsForClass(
    entrants.map((e, i) => ({ _id: String(i), ...e }))
  );
  const totals = new Map<string, number>();
  const heatsRun = new Map<string, Set<string>>();
  const failed = new Set<string>();

  for (const entrant of entrants) {
    const key = musherKey(entrant.name);
    const label = (entrant.heat || '').trim() || 'Heat 1';
    if (!heatsRun.has(key)) heatsRun.set(key, new Set());
    heatsRun.get(key)!.add(label);

    const secs = timeToSeconds(entrant.raceTime || '');
    if (!hasValidFinish(entrant.raceType) || secs >= Number.MAX_VALUE) {
      failed.add(key);
      continue;
    }
    totals.set(key, (totals.get(key) || 0) + secs);
  }

  const complete = [...totals.entries()].filter(([key]) => {
    if (failed.has(key)) return false;
    const run = heatsRun.get(key) || new Set<string>();
    return [...expectedHeats].every((heat) => run.has(heat));
  });

  const sorted = complete.sort((a, b) => a[1] - b[1]);
  const ranks = new Map<string, number>();
  sorted.forEach(([name], index) => ranks.set(name, index + 1));
  return ranks;
}

function scoringRowFromHeat(heat: HeatRun, name: string): ScoringEntrant {
  return {
    _id: heat.entrantId,
    name,
    heat: heat.heat,
    associatedDog: heat.associatedDog,
  };
}

function unionDogsFromHeats(
  heats: HeatRun[]
): { name: string; NZFSSRegistration: string }[] {
  const byKey = new Map<string, { name: string; NZFSSRegistration: string }>();
  for (const heat of heats) {
    for (const dog of heat.associatedDog || []) {
      const key = dogKey(dog);
      if (!byKey.has(key)) {
        byKey.set(key, {
          name: dog.name || "",
          NZFSSRegistration: dog.NZFSSRegistration || "",
        });
      }
    }
  }
  return Array.from(byKey.values());
}

function dogParticipationFromHeats(
  heats: HeatRun[],
  dogs: { name: string; NZFSSRegistration: string }[]
): DogParticipation[] {
  const allHeats = heats.map((h) => h.heat);
  return dogs.map((dog) => {
    const key = dogKey(dog);
    const heatsRun = heats
      .filter((h) => (h.associatedDog || []).some((d) => dogKey(d) === key))
      .map((h) => h.heat);
    const missedHeats = allHeats.filter((h) => !heatsRun.includes(h));
    return {
      name: dog.name,
      NZFSSRegistration: dog.NZFSSRegistration,
      heatsRun,
      missedHeats,
      ranEveryHeat: missedHeats.length === 0,
      points: 0,
    };
  });
}

function qualifyingDogKeys(participation: DogParticipation[]): Set<string> {
  const keys = new Set<string>();
  for (const dog of participation) {
    if (dog.ranEveryHeat) keys.add(dogKey(dog));
  }
  return keys;
}

/** Stored heat-1 points still list a dropped dog at 10; live heat teams override that. */
function dogPointsForDisplay(
  stored: { NZFSSRegistration: string; points: number }[],
  dogs: { name: string; NZFSSRegistration: string }[],
  qualifying: Set<string>
): { NZFSSRegistration: string; points: number }[] {
  return dogs.map((dog) => {
    const qualifies = qualifying.has(dogKey(dog));
    const dogReg = (dog.NZFSSRegistration || "").trim().toLowerCase();
    const dogName = (dog.name || "").trim().toLowerCase();
    const storedRow = stored.find((dp) => {
      const reg = (dp.NZFSSRegistration || "").trim().toLowerCase();
      return (dogReg && reg === dogReg) || (dogName && reg === dogName);
    });
    return {
      NZFSSRegistration: dog.NZFSSRegistration || dog.name,
      points: qualifies ? storedRow?.points ?? 0 : 0,
    };
  });
}

interface RowInput {
  _id: string;
  musherRank: number;
  points: number;
  dogPoints: { NZFSSRegistration: string; points: number }[];
  entrant: {
    name: string;
    raceTime?: string;
    heat?: string;
    raceType: string;
    class: string;
    customClass: string;
    dogWeight?: string;
    weightPulled?: string;
    associatedDog: { name: string; NZFSSRegistration: string }[];
  };
}

export function buildMusherGroups(rows: RowInput[]): MusherResultGroup[] {
  const map = new Map<
    string,
    {
      name: string;
      musherRank: number;
      totalSeconds: number;
      heats: HeatRun[];
      points: number;
      dogPoints: { NZFSSRegistration: string; points: number }[];
      entrant: RowInput['entrant'];
    }
  >();

  for (const row of rows) {
    const key = musherKey(row.entrant.name);
    const secs = timeToSeconds(row.entrant.raceTime || '');
    const heatLabel = row.entrant.heat?.trim() || "Heat 1";

    const heatRun: HeatRun = {
      entrantId: row._id,
      heat: heatLabel,
      raceTime: row.entrant.raceTime || '—',
      points: row.points,
      associatedDog: row.entrant.associatedDog || [],
    };

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        name: row.entrant.name,
        musherRank: row.musherRank,
        totalSeconds: secs < Number.MAX_VALUE ? secs : 0,
        heats: [heatRun],
        points: row.points,
        dogPoints: row.dogPoints,
        entrant: row.entrant,
      });
      continue;
    }

    existing.dogPoints = mergeDogPoints(existing.dogPoints, row.dogPoints);

    const sameHeatIdx = existing.heats.findIndex((h) => h.heat === heatLabel);
    if (sameHeatIdx >= 0) {
      if (
        isFresherHeatRow(
          scoringRowFromHeat(heatRun, row.entrant.name),
          scoringRowFromHeat(existing.heats[sameHeatIdx], row.entrant.name)
        )
      ) {
        existing.heats[sameHeatIdx] = heatRun;
      }
      existing.totalSeconds = existing.heats.reduce((sum, h) => {
        const t = timeToSeconds(h.raceTime);
        return sum + (t < Number.MAX_VALUE ? t : 0);
      }, 0);
    } else {
      existing.heats.push(heatRun);
      if (secs < Number.MAX_VALUE) {
        existing.totalSeconds += secs;
      }
    }
    existing.points = Math.max(existing.points, row.points);
  }

  const groups: MusherResultGroup[] = [...map.values()].map((g) => {
    g.heats.sort((a, b) => {
      const heatCmp = a.heat.localeCompare(b.heat);
      if (heatCmp !== 0) return heatCmp;
      return timeToSeconds(a.raceTime) - timeToSeconds(b.raceTime);
    });

    const dogParticipation = dogParticipationFromHeats(g.heats, unionDogsFromHeats(g.heats));
    // Scoring dogs first, missed-heat dogs last; stable so first-seen order holds within each.
    dogParticipation.sort((a, b) => Number(b.ranEveryHeat) - Number(a.ranEveryHeat));
    const associatedDog = dogParticipation.map(({ name, NZFSSRegistration }) => ({
      name,
      NZFSSRegistration,
    }));
    const qualifying = qualifyingDogKeys(dogParticipation);
    const dogPoints = dogPointsForDisplay(g.dogPoints, associatedDog, qualifying);
    // dogPointsForDisplay is positional with associatedDog, so index rather than
    // match by registration — same-registration dogs would otherwise collide.
    dogParticipation.forEach((dog, i) => {
      dog.points = dogPoints[i]?.points ?? 0;
    });

    return {
      groupKey: musherKey(g.name),
      name: g.name,
      musherRank: g.musherRank,
      totalTime: secondsToRaceTime(g.totalSeconds) || g.heats[0]?.raceTime || '—',
      heatCount: g.heats.length,
      heats: g.heats,
      dogsLabel: associatedDog.map((d) => d.name || '').join(', '),
      points: g.points,
      dogPoints,
      associatedDog,
      dogParticipation,
      raceType: g.entrant.raceType,
      class: g.entrant.class,
      customClass: g.entrant.customClass,
      dogWeight: g.entrant.dogWeight,
      weightPulled: g.entrant.weightPulled,
    };
  });

  return groups.sort((a, b) => {
    const rankA = a.musherRank > 0 ? a.musherRank : Number.MAX_SAFE_INTEGER;
    const rankB = b.musherRank > 0 ? b.musherRank : Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return a.name.localeCompare(b.name);
  });
}

export function isWeightpullGroup(group: MusherResultGroup): boolean {
  return (
    group.raceType === 'weightpull' ||
    group.class?.toLowerCase().includes('weight') ||
    group.class?.toLowerCase().includes('pull') ||
    group.customClass?.toLowerCase().includes('weight') ||
    group.customClass?.toLowerCase().includes('pull')
  );
}
