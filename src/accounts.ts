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

// Deployed s0nar program ID on Solana devnet.
export const PROGRAM_ID = new PublicKey(
  "9eqgnuLZP5vMnxU27vZVcrhoSkf3PhhVECRKbb8P8fNQ",
);

// Staleness threshold for attestations and region scores. Roughly 60 seconds at 400ms per slot.
const STALE_SLOTS = 150n;

// PDA derivation

// Derives the registry PDA from the seed "registry".
export function getRegistryPDA(
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("registry")], programId);
}

// Derives the network health PDA from the seed "network_health".
export function getNetworkHealthPDA(
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("network_health")],
    programId,
  );
}

// Derives an observer PDA from the seed "observer" and the observer pubkey.
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

// Normalises Anchor u64 / i64 values (BN, number, or bigint) into a single bigint type.
function toBigInt(val: BN | number | bigint): bigint {
  if (typeof val === "bigint") return val;
  if (typeof val === "number") return BigInt(val);
  return BigInt(val.toString());
}

// Converts an Anchor enum variant (object like { us: {} }) or string into our Region enum.
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

// Maps a raw Anchor Attestation struct to the clean consumer type.
// Anchor returns camelCase keys regardless of the snake_case names in the IDL.
function decodeAttestation(raw: Record<string, unknown>): Attestation {
  return {
    slot: toBigInt(raw["slot"] as BN),
    timestamp: toBigInt(raw["timestamp"] as BN),
    avgRttUs: raw["avgRttUs"] as number,
    p95RttUs: raw["p95RttUs"] as number,
    slotLatencyMs: raw["slotLatencyMs"] as number,
    tpuReachable: raw["tpuReachable"] as number,
    tpuProbed: raw["tpuProbed"] as number,
  };
}

// Maps a raw Anchor RegionScore struct to the clean consumer type. Internal running totals are dropped.
function decodeRegionScore(raw: Record<string, unknown>): RegionScore {
  return {
    region: toRegion(raw["region"] as Record<string, object>),
    observerCount: raw["observerCount"] as number,
    healthScore: raw["healthScore"] as number,
    reachabilityPct: raw["reachabilityPct"] as number,
    avgRttUs: raw["avgRttUs"] as number,
    slotLatencyMs: raw["slotLatencyMs"] as number,
    lastUpdatedSlot: toBigInt(raw["lastUpdatedSlot"] as BN),
  };
}

// Account decoders

// Decodes the raw NetworkHealthAccount into the clean NetworkHealth type.
// Converts the 255 sentinel for minHealthEver into null when no data has been recorded yet.
export function decodeNetworkHealth(
  raw: Record<string, unknown>,
): NetworkHealth {
  const minRaw = raw["minHealthEver"] as number;
  return {
    healthScore: raw["healthScore"] as number,
    tpuReachabilityPct: raw["tpuReachabilityPct"] as number,
    avgSlotLatencyMs: raw["avgSlotLatencyMs"] as number,
    activeObserverCount: raw["activeObserverCount"] as number,
    activeRegionCount: raw["activeRegionCount"] as number,
    lastUpdatedSlot: toBigInt(raw["lastUpdatedSlot"] as BN),
    lastUpdatedTs: toBigInt(raw["lastUpdatedTs"] as BN),
    minHealthEver: minRaw === 255 ? null : minRaw,
    maxHealthEver: raw["maxHealthEver"] as number,
    totalAttestations: toBigInt(raw["totalAttestations"] as BN),
    regionScores: (raw["regionScores"] as Record<string, unknown>[]).map(
      decodeRegionScore,
    ),
  };
}

// Decodes the raw ObserverAccount into the clean Observer type.
// The PDA address is passed in since Anchor does not include it in the raw payload.
export function decodeObserver(
  raw: Record<string, unknown>,
  publicKey: PublicKey,
): Observer {
  return {
    publicKey,
    authority: raw["authority"] as PublicKey,
    region: toRegion(raw["region"] as Record<string, object>),
    stakeLamports: toBigInt(raw["stakeLamports"] as BN),
    registeredAt: toBigInt(raw["registeredAt"] as BN),
    lastAttestationSlot: toBigInt(raw["lastAttestationSlot"] as BN),
    attestationCount: toBigInt(raw["attestationCount"] as BN),
    latestAttestation: decodeAttestation(
      raw["latestAttestation"] as Record<string, unknown>,
    ),
    isActive: raw["isActive"] as boolean,
  };
}

// Decodes the raw RegistryAccount into the clean Registry type.
export function decodeRegistry(raw: Record<string, unknown>): Registry {
  const pending = raw["pendingAuthority"] as PublicKey | null | undefined;
  return {
    authority: raw["authority"] as PublicKey,
    pendingAuthority: pending ?? null,
    minStakeLamports: toBigInt(raw["minStakeLamports"] as BN),
    observerCount: raw["observerCount"] as number,
    activeCount: raw["activeCount"] as number,
    maxObservers: raw["maxObservers"] as number,
    paused: raw["paused"] as boolean,
    version: raw["version"] as number,
  };
}

export { STALE_SLOTS };
