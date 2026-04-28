// Lists every registered observer and groups them by region.
// Run: npm run observers

import { Connection } from "@solana/web3.js";
import {
  createS0narClient,
  isObserverStale,
  lamportsToSol,
  Region,
  regionLabel,
} from "s0nar-sdk";

async function main() {
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed",
  );
  const client = createS0narClient({ connection });

  const observers = await client.getAllObservers();
  const currentSlot = BigInt(await connection.getSlot());

  console.log(`Total observers: ${observers.length}`);
  console.log("");

  // Group by region
  for (const region of Object.values(Region)) {
    const inRegion = observers.filter((o) => o.region === region);
    if (inRegion.length === 0) continue;

    console.log(`=== ${regionLabel(region)} (${inRegion.length}) ===`);
    for (const obs of inRegion) {
      const stale = isObserverStale(obs, currentSlot);
      const stake = lamportsToSol(obs.stakeLamports);
      const latest = obs.latestAttestation;
      console.log(
        `  ${obs.authority.toBase58().slice(0, 8)}...  active=${obs.isActive}  stale=${stale}  stake=${stake} SOL  reach=${latest.tpuReachable}/${latest.tpuProbed}  rtt=${latest.avgRttUs}us`,
      );
    }
    console.log("");
  }

  // Filter helper demo
  const usOnly = await client.getObserversByRegion(Region.US);
  console.log(`getObserversByRegion(US) returned: ${usOnly.length}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
