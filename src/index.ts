// Types
export {
  Region,
  type Attestation,
  type RegionScore,
  type NetworkHealth,
  type Observer,
  type Registry,
  type AttestationSubmittedEvent,
  type ObserverRegisteredEvent,
  type ObserverDeregisteredEvent,
  type ObserverSlashedEvent,
  type ConfigUpdatedEvent,
} from "./types.js";

// PDA helpers and program ID
export {
  PROGRAM_ID,
  getRegistryPDA,
  getNetworkHealthPDA,
  getObserverPDA,
} from "./accounts.js";

// Client
export {
  createS0narClient,
  type S0narClient,
  type S0narClientOptions,
} from "./client.js";

// Instruction params
export type {
  SubmitAttestationParams,
  UpdateConfigParams,
} from "./instructions.js";

// Utility helpers
export {
  isStale,
  isObserverStale,
  isDegraded,
  healthStatus,
  regionLabel,
  lamportsToSol,
  latencyScore,
  isConsensusCritical,
  stakeReachStatus,
  dominantClient,
  clientDiversityIndex,
} from "./utils.js";
