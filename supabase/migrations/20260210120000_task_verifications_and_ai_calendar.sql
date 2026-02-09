-- =====================================================
-- Migration: Task Verifications (AI Proof), AI Calendar Proposals, Storage Bucket
-- =====================================================

-- 1. Create storage bucket for task proof images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-proofs',
  'task-proofs',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can manage files in their own user_id folder
CREATE POLICY "Users can upload proof images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own proof images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own proof images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'task-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- 1b. Add requires_proof column to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS requires_proof boolean DEFAULT false;

-- 2. Create task_verifications table
CREATE TABLE IF NOT EXISTS public.task_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  ai_rating integer NOT NULL CHECK (ai_rating >= 0 AND ai_rating <= 10),
  ai_feedback text NOT NULL,
  task_title text NOT NULL,
  task_description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_task_verifications_user_id ON public.task_verifications(user_id);
CREATE INDEX idx_task_verifications_task_id ON public.task_verifications(task_id);

ALTER TABLE public.task_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications"
  ON public.task_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications"
  ON public.task_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own verifications"
  ON public.task_verifications FOR DELETE
  USING (auth.uid() = user_id);


-- 3. Add AI verification score columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_verification_avg numeric(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_verification_count integer DEFAULT 0;


-- 4. Create ai_schedule_proposals table
CREATE TABLE IF NOT EXISTS public.ai_schedule_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_type text NOT NULL CHECK (proposal_type IN ('schedule', 'reschedule', 'batch_plan')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  proposals jsonb NOT NULL,
  ai_reasoning text,
  created_at timestamptz DEFAULT now() NOT NULL,
  resolved_at timestamptz
);

CREATE INDEX idx_ai_schedule_proposals_user_id ON public.ai_schedule_proposals(user_id);
CREATE INDEX idx_ai_schedule_proposals_status ON public.ai_schedule_proposals(status);

ALTER TABLE public.ai_schedule_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proposals"
  ON public.ai_schedule_proposals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proposals"
  ON public.ai_schedule_proposals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own proposals"
  ON public.ai_schedule_proposals FOR UPDATE
  USING (auth.uid() = user_id);


-- 5. Auto-update profile verification scores on insert/delete
CREATE OR REPLACE FUNCTION update_verification_scores()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;

  UPDATE public.profiles
  SET
    ai_verification_avg = (
      SELECT COALESCE(ROUND(AVG(ai_rating)::numeric, 2), 0)
      FROM public.task_verifications
      WHERE user_id = target_user_id
    ),
    ai_verification_count = (
      SELECT COUNT(*)
      FROM public.task_verifications
      WHERE user_id = target_user_id
    )
  WHERE id = target_user_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_verification_insert
  AFTER INSERT ON public.task_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_scores();

CREATE TRIGGER on_verification_delete
  AFTER DELETE ON public.task_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_scores();
