export interface HeatRun {
  entrantId: string;
  heat: string;
  raceTime: string;
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

function hasValidFinish(raceType: string): boolean {
  const status = raceType?.toLowerCase() || '';
  return !['did not start', 'did not finish', 'disqualified', 'did not qualify'].includes(
    status
  );
}

/** Overall place by combined heat times. */
export function computeMusherRanks(
  entrants: { name: string; raceTime?: string; raceType: string }[]
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const entrant of entrants) {
    if (!hasValidFinish(entrant.raceType)) continue;
    const secs = timeToSeconds(entrant.raceTime || '');
    if (secs >= Number.MAX_VALUE) continue;
    const key = musherKey(entrant.name);
    totals.set(key, (totals.get(key) || 0) + secs);
  }

  const sorted = [...totals.entries()].sort((a, b) => a[1] - b[1]);
  const ranks = new Map<string, number>();
  sorted.forEach(([name], index) => ranks.set(name, index + 1));
  return ranks;
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
    const heatLabel = row.entrant.heat?.trim() || `Run ${(map.get(key)?.heats.length ?? 0) + 1}`;

    const heatRun: HeatRun = {
      entrantId: row._id,
      heat: heatLabel,
      raceTime: row.entrant.raceTime || '—',
      points: row.points,
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

    existing.heats.push(heatRun);
    if (secs < Number.MAX_VALUE) {
      existing.totalSeconds += secs;
    }
    existing.points = Math.max(existing.points, row.points);
  }

  const groups: MusherResultGroup[] = [...map.values()].map((g) => {
    g.heats.sort((a, b) => {
      const heatCmp = a.heat.localeCompare(b.heat);
      if (heatCmp !== 0) return heatCmp;
      return timeToSeconds(a.raceTime) - timeToSeconds(b.raceTime);
    });

    return {
      groupKey: musherKey(g.name),
      name: g.name,
      musherRank: g.musherRank,
      totalTime: secondsToRaceTime(g.totalSeconds) || g.heats[0]?.raceTime || '—',
      heatCount: g.heats.length,
      heats: g.heats,
      dogsLabel: g.entrant.associatedDog.map((d) => d.name || '').join(', '),
      points: g.points,
      dogPoints: g.dogPoints,
      associatedDog: g.entrant.associatedDog,
      raceType: g.entrant.raceType,
      class: g.entrant.class,
      customClass: g.entrant.customClass,
      dogWeight: g.entrant.dogWeight,
      weightPulled: g.entrant.weightPulled,
    };
  });

  return groups.sort((a, b) => {
    if (a.musherRank !== b.musherRank) return a.musherRank - b.musherRank;
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
