mod monitor;
mod strategy;
mod execution;
mod pump_interface;

use std::env;
use std::str::FromStr;
use std::sync::Arc;
use dotenv::dotenv;
use solana_sdk::signature::Keypair;
use solana_sdk::signer::Signer; // Fix for .pubkey()
use solana_sdk::pubkey::Pubkey;
use crate::monitor::Monitor;
use crate::execution::{ExecutionEngine, PumpAccounts};
use crate::strategy::StrategyConfig;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv().ok();
    println!("🚀 Snowball Effect: Liquidity Manager (Treasury Mode) Starting...");

    // 1. Load Config & Keys
    let rpc_url = env::var("RPC_URL").expect("RPC_URL missing");
    let wss_url = env::var("WSS_URL").unwrap_or(rpc_url.replace("https", "wss"));
    
    // This key MUST be the Treasury Wallet Private Key (base58 string)
    let key_str = env::var("TREASURY_PRIVATE_KEY").or_else(|_| env::var("MASTER_WALLET_PRIVATE_KEY")).expect("TREASURY_PRIVATE_KEY missing");
    let payer = Keypair::from_base58_string(&key_str);
    
    let snow_mint = Pubkey::from_str(&env::var("SNOW_MINT").expect("SNOW_MINT missing"))?;

    println!("👤 Treasury Authority: {}", payer.pubkey());

    // 2. Initialize Modules
    let settings = std::fs::read_to_string("settings.json").unwrap_or("{}".to_string());
    let strategy_config: StrategyConfig = serde_json::from_str(&settings).unwrap_or_default();
    println!("📈 Strategy Loaded: {:?}", strategy_config);

    // No need for Game Program ID anymore
    let engine = Arc::new(ExecutionEngine::new(rpc_url.clone(), payer));

    // Pump.fun Curve Address for SNOW (Must be found via API or hardcoded after launch)
    let curve_address = Pubkey::from_str(&env::var("BONDING_CURVE").expect("BONDING_CURVE address missing"))?;

    let monitor = Monitor::new(rpc_url, wss_url, curve_address);

    // 3. Define the Callback (What happens when a BUY is detected)
    let engine_clone = engine.clone();
    let snow_mint_clone = snow_mint;
    
    monitor.start_monitoring(move |sol_in, account_state| {
        // A. Calculate Metrics
        let price_sol = account_state.get_price_in_sol();
        let mc_sol = account_state.get_market_cap_sol();

        println!("⚖️  Analyzing Buy: {:.6} SOL | Market Cap: {:.2} SOL", sol_in as f64 / 1e9, mc_sol);

        // B. Decide Sell Amount
        let tokens_to_sell = strategy::calculate_sell_amount(
            sol_in, 
            mc_sol, 
            price_sol, 
            &strategy_config
        );

        if tokens_to_sell > 0 {
            println!("⚙️  Action: Selling {} SNOW...", tokens_to_sell);
            
            // For Token-2022, we MUST use the Token-2022 Program ID for ATA derivation
            let token_2022_program = Pubkey::from_str("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb").unwrap();

            // Construct Pump Accounts
            let associated_bonding_curve = spl_associated_token_account::get_associated_token_address_with_program_id(
                &curve_address,
                &snow_mint_clone,
                &token_2022_program
            );
            
            let associated_user = spl_associated_token_account::get_associated_token_address_with_program_id(
                &engine_clone.payer.pubkey(), 
                &snow_mint_clone,
                &token_2022_program
            );

            let pump_accounts = PumpAccounts {
                mint: snow_mint_clone,
                bonding_curve: curve_address,
                associated_bonding_curve,
                associated_user,
            };

            // Min SOL Out (Slippage protection - 20% for small test amounts)
            let min_sol_out = ((tokens_to_sell as f64 * price_sol) * 0.80) as u64;

            match engine_clone.execute_strategy(tokens_to_sell, min_sol_out, &pump_accounts) {
                Ok(sig) => println!("🚀 SUCCESS! Sold SNOW. Tx: {}", sig),
                Err(e) => eprintln!("❌ EXECUTION FAILED: {}", e),
            }
        } else {
            println!("ℹ️  Skipped: Sell amount calculated as 0 tokens (Buy might be too small).");
        }
    });

    // Keep Main Thread Alive
    loop {
        tokio::time::sleep(std::time::Duration::from_secs(60)).await;
        println!("💓 Heartbeat: Monitor Active...");
    }
}
