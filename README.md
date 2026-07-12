# ecosphere-esg

**EcoSphere** — ESG Management Platform built for Odoo Hackathon '26.

## Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Hosting**: Vercel Free (Hobby)
- **Database / Auth / Storage**: Supabase (Postgres, Auth, Storage)
- **Styling**: Tailwind CSS
- **Charts**: Recharts

## Features
- 🌿 **Environmental**: Activity logging, auto carbon calculation (Postgres trigger), goals tracking, emissions dashboard
- 👥 **Social**: CSR activities, participation + proof upload, manager approval queue, points system
- 🛡️ **Governance**: Policy management & acknowledgements, audits, compliance issues with live overdue detection
- 🏆 **Gamification**: Challenges lifecycle, badge auto-award (Postgres trigger), rewards redemption (atomic DB function), leaderboard
- 📊 **Reports**: 4 ESG reports with filters + CSV export, org dashboard with weighted ESG score
- ⚙️ **Settings**: Department hierarchy, ESG weight config, notification toggles

## How to run locally

```bash
npm install
# Create .env.local with your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
npm run dev
```

## Database setup

Apply migrations in order via Supabase SQL Editor:
1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_views.sql`
3. `supabase/migrations/003_triggers.sql`
4. `supabase/migrations/004_rls.sql`

## Live Demo
Deployed on Vercel: _link here after deployment_
