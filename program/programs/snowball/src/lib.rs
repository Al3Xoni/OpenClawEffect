use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

// UPDATE THIS ID BEFORE DEPLOY
declare_id!("HFn2E5EV2MyUw42n2ZENx8btzeKBeQ9aDyo9GRQQ9ebs");

const SNOW_DECIMALS: u64 = 1_000_000; 
const SNOW_PUSH_COST: u64 = 1_000 * SNOW_DECIMALS;
const ROUND_DURATION: i64 = 180;
const GAME_SEED: &[u8] = b"game_v4";

#[program]
pub mod snowball {
    use super::*;

    pub fn initialize_game(ctx: Context<InitializeGame>) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        let clock = Clock::get()?;
        
        game_state.is_active = true;
        game_state.round_number = 1;
        game_state.timer_end_timestamp = clock.unix_timestamp + ROUND_DURATION;
        game_state.snow_collected = 0;
        game_state.pot_balance_sol = 0;
        game_state.push_count = 0;
        game_state.authority = ctx.accounts.authority.key();
        game_state.liquidity_manager = ctx.accounts.authority.key(); 
        game_state.last_pushers = Vec::new();
        Ok(())
    }

    pub fn push_ball(ctx: Context<PushBall>) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        let clock = Clock::get()?;

        require!(game_state.is_active, GameError::GameNotActive);
        require!(
            clock.unix_timestamp < game_state.timer_end_timestamp,
            GameError::RoundEnded
        );

        let cpi_accounts = Transfer {
            from: ctx.accounts.user_snow_account.to_account_info(),
            to: ctx.accounts.game_snow_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, SNOW_PUSH_COST)?;

        game_state.snow_collected = game_state.snow_collected
            .checked_add(SNOW_PUSH_COST)
            .ok_or(GameError::MathOverflow)?;
            
        game_state.push_count += 1;
        game_state.timer_end_timestamp = clock.unix_timestamp + ROUND_DURATION;

        game_state.last_pushers.push(ctx.accounts.user.key());
        if game_state.last_pushers.len() > 3 {
            game_state.last_pushers.remove(0);
        }
        Ok(())
    }

    pub fn set_liquidity_manager(ctx: Context<SetLiquidityManager>, new_manager: Pubkey) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        game_state.liquidity_manager = new_manager;
        Ok(())
    }

    pub fn deposit_sol_pot(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.authority.key(),
            &game_state.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.authority.to_account_info(),
                game_state.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        game_state.pot_balance_sol += amount;
        Ok(())
    }

    pub fn withdraw_snow_for_swap(ctx: Context<WithdrawSnow>, amount: u64) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        
        require!(
            ctx.accounts.authority.key() == game_state.liquidity_manager, 
            GameError::Unauthorized
        );
        
        let seeds = &[GAME_SEED.as_ref(), &[ctx.bumps.game_state]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.game_snow_vault.to_account_info(),
            to: ctx.accounts.manager_snow_account.to_account_info(),
            authority: game_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, amount)?;
        
        game_state.snow_collected = game_state.snow_collected.saturating_sub(amount);
        Ok(())
    }

    pub fn resolve_round(ctx: Context<ResolveRound>) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        let clock = Clock::get()?;

        require!(game_state.is_active, GameError::GameNotActive);
        require!(
            clock.unix_timestamp >= game_state.timer_end_timestamp,
            GameError::RoundStillActive
        );

        let total_pot = game_state.pot_balance_sol;
        
        if total_pot > 0 {
             **game_state.to_account_info().try_borrow_mut_lamports()? -= total_pot;
             **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += total_pot;
        }

        game_state.pot_balance_sol = 0;
        game_state.is_active = false;
        Ok(())
    }

    pub fn reset_game(ctx: Context<ResetGame>) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        let clock = Clock::get()?;

        game_state.is_active = true;
        game_state.timer_end_timestamp = clock.unix_timestamp + ROUND_DURATION;
        game_state.push_count = 0;
        game_state.last_pushers = Vec::new();
        Ok(())
    }
}

#[account]
pub struct GameState {
    pub is_active: bool,
    pub round_number: u64,
    pub timer_end_timestamp: i64,
    pub snow_collected: u64,
    pub pot_balance_sol: u64,
    pub last_pushers: Vec<Pubkey>,
    pub push_count: u64,
    pub authority: Pubkey,
    pub liquidity_manager: Pubkey,
}

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(
        init, 
        payer = authority, 
        space = 8 + 1 + 8 + 8 + 8 + 8 + (4 + 32 * 3) + 8 + 32 + 32,
        seeds = [GAME_SEED], 
        bump
    )]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PushBall<'info> {
    #[account(mut, seeds = [GAME_SEED], bump)]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_snow_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub game_snow_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(mut, seeds = [GAME_SEED], bump)]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetLiquidityManager<'info> {
    #[account(mut, seeds = [GAME_SEED], bump)]
    pub game_state: Account<'info, GameState>,
    #[account(
        mut, 
        constraint = authority.key() == game_state.authority @ GameError::Unauthorized
    )]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawSnow<'info> {
    #[account(mut, seeds = [GAME_SEED], bump)]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub game_snow_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub manager_snow_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ResolveRound<'info> {
    #[account(mut, seeds = [GAME_SEED], bump)]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResetGame<'info> {
    #[account(mut, seeds = [GAME_SEED], bump)]
    pub game_state: Account<'info, GameState>,
    #[account(
        mut,
        constraint = authority.key() == game_state.authority @ GameError::Unauthorized
    )]
    pub authority: Signer<'info>,
}

#[error_code]
pub enum GameError {
    #[msg("ErrActive")]
    GameNotActive,
    #[msg("ErrEnded")]
    RoundEnded,
    #[msg("ErrOvrflw")]
    MathOverflow,
    #[msg("ErrActive")]
    RoundStillActive,
    #[msg("ErrAuth")]
    Unauthorized,
}