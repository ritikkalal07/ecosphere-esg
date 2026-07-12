# 🌿 EcoSphere — Gamified Corporate ESG Management Platform

**EcoSphere** is a premium, light-themed, enterprise-grade ESG (Environmental, Social, Governance) Management and Gamification Platform built for the **Odoo Hackathon '26** submission. 

It is designed to run entirely on serverless architectures (**Vercel Hobby Plan + Supabase Free Tier**) using Next.js 15 App Router, TypeScript, Tailwind CSS, and Recharts.

---

## 🎨 Premium SaaS User Experience

EcoSphere features a Dribbble/Behance-inspired light interface built around clean layouts, soft drop shadows, and high contrast typography. 

To make hackathon evaluation seamless, the top header includes a **Dynamic Role Indicator Badge** which automatically updates based on the logged-in user:
* ⚙️ **System Admin** — Access to global ESG weighting sliders, department hierarchies, categories, emission factors, and challenges.
* 📈 **ESG Manager** — Access to CSR approval queues, challenge verification, and compliance audit action-items.
* 👤 **Employee Panel** — Access to carbon logging, active challenges, badge milestones, and the points reward catalog.

---

## 🚀 Step-by-Step Setup Guide

Follow these steps to get EcoSphere running in production or locally in less than 5 minutes:

### Step 1: Create a Supabase Project
1. Create a free project at [Supabase](https://supabase.com).
2. Go to **Project Settings -> API** and copy:
   - **Project URL**
   - **Anon Key**
   - **Service Role Key** (Keep this safe! It is only used server-side in API routes)

### Step 2: Set Up Database Schema & Demo Seed Data
Run the following migration scripts in order inside the **Supabase SQL Editor**:
1. [001_schema.sql](file:///c:/Pipe%20Line/ESG/ecosphere/supabase/migrations/001_schema.sql) — Generates all core tables for profiles, departments, activity logs, compliance audits, badges, and rewards.
2. [002_views.sql](file:///c:/Pipe%20Line/ESG/ecosphere/supabase/migrations/002_views.sql) — Sets up live views (`v_overdue_compliance_issues` and `v_department_scores`) for dynamic calculation of overdue tasks and ESG points.
3. [003_triggers.sql](file:///c:/Pipe%20Line/ESG/ecosphere/supabase/migrations/003_triggers.sql) — Configures automated DB functions (auto carbon calculation, badge awards, points balance adjustments, and atomic point redemptions).
4. [004_rls.sql](file:///c:/Pipe%20Line/ESG/ecosphere/supabase/migrations/004_rls.sql) — Configures Row Level Security to protect resources based on user roles (`employee`, `manager`, `admin`).
5. [005_seed_data.sql](file:///c:/Pipe%20Line/ESG/ecosphere/supabase/migrations/005_seed_data.sql) — Populates your database with rich historic carbon transactions, active challenges, goals, audits, and department logs to fill all charts instantly!

### Step 3: Create Storage Bucket for Uploads
1. Go to the **Supabase Storage** dashboard.
2. Create a new bucket named **`proofs`**.
3. Set the bucket privacy toggle to **Public**.

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

---

## 🌿 Technical Specifications & Workflows

* **Environmental Pillar**: Employee logs transportation/utility data. Postgres trigger retrieves active emission factors, computes carbon equivalents, and logs transactions. Recharts renders trend comparisons.
* **Social Pillar**: CSR volunteer organization and manager verification queue with public upload verification.
* **Governance Pillar**: Policy acknowledgements and auditing system with live overdue issue warning alerts (`due_date < current_date`).
* **Gamification & Rewards**: Badges are unlocked automatically via trigger on target milestones. The Point-Store features **atomic check-and-decrement validation** (`redeem_reward()`) to prevent double-spending.
* **Reports Dashboard**: Interactive ESG Summary panel reading live weights from organizational parameters. Built-in tabular CSV exporters.
