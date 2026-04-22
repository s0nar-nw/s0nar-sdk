import {
  AnchorProvider,
  Program,
  type Idl,
  type Wallet,
} from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import idlJson from "./idl/s0nar_program.json";
import {
  PROGRAM_ID,
  decodeNetworkHealth,
  decodeObserver,
  decodeRegistry,
  getNetworkHealthPDA,
  getObserverPDA,
  getRegistryPDA,
} from "./accounts.js";
import type { NetworkHealth, Observer, Region, Registry } from "./types.js";

export interface S0narClientOptions {
  connection: Connection;
  programId?: PublicKey;
  wallet?: Wallet;
}

export interface S0narClient {
  readonly programId: PublicKey;
  readonly connection: Connection;
  getNetworkHealth(): Promise<NetworkHealth>;
  getRegistry(): Promise<Registry>;
  getObserver(observerPubkey: PublicKey): Promise<Observer>;
  getAllObservers(): Promise<Observer[]>;
  getObserversByRegion(region: Region): Promise<Observer[]>;
}

// Builds a dummy wallet for read-only usage. Anchor requires a wallet but reads never sign.
function createReadOnlyWallet(): Wallet {
  const kp = Keypair.generate();
  return {
    publicKey: kp.publicKey,
    payer: kp,
    signTransaction: async <T extends Transaction | VersionedTransaction>(
      tx: T,
    ): Promise<T> => tx,
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(
      txs: T[],
    ): Promise<T[]> => txs,
  };
}

// Factory that creates a configured client. Pass a wallet for write ops, omit for read-only.
export function createS0narClient(opts: S0narClientOptions): S0narClient {
  const { connection } = opts;
  const programId = opts.programId ?? PROGRAM_ID;
  const wallet = opts.wallet ?? createReadOnlyWallet();

  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const idl = { ...(idlJson as Idl), address: programId.toBase58() };
  const program = new Program(idl, provider);

  // Fetches the global oracle account with health score, region breakdowns, and aggregates.
  async function getNetworkHealth(): Promise<NetworkHealth> {
    const [pda] = getNetworkHealthPDA(programId);
    const raw = await (
      program.account as Record<
        string,
        { fetch: (key: PublicKey) => Promise<unknown> }
      >
    )["networkHealthAccount"]!.fetch(pda);
    return decodeNetworkHealth(raw as Record<string, unknown>);
  }

  // Fetches protocol config including authority, min stake, observer counts, and paused state.
  async function getRegistry(): Promise<Registry> {
    const [pda] = getRegistryPDA(programId);
    const raw = await (
      program.account as Record<
        string,
        { fetch: (key: PublicKey) => Promise<unknown> }
      >
    )["registryAccount"]!.fetch(pda);
    return decodeRegistry(raw as Record<string, unknown>);
  }

  // Fetches a single observer by its authority pubkey, including stake, region, and latest attestation.
  async function getObserver(observerPubkey: PublicKey): Promise<Observer> {
    const [pda] = getObserverPDA(observerPubkey, programId);
    const raw = await (
      program.account as Record<
        string,
        { fetch: (key: PublicKey) => Promise<unknown> }
      >
    )["observerAccount"]!.fetch(pda);
    return decodeObserver(raw as Record<string, unknown>, pda);
  }

  // Fetches every registered observer via getProgramAccounts. Can be heavy with many observers.
  async function getAllObservers(): Promise<Observer[]> {
    const all = await (
      program.account as Record<
        string,
        {
          all: () => Promise<Array<{ publicKey: PublicKey; account: unknown }>>;
        }
      >
    )["observerAccount"]!.all();
    return all.map((entry) =>
      decodeObserver(entry.account as Record<string, unknown>, entry.publicKey),
    );
  }

  // Returns observers filtered by region. Uses getAllObservers internally.
  async function getObserversByRegion(region: Region): Promise<Observer[]> {
    const all = await getAllObservers();
    return all.filter((o) => o.region === region);
  }

  return {
    programId,
    connection,
    getNetworkHealth,
    getRegistry,
    getObserver,
    getAllObservers,
    getObserversByRegion,
  };
}
