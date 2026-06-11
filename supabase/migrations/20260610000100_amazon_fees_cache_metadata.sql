-- Migration: 20260610000100_amazon_fees_cache_metadata.sql
-- Propósito: Evolução do schema da tabela public.marketplace_fee_quotes com metadados para suporte de cache real da Amazon Product Fees API.
-- Garantias: Esta migration não faz chamadas a serviços da Amazon, não altera o comportamento do código em index.ts e não popula dados. Ela apenas estende a tabela gerencial para fins de lookup e cache futuro.

-- 1. Adição de colunas para metadados de cache e auditoria
ALTER TABLE public.marketplace_fee_quotes
    ADD COLUMN IF NOT EXISTS modo_consulta text,
    ADD COLUMN IF NOT EXISTS identificador_usado text,
    ADD COLUMN IF NOT EXISTS seller_sku_usado text,
    ADD COLUMN IF NOT EXISTS asin_usado text,
    ADD COLUMN IF NOT EXISTS moeda text NOT NULL DEFAULT 'BRL',
    ADD COLUMN IF NOT EXISTS is_amazon_fulfilled boolean,
    ADD COLUMN IF NOT EXISTS payload_request_sanitizado jsonb,
    ADD COLUMN IF NOT EXISTS erro_codigo text,
    ADD COLUMN IF NOT EXISTS warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS valido_ate timestamptz,
    ADD COLUMN IF NOT EXISTS criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Adição de Constraints de Validação (Checks)
ALTER TABLE public.marketplace_fee_quotes
    DROP CONSTRAINT IF EXISTS chk_marketplace_fee_quotes_modo_consulta,
    ADD CONSTRAINT chk_marketplace_fee_quotes_modo_consulta
        CHECK (modo_consulta IN ('auto', 'sku', 'asin', 'batch')),

    DROP CONSTRAINT IF EXISTS chk_marketplace_fee_quotes_identificador_usado,
    ADD CONSTRAINT chk_marketplace_fee_quotes_identificador_usado
        CHECK (identificador_usado IN ('sku', 'asin')),

    DROP CONSTRAINT IF EXISTS chk_marketplace_fee_quotes_moeda,
    ADD CONSTRAINT chk_marketplace_fee_quotes_moeda
        CHECK (length(moeda) = 3 AND moeda = upper(moeda)),

    DROP CONSTRAINT IF EXISTS chk_marketplace_fee_quotes_warnings,
    ADD CONSTRAINT chk_marketplace_fee_quotes_warnings
        CHECK (jsonb_typeof(warnings) = 'array');

-- 3. Criação do Índice de Lookup do Cache (não exclusivo)
CREATE INDEX IF NOT EXISTS idx_fee_quotes_cache_lookup
    ON public.marketplace_fee_quotes (
        mapeamento_id,
        preco_consultado,
        moeda,
        is_amazon_fulfilled,
        modo_consulta,
        identificador_usado,
        status,
        valido_ate DESC
    );

-- 4. Criação do Trigger de updated_at usando a função existente public.set_updated_at()
DROP TRIGGER IF EXISTS set_marketplace_fee_quotes_updated_at ON public.marketplace_fee_quotes;

CREATE TRIGGER set_marketplace_fee_quotes_updated_at
    BEFORE UPDATE ON public.marketplace_fee_quotes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
