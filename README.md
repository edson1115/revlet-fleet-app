# Revlet Fleet

Local dev: `pnpm dev` → http://localhost:3000

- New request: `/fm/requests/new`
- Office (NEW): `/office/queue`
- Dispatch (SCHEDULED): `/dispatch/scheduled`
- Tech (IN_PROGRESS): `/tech/queue`

📄 Project brief: [docs/PROJECT_BRIEF.md](./docs/PROJECT_BRIEF.md)

The build in more detail:\
**Customer (ABC Motors) View:**

-   ✅ Dashboard: Last 5 completed services

-   ✅ Service Requests: Create, view, cancel

-   ✅ Real-time status updates (see changes immediately in app)

-   ✅Vehicles tab

## What’s in this branch (feature/office-scheduling-and-vehicles)

**APIs**
- `app/api/vehicles/route.ts`: UPSERT by `(company_id, unit_number)`; supports `vehicles.customer_id` or join table `company_customer_vehicles`.
- `app/api/lookups/route.ts`: `scope=locations|customers|technicians`. Customers filter is schema-tolerant (optional join tables).
- `app/api/requests/route.ts`: GET includes `technician`; POST accepts aliases (`service_type`, `po_number`, `customer_notes`, `odometer_miles`).
- `app/api/requests/[id]/schedule/route.ts`: PATCH `scheduled_at`, optional `technician_id`, auto-bumps status from office states to `SCHEDULED`.

**UI**
- `app/office/requests/[id]/page.tsx`: Schedule modal with Technician picker; edits FMC/Mileage/PO/Notes.
- `app/office/queue/page.tsx`: Added **Tech** column.
- `components/Toast.tsx` + `components/Toaster.tsx`; provider used in `app/layout.tsx`.

**DB expectations**
- `service_requests.technician_id` (nullable FK → `technicians.id`).
- Unique index on `vehicles(company_id, unit_number)`.
- Your test user’s `profiles.company_id` = `00000000-0000-0000-0000-000000000001`.

**Dev commands**
```bash
git checkout -b feature/office-scheduling-and-vehicles
git add .
git commit -m "Vehicles upsert + schema-tolerant lookups + schedule API + tech assignment + Toaster + queue tech column"
git push -u origin feature/office-scheduling-and-vehicles


**Where Recommendations Show:**

-   **Customer View:** See recommendations on completed services (helps
    them plan future maintenance)

**Dispatch View:**

-   ✅ Dashboard: Last 5 services + incomplete alerts (jobs without PO
    stay here)

-   ✅ Service Requests with:

    -   Assign to specific tech (dropdown of all techs)

    -   Schedule date/time

    -   Auto-suggest parts (by vehicle + service type)

    -   Edit/override parts list

    -   Add PO number (required to fully close job)

    -   Jobs stay in \"Needs PO\" state until PO added

    -   Reassign tech if needed

    -   Handle incomplete → reschedule

-    ✅ Emergency requests (only Dispatch sees these, can fast-track)

-    ✅ Remove vehicles tab

**Where Recommendations Show:**

**Dispatch View:** See recommendations to follow up with customer or
schedule future service

**Tech (Mike Rodriguez) View:**

-   ✅ Dashboard: Today\'s summary

-   ✅ My Schedule: Only his assigned jobs, sorted by time

    -   Check In → Complete/Incomplete buttons appear

    -   Incomplete prompts for reason

-   ✅ **NEW: Parts Pick List Tab:**

    -   Shows ALL parts for ALL jobs today in one list

    -   Can mark each part as \"Picked\"

    -   Parts already in van (oil/filters) shown differently

-   ✅ Individual job detail page also shows parts for that specific job

**Tech Completion Notes - V1 Approach:**

**Keep it Simple & Flexible:**

-   ✅ **Free text field** (no templates yet)

    -   Why: Every vehicle/situation is different, templates might be
        limiting

    -   Techs can type naturally: \"Oil leak at rear main seal -
        recommend repair within 1000 miles\"

    -   Easy to add templates in V2 if you see patterns

-   ✅ **Required before completion**

    -   Field label: \"Service Notes & Recommendations\"

    -   Placeholder text: \"Document work completed and any
        recommendations for future service\...\"

    -   Tech must add something (even \"No issues found\" or \"All
        good\")

-   ✅ **Notes appear on completed service**

    -   Customer sees it immediately when status changes to
        \"Completed\"

    -   Dispatch sees it in service details

    -   Stored in service history

**Tech Completion Flow - Updated:**

When tech marks a service **Complete**, they should see:

-   ✅ **Service Notes** (what was done)

-   ✅ **NEW: Recommendations Section**

    -   Text field for future service recommendations

    -   Examples: \"Oil leak detected - recommend gasket replacement\",
        \"Brake pads at 30% - schedule replacement in 2-3 months\",
        \"Tire tread wearing unevenly - alignment recommended\"

-   ✅ Mark Complete button

-   

**Workflow:**

1)  Customer creates request → Dispatch schedules + assigns tech +
    confirms parts → Tech sees in schedule → Tech completes → **Customer
    gets notification \"Completed\"** → Dispatch adds PO → Status
    updates to \"Closed\"

2)  Emergency: Dispatch creates emergency → assigns tech → same day OR
    next day

3)  Incomplete: Tech marks incomplete → Dispatch reschedules → Customer
    sees update

**Color-Coded Status System:**

I\'ll make statuses more visually distinct:

-   🔵 **NEW** (Blue) - Just submitted, needs scheduling

-   🟡 **SCHEDULED** (Yellow) - Date/time set, waiting for service day

-   🟣 **IN PROGRESS** (Purple) - Tech checked in, actively working

-   🟢 **COMPLETED** (Green) - Service done, customer can see

-   ⚫ **CLOSED** (Dark Gray) - PO added by dispatch, fully complete

-   🔴 **INCOMPLETE** (Red) - Needs attention/rescheduling

-   ⚠️ **EMERGENCY** (Orange/Red border) - Urgent, fast-track

**Customer Update Notifications:**

You\'re right - the whole point is to **eliminate**
calls/texts/emails/Slack!

**Customer Portal - Real-Time Updates:**

When customer (ABC Motors, Enterprise Fleet, etc.) logs in, they see:

**Dashboard View:**

-   🔴 **Active Services** (live status tracker)

    -   Shows: Vehicle, Status (color-coded), Last Updated time

    -   \"2020 Ford Transit • 🟣 IN PROGRESS • Updated 15 mins ago\"

-   🟢 **Recently Completed** (last 5)

    -   Can click \"Request Receipt\"

**Service Request Detail:**

-   **Status Timeline/Progress Bar:**

    -   New → Scheduled → In Progress → Completed → Closed

    -   Current step highlighted

    -   Timestamp for each stage

-   **Live Updates Section:**

    -   \"Scheduled for Oct 15, 9:00 AM with Tech: Mike Rodriguez\"

    -   \"Mike checked in at 9:05 AM\"

    -   \"Service completed at 10:30 AM - Notes: Oil change complete.
        Recommend brake inspection in 3 months\"

    -   \"Closed - PO#: 12345\"

**Key Features:**

1.  ✅ **No login spamming** - Clear \"last updated\" timestamp

2.  ✅ **Self-service** - They check when they want

3.  ✅ **Status history** - See full timeline

4.  ✅ **Tech notes visible** - Recommendations shown immediately

5.  ✅ **Receipt on demand** - Download when completed

**Final Feature Set - Confirmed:**

**Customer View (ABC Motors, Enterprise Fleet, etc.):**

-   ✅ Color-coded status badges

-   ✅ Dashboard: Active services + Last 5 completed

-   ✅ Vehicles tab (for scheduling reference)

-   ✅ Service Requests: Create, view, cancel

-   ✅ Status timeline/progress tracking

-   ✅ Real-time updates (check anytime, no spam)

-   ✅ Request Receipt button on completed services

-   ✅ See tech notes/recommendations

**Dispatch View:**

-   ✅ Color-coded statuses

-   ✅ Dashboard: Last 5 services + alerts (incomplete, needs PO)

-   ✅ Service Requests: Schedule, assign tech, confirm parts, add PO

-   ✅ Auto-suggest parts (vehicle + service type)

-   ✅ Emergency requests (same day or next day)

-   ✅ Jobs stay visible until PO added

-   ✅ Reassign techs

-   ✅ Handle incomplete → reschedule

**Tech View (Mike Rodriguez):**

-   ✅ Color-coded statuses

-   ✅ Dashboard: Today\'s summary

-   ✅ My Schedule: Only assigned jobs, sorted by time

-   ✅ Parts Pick List tab: All parts for today

-   ✅ Job detail page: Check In → Complete with required notes

-   ✅ Service Notes & Recommendations field (required before
    completion)

-   ✅ Mark Incomplete option with reason

**Status Flow:**

🔵 NEW → 🟡 SCHEDULED → 🟣 IN PROGRESS → 🟢 COMPLETED → ⚫ CLOSED (Red
for INCOMPLETE, Orange flag for EMERGENCY)

**V2 Features (Future):**

-   Email notifications

-   Parts templates

-   Priority levels for recommendations

-   Inventory tracking