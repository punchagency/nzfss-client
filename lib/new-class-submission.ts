/**
 * Pure helpers for the "Add New Class" flow inside the View Result modal.
 *
 * Adding a class to an existing race used to stamp every driver card with
 * whichever heat the selector happened to be showing at submit time. Two cards
 * entered under Heat 1 and Heat 2 therefore reached the server with the same
 * heat, and since a heated entrant's identity is musher + class + heat, the
 * second create silently overwrote the first — the race came back with one
 * heat, and re-adding the missing heat produced a third row instead.
 *
 * Kept free of React so the behaviour can be regression-tested.
 */
import { heatOf, isHeatedFormat } from "./result-edit-matching";
import { hasNzfssRegistration } from "./nzfss-registration";

export interface NewClassHeat {
  heat: string;
  temperature?: string;
  distance?: string;
  class?: string;
}

/** A heat row as sent to the server. */
export interface NewClassHeatRow {
  heat: string;
  temperature: string;
  distance: string;
  class: string;
}

export interface NewClassDriverCard {
  name: string;
  /** The heat this card was entered under. */
  heat?: string;
}

export interface NewClassContext {
  raceFormat?: string | null;
  /** Class type — "speed", "freight", "snow", "weight pull". */
  className: string;
  customClass?: string | null;
  /** Heats configured in the form, in display order. */
  heats: NewClassHeat[];
  /** Heat currently open in the selector. */
  selectedHeat?: string | null;
  /** Temperature typed into the non-heated (single) input. */
  fallbackTemperature?: string | null;
  /** Distance typed into the non-heated (single) input. */
  fallbackDistance?: string | null;
}

export const WEIGHT_PULL_DISTANCE = "10 metres";

function isWeightPull(ctx: NewClassContext): boolean {
  const haystack = `${ctx.className || ""} ${ctx.customClass || ""}`.toLowerCase();
  return haystack.includes("weight") || haystack.includes("pull");
}

function classTag(ctx: NewClassContext): string {
  return `${ctx.className || ""}:${ctx.customClass || ""}`;
}

/**
 * Which heat a driver card belongs to.
 *
 * The card's own heat wins. The selector is only a fallback for cards added
 * before heats existed — reading the selector first is what collapsed every
 * card onto one heat.
 */
export function resolveDriverHeat(
  driver: NewClassDriverCard,
  ctx: NewClassContext
): string {
  if (!isHeatedFormat(ctx.raceFormat)) return "Heat 1";
  return heatOf(driver.heat || ctx.selectedHeat);
}

/**
 * The full set of heats for the class, with each heat's own conditions.
 *
 * The single temperature/distance inputs mirror only the heat currently open
 * in the selector, so they may only fill in for that heat — using them
 * everywhere would copy one heat's conditions onto every other heat.
 */
export function buildNewClassHeatsData(ctx: NewClassContext): NewClassHeatRow[] {
  const tag = classTag(ctx);
  const weightPull = isWeightPull(ctx);
  const fallbackTemperature = ctx.fallbackTemperature || "";
  const fallbackDistance = weightPull
    ? WEIGHT_PULL_DISTANCE
    : ctx.fallbackDistance || "";

  if (!isHeatedFormat(ctx.raceFormat) || ctx.heats.length === 0) {
    return [
      {
        heat: "Heat 1",
        temperature: fallbackTemperature,
        distance: fallbackDistance,
        class: tag,
      },
    ];
  }

  const selected = heatOf(ctx.selectedHeat);

  return ctx.heats.map((heat) => {
    const isSelected = heatOf(heat.heat) === selected;
    return {
      heat: heat.heat || "",
      temperature: heat.temperature || (isSelected ? fallbackTemperature : "") || "",
      distance: weightPull
        ? WEIGHT_PULL_DISTANCE
        : heat.distance || (isSelected ? fallbackDistance : "") || "",
      class: tag,
    };
  });
}

export interface NewClassConditions {
  heat: string;
  temperature: string;
  distance: string;
  heatsData: NewClassHeatRow[];
}

/**
 * Heat, conditions and heat table for one driver card.
 *
 * Each card is its own entrant document, so it carries the conditions of the
 * heat it ran — not the conditions of whichever heat the selector is showing.
 */
export function buildNewClassConditions(
  driver: NewClassDriverCard,
  ctx: NewClassContext
): NewClassConditions {
  const heatsData = buildNewClassHeatsData(ctx);
  const heat = resolveDriverHeat(driver, ctx);
  const own = heatsData.find((row) => heatOf(row.heat) === heat);

  return {
    heat,
    temperature: own?.temperature ?? ctx.fallbackTemperature ?? "",
    distance: isWeightPull(ctx)
      ? WEIGHT_PULL_DISTANCE
      : own?.distance ?? ctx.fallbackDistance ?? "",
    heatsData,
  };
}

/**
 * A dog's registration number.
 *
 * The number already attached to the dog on the form wins: a dog typed in by
 * hand is not in the musher registry, so looking it up by name only finds
 * nothing and the number the user just entered would be thrown away.
 * "Unknown" is not written into the field — a blank registration must stay
 * blank so scoring treats the dog as unregistered rather than as a dog whose
 * registration number is literally the word "Unknown".
 */
export function resolveDogRegistration(
  dog?: { NZFSSRegistration?: string | null } | null,
  registryDog?: { nzfssNo?: string | null } | null
): string {
  if (hasNzfssRegistration(dog?.NZFSSRegistration)) {
    return (dog!.NZFSSRegistration as string).trim();
  }
  if (hasNzfssRegistration(registryDog?.nzfssNo)) {
    return (registryDog!.nzfssNo as string).trim();
  }
  return "";
}

/**
 * Server-side identity of an entrant: musher + class (+ heat when heated).
 * Two cards sharing a key overwrite each other on save.
 */
export function newClassEntrantKey(
  driver: NewClassDriverCard,
  ctx: NewClassContext
): string {
  return [
    (driver.name || "").trim().toLowerCase(),
    (ctx.className || "").toLowerCase(),
    (ctx.customClass || "").toLowerCase(),
    resolveDriverHeat(driver, ctx),
  ].join("::");
}

/**
 * Cards that would collide on the server, keyed by identity.
 * Weight pull is exempt: it deliberately keeps one row per dog entry.
 */
export function findCollidingDriverCards(
  drivers: NewClassDriverCard[],
  ctx: NewClassContext
): NewClassDriverCard[][] {
  if (isWeightPull(ctx)) return [];

  const byKey = new Map<string, NewClassDriverCard[]>();
  for (const driver of drivers) {
    const key = newClassEntrantKey(driver, ctx);
    const bucket = byKey.get(key);
    if (bucket) bucket.push(driver);
    else byKey.set(key, [driver]);
  }

  return Array.from(byKey.values()).filter((bucket) => bucket.length > 1);
}
