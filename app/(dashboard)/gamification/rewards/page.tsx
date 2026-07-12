'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Gift, Plus, X, ShoppingCart, AlertCircle } from 'lucide-react'
import type { Reward } from '@/lib/types'

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({ name: '', description: '', points_required: '100', stock: '10' })
  const supabase = createClient()

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from('rewards').select('*').eq('status', 'active').order('points_required'),
      supabase.from('profiles').select('role, points_balance').eq('id', user.id).single(),
    ])
    setRewards(r || [])
    setProfile(p)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function redeem(rewardId: string) {
    setRedeeming(rewardId)
    const { data, error } = await supabase.rpc('redeem_reward', {
      p_employee_id: (await supabase.auth.getUser()).data.user?.id,
      p_reward_id: rewardId,
    })
    setRedeeming(null)
    if (data?.success) {
      setMessage({ type: 'success', text: `Redeemed! ${data.points_deducted} points deducted.` })
      await load()
    } else {
      setMessage({ type: 'error', text: data?.error || 'Redemption failed' })
    }
    setTimeout(() => setMessage(null), 4000)
  }

  async function createReward() {
    setSaving(true)
    await supabase.from('rewards').insert({
      name: form.name, description: form.description,
      points_required: parseInt(form.points_required), stock: parseInt(form.stock),
    })
    setShowForm(false)
    setSaving(false)
    await load()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-emerald-400" /></div>

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Rewards Catalog</h1>
          <p className="text-xs text-gray-500 mt-0.5">Your balance: <strong className="text-emerald-400">{profile?.points_balance ?? 0} points</strong></p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add Reward
          </button>
        )}
      </div>

      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${message.type === 'success' ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-red-400 bg-red-400/10 border border-red-400/20'}`}>
          <AlertCircle size={15} /> {message.text}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Add Reward</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs text-gray-400 mb-1.5">Name</label>
                <input type="text" className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Reward name" /></div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Description</label>
                <input type="text" className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-400 mb-1.5">Points Required</label>
                  <input type="number" min="1" className="form-input" value={form.points_required} onChange={e => setForm(f => ({ ...f, points_required: e.target.value }))} /></div>
                <div><label className="block text-xs text-gray-400 mb-1.5">Stock</label>
                  <input type="number" min="0" className="form-input" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={createReward} disabled={saving || !form.name}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Add Reward'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rewards.map(r => {
          const canAfford = (profile?.points_balance ?? 0) >= r.points_required
          const inStock = r.stock > 0
          return (
            <div key={r.id}
              className="glass-card p-5 flex flex-col gap-3"
              style={{ opacity: inStock ? 1 : 0.5 }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
                style={{ background: 'rgba(16,185,129,0.12)' }}>
                <Gift size={24} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{r.name}</div>
                {r.description && <div className="text-xs text-gray-500 mt-0.5">{r.description}</div>}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-lg font-black text-emerald-400">{r.points_required} pts</div>
                <div className="text-xs text-gray-500">{r.stock} left</div>
              </div>
              <button
                id={`redeem-${r.id}`}
                onClick={() => redeem(r.id)}
                disabled={!inStock || !canAfford || redeeming === r.id}
                className="btn-primary flex items-center justify-center gap-2 w-full"
                style={{ opacity: (!inStock || !canAfford) ? 0.5 : 1 }}>
                {redeeming === r.id && <Loader2 size={13} className="animate-spin" />}
                <ShoppingCart size={14} />
                {!inStock ? 'Out of Stock' : !canAfford ? 'Insufficient Points' : 'Redeem'}
              </button>
            </div>
          )
        })}
        {rewards.length === 0 && (
          <div className="col-span-4 glass-card p-10 text-center text-gray-500 text-sm">No rewards in catalog yet.</div>
        )}
      </div>
    </div>
  )
}
