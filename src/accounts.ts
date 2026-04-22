import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import type {
  Attestation,
  NetworkHealth,
  Observer,
  Region,
  RegionScore,
  Registry,
} from "./types.js";

export const PROGRAM_ID = new PublicKey(
  "9eqgnuLZP5vMnxU27vZVcrhoSkf3PhhVECRKbb8P8fNQ",
);

const STALE_SLOTS = 150n;

// PDA derivation
export function getRegistryPDA(
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("registry")], programId);
}

export function getNetworkHealthPDA(
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("network_health")],
    programId,
  );
}

export function getObserverPDA(
  observer: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("observer"), observer.toBuffer()],
    programId,
  );
}

// Helpers
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

function decodeAttestation(raw: Record<string, unknown>): Attestation {
  return {
    slot: toBigInt(raw["slot"] as BN),
    timestamp: toBigInt(raw["timestamp"] as BN),
    avgRttUs: raw["avg_rtt_us"] as number,
    p95RttUs: raw["p95_rtt_us"] as number,
    slotLatencyMs: raw["slot_latency_ms"] as number,
    tpuReachable: raw["tpu_reachable"] as number,
    tpuProbed: raw["tpu_probed"] as number,
  };
}

function decodeRegionScore(raw: Record<string, unknown>): RegionScore {
  return {
    region: toRegion(raw["region"] as Record<string, object>),
    observerCount: raw["observer_count"] as number,
    healthScore: raw["health_score"] as number,
    reachabilityPct: raw["reachability_pct"] as number,
    avgRttUs: raw["avg_rtt_us"] as number,
    slotLatencyMs: raw["slot_latency_ms"] as number,
    lastUpdatedSlot: toBigInt(raw["last_updated_slot"] as BN),
  };
}

// Account decoders
export function decodeNetworkHealth(
  raw: Record<string, unknown>,
): NetworkHealth {
  const minRaw = raw["min_health_ever"] as number;
  return {
    healthScore: raw["health_score"] as number,
    tpuReachabilityPct: raw["tpu_reachability_pct"] as number,
    avgSlotLatencyMs: raw["avg_slot_latency_ms"] as number,
    activeObserverCount: raw["active_observer_count"] as number,
    activeRegionCount: raw["active_region_count"] as number,
    lastUpdatedSlot: toBigInt(raw["last_updated_slot"] as BN),
    lastUpdatedTs: toBigInt(raw["last_updated_ts"] as BN),
    minHealthEver: minRaw === 255 ? null : minRaw,
    maxHealthEver: raw["max_health_ever"] as number,
    totalAttestations: toBigInt(raw["total_attestations"] as BN),
    regionScores: (raw["region_scores"] as Record<string, unknown>[]).map(
      decodeRegionScore,
    ),
  };
}

export function decodeObserver(
  raw: Record<string, unknown>,
  publicKey: PublicKey,
): Observer {
  return {
    publicKey,
    authority: new PublicKey(raw["authority"] as string),
    region: toRegion(raw["region"] as Record<string, object>),
    stakeLamports: toBigInt(raw["stake_lamports"] as BN),
    registeredAt: toBigInt(raw["registered_at"] as BN),
    lastAttestationSlot: toBigInt(raw["last_attestation_slot"] as BN),
    attestationCount: toBigInt(raw["attestation_count"] as BN),
    latestAttestation: decodeAttestation(
      raw["latest_attestation"] as Record<string, unknown>,
    ),
    isActive: raw["is_active"] as boolean,
  };
}

export function decodeRegistry(raw: Record<string, unknown>): Registry {
  const pending = raw["pending_authority"];
  return {
    authority: new PublicKey(raw["authority"] as string),
    pendingAuthority: pending != null ? new PublicKey(pending as string) : null,
    minStakeLamports: toBigInt(raw["min_stake_lamports"] as BN),
    observerCount: raw["observer_count"] as number,
    activeCount: raw["active_count"] as number,
    maxObservers: raw["max_observers"] as number,
    paused: raw["paused"] as boolean,
    version: raw["version"] as number,
  };
}

export { STALE_SLOTS };
