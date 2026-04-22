import { PublicKey } from "@solana/web3.js";

export enum Region {
  Asia = "Asia",
  US = "US",
  EU = "EU",
  SouthAmerica = "SouthAmerica",
  Africa = "Africa",
  Oceania = "Oceania",
  Other = "Other",
}

export interface Attestation {
  slot: bigint;
  timestamp: bigint;
  avgRttUs: number;
  p95RttUs: number;
  slotLatencyMs: number;
  tpuReachable: number;
  tpuProbed: number;
}

export interface RegionScore {
  region: Region;
  observerCount: number;
  healthScore: number;
  reachabilityPct: number;
  avgRttUs: number;
  slotLatencyMs: number;
  lastUpdatedSlot: bigint;
}

export interface NetworkHealth {
  healthScore: number;
  tpuReachabilityPct: number;
  avgSlotLatencyMs: number;
  activeObserverCount: number;
  activeRegionCount: number;
  lastUpdatedSlot: bigint;
  lastUpdatedTs: bigint;
  /** null when 255 — on-chain sentinel meaning no data recorded yet */
  minHealthEver: number | null;
  maxHealthEver: number;
  totalAttestations: bigint;
  regionScores: RegionScore[];
}

export interface Observer {
  publicKey: PublicKey;
  authority: PublicKey;
  region: Region;
  stakeLamports: bigint;
  registeredAt: bigint;
  lastAttestationSlot: bigint;
  attestationCount: bigint;
  latestAttestation: Attestation;
  isActive: boolean;
}

export interface Registry {
  authority: PublicKey;
  pendingAuthority: PublicKey | null;
  minStakeLamports: bigint;
  observerCount: number;
  activeCount: number;
  maxObservers: number;
  paused: boolean;
  version: number;
}

export interface AttestationSubmittedEvent {
  observer: PublicKey;
  region: Region;
  score: number;
  reachabilityPct: number;
  slotLatencyMs: number;
  slot: bigint;
}

export interface ObserverRegisteredEvent {
  observer: PublicKey;
  region: Region;
  stakeLamports: bigint;
}

export interface ObserverDeregisteredEvent {
  observer: PublicKey;
}

export interface ObserverSlashedEvent {
  observer: PublicKey;
  slashBps: number;
  amountSlashed: bigint;
}

export interface ConfigUpdatedEvent {
  minStakeLamports: bigint | null;
  maxObservers: number | null;
  paused: boolean | null;
}
