# Revlet Fleet – Project Brief

## Stack
Next.js 15 (App Router), TypeScript, Supabase (Postgres), Tailwind.

## Local URLs
- App: http://localhost:3000

## Data Model (high level)
- `vehicles(id, company_id, unit_number, year, make, model, plate, active)`
- `service_requests(id, company_id, vehicle_id, service_type, priority, fmc, customer_notes,
  preferred_date_1..3, odometer_miles, status ENUM[NEW,SCHEDULED,IN_PROGRESS,COMPLETED],
  scheduled_at, started_at, completed_at, created_at)`

## API
- GET/POST `/api/requests`  (GET supports `?status=&limit=`)
- PATCH `/api/requests/:id/{schedule|start|complete}`
- GET/POST `/api/vehicles`
- GET `/api/lookups`

## Pages
- `/fm/requests/new` – create request (+ mileage, add vehicle, refresh vehicles)
- `/office/queue` – schedule NEW → SCHEDULED
- `/dispatch/scheduled` – mark IN_PROGRESS
- `/tech/queue` – complete IN_PROGRESS → COMPLETED

## Decisions / Conventions
- All server handlers return JSON (even on error); never HTML.
- Client pages fetch with `cache: 'no-store'` when freshness matters.
- Vehicle labels: show “(No vehicle)” fallback; optionally include `vehiclesById` in API responses.

## Open Issues / Next
- [ ] Inline “+ Add vehicle” expander under Vehicle* on create form
- [ ] Ensure `/dispatch/scheduled` and `/tech/queue` APIs return `vehiclesById`
- [ ] Add “Refresh” buttons everywhere lists exist
- [ ] Audit all PATCH handlers for `.single().catch()` misuse (should handle try/catch)
- [ ] Add `completed_at` if needed for analytics

## Changelog
- 2025-10-10: Added odometer_miles, started_at; fixed GET /api/requests; added refresh buttons; vehicle label fallback on tech queue.

NEXT_PUBLIC_SUPABASE_URL=https://tulxdovuwmhsuozodqwj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bHhkb3Z1d21oc3Vvem9kcXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDU3NDcsImV4cCI6MjA3NTQ4MTc0N30.2HSadQyk--GTs1SMEtEB2HZnixoDxGWotUM3J4NaFCQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bHhkb3Z1d21oc3Vvem9kcXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNTc0NywiZXhwIjoyMDc1NDgxNzQ3fQ.8590_hDrewtBki-oZHT6rojPY0QivV7xszNmJau6_sA


---

## 4) Data Model (public schema, high-level)

### vehicles
| column        | type      | notes                      |
|---------------|-----------|----------------------------|
| id (pk, uuid) | uuid      |                            |
| company_id    | uuid      | required                   |
| location_id   | uuid?     | nullable                   |
| unit_number   | text?     | nullable                   |
| year          | int       |                            |
| make          | text      |                            |
| model         | text      |                            |
| vin           | text      | unique per company (nice)  |
| plate         | text?     | nullable                   |
| active        | bool      | default true               |
| created_at    | timestamptz | default now()            |

### service_requests
| column            | type        | notes                                                    |
|-------------------|-------------|----------------------------------------------------------|
| id (pk, uuid)     | uuid        |                                                          |
| company_id        | uuid        | **not null**                                             |
| vehicle_id        | uuid        |                                                          |
| service_type      | text        | e.g. Oil Change, Brake Service…                          |
| priority          | text        | LOW / NORMAL / HIGH / URGENT                             |
| fmc               | text?       | nullable                                                 |
| customer_notes    | text?       | nullable                                                 |
| preferred_date_1  | date?       | nullable                                                 |
| preferred_date_2  | date?       | nullable                                                 |
| preferred_date_3  | date?       | nullable                                                 |
| odometer_miles    | int?        | nullable                                                 |
| status            | text        | **NEW / SCHEDULED / IN_PROGRESS / COMPLETED**           |
| scheduled_at      | timestamptz?| nullable (set on schedule)                               |
| started_at        | timestamptz?| nullable (set on start)                                  |
| completed_at      | timestamptz?| nullable (optional later)                                |
| created_at        | timestamptz | default now()                                            |

**Helpful indexes**
- `(company_id, status, created_at desc)`
- `(status, started_at desc)` (dashboards)

---

## 5) Routes (pages)

- `/fm/requests/new` — Create Service Request  
  - Fields: vehicle, mileage, service type, FMC, priority, location, notes, preferred dates, emergency
  - “+ Add” opens `/fm/vehicles/new` (inline expander planned)

- `/office/queue` — **NEW** requests  
  - Actions: **Schedule now** → `PATCH /api/requests/:id/schedule`
  - Has **Refresh** button

- `/dispatch/scheduled` — **SCHEDULED** requests  
  - Actions: **Mark In Progress** → `PATCH /api/requests/:id/start`
  - Has **Refresh** button

- `/tech/queue` — **IN_PROGRESS** requests  
  - Actions: **Complete** → `PATCH /api/requests/:id/complete`
  - Has **Refresh** button

---

## 6) API (server, JSON only)

### `GET /api/requests?status=NEW|SCHEDULED|IN_PROGRESS&limit=50`
- **200** `{ requests: RequestRow[], vehiclesById?: Record<uuid, Vehicle> }`
- **200 (error)** `{ requests: [], error: "message" }`
- Stable shape for tables; we may embed `vehiclesById` for label hydration.

### `POST /api/requests`
- Body:  


{
vehicle_id, service_type, priority, fmc?, location_id?,
customer_notes?, preferred_date_1?, preferred_date_2?, preferred_date_3?,
odometer_miles?, is_emergency?
}

{
vehicle_id, service_type, priority, fmc?, location_id?,
customer_notes?, preferred_date_1?, preferred_date_2?, preferred_date_3?,
odometer_miles?, is_emergency?
}

- Sets `status: "NEW"`, `company_id` inferred (seed default OK).
- **201** `{ ok: true, id }` or **400** `{ error }`

### `PATCH /api/requests/[id]/schedule`
- Body: `{ scheduled_at?: ISO, assigned_tech_id?: uuid, note?: string }`
- Sets `status: "SCHEDULED"` and timestamps if provided.
- **200** `{ ok: true, id }` or **400/500** `{ error }`

### `PATCH /api/requests/[id]/start`
- Body optional. Sets `status: "IN_PROGRESS"` + `started_at = now()` if null.

### `PATCH /api/requests/[id]/complete`
- Body optional. Sets `status: "COMPLETED"` (+ `completed_at = now()` if we add).

### `GET /api/vehicles`
- **200** `{ vehicles: Vehicle[] }`

### `POST /api/vehicles`
- Creates a vehicle (company defaults to ABC in seed).
- **201** `{ ok: true, vehicle }` or **400** `{ error }`

### `GET /api/lookups`
- **200** `{ vehicles, locations, companyId }`

**Handler patterns**
- Always return JSON (even on error).
- No chained `.catch()` after `supabase…single()` — use `try/catch` around the call.

---

## 7) UX Notes / Decisions
- **Vehicle labeling:** Prefer server to return `vehiclesById` so tables can render labels without extra roundtrip. Clients also have a fallback call to `/api/vehicles`.
- **Refresh buttons:** Present on all list pages; fetch with `cache: 'no-store'`.
- **Inline “+ Add vehicle”:** Planned: collapsible section under Vehicle* on create form. On save → refresh vehicles → preselect the newly created one → collapse.

---

## 8) Testing Flow (happy path)

1. **Create** → `/fm/requests/new`  
 - choose or add vehicle, enter mileage, pick service/priority/dates → submit  
 - expect green “Service request created.”

2. **Office Queue** → `/office/queue`  
 - click **Schedule now** on a NEW row  
 - row disappears; appears on **Dispatch — Scheduled**

3. **Dispatch** → `/dispatch/scheduled`  
 - click **Mark In Progress**  
 - row disappears; appears on **Tech Queue — In Progress**

4. **Tech Queue** → `/tech/queue`  
 - click **Complete**  
 - row disappears; status becomes **COMPLETED** in DB

---

## 9) Known Issues / Next
- [ ] **Inline Add Vehicle** on create page (collapsible expander + preselect new vehicle)
- [ ] Ensure **`vehiclesById`** is included by the API for `/dispatch/scheduled` & `/tech/queue`
- [ ] Add **Refresh** button on `/office/queue` (implemented), verify on all pages
- [ ] Standardize error banners (“HTTP XXX”) + console details
- [ ] Optional: add `completed_at` column and index for reports
- [ ] Tighten Row Level Security (RLS) when we add real auth

---

## 10) Changelog
- 2025-10-10: Added `odometer_miles`, `started_at`; fixed GET `/api/requests` handler; added refresh controls; improved vehicle label fallbacks; scheduling/starting flow wired; initial tech completion route added.




