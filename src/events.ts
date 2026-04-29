import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import type {
  AttestationSubmittedEvent,
  ConfigUpdatedEvent,
  ObserverDeregisteredEvent,
  ObserverRegisteredEvent,
  ObserverSlashedEvent,
  Region,
} from "./types.js";

// Anchor returns event payloads with the same camelCase keys as accounts.

function toBigInt(val: BN | number | bigint): bigint {
  if (typeof val === "bigint") return val;
  if (typeof val === "number") return BigInt(val);
  return BigInt(val.toString());
}

function toRegion(val: Record<string, object> | string): Region {
  const key = typeof val === "string" ? val : (Object.keys(val)[0] ?? "other");
  const normalized = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
  const map: Record<string, Region> = {
    Asia: "Asia",
    Us: "US",
    Eu: "EU",
    Southamerica: "SouthAmerica",
    Africa: "Africa",
    Oceania: "Oceania",
    Other: "Other",
  } as Record<string, Region>;
  return (map[normalized] ?? "Other") as Region;
}

export function decodeAttestationSubmitted(
  raw: Record<string, unknown>,
): AttestationSubmittedEvent {
  return {
    observer: raw["observer"] as PublicKey,
    region: toRegion(raw["region"] as Record<string, object>),
    score: raw["score"] as number,
    reachabilityPct: raw["reachabilityPct"] as number,
    slotLatencyMs: raw["slotLatencyMs"] as number,
    slot: toBigInt(raw["slot"] as BN),
  };
}

export function decodeObserverRegistered(
  raw: Record<string, unknown>,
): ObserverRegisteredEvent {
  return {
    observer: raw["observer"] as PublicKey,
    region: toRegion(raw["region"] as Record<string, object>),
    stakeLamports: toBigInt(raw["stakeLamports"] as BN),
  };
}

export function decodeObserverDeregistered(
  raw: Record<string, unknown>,
): ObserverDeregisteredEvent {
  return {
    observer: raw["observer"] as PublicKey,
  };
}

export function decodeObserverSlashed(
  raw: Record<string, unknown>,
): ObserverSlashedEvent {
  return {
    observer: raw["observer"] as PublicKey,
    slashBps: raw["slashBps"] as number,
    amountSlashed: toBigInt(raw["amountSlashed"] as BN),
  };
}

export function decodeConfigUpdated(
  raw: Record<string, unknown>,
): ConfigUpdatedEvent {
  const minStake = raw["minStakeLamports"];
  const maxObs = raw["maxObservers"];
  const paused = raw["paused"];
  return {
    minStakeLamports:
      minStake != null ? toBigInt(minStake as BN) : null,
    maxObservers: maxObs != null ? (maxObs as number) : null,
    paused: paused != null ? (paused as boolean) : null,
  };
}
