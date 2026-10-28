create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  reference_number text unique not null,
  supermarket text not null check (supermarket in ('quickmart','carrefour','naivas')),
  position text not null,
  position_category text,
  monthly_salary numeric not null,
  allowance_label text,
  allowance_amount text,
  full_name text not null,
  email text not null,
  phone text not null,
  preferred_branch text not null,
  orientation_date date not null,
  orientation_branch text not null,
  id_front_path text,
  id_back_path text,
  cv_path text,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid')),
  payment_phone text,
  mpesa_receipt text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.applications to authenticated;
grant all on public.applications to service_role;

alter table public.applications enable row level security;

create policy "applicants can insert their own application"
  on public.applications for insert to authenticated
  with check (user_id = auth.uid());

create policy "applicants can view their own application"
  on public.applications for select to authenticated
  using (user_id = auth.uid());

create policy "applicants can update their own application"
  on public.applications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Storage policies for the applicant-docs bucket (folder = user id)
create policy "authenticated can upload to own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'applicant-docs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "authenticated can read own folder"
  on storage.objects for select to authenticated
  using (bucket_id = 'applicant-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Demo seed applicants for the presentation
insert into public.applications
  (user_id, reference_number, supermarket, position, position_category, monthly_salary, allowance_label, allowance_amount, full_name, email, phone, preferred_branch, orientation_date, orientation_branch, payment_status, payment_phone, mpesa_receipt, paid_at, created_at)
values
  (null, 'CRF-2026-0031', 'carrefour', 'Driver', 'Logistics', 35000, 'Fuel Allowance', 'KSh 8,000', 'Brian Otieno', 'brian.otieno@example.com', '0712 345 678', 'Two Rivers', '2026-11-09', 'Two Rivers', 'paid', '0712345678', 'QGH7X2M9P1', now() - interval '2 days', now() - interval '3 days'),
  (null, 'QRT-2026-0014', 'quickmart', 'Cashiers', 'Customer Service', 34000, 'Medical Allowance', 'KSh 3,000', 'Faith Wanjiru', 'faith.wanjiru@example.com', '0722 888 410', 'Sarit Centre', '2026-11-10', 'Sarit Centre', 'paid', '0722888410', 'QKR4T8W2Z3', now() - interval '1 day', now() - interval '2 days'),
  (null, 'NVS-2026-0077', 'naivas', 'Sales Attendant', 'Retail', 29000, 'Sales Bonus', 'KSh 1,500', 'Kevin Mutua', 'kevin.mutua@example.com', '0733 210 955', 'Imaara Dhaba', '2026-11-11', 'Imaara Dhaba', 'unpaid', null, null, null, now() - interval '1 day'),
  (null, 'QRT-2026-0015', 'quickmart', 'Guards', 'Security', 31000, 'Night Allowance', 'KSh 3,000', 'Samuel Kirui', 'samuel.kirui@example.com', '0745 663 120', 'Garden City', '2026-11-12', 'Garden City', 'unpaid', null, null, null, now() - interval '5 hours'),
  (null, 'CRF-2026-0032', 'carrefour', 'Store Keepers', 'Inventory', 36000, 'Housing Allowance', 'KSh 5,000', 'Grace Achieng', 'grace.achieng@example.com', '0701 998 244', 'The Junction', '2026-11-12', 'The Junction', 'unpaid', null, null, null, now() - interval '2 hours');