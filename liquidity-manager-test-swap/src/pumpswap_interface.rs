use borsh::{BorshDeserialize, BorshSerialize};
use std::str::FromStr;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    system_program,
};

// PumpSwap AMM Program ID
pub const PUMPSWAP_PROGRAM_ID: &str = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";
pub const PUMPSWAP_GLOBAL: &str = "13ec7XdrjF3h3YcqBTFDSReRcUFwbCnJaAQspM4j6DDJ";
pub const PUMPSWAP_FEE_RECIPIENT: &str = "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ";

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct PumpSwapSellArgs {
    pub amount_in: u64,
    pub min_out: u64,
}

pub fn get_pumpswap_sell_instruction(
    amm_id: Pubkey,
    sol_vault: Pubkey,
    token_vault: Pubkey,
    mint: Pubkey,
    user: Pubkey,
    user_token_account: Pubkey,
    amount_in: u64,
    min_out: u64,
) -> Instruction {
    // Instruction Discriminator for "Sell" (Found via SHA256 "global:sell" or tracing)
    // Based on the transaction data "Pi83CqUD3CrHqHxp..."
    // The discriminator is the first 8 bytes.
    let discriminator: [u8; 8] = [51, 230, 133, 164, 1, 127, 131, 173]; 
    
    let args = PumpSwapSellArgs {
        amount_in,
        min_out,
    };

    let mut data = Vec::with_capacity(8 + 16);
    data.extend_from_slice(&discriminator);
    data.extend_from_slice(&args.try_to_vec().unwrap());

    let token_2022 = solana_sdk::pubkey::Pubkey::from_str("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb").unwrap();

    let accounts = vec![
        AccountMeta::new_readonly(Pubkey::from_str(PUMPSWAP_GLOBAL).unwrap(), false), // Global
        AccountMeta::new(Pubkey::from_str(PUMPSWAP_FEE_RECIPIENT).unwrap(), false),   // Fee Recipient
        AccountMeta::new_readonly(mint, false),                                     // Mint
        AccountMeta::new(amm_id, false),                                            // AMM Pool
        AccountMeta::new(token_vault, false),                                       // Token Vault
        AccountMeta::new(sol_vault, false),                                         // SOL Vault
        AccountMeta::new(user, true),                                               // User (Signer)
        AccountMeta::new(user_token_account, false),                                // User Token Account
        AccountMeta::new_readonly(system_program::id(), false),                     // System Program
        AccountMeta::new_readonly(token_2022, false),                               // Token-2022 Program
        AccountMeta::new_readonly(spl_associated_token_account::id(), false),       // Assoc Token Program
    ];

    Instruction {
        program_id: Pubkey::from_str(PUMPSWAP_PROGRAM_ID).unwrap(),
        accounts,
        data,
    }
}
