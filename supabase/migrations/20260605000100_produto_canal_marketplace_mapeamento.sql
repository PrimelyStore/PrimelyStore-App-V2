-- Migration: Planejar mapeamento produto-canal-marketplace para cotacoes de taxas por API
-- Target: Supabase / PostgreSQL (Fase 5.4E)
-- Description: Cria a tabela produto_canal_marketplace_mapeamento e adiciona rastreabilidade de mapeamento/aplicacao em marketplace_fee_quotes.

-- Tabela de mapeamento gerencial entre produto interno, canal e contexto de marketplace.
CREATE TABLE IF NOT EXISTS public.produto_canal_marketplace_mapeamento (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    canal_venda_id uuid NOT NULL REFERENCES public.canais_venda(id) ON DELETE CASCADE,

    marketplace text NOT NULL,
    seller_sku text NULL,
    asin text NULL,
    marketplace_id text NULL,

    item_id text NULL,
    category_id text NULL,
    listing_type_id text NULL,
    logistic_type text NULL,
    shipping_mode text NULL,
    free_shipping boolean NULL,

    is_amazon_fulfilled boolean NULL,

    moeda text NOT NULL DEFAULT 'BRL',
    manual_override boolean NOT NULL DEFAULT false,
    validade_cache_horas integer NOT NULL DEFAULT 24,

    status text NOT NULL DEFAULT 'ativo',
    observacoes text NULL,
    atualizado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT check_pcm_marketplace
        CHECK (marketplace IN ('amazon', 'mercado_livre', 'shopee', 'venda_manual')),
    CONSTRAINT check_pcm_status
        CHECK (status IN ('ativo', 'inativo')),
    CONSTRAINT check_pcm_validade_cache_horas
        CHECK (validade_cache_horas > 0),
    CONSTRAINT check_pcm_moeda_tamanho
        CHECK (char_length(moeda) = 3),
    CONSTRAINT check_pcm_moeda_upper
        CHECK (moeda = upper(moeda))
);

-- Indices de busca e filtros operacionais/gerenciais.
CREATE INDEX IF NOT EXISTS idx_pcm_produto_id
    ON public.produto_canal_marketplace_mapeamento(produto_id);

CREATE INDEX IF NOT EXISTS idx_pcm_canal_venda_id
    ON public.produto_canal_marketplace_mapeamento(canal_venda_id);

CREATE INDEX IF NOT EXISTS idx_pcm_marketplace
    ON public.produto_canal_marketplace_mapeamento(marketplace);

CREATE INDEX IF NOT EXISTS idx_pcm_status
    ON public.produto_canal_marketplace_mapeamento(status);

CREATE INDEX IF NOT EXISTS idx_pcm_seller_sku
    ON public.produto_canal_marketplace_mapeamento(seller_sku);

CREATE INDEX IF NOT EXISTS idx_pcm_asin
    ON public.produto_canal_marketplace_mapeamento(asin);

CREATE INDEX IF NOT EXISTS idx_pcm_item_id
    ON public.produto_canal_marketplace_mapeamento(item_id);

CREATE INDEX IF NOT EXISTS idx_pcm_produto_canal_status
    ON public.produto_canal_marketplace_mapeamento(produto_id, canal_venda_id, status);

-- Evita duplicidade do mesmo contexto ativo, preservando a possibilidade de multiplos anuncios/modalidades.
CREATE UNIQUE INDEX IF NOT EXISTS idx_pcm_unique_contexto_ativo
    ON public.produto_canal_marketplace_mapeamento (
        produto_id,
        canal_venda_id,
        marketplace,
        COALESCE(seller_sku, ''),
        COALESCE(asin, ''),
        COALESCE(marketplace_id, ''),
        COALESCE(item_id, ''),
        COALESCE(category_id, ''),
        COALESCE(listing_type_id, ''),
        COALESCE(logistic_type, ''),
        COALESCE(shipping_mode, ''),
        COALESCE(free_shipping::text, ''),
        COALESCE(is_amazon_fulfilled::text, '')
    )
    WHERE status = 'ativo';

-- RLS
ALTER TABLE public.produto_canal_marketplace_mapeamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_authenticated_produto_canal_marketplace_mapeamento
    ON public.produto_canal_marketplace_mapeamento
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY insert_financeiro_produto_canal_marketplace_mapeamento
    ON public.produto_canal_marketplace_mapeamento
    FOR INSERT TO authenticated
    WITH CHECK (public.usuario_pode_escrever_financeiro());

CREATE POLICY update_financeiro_produto_canal_marketplace_mapeamento
    ON public.produto_canal_marketplace_mapeamento
    FOR UPDATE TO authenticated
    USING (public.usuario_pode_escrever_financeiro())
    WITH CHECK (public.usuario_pode_escrever_financeiro());

CREATE POLICY delete_admin_produto_canal_marketplace_mapeamento
    ON public.produto_canal_marketplace_mapeamento
    FOR DELETE TO authenticated
    USING (public.usuario_e_admin());

-- Triggers de auditoria.
DROP TRIGGER IF EXISTS trigger_pcm_updated_at
    ON public.produto_canal_marketplace_mapeamento;

CREATE TRIGGER trigger_pcm_updated_at
    BEFORE UPDATE ON public.produto_canal_marketplace_mapeamento
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_pcm_atualizado_por
    ON public.produto_canal_marketplace_mapeamento;

CREATE TRIGGER trigger_pcm_atualizado_por
    BEFORE INSERT OR UPDATE ON public.produto_canal_marketplace_mapeamento
    FOR EACH ROW
    EXECUTE FUNCTION public.definir_atualizado_por();

-- Rastreabilidade das cotacoes ate o contexto de mapeamento usado.
ALTER TABLE public.marketplace_fee_quotes
    ADD COLUMN mapeamento_id uuid NULL,
    ADD COLUMN aplicado_em_precificacao boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_fee_quotes_mapeamento_id
    ON public.marketplace_fee_quotes(mapeamento_id);

ALTER TABLE public.marketplace_fee_quotes
    ADD CONSTRAINT marketplace_fee_quotes_mapeamento_id_fkey
    FOREIGN KEY (mapeamento_id)
    REFERENCES public.produto_canal_marketplace_mapeamento(id)
    ON DELETE SET NULL;
