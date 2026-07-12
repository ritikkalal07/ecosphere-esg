'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

export default function EnvironmentalDashboard() {
  const [trendData, setTrendData] = useState<any[]>([])
  const [deptData, setDeptData] = useState<any[]>([])
  const [goalSummary, setGoalSummary] = useState({ total: 0, achieved: 0, active: 0, missed: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      // Trend data: group carbon transactions by month
      const { data: txns } = await supabase
        .from('carbon_transactions')
        .select('date, calculated_co2')
        .order('date')

      if (txns) {
        const byMonth: Record<string, number> = {}
        txns.forEach(t => {
          const month = t.date.slice(0, 7)
          byMonth[month] = (byMonth[month] || 0) + Number(t.calculated_co2)
        })
        setTrendData(Object.entries(byMonth).map(([month, co2]) => ({
          month, co2: parseFloat(co2.toFixed(2))
        })))
      }

      // Dept breakdown
      const { data: depts } = await supabase
        .from('carbon_transactions')
        .select('department_id, calculated_co2, departments(name)')

      if (depts) {
        const byDept: Record<string, { name: string; co2: number }> = {}
        depts.forEach((d: any) => {
          const id = d.department_id
          if (!byDept[id]) byDept[id] = { name: d.departments?.name || id, co2: 0 }
          byDept[id].co2 += Number(d.calculated_co2)
        })
        setDeptData(Object.values(byDept).map(d => ({ ...d, co2: parseFloat(d.co2.toFixed(2)) })))
      }

      // Goals summary
      const { data: goals } = await supabase.from('environmental_goals').select('status')
      if (goals) {
        setGoalSummary({
          total: goals.length,
          achieved: goals.filter(g => g.status === 'achieved').length,
          active: goals.filter(g => g.status === 'active').length,
          missed: goals.filter(g => g.status === 'missed').length,
        })
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-emerald-400" /></div>

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-lg font-bold text-white">Environmental Dashboard</h1>
        <p className="text-xs text-gray-500 mt-0.5">Emissions trends and department breakdown</p>
      </div>

      {/* Goal summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Goals', value: goalSummary.total, color: '#9ca3af' },
          { label: 'Achieved', value: goalSummary.achieved, color: '#10b981' },
          { label: 'Active', value: goalSummary.active, color: '#f59e0b' },
          { label: 'Missed', value: goalSummary.missed, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-4 text-center">
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Trend Line chart */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Emissions Trend (kg CO₂e by Month)</h2>
        {trendData.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">No emission data yet — log some activities first.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e4e7ec' }}
                formatter={(v: any) => [`${v} kg CO₂e`, 'Emissions']} />
              <Line type="monotone" dataKey="co2" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per-Department Bar Chart */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Total Emissions by Department (kg CO₂e)</h2>
        {deptData.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">No department data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e4e7ec' }}
                formatter={(v: any) => [`${v} kg CO₂e`, 'Emissions']} />
              <Bar dataKey="co2" radius={[6,6,0,0]}>
                {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
