-- Add approval status to students table
ALTER TABLE public.students 
ADD COLUMN is_approved boolean NOT NULL DEFAULT false,
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN approved_by uuid;

-- Create index for faster filtering
CREATE INDEX idx_students_approval ON public.students(school_id, is_approved);