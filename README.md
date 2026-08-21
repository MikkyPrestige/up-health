# UP Health

**Paste a Universal Profile address. Find out exactly who can do what to it, and whether anything looks risky.**

UP Health is a read-only diagnostic tool for [LUKSO](https://lukso.network) Universal Profiles. It reads a profile's on-chain permission data (LSP6 Key Manager) and translates it into a plain-language breakdown of who controls the profile, what each controller can actually do, and whether anything about the current setup looks risky, stale, or misconfigured.

It doesn't manage, edit, or fix anything — it diagnoses. For remediation, it links out to the existing [LSP6 permission manager](https://permissioncontrol.app) already available in the LUKSO ecosystem.

🔗 **Live:** [up-health.vercel.app](https://up-health.vercel.app)
🧩 Also works as a **Mini-App** on [Universal Everything Grid](https://universaleverything.io) — just add `up-health.vercel.app` to your Grid.

---

## What it does

- **Plain-language permission breakdown** — every controller's raw LSP6 bitfield decoded into readable statements ("can transfer LYX," "can call external contracts"), not technical jargon.
- **Risk flags**, shown only to a profile's verified owner:
  - A controller can both govern permissions (add controllers / edit permissions) *and* move funds or make arbitrary calls
  - No recovery path — the profile has exactly one controller
  - A configured automatic-reaction contract (Universal Receiver Delegate) doesn't implement the interface it's supposed to
  - The profile has zero controllers
  - The profile's owner isn't actually a genuine LSP6 Key Manager — meaning none of its permission data is actually being enforced
- **Restriction visibility** — surfaces when a "powerful" permission (like `CALL` or `SETDATA`) is actually inert because nothing is allow-listed for it
- **Contract vs. wallet detection** for every controller, shown to everyone
- **Last-activity / staleness** per controller, shown only to the verified owner
- **Vault support** — LSP9 Vaults work identically to Profiles, using the same underlying data model
- **Works in two contexts**: as a standalone site, and embedded as a Mini-App inside a user's Grid, with wallet connection handled appropriately in each

## Identity-matched access, not wallet-gating

This is the core design principle, and it's stricter than typical "connect wallet to unlock" patterns:

- **Anyone**, without connecting anything, can see: basic profile info, the plain-language permission breakdown, contract-vs-wallet detection, restriction data, and whether automatic reaction code is configured.
- **Only the verified owner** — someone whose connected wallet address matches the profile being viewed — sees risk flags, staleness data, and next-step guidance.

Looking up someone else's profile, connected or not, never surfaces risk framing about it. The gate checks for a match between the connected identity and the profile being examined, not merely the presence of a connection. This means the tool can't be used as a public vulnerability-disclosure mechanism against a stranger's profile.

## Why it exists

LSP6 permissions are stored on-chain as bitfields — technically precise, but unreadable to anyone who isn't deeply familiar with the standard. A permission *management* tool already exists in the LUKSO ecosystem, but nothing diagnosed the current state of a profile's permissions before changes are made. UP Health fills that gap.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind v4
- [viem](https://viem.sh) for on-chain reads, [@erc725/erc725.js](https://github.com/lukso-network/tools-erc725js) for LSP6/LSP3 decoding with LUKSO's official schemas
- [wagmi](https://wagmi.sh) + [RainbowKit](https://www.rainbowkit.com) for standalone wallet connection (including WalletConnect, for UP Mobile)
- [@lukso/up-provider](https://www.npmjs.com/package/@lukso/up-provider) for Grid-embedded Mini-App context and one-click connection
- [Vitest](https://vitest.dev) for testing
- Frontend-only, no database, no backend — every result is read live from the chain at lookup time

## Getting started

```bash
git clone https://github.com/MikkyPrestige/up-health.git
cd up-health
npm install
```

Copy `.env.example` to `.env.local` and fill in the required values (a LUKSO Mainnet RPC endpoint and a WalletConnect Project ID).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Testing

```bash
npm test          # run once
npm run test:watch
```

Tests cover pure functions — risk flag logic, permission decoding/categorization, identity matching, summary generation. Functions that depend on live chain data are verified with standalone scripts (`verify-*.mjs` in the repo root) run manually against real profiles, rather than mocked.

### Building

```bash
npm run build
npm run lint
```

## Scope

- **Network:** LUKSO Mainnet only.
- **Read-only.** No transactions are ever sent, no permissions are ever edited from within the tool.
- Not yet built: true multisig-pattern recognition (beyond basic contract-vs-wallet detection), ecosystem-wide baseline comparisons, and historical permission tracking over time. Multisig-as-controller is already real and used in LUKSO's own official recovery infrastructure, so recognizing it is a real future direction, not a dismissed one.

## Contributing

This is currently a solo project. Bug reports and feedback are welcome via [Issues](https://github.com/MikkyPrestige/up-health/issues).
