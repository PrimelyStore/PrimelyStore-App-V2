-- Migration: Adicionar tabela de cotacoes de taxas e estender tabela de precificacao
-- Target: Supabase / PostgreSQL (Fase 5.3C-4B)
-- Description: Cria a tabela marketplace_fee_quotes e altera a produtos_precificacao para adicionar colunas de origem, caches calculados, fee_quote_id e atualizado_por com RLS e trigger de auditoria.

-- Redefinir funcao de trigger para atualizado_por de forma resiliente a nulos em updates em background
CREATE OR REPLACE FUNCTION public.definir_atualizado_por()
RETURNS trigger AS $$
BEGIN
    -- Se auth.uid() for nulo (ex: atualizacoes do sistema/Edge Functions/n8n), preserva o usuario anterior
    IF auth.uid() IS NULL THEN
        IF TG_OP = 'UPDATE' THEN
            new.atualizado_por = old.atualizado_por;
        END IF;
    ELSE
        new.atualizado_por = auth.uid();
    END IF;
    return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── TABELA 1: public.marketplace_fee_quotes ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_fee_quotes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id uuid NULL REFERENCES public.produtos(id) ON DELETE SET NULL,
    canal_venda_id uuid NULL REFERENCES public.canais_venda(id) ON DELETE SET NULL,
    produto_sku_snapshot text NOT null,
    canal_nome_snapshot text NOT null,
    origem text NOT null DEFAULT 'api' CONSTRAINT check_origem_quote CHECK (origem IN ('api', 'manual', 'matriz', 'configuracao_interna', 'estimativa_padrao')),
    marketplace text NOT null CONSTRAINT check_marketplace_quote CHECK (marketplace IN ('amazon', 'mercado_livre', 'shopee', 'venda_manual')),
    tipo_consulta text,
    preco_consultado numeric NOT null DEFAULT 0 CONSTRAINT check_preco_consultado CHECK (preco_consultado >= 0),
    taxa_marketplace_calculada numeric NOT null DEFAULT 0 CONSTRAINT check_taxa_marketplace_calc CHECK (taxa_marketplace_calculada >= 0),
    taxa_logistica_calculada numeric NOT null DEFAULT 0 CONSTRAINT check_taxa_logistica_calc CHECK (taxa_logistica_calculada >= 0),
    custo_total_calculado numeric NOT null DEFAULT 0 CONSTRAINT check_custo_total_calc CHECK (custo_total_calculado >= 0),
    payload_bruto jsonb,
    status text NOT null DEFAULT 'sucesso' CONSTRAINT check_status_quote CHECK (status IN ('sucesso', 'erro')),
    erro text,
    consultado_em timestamptz NOT null DEFAULT now(),
    created_at timestamptz NOT null DEFAULT now()
);

-- Indices para otimizacao de consultas e relatorios
-- Nota: Os indices B-tree no Postgres continuam indexando e funcionando perfeitamente mesmo com campos nullable.
CREATE INDEX IF NOT EXISTS idx_fee_quotes_prod_canal 
    ON public.marketplace_fee_quotes(produto_id, canal_venda_id);
CREATE INDEX IF NOT EXISTS idx_fee_quotes_consultado_em 
    ON public.marketplace_fee_quotes(consultado_em);

-- Habilitar RLS
ALTER TABLE public.marketplace_fee_quotes ENABLE ROW LEVEL SECURITY;

-- Limpar policies existentes antes de criar novas (Garante idempotencia)
DROP POLICY IF EXISTS select_authenticated_fee_quotes ON public.marketplace_fee_quotes;
DROP POLICY IF EXISTS select_financeiro_fee_quotes ON public.marketplace_fee_quotes;
DROP POLICY IF EXISTS insert_financeiro_fee_quotes ON public.marketplace_fee_quotes;
DROP POLICY IF EXISTS update_financeiro_fee_quotes ON public.marketplace_fee_quotes;
DROP POLICY IF EXISTS delete_admin_fee_quotes ON public.marketplace_fee_quotes;

-- Politicas de RLS para marketplace_fee_quotes
-- Nota: Por se tratar de um historico/log de cotacoes imutavel, nao ha policy de UPDATE.
-- Nota: Leitura restrita ao financeiro/admin para proteger o payload_bruto que contem dados sensiveis.
CREATE POLICY select_financeiro_fee_quotes ON public.marketplace_fee_quotes
    FOR SELECT TO authenticated USING (public.usuario_pode_acessar_financeiro());

CREATE POLICY insert_financeiro_fee_quotes ON public.marketplace_fee_quotes
    FOR INSERT TO authenticated WITH CHECK (public.usuario_pode_escrever_financeiro());

CREATE POLICY delete_admin_fee_quotes ON public.marketplace_fee_quotes
    FOR DELETE TO authenticated USING (public.usuario_e_admin());


-- ─── TABELA 2: public.produtos_precificacao (Extensao estrita de colunas) ───────
ALTER TABLE public.produtos_precificacao
    ADD COLUMN origem_taxa_marketplace text NOT null DEFAULT 'manual' CONSTRAINT check_origem_taxa_mp CHECK (origem_taxa_marketplace IN ('api', 'manual', 'matriz', 'configuracao_interna', 'estimativa_padrao')),
    ADD COLUMN origem_taxa_logistica text NOT null DEFAULT 'manual' CONSTRAINT check_origem_taxa_log CHECK (origem_taxa_logistica IN ('api', 'manual', 'matriz', 'configuracao_interna', 'estimativa_padrao')),
    ADD COLUMN origem_custo_prep_center text NOT null DEFAULT 'configuracao_interna' CONSTRAINT check_origem_custo_prep CHECK (origem_custo_prep_center IN ('api', 'manual', 'matriz', 'configuracao_interna', 'estimativa_padrao')),
    ADD COLUMN origem_imposto text NOT null DEFAULT 'configuracao_interna' CONSTRAINT check_origem_imp CHECK (origem_imposto IN ('api', 'manual', 'matriz', 'configuracao_interna', 'estimativa_padrao')),
    ADD COLUMN taxa_marketplace_calculada numeric NOT null DEFAULT 0 CONSTRAINT check_taxa_mp_calculada CHECK (taxa_marketplace_calculada >= 0),
    ADD COLUMN taxa_logistica_calculada numeric NOT null DEFAULT 0 CONSTRAINT check_taxa_log_calculada CHECK (taxa_logistica_calculada >= 0),
    ADD COLUMN custo_prep_center_calculado numeric NOT null DEFAULT 0 CONSTRAINT check_custo_prep_calculado CHECK (custo_prep_center_calculado >= 0),
    ADD COLUMN imposto_estimado_calculado numeric NOT null DEFAULT 0 CONSTRAINT check_imposto_est_calculado CHECK (imposto_estimado_calculado >= 0),
    ADD COLUMN data_ultima_consulta_api timestamptz,
    ADD COLUMN fee_quote_id uuid REFERENCES public.marketplace_fee_quotes(id) ON DELETE SET NULL,
    ADD COLUMN atualizado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Indices uteis para a extensao de produtos_precificacao
CREATE INDEX IF NOT EXISTS idx_prod_prec_fee_quote 
    ON public.produtos_precificacao(fee_quote_id);
CREATE INDEX IF NOT EXISTS idx_prod_prec_atualizado_por 
    ON public.produtos_precificacao(atualizado_por);

-- Trigger de auditoria para preenchimento de atualizado_por via auth.uid()
-- Dependencia: A funcao public.definir_atualizado_por() foi redefinida no inicio deste script.
DROP TRIGGER IF EXISTS trigger_produtos_precificacao_atualizado_por ON public.produtos_precificacao;
CREATE TRIGGER trigger_produtos_precificacao_atualizado_por
    BEFORE INSERT OR UPDATE ON public.produtos_precificacao
    FOR EACH ROW
    EXECUTE FUNCTION public.definir_atualizado_por();
