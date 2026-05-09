// Reads client diversity and stake-weighted reach from NetworkHealth.
// Shows per-region dominant client, diversity index, and consensus status.
// Run: npm run diversity

import { Connection } from "@solana/web3.js";
import {
  clientDiversityIndex,
  createS0narClient,
  dominantClient,
  isConsensusCritical,
  regionLabel,
  stakeReachStatus,
} from "s0nar-sdk";

async function main() {
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed",
  );
  const client = createS0narClient({ connection });

  const health = await client.getNetworkHealth();

  console.log("=== Global Client Distribution (validator counts) ===");
  console.log("Agave:        ", health.agaveCount);
  console.log("Firedancer:   ", health.firedancerCount);
  console.log("Jito:         ", health.jitoCount);
  console.log("Solana Labs:  ", health.solanaLabsCount);
  console.log("Other:        ", health.otherCount);
  console.log("");

  console.log("=== Per-Region Diversity ===");
  for (const r of health.regionScores) {
    if (r.observerCount === 0) continue;
    console.log(
      `${regionLabel(r.region).padEnd(15)}  ` +
        `dominant=${dominantClient(r).padEnd(11)}  ` +
        `diversity=${clientDiversityIndex(r)}/100  ` +
        `stakeReach=${r.reachableStakePct}% (${stakeReachStatus(r.reachableStakePct)})`,
    );
  }
  console.log("");

  console.log("=== Consensus Gate ===");
  // Gate any high-value writes on stake-weighted reach. Below 67% the network
  // cannot finalize and writes may not land.
  for (const r of health.regionScores) {
    if (r.observerCount === 0) continue;
    if (isConsensusCritical(r.reachableStakePct)) {
      console.log(
        `  [HALT] ${regionLabel(r.region)} below 67% stake reach — pause writes`,
      );
    }
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
