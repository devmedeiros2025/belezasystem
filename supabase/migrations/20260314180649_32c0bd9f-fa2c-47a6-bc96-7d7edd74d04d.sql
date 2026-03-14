
-- Planos
CREATE TABLE public.planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  preco_mensal numeric NOT NULL DEFAULT 0,
  preco_anual numeric NOT NULL DEFAULT 0,
  max_usuarios integer NOT NULL DEFAULT 5,
  max_profissionais integer NOT NULL DEFAULT 5,
  modulos_ativos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read planos" ON public.planos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin can insert planos" ON public.planos FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update planos" ON public.planos FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete planos" ON public.planos FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'));

-- Assinaturas
CREATE TABLE public.assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id uuid NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  plano_id uuid REFERENCES public.planos(id),
  status text NOT NULL DEFAULT 'Activo',
  ciclo text NOT NULL DEFAULT 'Mensal',
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_expiracao date,
  valor_cobrado numeric NOT NULL DEFAULT 0,
  gateway_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage all assinaturas" ON public.assinaturas FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Establishment can view own assinaturas" ON public.assinaturas FOR SELECT TO authenticated USING (
  estabelecimento_id IN (SELECT estabelecimento_id FROM profiles WHERE user_id = auth.uid())
);

-- Tickets
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id uuid NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT 'Geral',
  prioridade text NOT NULL DEFAULT 'Média',
  status text NOT NULL DEFAULT 'Aberto',
  atribuido_a text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolvido_at timestamptz
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage all tickets" ON public.tickets FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Establishment can view own tickets" ON public.tickets FOR SELECT TO authenticated USING (
  estabelecimento_id IN (SELECT estabelecimento_id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Establishment can insert own tickets" ON public.tickets FOR INSERT TO authenticated WITH CHECK (
  estabelecimento_id IN (SELECT estabelecimento_id FROM profiles WHERE user_id = auth.uid())
);

-- Ticket mensagens
CREATE TABLE public.ticket_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL,
  corpo text NOT NULL,
  is_interno boolean NOT NULL DEFAULT false,
  is_superadmin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage all ticket_msgs" ON public.ticket_mensagens FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Establishment can view own ticket msgs" ON public.ticket_mensagens FOR SELECT TO authenticated USING (
  ticket_id IN (SELECT id FROM tickets WHERE estabelecimento_id IN (SELECT estabelecimento_id FROM profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "Establishment can insert own ticket msgs" ON public.ticket_mensagens FOR INSERT TO authenticated WITH CHECK (
  ticket_id IN (SELECT id FROM tickets WHERE estabelecimento_id IN (SELECT estabelecimento_id FROM profiles WHERE user_id = auth.uid()))
);

-- Changelog
CREATE TABLE public.changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  versao text NOT NULL,
  titulo text NOT NULL,
  resumo text,
  data_publicacao date NOT NULL DEFAULT CURRENT_DATE,
  publicado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read changelog" ON public.changelog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin can insert changelog" ON public.changelog FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update changelog" ON public.changelog FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete changelog" ON public.changelog FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'));

-- Changelog itens
CREATE TABLE public.changelog_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  changelog_id uuid NOT NULL REFERENCES public.changelog(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'Nova funcionalidade',
  descricao text NOT NULL,
  modulo_afetado text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.changelog_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read changelog_itens" ON public.changelog_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin can insert changelog_itens" ON public.changelog_itens FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update changelog_itens" ON public.changelog_itens FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete changelog_itens" ON public.changelog_itens FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'));
