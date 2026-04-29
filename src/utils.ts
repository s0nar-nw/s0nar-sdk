import { STALE_SLOTS } from "./accounts.js";
import { Region } from "./types.js";
import type { NetworkHealth, Observer } from "./types.js";

// Health score thresholds.
const DEFAULT_DEGRADED_THRESHOLD = 70;
const DEFAULT_CRITICAL_THRESHOLD = 40;

// Returns true when the network health account has not been updated within STALE_SLOTS of currentSlot.
export function isStale(
  networkHealth: NetworkHealth,
  currentSlot: bigint,
): boolean {
  return currentSlot - networkHealth.lastUpdatedSlot > STALE_SLOTS;
}

// Returns true when the observer has not submitted an attestation within STALE_SLOTS of currentSlot.
export function isObserverStale(
  observer: Observer,
  currentSlot: bigint,
): boolean {
  return currentSlot - observer.lastAttestationSlot > STALE_SLOTS;
}

// Returns true when the health score falls below the degraded threshold (default 70).
export function isDegraded(
  networkHealth: NetworkHealth,
  threshold: number = DEFAULT_DEGRADED_THRESHOLD,
): boolean {
  return networkHealth.healthScore < threshold;
}

// Returns the network status based on score and optional staleness.
// When currentSlot is provided and the data is stale, returns "stale" regardless of score.
// Consumers reading the oracle for write paths should always pass currentSlot.
export function healthStatus(
  networkHealth: NetworkHealth,
  currentSlot?: bigint,
): "healthy" | "degraded" | "critical" | "stale" {
  if (currentSlot !== undefined && isStale(networkHealth, currentSlot)) {
    return "stale";
  }
  if (networkHealth.healthScore < DEFAULT_CRITICAL_THRESHOLD) return "critical";
  if (networkHealth.healthScore < DEFAULT_DEGRADED_THRESHOLD) return "degraded";
  return "healthy";
}

// Human-readable label for a region, suitable for UI display.
export function regionLabel(region: Region): string {
  switch (region) {
    case Region.Asia:
      return "Asia";
    case Region.US:
      return "United States";
    case Region.EU:
      return "Europe";
    case Region.SouthAmerica:
      return "South America";
    case Region.Africa:
      return "Africa";
    case Region.Oceania:
      return "Oceania";
    case Region.Other:
      return "Other";
  }
}

// Converts a lamports bigint into a SOL number with full precision.
export function lamportsToSol(lamports: bigint): number {
  return Number(lamports) / 1_000_000_000;
}

// Computes the latency component score using the on-chain formula.
// 400ms ceiling. Anything at or above 400ms scores 0.
export function latencyScore(slotLatencyMs: number): number {
  if (slotLatencyMs >= 400) return 0;
  return Math.floor(((400 - slotLatencyMs) * 100) / 400);
}
