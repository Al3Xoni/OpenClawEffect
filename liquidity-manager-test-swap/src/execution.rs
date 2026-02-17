use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
};
use std::str::FromStr;

use crate::raydium_interface;
use crate::pumpswap_interface;

pub struct ExecutionEngine {
    client: RpcClient,
    pub payer: Keypair,
}

impl ExecutionEngine {
    pub fn new(rpc_url: String, payer: Keypair) -> Self {
        let client = RpcClient::new_with_commitment(rpc_url, CommitmentConfig::confirmed());
        Self {
            client,
            payer,
        }
    }

    pub fn execute_strategy(
        &self,
        amount_snow: u64,
        min_sol_out: u64,
        swap_keys: &SwapKeys
    ) -> Result<String, Box<dyn std::error::Error>> {
        
        let swap_ix = match swap_keys {
            SwapKeys::Raydium(keys) => {
                println!("🚀 Executing Raydium Swap: {} SNOW -> Min {:.6} SOL", amount_snow, min_sol_out as f64 / 1e9);
                raydium_interface::get_swap_base_in_instruction(
                    keys.raydium_v4_program,
                    keys.amm_id,
                    keys.amm_authority,
                    keys.amm_open_orders,
                    keys.amm_target_orders,
                    keys.amm_coin_vault,
                    keys.amm_pc_vault,
                    keys.serum_program_id,
                    keys.serum_market,
                    keys.serum_bids,
                    keys.serum_asks,
                    keys.serum_event_queue,
                    keys.serum_coin_vault,
                    keys.serum_pc_vault,
                    keys.serum_vault_signer,
                    keys.user_source_token_account,
                    keys.user_dest_token_account,
                    self.payer.pubkey(),
                    amount_snow,
                    min_sol_out
                )
            },
            SwapKeys::PumpSwap(keys) => {
                println!("🚀 Executing PumpSwap: {} SNOW -> Min {:.6} SOL", amount_snow, min_sol_out as f64 / 1e9);
                pumpswap_interface::get_pumpswap_sell_instruction(
                    keys.amm_id,
                    keys.sol_vault,
                    keys.token_vault,
                    keys.mint,
                    self.payer.pubkey(),
                    keys.user_token_account,
                    amount_snow,
                    min_sol_out
                )
            }
        };

        // 2. Bundle & Send
        let blockhash = self.client.get_latest_blockhash()?;
        let tx = Transaction::new_signed_with_payer(
            &[swap_ix],
            Some(&self.payer.pubkey()),
            &[&self.payer],
            blockhash,
        );

        println!("📡 Sending transaction to Solana...");
        match self.client.send_and_confirm_transaction(&tx) {
            Ok(signature) => Ok(signature.to_string()),
            Err(e) => {
                if let Ok(sim) = self.client.simulate_transaction(&tx) {
                    println!("📋 Simulation Logs: {:?}", sim.value.logs);
                }
                Err(e.into())
            }
        }
    }
}

#[derive(Clone, Debug)]
pub enum SwapKeys {
    Raydium(RaydiumSwapKeys),
    PumpSwap(PumpSwapKeys),
}

#[derive(Clone, Debug)]
pub struct RaydiumSwapKeys {
    pub raydium_v4_program: Pubkey,
    pub amm_id: Pubkey,
    pub amm_authority: Pubkey,
    pub amm_open_orders: Pubkey,
    pub amm_target_orders: Pubkey,
    pub amm_coin_vault: Pubkey,
    pub amm_pc_vault: Pubkey,
    pub serum_program_id: Pubkey,
    pub serum_market: Pubkey,
    pub serum_bids: Pubkey,
    pub serum_asks: Pubkey,
    pub serum_event_queue: Pubkey,
    pub serum_coin_vault: Pubkey,
    pub serum_pc_vault: Pubkey,
    pub serum_vault_signer: Pubkey,
    pub user_source_token_account: Pubkey,
    pub user_dest_token_account: Pubkey,
}

#[derive(Clone, Debug)]
pub struct PumpSwapKeys {
    pub amm_id: Pubkey,
    pub sol_vault: Pubkey,
    pub token_vault: Pubkey,
    pub mint: Pubkey,
    pub user_token_account: Pubkey,
}
