
-- Table to log user login/logout activity
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  nome text,
  evento text NOT NULL DEFAULT 'login',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Only super_admin can view all sessions
CREATE POLICY "Super admin can view all sessions"
  ON public.user_sessions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Any authenticated user can insert their own session
CREATE POLICY "Users can log own sessions"
  ON public.user_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Super admin can delete sessions
CREATE POLICY "Super admin can delete sessions"
  ON public.user_sessions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));
