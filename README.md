# The Snowball Effect ($SNOW)

> **⚠️ DEVELOPMENT STATUS: LOCAL SIMULATION**
>
> This project is currently in **Private Test Mode**. All development, testing, and execution occur on a **Local Solana Validator**.
> *   **Token:** Mock SNOW (Local SPL Token).
> *   **DEX:** Simulated Swap Logic.
> *   **Funds:** Localhost Airdropped SOL.
>
> **Do not deploy to Mainnet** until the Simulation Test Suite passes 100%.

**The Snowball Effect** is a high-frequency GameFi project built on the Solana blockchain. It combines competitive "King of the Hill" mechanics with a deflationary token strategy, featuring real-time multiplayer animations and automated liquidity management.

## ❄️ The Concept

Players compete to be the last ones pushing a snowball uphill before a timer runs out. Every push requires `SNOW` tokens, which are collected in a Treasury.

1.  **Push the Ball:** Users pay a fee (in `SNOW`) to push the snowball.
2.  **Reset the Clock:** Each push extends or resets the 30-second countdown.
3.  **Visual Feedback:** The frontend renders real-time animations of "kids" (players) pushing the ball uphill.
4.  **The Winners:** When the timer hits zero, the **last 3 wallets** to push the ball split 60% of the pot.

## 💰 Economics & Payouts

The Treasury is distributed as follows when a round ends:

*   **🥇 Last Pusher:** 30% of the pot.
*   **🥈 2nd Last Pusher:** 20% of the pot.
*   **🥉 3rd Last Pusher:** 10% of the pot.
*   **🏦 Project/Dev:** 40% (Allocated for buybacks/liquidity management).

## 🏗️ System Architecture

The project consists of three distinct modules ensuring speed, security, and market stability.

### 1. The Program (Smart Contract)
*Powered by Rust & Anchor Framework*

The core logic resides on-chain. We utilize a **PDA (Program Derived Address)** to manage funds trustlessly.

*   **State Management:** Tracks `round_id`, `timer_end`, `pot_balance`, and the queue of `last_3_pushers`.
*   **Instructions:**
    *   `push_snowball`: Deducts SNOW, updates the winner queue, extends the timer.
    *   `resolve_round`: Distributes rewards to winners and the liquidity manager wallet automatically.

### 2. The Liquidity Manager (Off-Chain Bot)
*Powered by Rust*

A specialized autonomous agent designed to minimize sell pressure and stabilize the chart.

*   **Responsibility:** Receives the 40% Dev allocation from round pots.
*   **Strategy:** Monitors market volume on Pump.fun/Raydium. It executes **TWAP (Time-Weighted Average Price)** sells only when there is sufficient buy pressure, converting `SNOW` to `SOL` without "red candle" shocks.

### 3. The Frontend (dApp)
*Powered by Next.js, Solana Wallet Adapter, & WebSocket*

The user interface provides a gamified experience.

*   **Connectivity:** Connects to Phantom/Solflare wallets.
*   **Animation Engine:** Listens to on-chain events via WebSocket. When a `Push` event occurs, a new character sprite appears and animates the snowball moving up.
*   **Optimistic UI:** Ensures instant visual feedback for the user while the transaction confirms on Solana's high-speed network.

## 📂 Project Structure

```text
snowball-effect/
├── program/                 # Solana Smart Contract (Rust/Anchor)
│   ├── programs/snowball/   # Game logic and state
│   └── tests/               # TypeScript integration tests
├── liquidity-manager/       # Liquidity Manager (Rust)
│   ├── src/                 # Market monitoring and swap logic
│   └── Cargo.toml
└── web/                     # Frontend dApp (Next.js/React)
    ├── components/game/     # Animation canvas and logic
    └── hooks/               # Solana interaction hooks
```

## 🚀 Technology Stack

*   **Blockchain:** Solana
*   **Smart Contract:** Rust, Anchor Framework
*   **Frontend:** React, Next.js, TailwindCSS, Framer Motion
*   **Backend/Liquidity Manager:** Rust (Tokio, Solana Client)

## 🧪 Testing Strategy

We utilize a comprehensive **Root Test Suite** located in the `tests/` directory to simulate the entire ecosystem without spending real funds.

1.  **Environment:** `solana-test-validator` (Localhost).
2.  **Mocking:**
    *   **Token:** We generate a purely local `MockSNOW` mint.
    *   **DEX:** We mock the Liquidity Manager's "Swap" function to simulate market orders.
3.  **Scenario:**
    *   **Phase 1:** Init Game & Mint Tokens.
    *   **Phase 2:** Users Push (Timer Resets).
    *   **Phase 3:** Liquidity Manager Swaps SNOW -> SOL.
    *   **Phase 4:** Timer Expires -> Verify Leaderboard & Payouts.

## 📦 Getting Started

*(Instructions for local development will be added as modules are initialized)*

**Last Update:** 28 Jan 2026 - Migration to Web2.5 Hybrid Architecture.