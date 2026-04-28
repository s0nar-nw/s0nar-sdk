# s0nar-sdk examples

Runnable demos showing how to use every method in the SDK.

## Setup

```bash
cd s0nar-sdk
npm install
npm run build

cd examples
npm install
```

## Scripts

| Command             | What it does                                                                        |
| ------------------- | ----------------------------------------------------------------------------------- |
| `npm run read`      | Reads NetworkHealth + Registry from devnet, prints everything with utility helpers  |
| `npm run observers` | Lists all observers, groups by region, shows staleness check                        |
| `npm run build-ix`  | Builds every instruction (without sending), shows account counts and tx composition |

## Notes

- All demos hit Solana devnet at `https://api.devnet.solana.com`.
- `build-ix` does not sign or send anything. It only verifies the SDK builds valid `TransactionInstruction` objects.
- To run write-side instructions for real, pass a wallet to `createS0narClient({ connection, wallet })`.
