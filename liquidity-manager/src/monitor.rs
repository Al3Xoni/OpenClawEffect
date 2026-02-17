use solana_client::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;
use std::time::Duration;
use crate::pump_interface::BondingCurveAccount;
use borsh::BorshDeserialize;

pub struct Monitor {
    pub rpc_url: String,
    pub wss_url: String,
    pub curve_address: Pubkey,
    pub last_virtual_sol: Arc<AtomicU64>,
}

impl Monitor {
    pub fn new(rpc_url: String, wss_url: String, curve_address: Pubkey) -> Self {
        Self {
            rpc_url,
            wss_url,
            curve_address,
            last_virtual_sol: Arc::new(AtomicU64::new(0)),
        }
    }

    pub fn start_monitoring<F>(&self, on_buy: F) 
    where F: Fn(u64, BondingCurveAccount) + Send + Sync + 'static 
    {
        let rpc_url = self.rpc_url.clone();
        let curve_address = self.curve_address;
        let last_virtual_sol = self.last_virtual_sol.clone();

        thread::spawn(move || {
            println!("👀 Starting Monitor (Polling Mode) on {}", curve_address);
            let client = RpcClient::new(rpc_url);

            loop {
                match client.get_account_data(&curve_address) {
                    Ok(data) => {
                        if data.is_empty() {
                            println!("⚠️ [MONITOR] Warning: Account data is EMPTY.");
                        } else if data.len() <= 8 {
                            println!("⚠️ [MONITOR] Warning: Data too short.");
                        } else {
                            // Take exactly 41 bytes after the 8-byte discriminator
                            let data_to_deserialize = if data.len() >= 8 + 41 {
                                &data[8..8 + 41]
                            } else {
                                &data[8..]
                            };

                            match BondingCurveAccount::try_from_slice(data_to_deserialize) {
                                Ok(account) => {
                                    let prev_sol = last_virtual_sol.load(Ordering::Relaxed);
                                    
                                    println!("📡 [SCAN] Virtual SOL: {} | MC: {:.2} SOL", 
                                        account.virtual_sol_reserves, 
                                        account.get_market_cap_sol()
                                    );

                                    if prev_sol != 0 && account.virtual_sol_reserves != prev_sol {
                                        if account.virtual_sol_reserves > prev_sol {
                                            let sol_in = account.virtual_sol_reserves - prev_sol;
                                            println!("🟢 [BUY] +{:.6} SOL", sol_in as f64 / 1e9);
                                            on_buy(sol_in, account.clone());
                                        } else {
                                            let sol_out = prev_sol - account.virtual_sol_reserves;
                                            println!("🔴 [SELL] -{:.6} SOL", sol_out as f64 / 1e9);
                                        }
                                    }
                                    last_virtual_sol.store(account.virtual_sol_reserves, Ordering::Relaxed);
                                },
                                Err(e) => println!("❌ [MONITOR] Deserialization Error: {:?}", e),
                            }
                        }
                    },
                    Err(e) => {
                        println!("❌ [MONITOR] RPC CALL FAILED: {:?}", e);
                    }
                }
                thread::sleep(Duration::from_millis(1000));
            }
        });
    }
}