mod monitor;
mod strategy;
mod execution;
mod raydium_interface;
mod pumpswap_interface;

use std::env;
use std::str::FromStr;
use std::sync::Arc;
use std::convert::TryInto;
use dotenv::dotenv;
use solana_sdk::signature::Keypair;
use solana_sdk::signer::Signer;
use solana_sdk::pubkey::Pubkey;
use solana_client::rpc_client::RpcClient;
use crate::monitor::{Monitor, PUMPSWAP_PROGRAM, RAYDIUM_V4_PROGRAM};
use crate::execution::{ExecutionEngine, RaydiumSwapKeys, PumpSwapKeys, SwapKeys};
use crate::strategy::StrategyConfig;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv().ok();
    println!("🚀 Snowball Effect: Liquidity Manager (Multi-Protocol Mode) Starting...");

    // 1. Load Config & Keys
    let rpc_url = env::var("RPC_URL").expect("RPC_URL missing");
    let wss_url = env::var("WSS_URL").unwrap_or(rpc_url.replace("https", "wss"));
    
    let key_str = env::var("TREASURY_PRIVATE_KEY").or_else(|_| env::var("MASTER_WALLET_PRIVATE_KEY")).expect("TREASURY_PRIVATE_KEY missing");
    let payer = Keypair::from_base58_string(&key_str);
    
    let snow_mint = Pubkey::from_str(&env::var("SNOW_MINT").expect("SNOW_MINT missing"))?;

    println!("👤 Treasury Authority: {}", payer.pubkey());

    // 2. Initialize Modules
    let settings = std::fs::read_to_string("settings.json").unwrap_or("{}".to_string());
    let strategy_config: StrategyConfig = serde_json::from_str(&settings).unwrap_or_default();
    println!("📈 Strategy Loaded: {:?}", strategy_config);

    let engine = Arc::new(ExecutionEngine::new(rpc_url.clone(), payer));

    // AMM Pool ID
    let amm_pool_id = Pubkey::from_str(&env::var("AMM_POOL_ID").expect("AMM_POOL_ID missing"))?;

    // 3. Fetch Keys (Dynamic Loading)
    println!("⏳ Fetching Keys for Pool: {}", amm_pool_id);
    let rpc_client = RpcClient::new(rpc_url.clone());
    let keys = fetch_keys(&rpc_client, amm_pool_id, engine.payer.pubkey(), snow_mint)?;

    let monitor = Monitor::new(rpc_url, wss_url, amm_pool_id);

    // 4. Define the Callback
    let engine_clone = engine.clone();
    let keys_clone = keys.clone();
    
    monitor.start_monitoring(move |sol_in, account_state| {
        let price_sol = account_state.get_price_in_sol();
        let mc_sol = account_state.get_market_cap_sol();

        println!("⚖️  Analyzing Buy: {:.6} SOL | MC: {:.2} SOL", sol_in as f64 / 1e9, mc_sol);

        let tokens_to_sell = strategy::calculate_sell_amount(
            sol_in, 
            mc_sol, 
            price_sol, 
            &strategy_config
        );

        if tokens_to_sell > 0 {
            println!("⚙️  Action: Selling {} SNOW...", tokens_to_sell);
            let min_sol_out = ((tokens_to_sell as f64 * price_sol) * 0.90) as u64; 

            match engine_clone.execute_strategy(tokens_to_sell, min_sol_out, &keys_clone) {
                Ok(sig) => println!("🚀 SUCCESS! Tx: {}", sig),
                Err(e) => eprintln!("❌ EXECUTION FAILED: {}", e),
            }
        } else {
            println!("ℹ️  Skipped: Sell amount calculated as 0 tokens.");
        }
    });

    loop {
        tokio::time::sleep(std::time::Duration::from_secs(60)).await;
        println!("💓 Heartbeat: Monitor Active...");
    }
}

fn fetch_keys(client: &RpcClient, amm_id: Pubkey, payer: Pubkey, mint: Pubkey) -> anyhow::Result<SwapKeys> {
    let account = client.get_account(&amm_id)?;
    let owner = account.owner.to_string();

    if owner == PUMPSWAP_PROGRAM {
        println!("✅ Identifying as PumpSwap...");
        let data = account.data;
        let token_vault = Pubkey::new_from_array(data[136..168].try_into()?);
        let sol_vault = Pubkey::new_from_array(data[168..200].try_into()?);
        
        let user_token_account = spl_associated_token_account::get_associated_token_address_with_program_id(
            &payer, &mint, &Pubkey::from_str("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb").unwrap()
        );

        Ok(SwapKeys::PumpSwap(PumpSwapKeys {
            amm_id,
            sol_vault,
            token_vault,
            mint,
            user_token_account,
        }))
    } else if owner == RAYDIUM_V4_PROGRAM {
        println!("✅ Identifying as Raydium V4...");
        let data = account.data;
        let amm_coin_vault = Pubkey::new_from_array(data[400..432].try_into()?);
        let amm_pc_vault = Pubkey::new_from_array(data[432..464].try_into()?);
        let amm_open_orders = Pubkey::new_from_array(data[560..592].try_into()?);
        let serum_market = Pubkey::new_from_array(data[592..624].try_into()?);
        let amm_target_orders = Pubkey::new_from_array(data[624..656].try_into()?);

        let market_data = client.get_account_data(&serum_market)?;
        let serum_event_queue = Pubkey::new_from_array(market_data[285..317].try_into()?);
        let serum_bids = Pubkey::new_from_array(market_data[317..349].try_into()?);
        let serum_asks = Pubkey::new_from_array(market_data[349..381].try_into()?);
        let serum_coin_vault = Pubkey::new_from_array(market_data[117..149].try_into()?);
        let serum_pc_vault = Pubkey::new_from_array(market_data[149..181].try_into()?);
        let vault_signer_nonce = u64::from_le_bytes(market_data[45..53].try_into()?);

        let serum_program_id = Pubkey::from_str(crate::raydium_interface::SERUM_PROGRAM_ID)?;
        let (serum_vault_signer, _) = Pubkey::find_program_address(&[serum_market.as_ref(), &vault_signer_nonce.to_le_bytes()], &serum_program_id);

        let user_source_token_account = spl_associated_token_account::get_associated_token_address(&payer, &mint);
        let user_dest_token_account = spl_associated_token_account::get_associated_token_address(&payer, &Pubkey::from_str("So11111111111111111111111111111111111111112").unwrap());

        Ok(SwapKeys::Raydium(RaydiumSwapKeys {
            raydium_v4_program: Pubkey::from_str(RAYDIUM_V4_PROGRAM)?,
            amm_id,
            amm_authority: Pubkey::from_str("5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1")?,
            amm_open_orders,
            amm_target_orders,
            amm_coin_vault,
            amm_pc_vault,
            serum_program_id,
            serum_market,
            serum_bids,
            serum_asks,
            serum_event_queue,
            serum_coin_vault,
            serum_pc_vault,
            serum_vault_signer,
            user_source_token_account,
            user_dest_token_account,
        }))
    } else {
        Err(anyhow::anyhow!("Unsupported Protocol Owner: {}", owner))
    }
}
