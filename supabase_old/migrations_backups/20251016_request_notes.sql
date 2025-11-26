CREATE TABLE IF NOT EXISTS public.service_request_notes (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
author_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
body text NOT NULL,
created_at timestamptz NOT NULL DEFAULT now()
);


CREATE INDEX IF NOT EXISTS idx_notes_request_id ON public.service_request_notes(request_id);