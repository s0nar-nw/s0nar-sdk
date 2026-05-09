<p align="center">
  <img src="public/logo.svg" alt="s0nar" width="320" />
</p>

<h1 align="center">s0nar-sdk</h1>

<p align="center">
  TypeScript SDK for the s0nar network health oracle on Solana.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  <img src="https://img.shields.io/badge/Solana-devnet-9945FF?logo=solana" alt="Solana devnet" />
  <img src="https://img.shields.io/badge/npm-0.3.0-CB3837?logo=npm" alt="npm 0.3.0" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" />
</p>

<p align="center">
  <a href="https://s0nar.online">Website</a>
</p>

---

## Overview

s0nar is a decentralized network health oracle for Solana. Lightweight observer nodes probe validators across geographic regions and submit signed attestations on-chain. The program aggregates these into a single `NetworkHealthAccount` that any Solana program or dApp can read.

This SDK wraps the on-chain data into clean TypeScript types and exposes both read methods and instruction builders. No borsh, no PDAs, no Anchor boilerplate required.

## What The SDK Does

- Reads `NetworkHealthAccount`, `ObserverAccount`, and `RegistryAccount` as plain TypeScript objects
- Derives all PDAs internally
- Builds every program instruction as a `TransactionInstruction` for composing into transactions
- Surfaces validator client diversity (Agave / Firedancer / Jito / Solana Labs / Other) and stake-weighted reach for consensus-aware dApps
- Provides utility helpers: `isStale`, `isObserverStale`, `isDegraded`, `healthStatus`, `regionLabel`, `lamportsToSol`, `latencyScore`, `isConsensusCritical`, `stakeReachStatus`, `dominantClient`, `clientDiversityIndex`

## Install

```bash
npm install s0nar-sdk @solana/web3.js
```

## Quick Start

```ts
import { Connection } from "@solana/web3.js";
import { createS0narClient } from "s0nar-sdk";

const connection = new Connection("https://api.devnet.solana.com");
const client = createS0narClient({ connection });

const health = await client.getNetworkHealth();
console.log(health.healthScore); // 0 to 100
console.log(health.tpuReachabilityPct); // % validators reachable
console.log(health.avgSlotLatencyMs); // slot propagation latency

// Validator counts by client (global, averaged across active regions)
console.log(health.agaveCount, health.firedancerCount, health.jitoCount);
```

## Client Diversity & Stake-Weighted Reach

Every attestation now carries client distribution counts and stake-weighted reachability. Use these to gate high-value writes on actual consensus capacity rather than raw observer counts.

```ts
import {
  clientDiversityIndex,
  dominantClient,
  isConsensusCritical,
  stakeReachStatus,
} from "s0nar-sdk";

const health = await client.getNetworkHealth();

for (const region of health.regionScores) {
  if (region.observerCount === 0) continue;

  const dominant = dominantClient(region);
  const diversity = clientDiversityIndex(region); // 0-100, higher = more even
  const status = stakeReachStatus(region.reachableStakePct); // healthy | degraded | critical

  if (isConsensusCritical(region.reachableStakePct)) {
    // Below 67% stake reach. Network cannot finalize. Halt high-value writes.
  }
}
```

Stake reach thresholds: `>= 80%` healthy, `>= 67%` degraded, `< 67%` critical (loses finality quorum).

## Examples

The `examples/` folder contains runnable demos.

```bash
cd examples
npm install
npm run read         # reads NetworkHealth + Registry
npm run observers    # lists all observers grouped by region
npm run build-ix     # builds every instruction without sending
npm run diversity    # client distribution + stake-weighted consensus gate
```

## Health Score Formula

```
healthScore = (reachabilityPct × 70%) + (latencyScore × 30%)

latencyScore = max(0, (400 - slotLatencyMs) × 100 / 400)
```

Reachability is weighted higher because a slow but reachable network is functional, while unreachable means transaction failures.

## API

### `createS0narClient(options)`

| Option       | Type         | Default                |
| ------------ | ------------ | ---------------------- |
| `connection` | `Connection` | required               |
| `programId`  | `PublicKey`  | s0nar devnet address   |
| `wallet`     | `Wallet`     | dummy read-only wallet |

Returns an `S0narClient` object. Pass a wallet for write operations. Omit it for read-only usage.

### Read methods

| Method                         | Returns                  |
| ------------------------------ | ------------------------ |
| `getNetworkHealth()`           | `Promise<NetworkHealth>` |
| `getRegistry()`                | `Promise<Registry>`      |
| `getObserver(pubkey)`          | `Promise<Observer>`      |
| `getAllObservers()`            | `Promise<Observer[]>`    |
| `getObserversByRegion(region)` | `Promise<Observer[]>`    |

### Instruction builders

Each builder returns a `Promise<TransactionInstruction>` that the caller composes into a transaction.

| Builder                                                | Caller                |
| ------------------------------------------------------ | --------------------- |
| `registerObserver(observer, region)`                   | New observer          |
| `submitAttestation(authority, params)`                 | Existing observer     |
| `deregisterObserver(caller, observerWallet)`           | Observer or authority |
| `crankAggregation(cranker, observerAccounts)`          | Anyone                |
| `initialize(authority, minStake, maxObservers)`        | First-time setup      |
| `slashObserver(authority, wallet, treasury, slashBps)` | Authority             |
| `updateConfig(authority, params)`                      | Authority             |
| `proposeAuthority(authority, newAuthority)`            | Authority             |
| `acceptAuthority(newAuthority)`                        | New authority         |

### Event subscriptions

Each subscription returns a numeric listener id. Pass it to `removeEventListener` to stop receiving events.

```ts
const id = client.onAttestationSubmitted((event, slot) => {
  console.log("New attestation:", event.observer.toBase58(), event.score);
});

// later
await client.removeEventListener(id);
```

| Method                       | Event                       |
| ---------------------------- | --------------------------- |
| `onAttestationSubmitted(cb)` | `AttestationSubmittedEvent` |
| `onObserverRegistered(cb)`   | `ObserverRegisteredEvent`   |
| `onObserverDeregistered(cb)` | `ObserverDeregisteredEvent` |
| `onObserverSlashed(cb)`      | `ObserverSlashedEvent`      |
| `onConfigUpdated(cb)`        | `ConfigUpdatedEvent`        |
| `removeEventListener(id)`    | Unsubscribe                 |

### Utility helpers

| Function                                 | Purpose                                            |
| ---------------------------------------- | -------------------------------------------------- |
| `isStale(networkHealth, currentSlot)`    | True if oracle data older than 150 slots           |
| `isObserverStale(observer, currentSlot)` | Same check per observer                            |
| `isDegraded(networkHealth, threshold?)`  | True if score below threshold (default 70)         |
| `healthStatus(networkHealth)`            | Returns `"healthy"`, `"degraded"`, or `"critical"` |
| `regionLabel(region)`                    | UI label like `"United States"` for `Region.US`    |
| `lamportsToSol(lamports)`                | Convert bigint lamports to SOL number              |
| `latencyScore(slotLatencyMs)`            | Compute the on-chain latency component score       |
| `isConsensusCritical(reachableStakePct)` | True when stake reach below 67% finality threshold |
| `stakeReachStatus(reachableStakePct)`    | `"healthy"` (>=80%), `"degraded"` (>=67%), `"critical"` |
| `dominantClient(regionScore)`            | Largest validator client in a region by count      |
| `clientDiversityIndex(regionScore)`      | 0-100 score. 100 = perfectly even, 0 = monoculture |

### PDA helpers

| Function                               | Returns               |
| -------------------------------------- | --------------------- |
| `getRegistryPDA(programId?)`           | `[PublicKey, number]` |
| `getNetworkHealthPDA(programId?)`      | `[PublicKey, number]` |
| `getObserverPDA(observer, programId?)` | `[PublicKey, number]` |

### Regions

`Asia` · `US` · `EU` · `SouthAmerica` · `Africa` · `Oceania` · `Other`

## Notes

- All read methods perform a single RPC call. Wrap them in retry logic for production use.
- `getAllObservers` issues an unfiltered `getProgramAccounts`. Suitable for small fleets. For large deployments prefer `getObserversByRegion` or filter on `isActive` after fetching.
- `healthStatus` returns `"stale"` only when `currentSlot` is passed in. Always pass it for write paths or anything making decisions on the score.

## Status

> Early development. API may change before `1.0.0`.

Program ID (devnet): `DcVVV9W4CtitVvRD7Jf8ptG24Lh9qte4g6tUkwu4t16a`

## License

MIT
