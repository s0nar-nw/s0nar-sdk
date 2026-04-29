// Shows PDA derivation helpers and fetching a single observer by its authority pubkey.
// Run: npm run pdas

import { Connection } from "@solana/web3.js";
import {
  createS0narClient,
  getNetworkHealthPDA,
  getObserverPDA,
  getRegistryPDA,
  isObserverStale,
  lamportsToSol,
  latencyScore,
  PROGRAM_ID,
  regionLabel,
} from "s0nar-sdk";

async function main() {
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed",
  );
  const client = createS0narClient({ connection });

  console.log("=== PDA Derivation ===");
  console.log("Program ID:        ", PROGRAM_ID.toBase58());

  const [registryPda, registryBump] = getRegistryPDA();
  const [healthPda, healthBump] = getNetworkHealthPDA();
  console.log("");
  console.log(
    "Registry PDA:      ",
    registryPda.toBase58(),
    "bump",
    registryBump,
  );
  console.log("NetworkHealth PDA: ", healthPda.toBase58(), "bump", healthBump);

  // Fetch the only observer that exists today and derive its PDA.
  const all = await client.getAllObservers();
  if (all.length === 0) {
    console.log("");
    console.log("No observers registered yet.");
    return;
  }

  const first = all[0]!;
  const [observerPda, observerBump] = getObserverPDA(first.authority);

  console.log(
    "Observer PDA:      ",
    observerPda.toBase58(),
    "bump",
    observerBump,
  );
  console.log("Matches Anchor PDA:", observerPda.equals(first.publicKey));

  console.log("");
  console.log("=== Fetch Single Observer ===");
  const observer = await client.getObserver(first.authority);
  const currentSlot = BigInt(await connection.getSlot());
  const att = observer.latestAttestation;

  console.log("Authority:         ", observer.authority.toBase58());
  console.log("Region:            ", regionLabel(observer.region));
  console.log("Active:            ", observer.isActive);
  console.log("Stale:             ", isObserverStale(observer, currentSlot));
  console.log(
    "Stake:             ",
    lamportsToSol(observer.stakeLamports),
    "SOL",
  );
  console.log("Total attestations:", observer.attestationCount.toString());
  console.log("");
  console.log("Latest attestation:");
  console.log("  TPU reach:       ", att.tpuReachable, "/", att.tpuProbed);
  console.log("  Avg RTT:         ", att.avgRttUs, "us");
  console.log("  P95 RTT:         ", att.p95RttUs, "us");
  console.log("  Slot latency:    ", att.slotLatencyMs, "ms");
  console.log("  Latency score:   ", latencyScore(att.slotLatencyMs), "/ 100");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
