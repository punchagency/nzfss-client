'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  buildMusherGroups,
  isWeightpullGroup,
  type DogParticipation,
  type MusherResultGroup,
} from '@/lib/race-result-grouping';

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

interface MusherResultRowsProps {
  rows: RowInput[];
  classKey: string;
  variant?: 'public' | 'admin';
  renderStatus?: (group: MusherResultGroup) => React.ReactNode;
}

export function MusherResultRows({
  rows,
  classKey,
  variant = 'public',
  renderStatus,
}: MusherResultRowsProps) {
  const groups = buildMusherGroups(rows);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (groups.length === 0) return null;

  const firstGroup = groups[0];
  const isWeightpull = isWeightpullGroup(firstGroup);
  const isAdmin = variant === 'admin';
  const colSpan = isAdmin
    ? isWeightpull
      ? 6
      : 4
    : isWeightpull
      ? 7
      : 6;

  function toggleExpand(groupKey: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }

  function expandKey(group: MusherResultGroup) {
    return `${classKey}::${group.groupKey}`;
  }

  return (
    <>
      {groups.map((group, index) => {
        const canExpand = group.heatCount > 1;
        const isOpen = expanded.has(expandKey(group));

        return (
          <React.Fragment key={expandKey(group)}>
            <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {!isAdmin ? (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {group.musherRank > 0 ? group.musherRank : '—'}
                </td>
              ) : null}
              <td className={isAdmin ? 'py-2 text-sm' : 'px-6 py-4 whitespace-nowrap text-sm text-gray-900'}>
                {group.name}
              </td>
              <td className={isAdmin ? 'py-2 text-sm' : 'px-6 py-4 text-sm text-gray-900'}>
                <DogNamesList group={group} compact={isAdmin} />
              </td>
              {isWeightpull ? (
                <>
                  <td className={isAdmin ? 'py-2 text-sm' : 'px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900'}>
                    {group.dogWeight ? `${group.dogWeight} kg` : 'N/A'}
                  </td>
                  <td className={isAdmin ? 'py-2 text-sm' : 'px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900'}>
                    {group.weightPulled ? `${group.weightPulled} kg` : 'N/A'}
                  </td>
                </>
              ) : null}
              <td className={isAdmin ? 'py-2 text-sm' : 'px-6 py-4 whitespace-nowrap text-sm text-gray-900'}>
                <div className="flex items-center gap-2">
                  {canExpand ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(expandKey(group))}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? 'Hide' : 'Show'} heat times for ${group.name}`}
                    >
                      <ChevronDown
                        className={`h-4 w-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  ) : null}
                  <div>
                    <span className="font-semibold text-gray-900">
                      {canExpand ? group.totalTime : group.heats[0]?.raceTime || '—'}
                    </span>
                    {canExpand ? (
                      <span className="ml-2 text-xs text-gray-500">
                        total · {group.heatCount} heats
                      </span>
                    ) : null}
                  </div>
                </div>
              </td>
              {!isAdmin && !isWeightpull ? (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {group.points}
                </td>
              ) : null}
              {!isAdmin ? (
                <td className="px-6 py-4 text-sm text-gray-900">
                  <DogPointsList group={group} />
                </td>
              ) : null}
              {isAdmin && renderStatus ? (
                <td className="py-2">{renderStatus(group)}</td>
              ) : null}
            </tr>
            {canExpand && isOpen ? (
              <tr className="bg-blue-50/40">
                <td colSpan={colSpan} className={isAdmin ? 'px-2 py-2' : 'px-6 py-3'}>
                  <div className="ml-1 border-l-2 border-blue-200 pl-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Heat breakdown
                    </p>
                    <div className="space-y-1.5">
                      {group.heats.map((heat) => (
                        <div
                          key={heat.entrantId}
                          className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm"
                        >
                          <span className="min-w-[5rem] font-medium text-gray-800">{heat.heat}</span>
                          <span className="font-mono text-gray-900">{heat.raceTime}</span>
                          {heat.associatedDog?.length ? (
                            <span className="text-xs text-gray-500">
                              {heat.associatedDog.map((d) => d.name).filter(Boolean).join(', ')}
                            </span>
                          ) : null}
                          {!isWeightpull && heat.points > 0 ? (
                            <span className="text-xs text-gray-500">{heat.points} pts (heat)</span>
                          ) : null}
                        </div>
                      ))}
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 border-t border-blue-100 pt-2 text-sm font-semibold text-gray-900">
                        <span>Combined total</span>
                        <span className="font-mono">{group.totalTime}</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
}

function missedHeatsLabel(dog: DogParticipation): string {
  if (dog.missedHeats.length === 1) return `missed ${dog.missedHeats[0]}`;
  return `missed ${dog.missedHeats.length} heats`;
}

/**
 * Every dog that started any heat is listed. A dog that skipped a heat is
 * still part of the team's history, so it stays visible but is tagged.
 */
function DogNamesList({
  group,
  compact,
}: {
  group: MusherResultGroup;
  compact: boolean;
}) {
  const dogs = group.dogParticipation;
  if (dogs.length === 0) return <span>{group.dogsLabel}</span>;

  const showHeatTags = group.heatCount > 1;

  return (
    <div className="space-y-1">
      {dogs.map((dog, i) => {
        const partial = showHeatTags && !dog.ranEveryHeat;
        return (
          <div key={`${dog.NZFSSRegistration || dog.name}-${i}`} className="flex flex-wrap items-center gap-2">
            <span className={partial ? 'text-gray-500' : ''}>{dog.name}</span>
            {partial ? (
              <span
                className={`inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-amber-800 ${
                  compact ? 'text-[10px]' : 'text-xs'
                }`}
                title={`Ran ${dog.heatsRun.join(', ') || 'no heats'} of ${group.heatCount}. Dogs must run every heat to earn points.`}
              >
                {dog.heatsRun.length}/{group.heatCount} heats · {missedHeatsLabel(dog)}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function DogPointsList({ group }: { group: MusherResultGroup }) {
  const { dogParticipation } = group;
  if (dogParticipation.length === 0) return null;

  return (
    <div className="space-y-1">
      {dogParticipation.map((dog, i) => {
        const partial = group.heatCount > 1 && !dog.ranEveryHeat;
        return (
          <div key={`${dog.NZFSSRegistration || dog.name}-${i}`} className="flex items-center gap-2">
            <span className={`font-medium ${partial ? 'text-gray-400' : 'text-gray-900'}`}>
              {dog.points}
            </span>
            {partial ? <span className="text-xs text-gray-400">not eligible</span> : null}
          </div>
        );
      })}
    </div>
  );
}
