import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client (Service Role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_WALLET = "CCxBFjohSTWpLAtTG7KGJTTnafSibsata4N2JhBftJNx";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wallet, action, durationSeconds } = body;

    // 1. Basic Security Check
    if (wallet !== ADMIN_WALLET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'reset_game') {
      // 2. Create a new Round
      const { data: newRound, error: roundError } = await supabaseAdmin
        .from('rounds')
        .insert([{ status: 'active', total_pot: 0 }])
        .select()
        .single();

      if (roundError) throw roundError;

      // 3. Reset Game State
      // Default to 3 minutes (180s) if not specified
      const timerDuration = durationSeconds || 180;
      const newTimerEnd = new Date(Date.now() + timerDuration * 1000).toISOString();

      const { error: stateError } = await supabaseAdmin
        .from('game_state')
        .update({
          current_round_id: newRound.id,
          timer_end: newTimerEnd,
          push_count: 0,
          last_pushers: [],
          is_paused: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (stateError) throw stateError;

      return NextResponse.json({ 
        success: true, 
        message: `Game Reset! New Round ID: ${newRound.id}`,
        timer_end: newTimerEnd
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Admin Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
