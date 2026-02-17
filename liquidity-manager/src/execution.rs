use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
};
use std::str::FromStr;

use crate::pump_interface;

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
        pump_accounts: &PumpAccounts
    ) -> Result<String, Box<dyn std::error::Error>> {
        
        println!("🚀 Executing Direct Sell: {} SNOW -> Min {:.6} SOL", amount_snow, min_sol_out as f64 / 1e9);

        // 1. Construct "Sell" Instruction (on Pump.fun)
        let global_account = Pubkey::from_str(pump_interface::PUMP_GLOBAL)?;

        let sell_ix = pump_interface::get_sell_instruction(
            Pubkey::from_str(pump_interface::PUMP_PROGRAM_ID)?,
            global_account,
            Pubkey::from_str(pump_interface::PUMP_FEE_RECIPIENT)?,
            pump_accounts.mint,
            pump_accounts.bonding_curve,
            pump_accounts.associated_bonding_curve,
            pump_accounts.associated_user,
            self.payer.pubkey(), // The user selling is the Payer (Treasury)
            amount_snow,
            min_sol_out
        );

        // 2. Bundle & Send
        let blockhash = self.client.get_latest_blockhash()?;
        let tx = Transaction::new_signed_with_payer(
            &[sell_ix],
            Some(&self.payer.pubkey()),
            &[&self.payer],
            blockhash,
        );

        println!("📡 Sending transaction to Solana...");
        match self.client.send_and_confirm_transaction(&tx) {
            Ok(signature) => Ok(signature.to_string()),
            Err(e) => {
                // Try to get simulation logs
                if let Ok(sim) = self.client.simulate_transaction(&tx) {
                    println!("📋 Simulation Logs: {:?}", sim.value.logs);
                }
                Err(e.into())
            }
        }
    }
}

pub struct PumpAccounts {
    pub mint: Pubkey,
    pub bonding_curve: Pubkey,
    pub associated_bonding_curve: Pubkey,
    pub associated_user: Pubkey,
}
