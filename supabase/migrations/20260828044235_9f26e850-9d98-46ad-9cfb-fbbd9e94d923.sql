ALTER TABLE public.convites
  ADD COLUMN IF NOT EXISTS envios integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_envio_em timestamptz;

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  nome text NOT NULL,
  assunto text NOT NULL,
  corpo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email templates"
ON public.email_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.email_templates (chave, nome, assunto, corpo) VALUES
('convite', 'Convite para a equipe', 'Convite — CRM Cabaret da Cecília',
'Olá!

Você foi convidado(a) para o CRM do Cabaret da Cecília como {{papeis}}.

Acesse e confirme seu acesso: {{link}}

Este convite expira em {{expira_em}}.

Até logo,
Direção do Cabaret da Cecília'),
('convite_reenvio', 'Lembrete de convite', 'Lembrete: seu convite do Cabaret da Cecília',
'Olá!

Notamos que seu convite para o CRM do Cabaret da Cecília ({{papeis}}) ainda está pendente.

Acesse: {{link}}

Novo prazo: {{expira_em}}.

Direção do Cabaret da Cecília')
ON CONFLICT (chave) DO NOTHING;