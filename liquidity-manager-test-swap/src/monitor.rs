use solana_client::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;
use std::time::Duration;
use std::convert::TryInto;
use std::str::FromStr;

pub const PUMPSWAP_PROGRAM: &str = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";
pub const RAYDIUM_V4_PROGRAM: &str = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";

pub struct Monitor {
    pub rpc_url: String,
    pub wss_url: String,
    pub amm_pool_id: Pubkey,
    pub last_sol_reserves: Arc<AtomicU64>,
}

#[derive(Debug, Clone)]
pub struct AmmState {
    pub sol_reserves: u64,
    pub token_reserves: u64,
}

impl AmmState {
    pub fn get_price_in_sol(&self) -> f64 {
        if self.token_reserves == 0 { return 0.0; }
        self.sol_reserves as f64 / self.token_reserves as f64
    }
    
    pub fn get_market_cap_sol(&self) -> f64 {
        self.get_price_in_sol() * 1_000_000_000_000_000.0 / 1e9 
    }
}

impl Monitor {
    pub fn new(rpc_url: String, wss_url: String, amm_pool_id: Pubkey) -> Self {
        Self {
            rpc_url,
            wss_url,
            amm_pool_id,
            last_sol_reserves: Arc::new(AtomicU64::new(0)),
        }
    }

    pub fn start_monitoring<F>(&self, on_buy: F) 
    where F: Fn(u64, AmmState) + Send + Sync + 'static 
    {
        let rpc_url = self.rpc_url.clone();
        let amm_pool_id = self.amm_pool_id;
        let last_sol_reserves = self.last_sol_reserves.clone();

        thread::spawn(move || {
            println!("👀 Starting Monitor on Pool: {}", amm_pool_id);
            let client = RpcClient::new(rpc_url);

            // 1. Identify Protocol and Fetch Vaults
            let (coin_vault, pc_vault) = loop {
                println!("⏳ Identifying Protocol for AMM...");
                match client.get_account(&amm_pool_id) {
                    Ok(account) => {
                        let owner = account.owner.to_string();
                        let data = account.data;
                        
                        if owner == PUMPSWAP_PROGRAM {
                            println!("✅ Detected protocol: PUMPSWAP");
                            // Offsets identified via trace: Token=136, SOL=168
                            let cv = Pubkey::new_from_array(data[136..168].try_into().unwrap());
                            let pv = Pubkey::new_from_array(data[168..200].try_into().unwrap());
                            break (cv, pv);
                        } else if owner == RAYDIUM_V4_PROGRAM {
                            println!("✅ Detected protocol: RAYDIUM V4");
                            let cv = Pubkey::new_from_array(data[400..432].try_into().unwrap());
                            let pv = Pubkey::new_from_array(data[432..464].try_into().unwrap());
                            break (cv, pv);
                        } else {
                            println!("❌ Unknown Pool Owner: {}", owner);
                        }
                    }
                    Err(e) => println!("❌ Error fetching AMM state: {:?}", e),
                }
                thread::sleep(Duration::from_secs(2));
            };

            println!("✅ Vaults Located:\n   Token: {}\n   SOL: {}", coin_vault, pc_vault);

            // 2. Poll Vault Balances
            loop {
                let sol_bal_res = client.get_token_account_balance(&pc_vault);
                let token_bal_res = client.get_token_account_balance(&coin_vault);

                if let (Ok(sol_bal), Ok(token_bal)) = (sol_bal_res, token_bal_res) {
                    let current_sol = sol_bal.amount.parse::<u64>().unwrap_or(0);
                    let current_token = token_bal.amount.parse::<u64>().unwrap_or(0);
                    let prev_sol = last_sol_reserves.load(Ordering::Relaxed);

                    let price = if current_token > 0 { current_sol as f64 / current_token as f64 } else { 0.0 };
                    
                    if prev_sol != 0 && current_sol != prev_sol {
                        if current_sol > prev_sol {
                            let sol_in = current_sol - prev_sol;
                            println!("🟢 [BUY] +{:.6} SOL | Pool SOL: {:.2}", sol_in as f64 / 1e9, current_sol as f64 / 1e9);
                            on_buy(sol_in, AmmState { sol_reserves: current_sol, token_reserves: current_token });
                        } else {
                            let sol_out = prev_sol - current_sol;
                            println!("🔴 [SELL] -{:.6} SOL | Pool SOL: {:.2}", sol_out as f64 / 1e9, current_sol as f64 / 1e9);
                        }
                    }
                    last_sol_reserves.store(current_sol, Ordering::Relaxed);
                }
                thread::sleep(Duration::from_millis(1000));
            }
        });
    }
}