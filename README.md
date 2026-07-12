# EcoSphere — ESG Management Platform

**EcoSphere** is a premium ESG (Environmental, Social, Governance) Management Platform built for the **Odoo Hackathon '26** submission. It is designed to run entirely on free-tier serverless architectures (**Vercel Hobby Plan + Supabase Free Tier**) using Next.js 15 App Router, TypeScript, Tailwind CSS, and Recharts.

---

## 🚀 Step-by-Step Setup Guide

Follow these steps to get EcoSphere running in production or locally in less than 5 minutes:

### Step 1: Create a Supabase Project
1. Go to [Supabase](https://supabase.com) and create a new free project.
2. Retrieve your project connection parameters:
   - **Project URL**
   - **Anon Key**
   - **Service Role Key** (Keep this safe! It is only used server-side in API routes)

### Step 2: Set Up Database Schema & Logic
Run the following migration scripts in order inside the **Supabase SQL Editor**:
1. [001_schema.sql](file:///c:/Pipe%20Line/ESG/ecosphere/supabase/migrations/001_schema.sql) — Generates all tables for profiles, departments, activity logs, goals, compliance audits, badges, and rewards.
2. [002_views.sql](file:///c:/Pipe%20Line/ESG/ecosphere/supabase/migrations/002_views.sql) — Sets up live views (`v_overdue_compliance_issues` and `v_department_scores`) for dynamic calculation of overdue tasks and ESG points.
3. [003_triggers.sql](file:///c:/Pipe%20Line/ESG/ecosphere/supabase/migrations/003_triggers.sql) — Configures automated DB functions (auto carbon calculation, badge awards, points balance adjustments, and atomic point redemptions).
4. [004_rls.sql](file:///c:/Pipe%20Line/ESG/ecosphere/supabase/migrations/004_rls.sql) — Configures Row Level Security to protect resources based on user roles (`employee`, `manager`, `admin`).

### Step 3: Create Storage Bucket for Uploads
1. Go to the **Supabase Storage** dashboard.
2. Create a new bucket named **`proofs`**.
3. Set the bucket privacy toggle to **Public** or define appropriate RLS policies for authenticated read/write access.

### Step 4: Configure Local Environment Variables
Create a file named `.env.local` in the root of your `ecosphere/` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 5: Install & Run
Run the following commands in your shell:
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your dashboard!

### Step 6: Deploy to Vercel
1. Push your repository to GitHub.
2. Link your GitHub repo to [Vercel](https://vercel.com).
3. Add the exact environment variables from Step 4 into the Vercel project settings dashboard.
4. Click **Deploy** — Vercel will build the optimized production build and host the platform dynamically.

---

## 🌿 Module Mappings

- **Environmental**: Activity logs, auto emissions triggers, and monthly carbon trend charts.
- **Social**: CSR events organization, manager approval queues, and proof file uploads.
- **Governance**: Policy acknowledgement tracking, compliance issue logs, and automated live overdue warnings.
- **Gamification**: Milestone-based auto badge distribution, points shop catalog with atomic double-spend prevention, and global XP leaderboard.
- **Reports**: Pillar analytics feeds and CSV exporters.

---

## 🔒 Row-Level Security Matrix

| Table | Employee | Manager | Admin |
|---|---|---|---|
| Own Profiles / Activity Logs | Read / Write | Read / Write | Full |
| Department Aggregate Scores | Read | Read / Write (Dept) | Full |
| System Configuration | Read | Read | Full |
| Submissions / Approvals | View Own | Approve (Dept) | Full |
