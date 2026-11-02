ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'no_show';

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS appointment_buffer_minutes integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.businesses.appointment_buffer_minutes IS 'Minutes of buffer reserved after each appointment before the next one can start';