import Link from 'next/link'
import { Trophy, Swords, Award, Gift, Crown } from 'lucide-react'

const pages = [
  { href: '/gamification/challenges', icon: Swords, label: 'Challenges', desc: 'Admin/manager: create and manage challenge lifecycle' },
  { href: '/gamification/my-challenges', icon: Trophy, label: 'My Challenges', desc: 'Employee: join challenges and submit proof' },
  { href: '/gamification/badges', icon: Award, label: 'Badges', desc: 'Auto-awarded badges for XP and milestones' },
  { href: '/gamification/rewards', icon: Gift, label: 'Rewards', desc: 'Redeem points for rewards from the catalog' },
  { href: '/gamification/leaderboard', icon: Crown, label: 'Leaderboard', desc: 'Top employees ranked by XP' },
]

export default function GamificationPage() {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy size={22} className="text-amber-400" /> Gamification
        </h1>
        <p className="text-sm text-gray-400 mt-1">Challenges, badges, leaderboards, and rewards to drive ESG engagement</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href} className="glass-card p-5 hover:border-amber-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Icon size={20} className="text-amber-400" />
            </div>
            <div className="font-semibold text-white text-sm group-hover:text-amber-400 transition-colors">{label}</div>
            <div className="text-xs text-gray-500 mt-1">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
