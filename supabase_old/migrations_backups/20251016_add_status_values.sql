-- Ensure all app statuses exist on enum type job_status
-- (ORDER only matters for aesthetics; checks use IF NOT EXISTS to be idempotent)

ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'NEW';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'WAITING_APPROVAL';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'WAITING_PARTS';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'SCHEDULED';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'RESCHEDULED';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'CANCELED';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'COMPLETED';

-- Recreate the helpful partial indexes (safe if they already exist)
CREATE INDEX IF NOT EXISTS idx_service_requests_status
  ON public.service_requests(status);

CREATE INDEX IF NOT EXISTS idx_service_requests_scheduled_at
  ON public.service_requests(scheduled_at)
  WHERE status = 'SCHEDULED';

CREATE INDEX IF NOT EXISTS idx_service_requests_started_at
  ON public.service_requests(started_at)
  WHERE status IN ('IN_PROGRESS','RESCHEDULED');
