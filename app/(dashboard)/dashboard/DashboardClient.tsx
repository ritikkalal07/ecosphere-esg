'use client'

import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts'
import { TrendingUp, Leaf, Users, Shield, Trophy, Activity } from 'lucide-react'
import type { DepartmentScore, OrgSettings } from '@/lib/types'

interface Props {
  deptScores: DepartmentScore[]
  orgSettings: OrgSettings | null
  overallScore: number
  recentActivities: any[]
  recentParticipations: any[]
  recentChallenges: any[]
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto">
        <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
          <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * 201} 201`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{score.toFixed(0)}</span>
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-2">{label}</div>
    </div>
  )
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']

export default function DashboardClient({ deptScores, orgSettings, overallScore, recentActivities, recentParticipations, recentChallenges }: Props) {
  const avgEnv = deptScores.length ? Math.round(deptScores.reduce((a, d) => a + d.environmental_score, 0) / deptScores.length) : 0
  const avgSoc = deptScores.length ? Math.round(deptScores.reduce((a, d) => a + d.social_score, 0) / deptScores.length) : 0
  const avgGov = deptScores.length ? Math.round(deptScores.reduce((a, d) => a + d.governance_score, 0) / deptScores.length) : 0

  const recentFeed = [
    ...recentActivities.map(a => ({ type: 'activity', label: `Activity logged: ${a.type} by ${a.departments?.name}`, time: a.created_at })),
    ...recentParticipations.map(p => ({ type: 'participation', label: `${p.profiles?.full_name} joined "${p.csr_activities?.title}"`, time: p.created_at })),
    ...recentChallenges.map(c => ({ type: 'challenge', label: `${c.profiles?.full_name} submitted challenge "${c.challenges?.title}"`, time: c.created_at })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8)

  const scoreColor = overallScore >= 70 ? '#10b981' : overallScore >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="space-y-6 fade-in">
      {/* Top row: Overall ESG score + pillar rings */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Big score */}
        <div className="glass-card p-6 col-span-1 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Overall ESG Score</div>
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 128 128" className="w-32 h-32 -rotate-90">
              <circle cx="64" cy="64" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <circle
                cx="64" cy="64" r="52" fill="none" stroke={scoreColor} strokeWidth="12"
                strokeDasharray={`${(overallScore / 100) * 327} 327`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">{overallScore}</span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Weights: {orgSettings?.env_weight}% E · {orgSettings?.social_weight}% S · {orgSettings?.gov_weight}% G
          </div>
        </div>

        {/* Pillar cards */}
        {[
          { label: 'Environmental', score: avgEnv, icon: Leaf, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Social', score: avgSoc, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Governance', score: avgGov, icon: Shield, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        ].map(({ label, score, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card p-6 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={20} style={{ color }} />
            </div>
            <ScoreRing score={score} label={label} color={color} />
          </div>
        ))}
      </div>

      {/* Department Rankings + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department ranking bar chart */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-emerald-400" />
            <h2 className="font-semibold text-white text-sm">Department Rankings</h2>
          </div>
          {deptScores.length === 0 ? (
            <div className="text-center text-gray-500 py-10 text-sm">No departments yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptScores} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis type="category" dataKey="department_name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={90} />
                <Tooltip
                  contentStyle={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e4e7ec' }}
                  formatter={(v: number) => [`${v.toFixed(1)}`, 'Score']}
                />
                <Bar dataKey="total_score" radius={[0, 6, 6, 0]}>
                  {deptScores.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} className="text-blue-400" />
            <h2 className="font-semibold text-white text-sm">Recent Activity</h2>
          </div>
          <div className="space-y-3 max-h-56 overflow-y-auto">
            {recentFeed.length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm">No recent activity</div>
            ) : (
              recentFeed.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: item.type === 'activity' ? '#10b981' : item.type === 'participation' ? '#3b82f6' : '#f59e0b' }}
                  />
                  <div>
                    <p className="text-xs text-gray-300 leading-relaxed">{item.label}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{new Date(item.time).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Department score table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
          <Trophy size={16} className="text-amber-400" />
          <h2 className="font-semibold text-white text-sm">Department Score Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Rank', 'Department', 'Environmental', 'Social', 'Governance', 'Total'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deptScores.map((d, i) => (
                <tr key={d.department_id} className="border-t border-white/5 table-row-hover">
                  <td className="px-4 py-3 text-sm font-bold" style={{ color: i === 0 ? '#f59e0b' : '#6b7280' }}>#{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-white">{d.department_name}</td>
                  <td className="px-4 py-3"><ScorePill value={d.environmental_score} color="#10b981" /></td>
                  <td className="px-4 py-3"><ScorePill value={d.social_score} color="#3b82f6" /></td>
                  <td className="px-4 py-3"><ScorePill value={d.governance_score} color="#8b5cf6" /></td>
                  <td className="px-4 py-3 text-sm font-bold text-white">{d.total_score.toFixed(1)}</td>
                </tr>
              ))}
              {deptScores.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">No data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ScorePill({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="progress-bar flex-1 max-w-20">
        <div className="progress-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs text-gray-400 w-8">{value.toFixed(0)}</span>
    </div>
  )
}
