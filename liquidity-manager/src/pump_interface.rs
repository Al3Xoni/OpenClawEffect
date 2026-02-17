use borsh::{BorshDeserialize, BorshSerialize};
use std::str::FromStr;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    system_program,
};

// CORRECT Pump.fun Mainnet Addresses for this Token
pub const PUMP_PROGRAM_ID: &str = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
pub const PUMP_FEE_RECIPIENT: &str = "CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM";
pub const PUMP_GLOBAL: &str = "4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf";
pub const EVENT_AUTHORITY: &str = "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1";

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct SellArgs {
    pub amount: u64,
    pub min_sol_output: u64,
}

pub fn get_sell_instruction(
    program_id: Pubkey,
    global: Pubkey,
    fee_recipient: Pubkey,
    mint: Pubkey,
    bonding_curve: Pubkey,
    associated_bonding_curve: Pubkey,
    associated_user: Pubkey,
    user: Pubkey,
    amount: u64,
    min_sol_output: u64,
) -> Instruction {
    let discriminator: [u8; 8] = [51, 230, 133, 164, 1, 127, 131, 173];
    let args = SellArgs {
        amount,
        min_sol_output,
    };
    
    let mut data = Vec::with_capacity(8 + 16);
    data.extend_from_slice(&discriminator);
    data.extend_from_slice(&args.try_to_vec().unwrap());

    // This token uses a 16-account layout for Sell
    let token_2022 = Pubkey::from_str("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb").unwrap();
    let associated_token_program = spl_associated_token_account::id();

    let accounts = vec![
        AccountMeta::new_readonly(global, false),           // 0
        AccountMeta::new(fee_recipient, false),             // 1
        AccountMeta::new_readonly(mint, false),              // 2
        AccountMeta::new(bonding_curve, false),              // 3
        AccountMeta::new(associated_bonding_curve, false),   // 4
        AccountMeta::new(associated_user, false),            // 5
        AccountMeta::new(user, true),                        // 6
        AccountMeta::new_readonly(system_program::id(), false), // 7
        AccountMeta::new_readonly(token_2022, false),        // 8: Token Program (Token-2022)
        AccountMeta::new_readonly(associated_token_program, false), // 9: Assoc Token Program
        AccountMeta::new_readonly(Pubkey::from_str(EVENT_AUTHORITY).unwrap(), false), // 10
        AccountMeta::new_readonly(program_id, false),        // 11
        // NEW ACCOUNTS (12-15) found in successful TXs for this token
        AccountMeta::new_readonly(Pubkey::from_str("Hq2wp8uJ9jCPsYgNHex8RtqdvMPfVGoYwjvF1ATiwn2Y").unwrap(), false), // 12: fee_config?
        AccountMeta::new_readonly(Pubkey::from_str("6y72tsr2zP6pe9nNQTtjmQADK2qCUE5SXGdqDPf9ea4c").unwrap(), false), // 13
        AccountMeta::new_readonly(Pubkey::from_str("8Wf5TiAheLUqBrKXeYg2JtAFFMWtKdG2BSFgqUcPVwTt").unwrap(), false), // 14
        AccountMeta::new_readonly(Pubkey::from_str("pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ").unwrap(), false), // 15
    ];

    Instruction {
        program_id,
        accounts,
        data,
    }
}

#[derive(BorshDeserialize, Debug, Clone)]
pub struct BondingCurveAccount {
    pub virtual_token_reserves: u64,
    pub virtual_sol_reserves: u64,
    pub real_token_reserves: u64,
    pub real_sol_reserves: u64,
    pub token_total_supply: u64,
    pub complete: bool,
}

impl BondingCurveAccount {
    pub fn get_price_in_sol(&self) -> f64 {
        if self.virtual_token_reserves == 0 {
            return 0.0;
        }
        self.virtual_sol_reserves as f64 / self.virtual_token_reserves as f64
    }

    pub fn get_market_cap_sol(&self) -> f64 {
        (self.get_price_in_sol() * self.token_total_supply as f64) / 1e9
    }
}