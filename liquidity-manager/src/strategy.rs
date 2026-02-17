use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct StrategyConfig {
    pub step1_mc: f64, // 50k
    pub step1_pct: f64, // 10%
    pub step2_mc: f64, // 100k
    pub step2_pct: f64, // 15%
    pub step3_mc: f64, // 500k
    pub step3_pct: f64, // 25%
}

impl Default for StrategyConfig {
    fn default() -> Self {
        Self {
            step1_mc: 500.0,   // 500 SOL MC (~$50k @ $100/SOL)
            step1_pct: 0.10,  // 10%
            step2_mc: 1000.0,  // 1000 SOL MC (~$100k)
            step2_pct: 0.15,  // 15%
            step3_mc: 5000.0,  // 5000 SOL MC (~$500k)
            step3_pct: 0.25,  // 25%
        }
    }
}

pub fn calculate_sell_amount(
    sol_in: u64,
    current_market_cap_sol: f64,
    price_sol: f64,
    config: &StrategyConfig
) -> u64 {
    // 1. Determine Dump Ratio based on Stepped Rules
    let ratio = if current_market_cap_sol < config.step1_mc {
        config.step1_pct // 10% below 50k
    } else if current_market_cap_sol < config.step2_mc {
        config.step1_pct // 10% between 50k-100k
    } else if current_market_cap_sol < config.step3_mc {
        config.step2_pct // 15% between 100k-500k
    } else {
        config.step3_pct // 25% above 500k
    };

    // 2. Calculate Target SOL to extract
    let sol_to_extract = (sol_in as f64 * ratio) as u64;

    // 3. Convert to Token Amount (SNOW)
    if price_sol == 0.0 { return 0; }
    
    let tokens_to_sell = (sol_to_extract as f64 / price_sol) as u64;
    
    println!("--- Swap Calculation ---");
    println!("MC: {:.2} SOL | Ratio: {:.0}%", current_market_cap_sol, ratio * 100.0);
    println!("In: {:.4} SOL | Out (Target): {:.4} SOL ({} SNOW)", 
        sol_in as f64 / 1e9, 
        sol_to_extract as f64 / 1e9,
        tokens_to_sell
    );

    tokens_to_sell
}
