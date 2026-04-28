// Builds every instruction without sending anything. Useful for verifying account
// derivation and inspecting the compiled tx. Run: npm run build-ix

import { Connection, Keypair, Transaction } from "@solana/web3.js";
import { createS0narClient, Region } from "s0nar-sdk";

async function main() {
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed",
  );
  const client = createS0narClient({ connection });

  // Throwaway keys for example output. None of these get signed or sent.
  const observer = Keypair.generate().publicKey;
  const authority = Keypair.generate().publicKey;
  const newAuthority = Keypair.generate().publicKey;
  const treasury = Keypair.generate().publicKey;

  const ix = {
    register: await client.registerObserver(observer, Region.US),
    submit: await client.submitAttestation(authority, {
      tpuReachable: 95,
      tpuProbed: 100,
      avgRttUs: 1500,
      p95RttUs: 2500,
      slotLatencyMs: 380,
    }),
    deregister: await client.deregisterObserver(authority, observer),
    crank: await client.crankAggregation(authority, []),
    initialize: await client.initialize(authority, 100_000_000n, 100),
    slash: await client.slashObserver(authority, observer, treasury, 500),
    updateConfig: await client.updateConfig(authority, {
      minStakeLamports: 200_000_000n,
      maxObservers: null,
      paused: true,
    }),
    propose: await client.proposeAuthority(authority, newAuthority),
    accept: await client.acceptAuthority(newAuthority),
  };

  for (const [name, instruction] of Object.entries(ix)) {
    console.log(
      `${name.padEnd(14)}  ${instruction.keys.length} accts  ${instruction.data.length}b data`,
    );
  }

  // Compose multiple instructions into one tx as a real consumer would
  const tx = new Transaction().add(ix.register, ix.submit);
  console.log("");
  console.log(`Composed tx: ${tx.instructions.length} instructions`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
