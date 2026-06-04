create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  action text not null,
  meta jsonb default '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_user_id on audit_logs (user_id);
create index idx_audit_logs_created_at on audit_logs (created_at);

alter table audit_logs enable row level security;

create policy "service_role_all_audit_logs"
  on audit_logs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists input_validation_rules (
  id uuid primary key default gen_random_uuid(),
  field_name text not null,
  rule_type text not null,
  pattern text,
  min_length int,
  max_length int,
  created_at timestamptz not null default now()
);

alter table input_validation_rules enable row level security;

create policy "service_role_all_input_validation_rules"
  on input_validation_rules
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
