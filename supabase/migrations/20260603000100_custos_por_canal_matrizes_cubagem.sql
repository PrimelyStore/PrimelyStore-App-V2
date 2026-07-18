-- Migration: Criar matrizes tarifárias de comissões e frete por canal e dimensões gerenciais
-- Target: Supabase / PostgreSQL (Fase 5.3C-1)
-- Description: Cria as tabelas tarifas_comissoes_marketplaces, tarifas_logistica_mercado_livre, tarifas_logistica_amazon e produtos_dimensoes_gerenciais com RLS, índices e triggers.

-- 1. Função de trigger para preencher automaticamente o atualizado_por via auth.uid()
CREATE OR REPLACE FUNCTION public.definir_atualizado_por()
RETURNS trigger AS $$
BEGIN
  new.atualizado_por = auth.uid();
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── TABELA 1: public.tarifas_comissoes_marketplaces ──────────────────────────
CREATE TABLE IF NOT EXISTS public.tarifas_comissoes_marketplaces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    canal_venda_id uuid NOT null REFERENCES public.canais_venda(id) ON DELETE CASCADE,
    categoria_nome text NOT null,
    comissao_percentual numeric NOT null DEFAULT 0 CHECK (comissao_percentual >= 0),
    taxa_fixa_abaixo_limiar numeric NOT null DEFAULT 0 CHECK (taxa_fixa_abaixo_limiar >= 0),
    limiar_preco_taxa_fixa numeric NOT null DEFAULT 0 CHECK (limiar_preco_taxa_fixa >= 0),
    status text NOT null DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at timestamptz NOT null DEFAULT now(),
    updated_at timestamptz NOT null DEFAULT now(),
    CONSTRAINT unique_comissoes_canal_categoria UNIQUE (canal_venda_id, categoria_nome)
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_tarifas_comissoes_canal_venda 
    ON public.tarifas_comissoes_marketplaces(canal_venda_id);
CREATE INDEX IF NOT EXISTS idx_tarifas_comissoes_categoria 
    ON public.tarifas_comissoes_marketplaces(categoria_nome);
CREATE INDEX IF NOT EXISTS idx_tarifas_comissoes_status 
    ON public.tarifas_comissoes_marketplaces(status);

-- RLS
ALTER TABLE public.tarifas_comissoes_marketplaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_authenticated_tarifas_comissoes ON public.tarifas_comissoes_marketplaces
    FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_financeiro_tarifas_comissoes ON public.tarifas_comissoes_marketplaces
    FOR INSERT TO authenticated WITH CHECK (public.usuario_pode_escrever_financeiro());

CREATE POLICY update_financeiro_tarifas_comissoes ON public.tarifas_comissoes_marketplaces
    FOR UPDATE TO authenticated USING (public.usuario_pode_escrever_financeiro()) WITH CHECK (public.usuario_pode_escrever_financeiro());

CREATE POLICY delete_admin_tarifas_comissoes ON public.tarifas_comissoes_marketplaces
    FOR DELETE TO authenticated USING (public.usuario_e_admin());

-- Trigger set_updated_at
DROP TRIGGER IF EXISTS trigger_comissoes_updated_at ON public.tarifas_comissoes_marketplaces;
CREATE TRIGGER trigger_comissoes_updated_at
    BEFORE UPDATE ON public.tarifas_comissoes_marketplaces
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- ─── TABELA 2: public.tarifas_logistica_mercado_livre ─────────────────────────
CREATE TABLE IF NOT EXISTS public.tarifas_logistica_mercado_livre (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    modalidade text NOT null,
    peso_min_g numeric NOT null DEFAULT 0 CHECK (peso_min_g >= 0),
    peso_max_g numeric NOT null CHECK (peso_max_g >= 0),
    preco_min numeric NOT null DEFAULT 0 CHECK (preco_min >= 0),
    preco_max numeric NOT null DEFAULT 999999999 CHECK (preco_max >= 0),
    reputacao text NOT null DEFAULT 'nao_informado',
    custo_frete_gratis numeric NOT null DEFAULT 0 CHECK (custo_frete_gratis >= 0),
    desconto_frete_percentual numeric NOT null DEFAULT 0 CHECK (desconto_frete_percentual >= 0),
    custo_envio_pago numeric NOT null DEFAULT 0 CHECK (custo_envio_pago >= 0),
    status text NOT null DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at timestamptz NOT null DEFAULT now(),
    updated_at timestamptz NOT null DEFAULT now(),
    CONSTRAINT unique_logistica_ml UNIQUE (modalidade, peso_min_g, peso_max_g, preco_min, preco_max, reputacao)
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_tarifas_ml_modalidade 
    ON public.tarifas_logistica_mercado_livre(modalidade);
CREATE INDEX IF NOT EXISTS idx_tarifas_ml_peso_max 
    ON public.tarifas_logistica_mercado_livre(peso_max_g);
CREATE INDEX IF NOT EXISTS idx_tarifas_ml_reputacao 
    ON public.tarifas_logistica_mercado_livre(reputacao);
CREATE INDEX IF NOT EXISTS idx_tarifas_ml_status 
    ON public.tarifas_logistica_mercado_livre(status);

-- RLS
ALTER TABLE public.tarifas_logistica_mercado_livre ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_authenticated_tarifas_ml ON public.tarifas_logistica_mercado_livre
    FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_financeiro_tarifas_ml ON public.tarifas_logistica_mercado_livre
    FOR INSERT TO authenticated WITH CHECK (public.usuario_pode_escrever_financeiro());

CREATE POLICY update_financeiro_tarifas_ml ON public.tarifas_logistica_mercado_livre
    FOR UPDATE TO authenticated USING (public.usuario_pode_escrever_financeiro()) WITH CHECK (public.usuario_pode_escrever_financeiro());

CREATE POLICY delete_admin_tarifas_ml ON public.tarifas_logistica_mercado_livre
    FOR DELETE TO authenticated USING (public.usuario_e_admin());

-- Trigger set_updated_at
DROP TRIGGER IF EXISTS trigger_ml_logistica_updated_at ON public.tarifas_logistica_mercado_livre;
CREATE TRIGGER trigger_ml_logistica_updated_at
    BEFORE UPDATE ON public.tarifas_logistica_mercado_livre
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- ─── TABELA 3: public.tarifas_logistica_amazon ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tarifas_logistica_amazon (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    modalidade text NOT null,
    tamanho_categoria text NOT null DEFAULT 'nao_informado',
    peso_min_g numeric NOT null DEFAULT 0 CHECK (peso_min_g >= 0),
    peso_max_g numeric NOT null CHECK (peso_max_g >= 0),
    preco_min numeric NOT null DEFAULT 0 CHECK (preco_min >= 0),
    preco_max numeric NOT null DEFAULT 999999999 CHECK (preco_max >= 0),
    custo_frete numeric NOT null DEFAULT 0 CHECK (custo_frete >= 0),
    status text NOT null DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at timestamptz NOT null DEFAULT now(),
    updated_at timestamptz NOT null DEFAULT now(),
    CONSTRAINT unique_logistica_amazon UNIQUE (modalidade, tamanho_categoria, peso_min_g, peso_max_g, preco_min, preco_max)
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_tarifas_amz_modalidade 
    ON public.tarifas_logistica_amazon(modalidade);
CREATE INDEX IF NOT EXISTS idx_tarifas_amz_tamanho 
    ON public.tarifas_logistica_amazon(tamanho_categoria);
CREATE INDEX IF NOT EXISTS idx_tarifas_amz_peso_max 
    ON public.tarifas_logistica_amazon(peso_max_g);
CREATE INDEX IF NOT EXISTS idx_tarifas_amz_status 
    ON public.tarifas_logistica_amazon(status);

-- RLS
ALTER TABLE public.tarifas_logistica_amazon ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_authenticated_tarifas_amz ON public.tarifas_logistica_amazon
    FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_financeiro_tarifas_amz ON public.tarifas_logistica_amazon
    FOR INSERT TO authenticated WITH CHECK (public.usuario_pode_escrever_financeiro());

CREATE POLICY update_financeiro_tarifas_amz ON public.tarifas_logistica_amazon
    FOR UPDATE TO authenticated USING (public.usuario_pode_escrever_financeiro()) WITH CHECK (public.usuario_pode_escrever_financeiro());

CREATE POLICY delete_admin_tarifas_amz ON public.tarifas_logistica_amazon
    FOR DELETE TO authenticated USING (public.usuario_e_admin());

-- Trigger set_updated_at
DROP TRIGGER IF EXISTS trigger_amz_logistica_updated_at ON public.tarifas_logistica_amazon;
CREATE TRIGGER trigger_amz_logistica_updated_at
    BEFORE UPDATE ON public.tarifas_logistica_amazon
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- ─── TABELA 4: public.produtos_dimensoes_gerenciais ───────────────────────────
CREATE TABLE IF NOT EXISTS public.produtos_dimensoes_gerenciais (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id uuid NOT null REFERENCES public.produtos(id) ON DELETE CASCADE,
    peso_g numeric CHECK (peso_g >= 0),
    altura_mm numeric CHECK (altura_mm >= 0),
    largura_mm numeric CHECK (largura_mm >= 0),
    comprimento_mm numeric CHECK (comprimento_mm >= 0),
    origem text NOT null DEFAULT 'manual' CHECK (origem IN ('manual', 'olist', 'amazon', 'mercado_livre', 'estimativa')),
    observacoes text,
    atualizado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT null DEFAULT now(),
    updated_at timestamptz NOT null DEFAULT now(),
    CONSTRAINT unique_dimensoes_produto_id UNIQUE (produto_id)
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_dimensoes_produto_id 
    ON public.produtos_dimensoes_gerenciais(produto_id);
CREATE INDEX IF NOT EXISTS idx_dimensoes_origem 
    ON public.produtos_dimensoes_gerenciais(origem);

-- RLS
ALTER TABLE public.produtos_dimensoes_gerenciais ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_authenticated_dimensoes ON public.produtos_dimensoes_gerenciais
    FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_financeiro_dimensoes ON public.produtos_dimensoes_gerenciais
    FOR INSERT TO authenticated WITH CHECK (public.usuario_pode_escrever_financeiro());

CREATE POLICY update_financeiro_dimensoes ON public.produtos_dimensoes_gerenciais
    FOR UPDATE TO authenticated USING (public.usuario_pode_escrever_financeiro()) WITH CHECK (public.usuario_pode_escrever_financeiro());

CREATE POLICY delete_admin_dimensoes ON public.produtos_dimensoes_gerenciais
    FOR DELETE TO authenticated USING (public.usuario_e_admin());

-- Trigger set_updated_at
DROP TRIGGER IF EXISTS trigger_dimensoes_updated_at ON public.produtos_dimensoes_gerenciais;
CREATE TRIGGER trigger_dimensoes_updated_at
    BEFORE UPDATE ON public.produtos_dimensoes_gerenciais
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Trigger definir_atualizado_por
DROP TRIGGER IF EXISTS trigger_dimensoes_atualizado_por ON public.produtos_dimensoes_gerenciais;
CREATE TRIGGER trigger_dimensoes_atualizado_por
    BEFORE INSERT OR UPDATE ON public.produtos_dimensoes_gerenciais
    FOR EACH ROW
    EXECUTE FUNCTION public.definir_atualizado_por();
