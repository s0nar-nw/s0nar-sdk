import { STALE_SLOTS } from "./accounts.js";
import { Region } from "./types.js";
import type { NetworkHealth, Observer, RegionScore } from "./types.js";

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

// Returns true when stake-weighted reach is below the 67% consensus threshold.
// At this point the network cannot finalize — dApps should halt high-value writes.
export function isConsensusCritical(reachableStakePct: number): boolean {
  return reachableStakePct < 67;
}

// Human-readable status for stake-weighted reachability.
export function stakeReachStatus(
  reachableStakePct: number,
): "healthy" | "degraded" | "critical" {
  if (reachableStakePct >= 80) return "healthy";
  if (reachableStakePct >= 67) return "degraded";
  return "critical";
}

// Returns the dominant client for a region by count.
// Useful for dashboard labels and staking strategy hints.
export function dominantClient(
  region: RegionScore,
): "agave" | "firedancer" | "jito" | "other" {
  const counts = {
    agave: region.agaveCount,
    firedancer: region.firedancerCount,
    jito: region.jitoCount,
    other: region.otherCount + region.solanaLabsCount,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]![0] as
    | "agave"
    | "firedancer"
    | "jito"
    | "other";
}

// Computes client diversity index (0-100). 100 = perfectly even across all clients.
// 0 = complete monoculture. Uses simplified Herfindahl-Hirschman Index inverted.
export function clientDiversityIndex(region: RegionScore): number {
  const total =
    region.agaveCount +
    region.firedancerCount +
    region.jitoCount +
    region.solanaLabsCount +
    region.otherCount;
  if (total === 0) return 0;
  const shares = [
    region.agaveCount,
    region.firedancerCount,
    region.jitoCount,
    region.solanaLabsCount,
    region.otherCount,
  ].map((c) => c / total);
  const hhi = shares.reduce((sum, s) => sum + s * s, 0);
  // HHI ranges 0.2 (perfectly even across 5) to 1.0 (monoculture). Invert and normalize.
  return Math.round((1 - hhi) * 125);
}
