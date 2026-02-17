# Project Specification: The Snowball Effect

**Version:** 1.0.0
**Stack:** Solana (Anchor/Rust), Next.js (React), Rust (Off-chain Liquidity Manager)
**Architecture Style:** Season-Based (Adaptable Theme Engine)

---

## 1. Core Logic & Constants

### 1.1 Game Mechanics
*   **Type:** Fomo3D / Key Game variant.
*   **Timer Logic:** **Hard Reset**. Every valid interaction resets the countdown to `30 seconds`.
*   **Entry Cost:** **Fixed Price**. `1000 SNOW` tokens per push (subject to initial config).
*   **End Condition:** Timer reaches `0`.
*   **Payouts (in SOL):**
    *   **Winner 1 (Last):** 30% of SOL Pot.
    *   **Winner 2 (2nd Last):** 20% of SOL Pot.
    *   **Winner 3 (3rd Last):** 10% of SOL Pot.
    *   **Creator/Dev:** 40% of SOL Pot.

### 1.2 The "Theme Engine" (Seasonality)
The architecture decouples **Logic** from **Assets**.
*   **Logic:** `GameAccount`, `Instruction::push` (remains constant).
*   **Assets:** Frontend config maps `SeasonID` to specific sprites (Snowball, Earthball, Fireball).

---

## 2. Module 1: The On-Chain Program (Rust/Anchor)

### 2.1 State Structs

```rust
#[account]
pub struct GameState {
    pub is_active: bool,
    pub round_number: u64,
    pub timer_end_timestamp: i64, // Unix timestamp
    pub snow_collected: u64,      // Total SNOW awaiting conversion
    pub pot_balance_sol: u64,     // Total SOL available for payout
    pub last_pushers: Vec<Pubkey>, // Fixed size: 3
    pub push_count: u64,
    pub authority: Pubkey,        // Admin key (Liquidity Manager)
}
```

### 2.2 Instructions

#### `initialize_game`
*   **Input:** `start_time`
*   **Logic:** Sets `round_number = 1`, `timer_end = start_time + 30`, `pot = 0`.

#### `push_ball`
*   **Input:** None.
*   **Transfers:** `1000 SNOW` from `User ATA` -> `Game PDA (Snow Vault)`.
*   **Logic:**
    1.  Check `block.timestamp < timer_end_timestamp`.
    2.  Transfer tokens.
    3.  **Update Timer:** `timer_end_timestamp = block.timestamp + 30`.
    4.  **Update Queue:** Push `User Pubkey` to `last_pushers`.
    5.  Emit `PushEvent`.

#### `deposit_sol_pot` (Called by Liquidity Manager)
*   **Input:** `amount_sol`
*   **Transfers:** SOL from `Liquidity Manager Wallet` -> `Game PDA (Sol Vault)`.
*   **Logic:** Updates `pot_balance_sol`.

#### `withdraw_snow_for_swap` (Called by Liquidity Manager)
*   **Input:** `amount_snow`
*   **Transfers:** SNOW from `Game PDA` -> `Liquidity Manager Wallet`.
*   **Logic:** Only callable by `authority` (Liquidity Manager). Used to extract SNOW to sell it for SOL.

#### `resolve_round`
*   **Input:** None (Permissionless).
*   **Logic:**
    1.  Check `block.timestamp >= timer_end_timestamp`.
    2.  Check `is_active == true`.
    3.  **Calculate Shares (of SOL Pot):**
        *   `winner_1`: 30%
        *   `winner_2`: 20%
        *   `winner_3`: 10%
        *   `creator`: 40%
    4.  **Transfers:** Send SOL from PDA to respective Wallets.
    5.  **State Update:** `is_active = false`.
    6.  Emit `RoundEndedEvent`.

---

## 3. Module 2: The Liquidity Manager (Rust/Tokio)

### 3.1 Objective
Actively convert `SNOW` (collected from pushes) into `SOL` (for the pot) by selling into market strength.

### 3.2 Logic Cycle: "The Converter"
The bot runs a high-frequency loop:

1.  **Monitor Vault:** Checks `Game PDA` for accumulated `SNOW`.
2.  **Monitor Market:** Checks Raydium/Pump.fun for Buy Volume.
3.  **Trigger:**
    *   If `Game SNOW` > Threshold AND `Market Buy Vol` > Target:
    *   **Action:**
        1.  Call `withdraw_snow_for_swap`.
        2.  Execute Swap (SNOW -> SOL) on DEX.
        3.  Call `deposit_sol_pot` (injecting the SOL back into the game).
4.  **End Game Mode:**
    *   When `timer` < 5 seconds: Aggressively swap remaining SNOW to ensure maximum SOL pot for winners.

---

## 4. Module 3: Frontend (Next.js)

### 4.1 Theme Configuration (`theme.config.ts`)
Must support hot-swapping for future seasons.

```typescript
export const SEASON_CONFIG = {
  current_season: "snowball",
  themes: {
    snowball: {
      name: "The Snowball Effect",
      assets: {
        bg_layer_1: "/assets/snow/mountain_back.png",
        bg_layer_2: "/assets/snow/mountain_front.png",
        ball_sprite: "/assets/snow/snowball.png",
        character_sprite: "/assets/snow/kid_pushing.gif",
        audio_push: "/assets/snow/crunch.mp3",
      },
      colors: {
        primary: "#A5F3FC", // Light Blue
        button: "#0EA5E9",
      }
    },
    // Future expansion
    magma: { ... }
  }
}
```

### 4.2 State Machine
*   **WebSocket:** Subscribes to `PushEvent`.
*   **Animation Queue:**
    *   On `PushEvent` -> Add `Character` to `AnimationQueue`.
    *   `Character` spawns at `x: random, y: bottom`, runs to Ball, plays `push` animation, fades out.
    *   **Ball Physics:** Ball moves slightly `up` on push, slowly slides `down` continuously (lerp).

---

## 5. Deployment Sequence

1.  **Manual:** Create Token on Pump.fun (Get Mint CA).
2.  **Config:** Update `lib.rs` and `liquidity-manager/config.toml` with Mint CA.
3.  **Deploy:** Anchor Program to Solana Mainnet.
4.  **Init:** Run `initialize_game`.
5.  **Launch:** Web & Liquidity Manager go live.


