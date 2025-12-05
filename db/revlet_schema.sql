-- =====================================================
-- REVLET Fleet Service Management - Database Schema
-- Supabase PostgreSQL Schema (V1 MVP)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('OFFICE', 'FLEET_MANAGER', 'TECH');

CREATE TYPE job_status AS ENUM (
  'NEW',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CLOSED',
  'INCOMPLETE',
  'EMERGENCY'
);

CREATE TYPE fmc AS ENUM (
  'LMR',
  'Element',
  'Enterprise Fleet',
  'Merchant',
  'Holman',
  'EAN',
  'Hertz',
  'Fleetio',
  'Other'
);

CREATE TYPE service_type AS ENUM (
  'Oil Change',
  'Brake Service',
  'Tire Service',
  'Battery Replacement',
  'Inspection',
  'Preventive Maintenance',
  'Diagnostics',
  'Repair',
  'Other'
);

CREATE TYPE priority_level AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- =====================================================
-- TABLES
-- =====================================================

-- Companies (Fleet Customers)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  fmc fmc NOT NULL,
  account_number TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Locations (Multi-site support)
CREATE TABLE company_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Users (linked to Supabase Auth)
CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_uid UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  role user_role NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  location_id UUID REFERENCES company_locations(id),
  year INTEGER,
  make TEXT,
  model TEXT,
  vin TEXT,
  plate TEXT,
  unit_number TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vehicle_identifier CHECK (
    vin IS NOT NULL OR (plate IS NOT NULL AND year IS NOT NULL AND make IS NOT NULL)
  )
);

-- Service Requests (main job entity)
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  location_id UUID REFERENCES company_locations(id),
  fmc fmc NOT NULL,
  service_type service_type NOT NULL,
  priority priority_level DEFAULT 'NORMAL',
  status job_status DEFAULT 'NEW' NOT NULL,
  
  -- Request details
  customer_notes TEXT,
  preferred_date_1 DATE,
  preferred_date_2 DATE,
  preferred_date_3 DATE,
  
  -- Scheduling
  assigned_tech UUID REFERENCES app_users(id),
  scheduled_at TIMESTAMPTZ,
  
  -- Execution
  checked_in_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  incomplete_reason TEXT,
  
  -- Closure
  po_number TEXT,
  invoice_number TEXT,
  
  -- Tracking
  is_emergency BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Events (audit trail / timeline)
CREATE TABLE service_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  from_status job_status,
  to_status job_status NOT NULL,
  event_type TEXT NOT NULL,
  message TEXT,
  user_id UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Parts (suggested/used parts)
CREATE TABLE service_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL,
  part_number TEXT,
  quantity INTEGER DEFAULT 1,
  in_van BOOLEAN DEFAULT false,
  picked BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Notes (tech completion notes & recommendations)
CREATE TABLE service_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  tech_id UUID NOT NULL REFERENCES app_users(id),
  service_notes TEXT NOT NULL,
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_app_users_auth_uid ON app_users(auth_uid);
CREATE INDEX idx_app_users_company ON app_users(company_id);
CREATE INDEX idx_app_users_role ON app_users(role);

CREATE INDEX idx_vehicles_company ON vehicles(company_id);
CREATE INDEX idx_vehicles_location ON vehicles(location_id);

CREATE INDEX idx_requests_company ON service_requests(company_id);
CREATE INDEX idx_requests_status ON service_requests(status);
CREATE INDEX idx_requests_tech ON service_requests(assigned_tech);
CREATE INDEX idx_requests_scheduled ON service_requests(scheduled_at);

CREATE INDEX idx_events_request ON service_events(request_id);
CREATE INDEX idx_parts_request ON service_parts(request_id);
CREATE INDEX idx_notes_request ON service_notes(request_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER app_users_updated_at BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER service_requests_updated_at BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Business Logic Trigger: PO required before CLOSED
CREATE OR REPLACE FUNCTION check_po_before_closed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'CLOSED' AND NEW.po_number IS NULL THEN
    RAISE EXCEPTION 'PO number is required before marking job as CLOSED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_po_before_closed
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  WHEN (NEW.status = 'CLOSED')
  EXECUTE FUNCTION check_po_before_closed();

-- Business Logic Trigger: Check-in required before COMPLETED
CREATE OR REPLACE FUNCTION check_checkin_before_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND NEW.checked_in_at IS NULL THEN
    RAISE EXCEPTION 'Tech must check in before marking job as COMPLETED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_checkin_before_completed
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  WHEN (NEW.status = 'COMPLETED')
  EXECUTE FUNCTION check_checkin_before_completed();

-- Auto-set timestamps on status changes
CREATE OR REPLACE FUNCTION set_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Set checked_in_at when status changes to IN_PROGRESS
  IF NEW.status = 'IN_PROGRESS' AND OLD.status != 'IN_PROGRESS' THEN
    NEW.checked_in_at = NOW();
  END IF;
  
  -- Set completed_at when status changes to COMPLETED
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- Set closed_at when status changes to CLOSED
  IF NEW.status = 'CLOSED' AND OLD.status != 'CLOSED' THEN
    NEW.closed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_status_timestamps
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_status_timestamps();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_notes ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's app_user record
CREATE OR REPLACE FUNCTION get_current_app_user()
RETURNS app_users AS $$
  SELECT * FROM app_users WHERE auth_uid = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM app_users WHERE auth_uid = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION get_current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM app_users WHERE auth_uid = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES: COMPANIES
-- =====================================================

-- OFFICE: full access to their company
CREATE POLICY office_companies_all ON companies
  FOR ALL
  TO authenticated
  USING (
    get_current_user_role() = 'OFFICE' AND
    id = get_current_user_company_id()
  );

-- FLEET_MANAGER: read their company
CREATE POLICY fm_companies_read ON companies
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'FLEET_MANAGER' AND
    id = get_current_user_company_id()
  );

-- =====================================================
-- RLS POLICIES: COMPANY_LOCATIONS
-- =====================================================

CREATE POLICY office_locations_all ON company_locations
  FOR ALL
  TO authenticated
  USING (company_id = get_current_user_company_id());

CREATE POLICY fm_locations_read ON company_locations
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'FLEET_MANAGER' AND
    company_id = get_current_user_company_id()
  );

-- =====================================================
-- RLS POLICIES: APP_USERS
-- =====================================================

CREATE POLICY users_read_own_company ON app_users
  FOR SELECT
  TO authenticated
  USING (
    company_id = get_current_user_company_id() OR
    auth_uid = auth.uid()
  );

CREATE POLICY office_users_manage ON app_users
  FOR ALL
  TO authenticated
  USING (
    get_current_user_role() = 'OFFICE' AND
    company_id = get_current_user_company_id()
  );

-- =====================================================
-- RLS POLICIES: VEHICLES
-- =====================================================

CREATE POLICY office_vehicles_all ON vehicles
  FOR ALL
  TO authenticated
  USING (company_id = get_current_user_company_id());

CREATE POLICY fm_vehicles_all ON vehicles
  FOR ALL
  TO authenticated
  USING (
    get_current_user_role() = 'FLEET_MANAGER' AND
    company_id = get_current_user_company_id()
  );

CREATE POLICY tech_vehicles_read ON vehicles
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'TECH' AND
    id IN (
      SELECT vehicle_id FROM service_requests 
      WHERE assigned_tech = (SELECT id FROM app_users WHERE auth_uid = auth.uid())
    )
  );

-- =====================================================
-- RLS POLICIES: SERVICE_REQUESTS
-- =====================================================

-- OFFICE: full access to company's requests
CREATE POLICY office_requests_all ON service_requests
  FOR ALL
  TO authenticated
  USING (company_id = get_current_user_company_id());

-- FLEET_MANAGER: can insert for their company
CREATE POLICY fm_requests_insert ON service_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'FLEET_MANAGER' AND
    company_id = get_current_user_company_id()
  );

-- FLEET_MANAGER: can read their company's requests
CREATE POLICY fm_requests_read ON service_requests
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'FLEET_MANAGER' AND
    company_id = get_current_user_company_id()
  );

-- FLEET_MANAGER: can update only NEW status requests
CREATE POLICY fm_requests_update ON service_requests
  FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'FLEET_MANAGER' AND
    company_id = get_current_user_company_id() AND
    status = 'NEW'
  );

-- TECH: can read assigned jobs
CREATE POLICY tech_requests_read ON service_requests
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'TECH' AND
    assigned_tech = (SELECT id FROM app_users WHERE auth_uid = auth.uid())
  );

-- TECH: can update assigned jobs (check-in, complete, incomplete)
CREATE POLICY tech_requests_update ON service_requests
  FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'TECH' AND
    assigned_tech = (SELECT id FROM app_users WHERE auth_uid = auth.uid())
  );

-- =====================================================
-- RLS POLICIES: SERVICE_EVENTS
-- =====================================================

CREATE POLICY events_read_by_request_access ON service_events
  FOR SELECT
  TO authenticated
  USING (
    request_id IN (SELECT id FROM service_requests)
  );

CREATE POLICY events_insert_by_request_access ON service_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    request_id IN (SELECT id FROM service_requests)
  );

-- =====================================================
-- RLS POLICIES: SERVICE_PARTS
-- =====================================================

CREATE POLICY parts_read_by_request_access ON service_parts
  FOR SELECT
  TO authenticated
  USING (
    request_id IN (SELECT id FROM service_requests)
  );

CREATE POLICY parts_all_by_request_access ON service_parts
  FOR ALL
  TO authenticated
  USING (
    request_id IN (SELECT id FROM service_requests)
  );

-- =====================================================
-- RLS POLICIES: SERVICE_NOTES
-- =====================================================

CREATE POLICY notes_read_by_request_access ON service_notes
  FOR SELECT
  TO authenticated
  USING (
    request_id IN (SELECT id FROM service_requests)
  );

CREATE POLICY notes_insert_by_tech ON service_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tech_id = (SELECT id FROM app_users WHERE auth_uid = auth.uid()) AND
    request_id IN (SELECT id FROM service_requests WHERE assigned_tech = tech_id)
  );

-- =====================================================
-- UTILITY VIEWS
-- =====================================================

-- View: Active requests with company and vehicle details
CREATE OR REPLACE VIEW active_requests_view AS
SELECT 
  sr.*,
  c.name as company_name,
  c.fmc as company_fmc,
  v.year, v.make, v.model, v.vin, v.plate, v.unit_number,
  cl.name as location_name,
  u.name as tech_name,
  u.email as tech_email
FROM service_requests sr
JOIN companies c ON sr.company_id = c.id
JOIN vehicles v ON sr.vehicle_id = v.id
LEFT JOIN company_locations cl ON sr.location_id = cl.id
LEFT JOIN app_users u ON sr.assigned_tech = u.id
WHERE sr.status NOT IN ('CLOSED');

-- =====================================================
-- GRANTS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;