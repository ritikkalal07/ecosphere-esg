-- ============================================================
-- EcoSphere ESG Platform — Migration 005: Rich Demo Seed Data
-- ============================================================

-- 1. SEED DEPARTMENTS
insert into departments (id, name, code, employee_count, status) values
  ('d1111111-1111-1111-1111-111111111111', 'Executive Office', 'EXEC-001', 5, 'active'),
  ('d2222222-2222-2222-2222-222222222222', 'Engineering & IT', 'ENG-002', 45, 'active'),
  ('d3333333-3333-3333-3333-333333333333', 'Human Resources', 'HR-003', 8, 'active'),
  ('d4444444-4444-4444-4444-444444444444', 'Facilities & Ops', 'FAC-004', 20, 'active'),
  ('d5555555-5555-5555-5555-555555555555', 'Marketing & Sales', 'MKT-005', 15, 'active')
on conflict (code) do nothing;

-- 2. SEED EMISSION FACTORS
insert into emission_factors (activity_type, factor_value, unit) values
  ('electricity', 0.453200, 'kWh'),
  ('mileage', 0.178200, 'mile'),
  ('expense', 0.085000, 'USD'),
  ('fleet', 2.310000, 'liter')
on conflict do nothing;

-- 3. SEED CATEGORIES
insert into categories (id, name, type, status) values
  ('c1111111-1111-1111-1111-111111111111', 'Carbon Reduction', 'challenge', 'active'),
  ('c2222222-2222-2222-2222-222222222222', 'Community Volunteer', 'csr_activity', 'active'),
  ('c3333333-3333-3333-3333-333333333333', 'Waste Reduction', 'challenge', 'active'),
  ('c4444444-4444-4444-4444-444444444444', 'Education & Outreach', 'csr_activity', 'active')
on conflict do nothing;

-- 4. SEED CHALLENGES
insert into challenges (id, title, category_id, description, xp, difficulty, evidence_required, status) values
  ('e1111111-1111-1111-1111-111111111111', 'Zero Waste Week', 'c3333333-3333-3333-3333-333333333333', 'Avoid single-use plastics for 7 consecutive days at the office.', 150, 'medium', true, 'active'),
  ('e2222222-2222-2222-2222-222222222222', 'Eco Commuter', 'c1111111-1111-1111-1111-111111111111', 'Walk, cycle, or take public transit to work for 5 days.', 200, 'hard', true, 'active'),
  ('e3333333-3333-3333-3333-333333333333', 'Paperless Champion', 'c3333333-3333-3333-3333-333333333333', 'Audit digital file usage and reduce printing quotas.', 100, 'easy', false, 'active')
on conflict do nothing;

-- 5. SEED BADGES
insert into badges (id, name, description, unlock_metric, unlock_operator, unlock_value, icon) values
  ('b1111111-1111-1111-1111-111111111111', 'Green Pioneer', 'Unlock by reaching 100 XP overall.', 'xp', 'gte', 100, '🌱'),
  ('b2222222-2222-2222-2222-222222222222', 'Sustainability Champion', 'Unlock by reaching 500 XP overall.', 'xp', 'gte', 500, '🏆'),
  ('b3333333-3333-3333-3333-333333333333', 'Challenge Master', 'Complete at least 3 active challenges.', 'completed_challenges', 'gte', 3, '🎓')
on conflict do nothing;

-- 6. SEED REWARDS
insert into rewards (id, name, description, points_required, stock, status) values
  ('r1111111-1111-1111-1111-111111111111', 'Reusable Coffee Mug', 'Eco-friendly bamboo fiber double-wall mug.', 50, 20, 'active'),
  ('r2222222-2222-2222-2222-222222222222', 'Carbon Offset Certificate', 'Offset 1 metric ton of CO2 emissions via reforestation.', 100, 50, 'active'),
  ('r3333333-3333-3333-3333-333333333333', 'Premium Cycle Helmet', 'High-quality commuter cycle safety helmet.', 250, 5, 'active')
on conflict do nothing;

-- 7. SEED ESG POLICIES
insert into esg_policies (id, title, description, category, version, status) values
  ('p1111111-1111-1111-1111-111111111111', 'Office Zero-Waste Directives', 'Guidelines for paper reduction and plastic ban in office cafeterias.', 'Environmental', '1.2', 'active'),
  ('p2222222-2222-2222-2222-222222222222', 'Fair Workplace & Equal Opportunity Policy', 'Human rights guidelines, diversity standards, and grievance channels.', 'Social', '2.0', 'active'),
  ('p3333333-3333-3333-3333-333333333333', 'Anti-Bribery and Corruption Policy', 'Compliance directives, gift reporting quotas, and regulatory audits.', 'Governance', '1.0', 'active')
on conflict do nothing;

-- 8. SEED CSR ACTIVITIES
insert into csr_activities (id, title, category_id, department_id, description, date) values
  ('a1111111-1111-1111-1111-111111111111', 'Urban Reforestation Day', 'c2222222-2222-2222-2222-222222222222', 'd4444444-4444-4444-4444-444444444444', 'Planting 200 saplings in the local city park belt.', current_date - 10),
  ('a2222222-2222-2222-2222-222222222222', 'Community Food Drive', 'c2222222-2222-2222-2222-222222222222', 'd3333333-3333-3333-3333-333333333333', 'Distributing food and utility items to families in need.', current_date - 5)
on conflict do nothing;

-- 9. SEED AUDITS & COMPLIANCE ISSUES
insert into audits (id, title, department_id, date, findings_summary, status) values
  ('u1111111-1111-1111-1111-111111111111', 'Annual Carbon Footprint Audit', 'd4444444-4444-4444-4444-444444444444', current_date - 30, 'Initial review shows fleet logging calculations completed. Paper printing quotas exceeded.', 'closed'),
  ('u2222222-2222-2222-2222-222222222222', 'Workplace Safety Compliance Review', 'd2222222-2222-2222-2222-222222222222', current_date - 5, 'Found 2 server room ventilation compliance issues.', 'open')
on conflict do nothing;

-- 10. SEED HISTORIC CARBON DATA (For immediate chart population)
-- Seed carbon transactions directly mapped to departments
insert into carbon_transactions (id, calculated_co2, source, date, department_id) values
  -- Executive Office (EXEC)
  (gen_random_uuid(), 120.50, 'manual', current_date - 40, 'd1111111-1111-1111-1111-111111111111'),
  (gen_random_uuid(), 95.80, 'manual', current_date - 10, 'd1111111-1111-1111-1111-111111111111'),
  
  -- Engineering (ENG)
  (gen_random_uuid(), 1250.00, 'auto', current_date - 45, 'd2222222-2222-2222-2222-222222222222'),
  (gen_random_uuid(), 1120.00, 'auto', current_date - 20, 'd2222222-2222-2222-2222-222222222222'),
  (gen_random_uuid(), 980.50, 'auto', current_date - 5, 'd2222222-2222-2222-2222-222222222222'),
  
  -- Human Resources (HR)
  (gen_random_uuid(), 85.00, 'auto', current_date - 30, 'd3333333-3333-3333-3333-333333333333'),
  (gen_random_uuid(), 90.20, 'auto', current_date - 8, 'd3333333-3333-3333-3333-333333333333'),

  -- Facilities & Ops (FAC)
  (gen_random_uuid(), 1890.00, 'auto', current_date - 50, 'd4444444-4444-4444-4444-444444444444'),
  (gen_random_uuid(), 2150.00, 'auto', current_date - 25, 'd4444444-4444-4444-4444-444444444444'),
  (gen_random_uuid(), 1740.00, 'auto', current_date - 3, 'd4444444-4444-4444-4444-444444444444'),

  -- Marketing & Sales (MKT)
  (gen_random_uuid(), 310.40, 'manual', current_date - 35, 'd5555555-5555-5555-5555-555555555555'),
  (gen_random_uuid(), 280.90, 'manual', current_date - 12, 'd5555555-5555-5555-5555-555555555555')
on conflict do nothing;

-- 11. SEED ENVIRONMENTAL GOALS FOR DEPARTMENTS
insert into environmental_goals (department_id, metric, target_value, actual_value, deadline, status) values
  ('d2222222-2222-2222-2222-222222222222', 'Reduce Server Energy Consumption (kWh)', 5000.00, 3200.00, current_date + 60, 'active'),
  ('d4444444-4444-4444-4444-444444444444', 'Fleet Fuel Efficiency (Liters)', 1000.00, 1000.00, current_date - 2, 'achieved'),
  ('d5555555-5555-5555-5555-555555555555', 'Marketing Rallies Carpool Rate (%)', 80.00, 45.00, current_date + 15, 'active')
on conflict do nothing;
