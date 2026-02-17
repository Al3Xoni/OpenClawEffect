use borsh::{BorshDeserialize, BorshSerialize};
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};

// Raydium Liquidity Pool V4 Program ID
pub const RAYDIUM_V4_PROGRAM_ID: &str = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";
pub const SERUM_PROGRAM_ID: &str = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u64)]
pub enum RaydiumSwapInstruction {
    SwapBaseIn = 9,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct SwapBaseInArgs {
    pub instruction: u8, // Should be 9
    pub amount_in: u64,
    pub min_out: u64,
}

// Raydium AMM Pool State Layout (Partial/Simplified for Monitoring)
// We only need the public keys of the Vaults to fetch their balances via RPC.
// The struct is too large/complex to deserialize fully if we just want the vault keys.
// However, the vault keys are static in the AMM Account data at specific offsets.
// 
// Offsets (based on Raydium Rust SDK):
// status: 0 (u64)
// ...
// coin_vault: 400 (Pubkey)
// pc_vault: 432 (Pubkey)
// ...
#[derive(Debug, Clone)]
pub struct AmmKeys {
    pub amm_id: Pubkey,
    pub coin_vault: Pubkey,
    pub pc_vault: Pubkey,
    pub coin_mint: Pubkey,
    pub pc_mint: Pubkey,
    pub open_orders: Pubkey,
    pub target_orders: Pubkey,
    pub market_program: Pubkey,
    pub market: Pubkey,
}

// We will use a helper to extract these from the account data manually
// instead of a full struct to avoid alignment issues with the massive Raydium struct.

pub fn get_swap_base_in_instruction(
    program_id: Pubkey,
    amm_id: Pubkey,
    amm_authority: Pubkey,
    amm_open_orders: Pubkey,
    amm_target_orders: Pubkey,
    pool_coin_token_account: Pubkey,
    pool_pc_token_account: Pubkey,
    serum_program_id: Pubkey,
    serum_market: Pubkey,
    serum_bids: Pubkey,
    serum_asks: Pubkey,
    serum_event_queue: Pubkey,
    serum_coin_vault: Pubkey,
    serum_pc_vault: Pubkey,
    serum_vault_signer: Pubkey,
    user_source_token_account: Pubkey,
    user_dest_token_account: Pubkey,
    user_owner: Pubkey,
    amount_in: u64,
    min_out: u64,
) -> Instruction {
    
    // Manual serialization for the instruction data
    // Layout: [u8; 1] (9) + [u64; 1] (amount_in) + [u64; 1] (min_out)
    let mut data = Vec::with_capacity(17);
    data.push(9u8);
    data.extend_from_slice(&amount_in.to_le_bytes());
    data.extend_from_slice(&min_out.to_le_bytes());

    let accounts = vec![
        // 1. SPL Token Program
        AccountMeta::new_readonly(spl_token::id(), false),
        // 2. AMM ID
        AccountMeta::new(amm_id, false),
        // 3. AMM Authority
        AccountMeta::new_readonly(amm_authority, false),
        // 4. AMM Open Orders
        AccountMeta::new(amm_open_orders, false),
        // 5. AMM Target Orders
        AccountMeta::new(amm_target_orders, false),
        // 6. AMM Coin Vault
        AccountMeta::new(pool_coin_token_account, false),
        // 7. AMM PC Vault
        AccountMeta::new(pool_pc_token_account, false),
        // 8. Serum Program ID
        AccountMeta::new_readonly(serum_program_id, false),
        // 9. Serum Market
        AccountMeta::new(serum_market, false),
        // 10. Serum Bids
        AccountMeta::new(serum_bids, false),
        // 11. Serum Asks
        AccountMeta::new(serum_asks, false),
        // 12. Serum Event Queue
        AccountMeta::new(serum_event_queue, false),
        // 13. Serum Coin Vault
        AccountMeta::new(serum_coin_vault, false),
        // 14. Serum PC Vault
        AccountMeta::new(serum_pc_vault, false),
        // 15. Serum Vault Signer
        AccountMeta::new_readonly(serum_vault_signer, false),
        // 16. User Source Token Account (SNOW)
        AccountMeta::new(user_source_token_account, false),
        // 17. User Dest Token Account (SOL/WSOL)
        AccountMeta::new(user_dest_token_account, false),
        // 18. User Owner
        AccountMeta::new_readonly(user_owner, true),
    ];

    Instruction {
        program_id,
        accounts,
        data,
    }
}
