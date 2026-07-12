'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

export default function SocialDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [deptData, setDeptData] = useState<any[]>([])
  const [ackStats, setAckStats] = useState({ total: 0, acked: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: parts }, { data: profiles }, { data: policies }, { data: acks }] = await Promise.all([
        supabase.from('employee_participations').select('approval_status, csr_activities(department_id, departments(name))'),
        supabase.from('profiles').select('department_id, departments(name)').eq('role', 'employee'),
        supabase.from('esg_policies').select('id').eq('status', 'active'),
        supabase.from('policy_acknowledgements').select('id'),
      ])

      const total = parts?.length || 0
      const approved = parts?.filter(p => p.approval_status === 'approved').length || 0
      const rate = total > 0 ? Math.round((approved / total) * 100) : 0
      setStats({ total, approved, rate, employees: profiles?.length || 0 })

      // Dept breakdown
      const byDept: Record<string, { name: string; approved: number; total: number }> = {}
      parts?.forEach((p: any) => {
        const deptId = p.csr_activities?.department_id
        const deptName = p.csr_activities?.departments?.name || 'Unknown'
        if (deptId) {
          if (!byDept[deptId]) byDept[deptId] = { name: deptName, approved: 0, total: 0 }
          byDept[deptId].total++
          if (p.approval_status === 'approved') byDept[deptId].approved++
        }
      })
      setDeptData(Object.values(byDept).map(d => ({
        name: d.name, rate: d.total > 0 ? Math.round((d.approved / d.total) * 100) : 0, total: d.total
      })))

      const policyCount = policies?.length || 0
      const ackCount = acks?.length || 0
      const employeeCount = profiles?.length || 0
      setAckStats({ total: policyCount * employeeCount, acked: ackCount })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-blue-400" /></div>

  const ackRate = stats?.total > 0 ? Math.round((ackStats.acked / Math.max(ackStats.total, 1)) * 100) : 0

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-lg font-bold text-white">Social Dashboard</h1>
        <p className="text-xs text-gray-500 mt-0.5">Participation rates, engagement, and policy acknowledgements</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Employees', value: stats?.employees, color: '#9ca3af' },
          { label: 'Total Participations', value: stats?.total, color: '#60a5fa' },
          { label: 'Approved', value: stats?.approved, color: '#10b981' },
          { label: 'Participation Rate', value: `${stats?.rate}%`, color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-4 text-center">
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Participation Rate by Department</h2>
          {deptData.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No participation data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e4e7ec' }}
                  formatter={(v: number) => [`${v}%`, 'Approval Rate']} />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Policy Acknowledgement Rate</h2>
          <div className="flex flex-col items-center justify-center h-40 gap-4">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 112 112" className="w-28 h-28 -rotate-90">
                <circle cx="56" cy="56" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle cx="56" cy="56" r="44" fill="none" stroke="#8b5cf6" strokeWidth="10"
                  strokeDasharray={`${(ackRate / 100) * 276} 276`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{ackRate}%</span>
              </div>
            </div>
            <div className="text-xs text-gray-400">{ackStats.acked} of {ackStats.total} acknowledgements completed</div>
          </div>
        </div>
      </div>
    </div>
  )
}
