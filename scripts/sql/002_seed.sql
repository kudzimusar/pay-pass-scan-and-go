-- Seed demo data (idempotent)

-- Demo operator
insert into operators (id, company_name, phone, email, pin_hash)
values (
  '00000000-0000-0000-0000-000000000111',
  'Demo Bus Co.',
  '+263771111111',
  'operator@demo.com',
  '$2a$10$uE4c0e2CwVdO3GgciJzJ2eR8yq1m7p1G6qS0m3u2h3lJ2b0Y3QF5W' -- 1234
)
on conflict (phone) do nothing;

-- Demo routes
insert into routes (id, operator_id, name, description, fare_usd, fare_zwl, qr_code)
values
  ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000111', 'Route A - CBD to Avondale', 'Express commuter bus', 1.00, 15.00, 'PP_DEMO_ROUTE_A'),
  ('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000111', 'Route B - CBD to Borrowdale', 'Regular service', 1.50, 22.50, 'PP_DEMO_ROUTE_B')
on conflict (qr_code) do nothing;

-- Demo users
insert into users (id, full_name, phone, email, pin_hash, biometric_enabled)
values
  ('00000000-0000-0000-0000-000000000311', 'Tendai Moyo', '+263772222222', 'tendai@example.com', '$2a$10$uE4c0e2CwVdO3GgciJzJ2eR8yq1m7p1G6qS0m3u2h3lJ2b0Y3QF5W', false),
  ('00000000-0000-0000-0000-000000000312', 'Rudo Chikafu', '+263773333333', 'rudo@example.com', '$2a$10$uE4c0e2CwVdO3GgciJzJ2eR8yq1m7p1G6qS0m3u2h3lJ2b0Y3QF5W', true)
on conflict (phone) do nothing;

-- Wallets (ensure)
insert into wallets (user_id, usd_balance, zwl_balance)
values
  ('00000000-0000-0000-0000-000000000311', 14.00, 50.00),
  ('00000000-0000-0000-0000-000000000312', 3.50, 50.00)
on conflict (user_id) do nothing;

-- Transactions with references to keep idempotent
insert into transactions (id, user_id, operator_id, route_id, type, category, amount, currency, description, status, payment_method, reference, created_at)
values
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000211', 'payment', 'bus', 1.00, 'USD', 'Bus fare - Route A - CBD to Avondale', 'completed', 'wallet', 'seed-tendai-pay-a', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000412', '00000000-0000-0000-0000-000000000311', null, null, 'topup', 'transfer', 10.00, 'USD', 'Top-up via EcoCash', 'completed', 'EcoCash', 'seed-tendai-topup', now() - interval '23 hours'),
  ('00000000-0000-0000-0000-000000000413', '00000000-0000-0000-0000-000000000312', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000212', 'payment', 'bus', 1.50, 'USD', 'Bus fare - Route B - CBD to Borrowdale', 'completed', 'wallet', 'seed-rudo-pay-b', now() - interval '2 hours')
on conflict (reference) do nothing;
