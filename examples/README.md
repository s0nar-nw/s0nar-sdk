# s0nar-sdk examples

Runnable demos showing how to use the SDK methods.

## Setup

```bash
cd examples
npm install
```

## Scripts

| Command             | What it does                                                                              | SDK methods used                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run read`      | Reads NetworkHealth + Registry from devnet, prints everything with utility helpers        | `getNetworkHealth`, `getRegistry`, `healthStatus`, `isStale`, `isDegraded`, `lamportsToSol`, `regionLabel` |
| `npm run observers` | Lists all observers, groups by region, shows staleness check                              | `getAllObservers`, `getObserversByRegion`, `isObserverStale`, `lamportsToSol`, `regionLabel`      |
| `npm run pdas`      | Derives PDAs and fetches a single observer by authority                                    | `getRegistryPDA`, `getNetworkHealthPDA`, `getObserverPDA`, `getObserver`, `latencyScore`, `PROGRAM_ID` |
| `npm run subscribe` | Subscribes to live program events for 60 seconds, then unsubscribes                       | `onAttestationSubmitted`, `onObserverRegistered`, `onObserverDeregistered`, `onObserverSlashed`, `onConfigUpdated`, `removeEventListener` |
| `npm run build-ix`  | Builds every instruction (without sending), shows account counts and tx composition       | All 9 instruction builders (`registerObserver`, `submitAttestation`, etc.)                        |
| `npm run diversity` | Prints global client distribution, per-region dominant client, diversity index, and stake-weighted consensus gate | `getNetworkHealth`, `dominantClient`, `clientDiversityIndex`, `stakeReachStatus`, `isConsensusCritical`, `regionLabel` |

## Notes

- All demos hit Solana devnet at `https://api.devnet.solana.com`.
- `subscribe` uses the connection's auto-derived websocket endpoint (from the HTTP url) to receive events in real time.
- `build-ix` does not sign or send anything. It only verifies the SDK builds valid `TransactionInstruction` objects.
- To run write-side instructions for real, pass a wallet to `createS0narClient({ connection, wallet })`.
