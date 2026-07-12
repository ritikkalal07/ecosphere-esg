import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { employee_id, reward_id } = await request.json()
    if (!employee_id || !reward_id) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase.rpc('redeem_reward', {
      p_employee_id: employee_id,
      p_reward_id: reward_id,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
