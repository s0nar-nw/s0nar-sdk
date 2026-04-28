// Reads global network health and registry config from devnet.
// Run: npm run read

import { Connection } from "@solana/web3.js";
import {
  createS0narClient,
  healthStatus,
  isDegraded,
  isStale,
  lamportsToSol,
  regionLabel,
} from "s0nar-sdk";

async function main() {
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed",
  );
  const client = createS0narClient({ connection });

  console.log("Program ID:", client.programId.toBase58());
  console.log("");

  // Global oracle state
  const health = await client.getNetworkHealth();
  const currentSlot = BigInt(await connection.getSlot());

  console.log("=== Network Health ===");
  console.log("Health Score:        ", health.healthScore, "/ 100");
  console.log("Status:              ", healthStatus(health));
  console.log("Reachability:        ", health.tpuReachabilityPct, "%");
  console.log("Avg Slot Latency:    ", health.avgSlotLatencyMs, "ms");
  console.log("Active Observers:    ", health.activeObserverCount);
  console.log("Active Regions:      ", health.activeRegionCount);
  console.log("Total Attestations:  ", health.totalAttestations.toString());
  console.log("Min Health Ever:     ", health.minHealthEver ?? "no data");
  console.log("Max Health Ever:     ", health.maxHealthEver);
  console.log("Last Updated Slot:   ", health.lastUpdatedSlot.toString());
  console.log("Stale:               ", isStale(health, currentSlot));
  console.log("Degraded:            ", isDegraded(health));
  console.log("");

  // Per-region breakdown
  console.log("=== Region Breakdown ===");
  for (const r of health.regionScores) {
    if (r.observerCount === 0) continue;
    console.log(
      `${regionLabel(r.region).padEnd(15)}  score=${r.healthScore}  reach=${r.reachabilityPct}%  latency=${r.slotLatencyMs}ms  obs=${r.observerCount}`,
    );
  }
  console.log("");

  // Protocol config
  const registry = await client.getRegistry();
  console.log("=== Registry ===");
  console.log("Authority:           ", registry.authority.toBase58());
  console.log(
    "Min Stake:           ",
    lamportsToSol(registry.minStakeLamports),
    "SOL",
  );
  console.log(
    "Observers:           ",
    registry.activeCount,
    "/",
    registry.maxObservers,
  );
  console.log("Paused:              ", registry.paused);
  console.log("Version:             ", registry.version);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
