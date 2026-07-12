'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Crown, Medal, Award } from 'lucide-react'

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [deptFilter, setDeptFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
      const { data: depts } = await supabase.from('departments').select('id,name').eq('status', 'active')
      setDepartments(depts || [])
    }
    init()
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase.from('profiles')
        .select('id, full_name, xp_total, points_balance, role, departments(name)')
        .order('xp_total', { ascending: false })
        .limit(50)
      if (deptFilter) q = q.eq('department_id', deptFilter)
      const { data } = await q
      setLeaders(data || [])
      setLoading(false)
    }
    load()
  }, [deptFilter])

  const rankIcon = (i: number) => {
    if (i === 0) return <Crown size={18} className="text-amber-400" />
    if (i === 1) return <Medal size={18} className="text-gray-300" />
    if (i === 2) return <Award size={18} className="text-amber-600" />
    return <span className="text-gray-500 text-sm font-bold">#{i + 1}</span>
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Leaderboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Employees ranked by total XP earned</p>
        </div>
        <select className="form-input" style={{ width: 200 }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-amber-400" /></div>
      ) : (
        <div className="space-y-3">
          {/* Top 3 podium */}
          {leaders.slice(0, 3).length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {leaders.slice(0, 3).map((l, i) => (
                <div key={l.id}
                  className="glass-card p-5 text-center"
                  style={{
                    order: i === 0 ? 2 : i === 1 ? 1 : 3,
                    background: i === 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
                    border: i === 0 ? '1px solid rgba(245,158,11,0.2)' : undefined,
                    transform: i === 0 ? 'none' : 'scale(0.96)',
                  }}>
                  <div className="flex justify-center mb-2">{rankIcon(i)}</div>
                  <div className="text-sm font-bold text-white">{l.full_name}</div>
                  <div className="text-xs text-gray-400">{l.departments?.name}</div>
                  <div className="text-2xl font-black mt-2" style={{ color: i === 0 ? '#f59e0b' : '#e4e7ec' }}>{l.xp_total}</div>
                  <div className="text-[10px] text-gray-500">XP</div>
                </div>
              ))}
            </div>
          )}

          {/* Full list */}
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Rank', 'Employee', 'Department', 'XP', 'Points Balance'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaders.map((l, i) => (
                  <tr key={l.id}
                    className="border-t border-white/5 table-row-hover"
                    style={{ background: l.id === currentUserId ? 'rgba(16,185,129,0.05)' : undefined }}>
                    <td className="px-4 py-3 w-12">{rankIcon(i)}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-white">{l.full_name}
                        {l.id === currentUserId && <span className="ml-2 text-[10px] text-emerald-400 font-semibold">(You)</span>}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{l.role}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{l.departments?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-bold text-amber-400">{l.xp_total}</td>
                    <td className="px-4 py-3 text-sm text-emerald-400">{l.points_balance} pts</td>
                  </tr>
                ))}
                {leaders.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-sm">No employees found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
