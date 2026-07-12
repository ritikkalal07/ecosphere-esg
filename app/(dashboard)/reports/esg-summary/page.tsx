'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

function exportCSV(data: any[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click()
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899']

export default function ESGSummaryReport() {
  const [scores, setScores] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: org }] = await Promise.all([
        supabase.from('v_department_scores').select('*').order('total_score', { ascending: false }),
        supabase.from('org_settings').select('*').single(),
      ])
      setScores(s || [])
      setSettings(org)
      setLoading(false)
    }
    load()
  }, [])

  const overall = scores.length > 0
    ? (scores.reduce((a, d) => a + d.total_score, 0) / scores.length).toFixed(1)
    : '0'

  const exportData = scores.map(d => ({
    department: d.department_name,
    environmental_score: d.environmental_score,
    social_score: d.social_score,
    governance_score: d.governance_score,
    total_score: d.total_score,
  }))

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">ESG Summary Report</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Overall Score: <strong className="text-emerald-400">{overall}/100</strong> ·
            Weights: {settings?.env_weight}% E · {settings?.social_weight}% S · {settings?.gov_weight}% G
          </p>
        </div>
        <button id="export-esg-summary-csv" onClick={() => exportCSV(exportData, `esg-summary-${new Date().toISOString().slice(0,10)}.csv`)}
          className="btn-secondary flex items-center gap-2"><Download size={14} /> Export CSV</button>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Department ESG Scores (Total Score)</h2>
        {scores.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">No department data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={scores} margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="department_name" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e4e7ec' }}
                formatter={(v: number) => [`${v.toFixed(1)}`, 'Total Score']} />
              <Bar dataKey="total_score" radius={[6, 6, 0, 0]}>
                {scores.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}>
            {['Dept', 'Environmental', 'Social', 'Governance', 'Total Score'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {scores.map((d, i) => (
              <tr key={d.department_id} className="border-t border-white/5 table-row-hover">
                <td className="px-4 py-3 text-sm font-medium text-white">{d.department_name}</td>
                {[
                  { val: d.environmental_score, color: '#10b981' },
                  { val: d.social_score, color: '#3b82f6' },
                  { val: d.governance_score, color: '#8b5cf6' },
                ].map(({ val, color }, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="progress-bar w-16"><div className="progress-bar-fill" style={{ width: `${val}%`, background: color }} /></div>
                      <span className="text-xs text-gray-400 w-8">{val.toFixed(0)}</span>
                    </div>
                  </td>
                ))}
                <td className="px-4 py-3 text-sm font-bold" style={{ color: COLORS[i % COLORS.length] }}>{d.total_score.toFixed(1)}</td>
              </tr>
            ))}
            {scores.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-sm">No department score data yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
