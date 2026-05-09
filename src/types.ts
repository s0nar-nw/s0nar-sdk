import { PublicKey } from "@solana/web3.js";

// Geographic region of an observer node. Serializes as u8 on-chain.
export enum Region {
  Asia = "Asia",
  US = "US",
  EU = "EU",
  SouthAmerica = "SouthAmerica",
  Africa = "Africa",
  Oceania = "Oceania",
  Other = "Other",
}

// Single 10-second measurement submitted by one observer node.
export interface Attestation {
  slot: bigint;
  timestamp: bigint;
  avgRttUs: number;
  p95RttUs: number;
  slotLatencyMs: number;
  tpuReachable: number;
  tpuProbed: number;
  agaveCount: number;
  firedancerCount: number;
  jitoCount: number;
  solanaLabsCount: number;
  otherCount: number;
  reachableStakePct: number;
}

// Health snapshot for one geographic region. Embedded in NetworkHealth.
export interface RegionScore {
  region: Region;
  observerCount: number;
  healthScore: number;
  reachabilityPct: number;
  avgRttUs: number;
  slotLatencyMs: number;
  lastUpdatedSlot: bigint;
  agaveCount: number;
  firedancerCount: number;
  jitoCount: number;
  solanaLabsCount: number;
  otherCount: number;
  reachableStakePct: number;
}

// Global oracle state. Single source of truth for dApps reading network health.
export interface NetworkHealth {
  healthScore: number;
  tpuReachabilityPct: number;
  avgSlotLatencyMs: number;
  activeObserverCount: number;
  activeRegionCount: number;
  lastUpdatedSlot: bigint;
  lastUpdatedTs: bigint;
  // Null when no data has been recorded yet. On-chain sentinel is 255.
  minHealthEver: number | null;
  maxHealthEver: number;
  totalAttestations: bigint;
  regionScores: RegionScore[];
  agavePct: number;
  firedancerPct: number;
  jitoPct: number;
  solanaLabsPct: number;
  otherPct: number;
}

// Per-observer state. Stores identity, region, stake, and most recent attestation.
export interface Observer {
  // PDA address of this observer account.
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

// Global protocol configuration.
export interface Registry {
  authority: PublicKey;
  // Null when no 2-step authority handoff is in progress.
  pendingAuthority: PublicKey | null;
  minStakeLamports: bigint;
  observerCount: number;
  activeCount: number;
  maxObservers: number;
  // Circuit breaker. When true, blocks new registrations and attestation submissions.
  paused: boolean;
  version: number;
}

// Emitted when an observer submits a measurement.
export interface AttestationSubmittedEvent {
  observer: PublicKey;
  region: Region;
  score: number;
  reachabilityPct: number;
  slotLatencyMs: number;
  slot: bigint;
  agaveCount: number;
  firedancerCount: number;
  jitoCount: number;
  solanaLabsCount: number;
  otherCount: number;
  reachableStakePct: number;
}

// Emitted when an observer registers.
export interface ObserverRegisteredEvent {
  observer: PublicKey;
  region: Region;
  stakeLamports: bigint;
}

// Emitted when an observer deregisters.
export interface ObserverDeregisteredEvent {
  observer: PublicKey;
}

// Emitted when an observer is slashed by the authority.
export interface ObserverSlashedEvent {
  observer: PublicKey;
  slashBps: number;
  amountSlashed: bigint;
}

// Emitted when protocol config is updated.
export interface ConfigUpdatedEvent {
  minStakeLamports: bigint | null;
  maxObservers: number | null;
  paused: boolean | null;
}
