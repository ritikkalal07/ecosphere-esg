'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AcknowledgementsPage() {
  const [policies, setPolicies] = useState<any[]>([])
  const [acks, setAcks] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [ackStats, setAckStats] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const [{ data: p }, { data: myAcks }, { data: prof }] = await Promise.all([
        supabase.from('esg_policies').select('*').eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('policy_acknowledgements').select('*').eq('employee_id', user.id),
        supabase.from('profiles').select('role').eq('id', user.id).single(),
      ])
      setPolicies(p || [])
      setAcks(myAcks || [])
      setProfile(prof)

      if (prof?.role === 'admin' || prof?.role === 'manager') {
        const { data: allAcks } = await supabase.from('policy_acknowledgements').select('policy_id')
        const { data: employees } = await supabase.from('profiles').select('id').eq('role', 'employee')
        const empCount = employees?.length || 0
        const countByPolicy: Record<string, number> = {}
        allAcks?.forEach(a => { countByPolicy[a.policy_id] = (countByPolicy[a.policy_id] || 0) + 1 })
        setAckStats((p || []).map((pol: any) => ({
          id: pol.id, title: pol.title,
          acked: countByPolicy[pol.id] || 0, total: empCount,
          rate: empCount > 0 ? Math.round(((countByPolicy[pol.id] || 0) / empCount) * 100) : 0
        })))
      }
      setLoading(false)
    }
    load()
  }, [])

  async function acknowledge(policyId: string) {
    if (!userId) return
    await supabase.from('policy_acknowledgements').insert({ policy_id: policyId, employee_id: userId })
    const { data: myAcks } = await supabase.from('policy_acknowledgements').select('*').eq('employee_id', userId)
    setAcks(myAcks || [])
  }

  const isAcked = (policyId: string) => acks.some(a => a.policy_id === policyId)
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-violet-400" /></div>

  return (
    <div className="space-y-6 fade-in">
      <div><h1 className="text-lg font-bold text-white">Policy Acknowledgements</h1>
        <p className="text-xs text-gray-500 mt-0.5">Review and acknowledge active ESG policies</p></div>

      {isAdmin && ackStats.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acknowledgement Stats (Admin View)</div>
          <table className="w-full">
            <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['Policy', 'Acknowledged', 'Total Employees', 'Rate'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {ackStats.map(s => (
                <tr key={s.id} className="border-t border-white/5">
                  <td className="px-4 py-3 text-sm text-white">{s.title}</td>
                  <td className="px-4 py-3 text-sm text-emerald-400">{s.acked}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{s.total}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="progress-bar w-20"><div className="progress-bar-fill" style={{ width: `${s.rate}%`, background: '#8b5cf6' }} /></div>
                      <span className="text-xs text-gray-400">{s.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-3">
        {policies.map(pol => {
          const acked = isAcked(pol.id)
          return (
            <div key={pol.id} className="glass-card p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-white">{pol.title}</div>
                  <span className="text-[10px] text-gray-500 font-mono">v{pol.version}</span>
                  <span className="text-[10px] text-gray-500 px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>{pol.category}</span>
                </div>
                {pol.description && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{pol.description}</p>}
              </div>
              <div className="shrink-0">
                {acked ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                    <CheckCircle size={16} /> Acknowledged
                  </div>
                ) : (
                  <button id={`ack-${pol.id}`} onClick={() => acknowledge(pol.id)} className="btn-primary text-xs py-2 px-4">
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {policies.length === 0 && (
          <div className="glass-card p-10 text-center text-gray-500 text-sm">No active policies to acknowledge.</div>
        )}
      </div>
    </div>
  )
}
