PROJECT: Revlet Fleet – Next.js 15 (App Router) + Supabase
ENV: local dev on http://localhost:3000
DB: Supabase (public schema)
PAGES: /fm/requests/new, /office/queue, /dispatch/scheduled, /tech/queue
API: GET/POST /api/requests; PATCH /api/requests/:id/{schedule|start|complete}; GET/POST /api/vehicles; GET /api/lookups
STATUS FLOW: NEW → SCHEDULED → IN_PROGRESS → COMPLETED
DOC LINK: <your repo docs/PROJECT_BRIEF.md or Notion link>

TODAY’S GOAL:
- <put your goal here>

ISSUES TO WATCH:
- vehicle labels: prefer vehiclesById in API payloads; fallback to GET /api/vehicles
- refresh buttons present on lists; fetch with no-store
