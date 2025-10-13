-- =====================================================
-- REVLET Fleet Service Management - Seed Data
-- Sample data for testing (1 shop, 1 customer, users, vehicles)
-- =====================================================

-- =====================================================
-- COMPANIES
-- =====================================================

-- Shop (Office users work for this company)
INSERT INTO companies (id, name, fmc, account_number, contact_email, contact_phone) VALUES
('00000000-0000-0000-0000-000000000001', 'RevTech Mobile Service', 'Other', 'SHOP-001', 'dispatch@revtechmobile.com', '210-555-0100');

-- Customer (Fleet Manager's company)
INSERT INTO companies (id, name, fmc, account_number, contact_email, contact_phone) VALUES
('00000000-0000-0000-0000-000000000002', 'ABC Motors Fleet', 'Enterprise Fleet', 'CUST-ABC-001', 'fleet@abcmotors.com', '210-555-0200');

-- =====================================================
-- COMPANY LOCATIONS
-- =====================================================

INSERT INTO company_locations (id, company_id, name, address, city, state, zip) VALUES
-- ABC Motors locations
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000002', 'ABC Motors - Main Depot', '1234 Commerce St', 'San Antonio', 'TX', '78201'),
('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000002', 'ABC Motors - North Yard', '5678 Industrial Blvd', 'San Antonio', 'TX', '78218');

-- =====================================================
-- APP USERS
-- =====================================================
-- Note: You must create these users in Supabase Auth first, then link them here
-- For testing, create users with these emails in Supabase Auth dashboard
-- Password for all test users: TestPass123!

-- Office User (Dispatch)
-- Auth email: dispatch@revtechmobile.com
-- You'll need to replace 'YOUR_SUPABASE_AUTH_UID_HERE' with actual auth.users.id after creating
INSERT INTO app_users (id, auth_uid, company_id, role, name, email, phone) VALUES
('10000000-0000-0000-0000-000000000001', '39a7b963-39b3-45fc-8999-c8b8952c8a9a'::uuid, '00000000-0000-0000-0000-000000000001', 'OFFICE', 'Sarah Dispatch', 'dispatch@revtechmobile.com', '210-555-0101');

-- Fleet Manager (Customer)
-- Auth email: john.fleet@abcmotors.com
INSERT INTO app_users (id, auth_uid, company_id, role, name, email, phone) VALUES
('20000000-0000-0000-0000-000000000001', '8a623e38-ac9d-45d5-86c2-1a084adde1d6'::uuid, '00000000-0000-0000-0000-000000000002', 'FLEET_MANAGER', 'John Fleet', 'john.fleet@abcmotors.com', '210-555-0201');

-- Technicians
-- Auth email: mike.tech@revtechmobile.com
INSERT INTO app_users (id, auth_uid, company_id, role, name, email, phone) VALUES
('30000000-0000-0000-0000-000000000001', '18e1fe1f-2e76-492d-b8a7-f5b1b29c040c'::uuid, NULL, 'TECH', 'Mike Rodriguez', 'mike.tech@revtechmobile.com', '210-555-0301');

-- Auth email: sarah.tech@revtechmobile.com
INSERT INTO app_users (id, auth_uid, company_id, role, name, email, phone) VALUES
('30000000-0000-0000-0000-000000000002', '3a9240bd-21e2-44bd-84df-a1b45e2d6baa'::uuid, NULL, 'TECH', 'Sarah Chen', 'sarah.tech@revtechmobile.com', '210-555-0302');

-- =====================================================
-- VEHICLES
-- =====================================================

INSERT INTO vehicles (id, company_id, location_id, year, make, model, vin, plate, unit_number) VALUES
-- ABC Motors Fleet
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-000000000001', 2020, 'Ford', 'Transit 250', '1FTBR1C85LKA12345', 'ABC-101', 'VAN-101'),
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-000000000001', 2021, 'Ford', 'Transit 350', '1FTBR2CM1MKA23456', 'ABC-102', 'VAN-102'),
('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-000000000002', 2019, 'Chevrolet', 'Express 2500', '1GCWGAFG5K1234567', 'ABC-201', 'VAN-201'),
('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-000000000002', 2022, 'Ram', 'ProMaster 2500', '3C6TRVNG1NE567890', 'ABC-202', 'VAN-202'),
('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-000000000001', 2021, 'Mercedes-Benz', 'Sprinter 2500', 'WD3PE7CD5MP234567', 'ABC-103', 'VAN-103'),
('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-000000000002', 2020, 'Nissan', 'NV2500', '1N6BF0LY5LN345678', 'ABC-203', 'VAN-203');

-- =====================================================
-- SAMPLE SERVICE REQUESTS
-- =====================================================

-- NEW request (just submitted, needs scheduling)
INSERT INTO service_requests (
  id, company_id, vehicle_id, location_id, fmc, service_type, priority, status,
  customer_notes, preferred_date_1, preferred_date_2, is_emergency
) VALUES (
  '50000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000001',
  'Enterprise Fleet',
  'Oil Change',
  'NORMAL',
  'NEW',
  'Due for 10k mile service. Please check all fluids.',
  CURRENT_DATE + INTERVAL '2 days',
  CURRENT_DATE + INTERVAL '3 days',
  false
);

-- SCHEDULED request (assigned to Mike, scheduled for tomorrow)
INSERT INTO service_requests (
  id, company_id, vehicle_id, location_id, fmc, service_type, priority, status,
  customer_notes, assigned_tech_id, scheduled_at
) VALUES (
  '50000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0001-000000000001',
  'Enterprise Fleet',
  'Brake Service',
  'HIGH',
  'SCHEDULED',
  'Customer reports squealing noise when braking.',
  '30000000-0000-0000-0000-000000000001',
  (CURRENT_DATE + INTERVAL '1 day')::timestamp + TIME '09:00:00'
);

-- COMPLETED request (finished today, needs PO to close)
INSERT INTO service_requests (
  id, company_id, vehicle_id, location_id, fmc, service_type, priority, status,
  customer_notes, assigned_tech_id, scheduled_at, checked_in_at, completed_at
) VALUES (
  '50000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0001-000000000002',
  'Enterprise Fleet',
  'Tire Service',
  'NORMAL',
  'COMPLETED',
  'Regular tire rotation needed.',
  '30000000-0000-0000-0000-000000000002',
  CURRENT_TIMESTAMP - INTERVAL '3 hours',
  CURRENT_TIMESTAMP - INTERVAL '2.5 hours',
  CURRENT_TIMESTAMP - INTERVAL '1 hour'
);

-- =====================================================
-- SERVICE EVENTS (audit trail for the requests above)
-- =====================================================

-- Events for request 1 (NEW)
INSERT INTO service_events (request_id, from_status, to_status, event_type, message, user_id) VALUES
('50000000-0000-0000-0000-000000000001', NULL, 'NEW', 'REQUEST_CREATED', 'Service request created by fleet manager', '20000000-0000-0000-0000-000000000001');

-- Events for request 2 (SCHEDULED)
INSERT INTO service_events (request_id, from_status, to_status, event_type, message, user_id) VALUES
('50000000-0000-0000-0000-000000000002', NULL, 'NEW', 'REQUEST_CREATED', 'Service request created by fleet manager', '20000000-0000-0000-0000-000000000001'),
('50000000-0000-0000-0000-000000000002', 'NEW', 'SCHEDULED', 'JOB_SCHEDULED', 'Job scheduled and assigned to Mike Rodriguez', '10000000-0000-0000-0000-000000000001');

-- Events for request 3 (COMPLETED)
INSERT INTO service_events (request_id, from_status, to_status, event_type, message, user_id) VALUES
('50000000-0000-0000-0000-000000000003', NULL, 'NEW', 'REQUEST_CREATED', 'Service request created by fleet manager', '20000000-0000-0000-0000-000000000001'),
('50000000-0000-0000-0000-000000000003', 'NEW', 'SCHEDULED', 'JOB_SCHEDULED', 'Job scheduled and assigned to Sarah Chen', '10000000-0000-0000-0000-000000000001'),
('50000000-0000-0000-0000-000000000003', 'SCHEDULED', 'IN_PROGRESS', 'TECH_CHECKED_IN', 'Sarah Chen checked in', '30000000-0000-0000-0000-000000000002'),
('50000000-0000-0000-0000-000000000003', 'IN_PROGRESS', 'COMPLETED', 'JOB_COMPLETED', 'Service completed', '30000000-0000-0000-0000-000000000002');

-- =====================================================
-- SERVICE NOTES (for the completed job)
-- =====================================================

INSERT INTO service_notes (request_id, tech_id, service_notes, recommendations) VALUES
('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 
  'Rotated all four tires. Checked tire pressure and adjusted to 35 PSI all around. All tires in good condition with 6/32" tread depth.',
  'Recommend checking alignment in next 3 months due to slight uneven wear pattern on front right tire.');

-- =====================================================
-- SERVICE PARTS (example parts for scheduled job)
-- =====================================================

INSERT INTO service_parts (request_id, part_name, part_number, quantity, in_van, picked) VALUES
('50000000-0000-0000-0000-000000000002', 'Brake Pads - Front', 'BP-FORD-F250', 1, false, false),
('50000000-0000-0000-0000-000000000002', 'Brake Rotors - Front', 'BR-FORD-F250', 2, false, false),
('50000000-0000-0000-0000-000000000002', 'Brake Cleaner', 'BC-14OZ', 1, true, false),
('50000000-0000-0000-0000-000000000002', 'Shop Rags', 'RAGS-50', 1, true, false);

-- =====================================================
-- SETUP INSTRUCTIONS
-- =====================================================

/*
TO USE THIS SEED DATA:

1. First, create users in Supabase Auth Dashboard:
   - dispatch@revtechmobile.com (password: TestPass123!)
   - john.fleet@abcmotors.com (password: TestPass123!)
   - mike.tech@revtechmobile.com (password: TestPass123!)
   - sarah.tech@revtechmobile.com (password: TestPass123!)

2. Get the auth.users.id (UUID) for each created user

3. Update the app_users INSERT statements above:
   - Replace 'YOUR_OFFICE_AUTH_UID' with dispatch user's auth.users.id
   - Replace 'YOUR_FM_AUTH_UID' with john.fleet user's auth.users.id
   - Replace 'YOUR_TECH1_AUTH_UID' with mike.tech user's auth.users.id
   - Replace 'YOUR_TECH2_AUTH_UID' with sarah.tech user's auth.users.id

4. Run this seed.sql in Supabase SQL Editor

5. Test logins:
   OFFICE: dispatch@revtechmobile.com / TestPass123!
   FLEET_MANAGER: john.fleet@abcmotors.com / TestPass123!
   TECH: mike.tech@revtechmobile.com / TestPass123!
   TECH: sarah.tech@revtechmobile.com / TestPass123!

QUICK VERIFICATION QUERIES:

-- See all companies and locations
SELECT c.name, cl.name as location 
FROM companies c 
LEFT JOIN company_locations cl ON c.id = cl.company_id;

-- See all users and their roles
SELECT name, email, role, (SELECT name FROM companies WHERE id = company_id) as company
FROM app_users;

-- See all vehicles
SELECT v.unit_number, v.year, v.make, v.model, c.name as company
FROM vehicles v
JOIN companies c ON v.company_id = c.id;

-- See all service requests with details
SELECT 
  sr.status,
  c.name as customer,
  v.unit_number,
  sr.service_type,
  sr.scheduled_at,
  u.name as assigned_tech
FROM service_requests sr
JOIN companies c ON sr.company_id = c.id
JOIN vehicles v ON sr.vehicle_id = v.id
LEFT JOIN app_users u ON sr.assigned_tech_id = u.id;
*/