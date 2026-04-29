// Subscribes to live program events from devnet. Run for 60 seconds then unsubscribe.
// Run: npm run subscribe

import { Connection } from "@solana/web3.js";
import { createS0narClient, regionLabel } from "s0nar-sdk";

async function main() {
  // Connection auto-derives the websocket endpoint from the HTTP url.
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed",
  );
  const client = createS0narClient({ connection });

  console.log("Listening for s0nar events for 60 seconds...");
  console.log("");

  const ids: number[] = [];

  ids.push(
    client.onAttestationSubmitted((event, slot) => {
      console.log(
        `[slot ${slot}] AttestationSubmitted from ${event.observer.toBase58().slice(0, 8)}... ` +
          `region=${regionLabel(event.region)} score=${event.score} reach=${event.reachabilityPct}%`,
      );
    }),
  );

  ids.push(
    client.onObserverRegistered((event, slot) => {
      console.log(
        `[slot ${slot}] ObserverRegistered ${event.observer.toBase58().slice(0, 8)}... ` +
          `region=${regionLabel(event.region)} stake=${event.stakeLamports} lamports`,
      );
    }),
  );

  ids.push(
    client.onObserverDeregistered((event, slot) => {
      console.log(
        `[slot ${slot}] ObserverDeregistered ${event.observer.toBase58().slice(0, 8)}...`,
      );
    }),
  );

  ids.push(
    client.onObserverSlashed((event, slot) => {
      console.log(
        `[slot ${slot}] ObserverSlashed ${event.observer.toBase58().slice(0, 8)}... ` +
          `bps=${event.slashBps} amount=${event.amountSlashed} lamports`,
      );
    }),
  );

  ids.push(
    client.onConfigUpdated((event, slot) => {
      console.log(
        `[slot ${slot}] ConfigUpdated minStake=${event.minStakeLamports} maxObservers=${event.maxObservers} paused=${event.paused}`,
      );
    }),
  );

  await new Promise((resolve) => setTimeout(resolve, 60_000));

  console.log("");
  console.log("Unsubscribing...");
  for (const id of ids) {
    await client.removeEventListener(id);
  }
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
