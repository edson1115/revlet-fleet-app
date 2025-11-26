CREATE OR REPLACE FUNCTION fn_guard_status_transition()
RETURNS trigger AS $$
DECLARE
allowed jsonb := jsonb_build_object(
'NEW', '{"WAITING_APPROVAL","WAITING_PARTS"}',
'WAITING_APPROVAL', '{"WAITING_PARTS"}',
'WAITING_PARTS', '{"SCHEDULED"}',
'SCHEDULED', '{"IN_PROGRESS"}',
'IN_PROGRESS', '{"CANCELED","COMPLETED","RESCHEDULED"}',
'RESCHEDULED', '{"SCHEDULED"}',
'CANCELED', '{"RESCHEDULED"}',
'COMPLETED', '{}'
);
from_status text := COALESCE(OLD.status::text, 'NEW');
to_status text := NEW.status::text;
ok bool := to_status = ANY (string_to_array((allowed ->> from_status), ','));
BEGIN
IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
IF NOT ok THEN
RAISE EXCEPTION 'Illegal transition % → %', from_status, to_status;
END IF;
END IF;
RETURN NEW;
END; $$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS trg_guard_status ON service_requests;
CREATE TRIGGER trg_guard_status
BEFORE UPDATE ON service_requests
FOR EACH ROW EXECUTE FUNCTION fn_guard_status_transition();