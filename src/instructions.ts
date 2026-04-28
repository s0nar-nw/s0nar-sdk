import { Program, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  TransactionInstruction,
  type AccountMeta,
} from "@solana/web3.js";
import { Region } from "./types.js";

// Converts our Region enum into Anchor's enum input format like { us: {} }.
function toAnchorRegion(region: Region): Record<string, Record<string, never>> {
  const map: Record<Region, string> = {
    [Region.Asia]: "asia",
    [Region.US]: "us",
    [Region.EU]: "eu",
    [Region.SouthAmerica]: "southAmerica",
    [Region.Africa]: "africa",
    [Region.Oceania]: "oceania",
    [Region.Other]: "other",
  };
  return { [map[region]]: {} };
}

// Casts the loosely-typed methods namespace so we can call instructions by name.
type AnchorMethods = Record<
  string,
  (...args: unknown[]) => {
    accounts: (accounts: Record<string, PublicKey>) => {
      remainingAccounts: (accounts: AccountMeta[]) => {
        instruction: () => Promise<TransactionInstruction>;
      };
      instruction: () => Promise<TransactionInstruction>;
    };
  }
>;

// Registers a new observer with the given region. Observer signer pays rent and stake.
export async function buildRegisterObserver(
  program: Program,
  observer: PublicKey,
  region: Region,
): Promise<TransactionInstruction> {
  return (program.methods as unknown as AnchorMethods)["registerObserver"]!(
    toAnchorRegion(region),
  )
    .accounts({ observer })
    .instruction();
}

// Params for a single attestation submission.
export interface SubmitAttestationParams {
  tpuReachable: number;
  tpuProbed: number;
  avgRttUs: number;
  p95RttUs: number;
  slotLatencyMs: number;
}

// Submits a 10-second measurement. Authority must be the observer's authority key.
export async function buildSubmitAttestation(
  program: Program,
  authority: PublicKey,
  params: SubmitAttestationParams,
): Promise<TransactionInstruction> {
  return (program.methods as unknown as AnchorMethods)["submitAttestation"]!(
    params.tpuReachable,
    params.tpuProbed,
    params.avgRttUs,
    params.p95RttUs,
    params.slotLatencyMs,
  )
    .accounts({ authority })
    .instruction();
}

// Deregisters an observer and returns the staked lamports to observerWallet.
// Caller must be either the observer wallet or the registry authority.
export async function buildDeregisterObserver(
  program: Program,
  caller: PublicKey,
  observerWallet: PublicKey,
): Promise<TransactionInstruction> {
  return (program.methods as unknown as AnchorMethods)["deregisterObserver"]!()
    .accounts({ caller, observerWallet })
    .instruction();
}

// Permissionless full recomputation of NetworkHealth. Pass all observer PDAs as remaining accounts.
export async function buildCrankAggregation(
  program: Program,
  cranker: PublicKey,
  observerAccounts: PublicKey[],
): Promise<TransactionInstruction> {
  const remaining: AccountMeta[] = observerAccounts.map((pubkey) => ({
    pubkey,
    isSigner: false,
    isWritable: false,
  }));
  return (program.methods as unknown as AnchorMethods)["crankAggregation"]!()
    .accounts({ cranker })
    .remainingAccounts(remaining)
    .instruction();
}

// Bootstraps the protocol. Called once. Authority becomes the registry admin.
export async function buildInitialize(
  program: Program,
  authority: PublicKey,
  minStakeLamports: bigint,
  maxObservers: number,
): Promise<TransactionInstruction> {
  return (program.methods as unknown as AnchorMethods)["initialize"]!(
    new BN(minStakeLamports.toString()),
    maxObservers,
  )
    .accounts({ authority })
    .instruction();
}

// Slashes an observer's stake. Authority must match the registry authority. slashBps is 0 to 10000.
export async function buildSlashObserver(
  program: Program,
  authority: PublicKey,
  observerWallet: PublicKey,
  treasury: PublicKey,
  slashBps: number,
): Promise<TransactionInstruction> {
  return (program.methods as unknown as AnchorMethods)["slashObserver"]!(
    slashBps,
  )
    .accounts({ authority, observerWallet, treasury })
    .instruction();
}

// Optional updates to protocol config. Pass null for fields you do not want to change.
export interface UpdateConfigParams {
  minStakeLamports: bigint | null;
  maxObservers: number | null;
  paused: boolean | null;
}

// Updates protocol config. Authority-only.
export async function buildUpdateConfig(
  program: Program,
  authority: PublicKey,
  params: UpdateConfigParams,
): Promise<TransactionInstruction> {
  const minStake =
    params.minStakeLamports != null
      ? new BN(params.minStakeLamports.toString())
      : null;
  return (program.methods as unknown as AnchorMethods)["updateConfig"]!(
    minStake,
    params.maxObservers,
    params.paused,
  )
    .accounts({ authority })
    .instruction();
}

// Step 1 of authority handoff. Current authority proposes a new authority.
export async function buildProposeAuthority(
  program: Program,
  authority: PublicKey,
  newAuthority: PublicKey,
): Promise<TransactionInstruction> {
  return (program.methods as unknown as AnchorMethods)["proposeAuthority"]!(
    newAuthority,
  )
    .accounts({ authority })
    .instruction();
}

// Step 2 of authority handoff. The proposed authority claims the role.
export async function buildAcceptAuthority(
  program: Program,
  newAuthority: PublicKey,
): Promise<TransactionInstruction> {
  return (program.methods as unknown as AnchorMethods)["acceptAuthority"]!()
    .accounts({ newAuthority })
    .instruction();
}
