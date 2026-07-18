-- Seed: Carga inicial de comissões genéricas e estimativas padrão por canal de venda
-- Target: Supabase / PostgreSQL (Fase 5.3C-3)
-- Description: Insere comissões estimadas de fallback na tabela tarifas_comissoes_marketplaces usando blocos anônimos para resolução dinâmica de chaves de canais e ON CONFLICT para idempotência.

-- NOTA DE GOVERNANÇA:
-- Estes valores são estimativas padrão e fallbacks manuais de comissões de marketplaces. 
-- Eles servem para cotação e simulação gerencial inicial no painel do Primely Store.
-- Eles NÃO substituem as taxas oficiais cobradas e faturadas de fato pelas plataformas.
-- Em fases futuras, estes dados serão complementados e validados por APIs dinâmicas oficiais dos canais (ex: Amazon SP-API e API Mercado Livre) e por overrides manuais do gestor.

DO $$
DECLARE
    r_canal record;
BEGIN
    -- ─── 1. SEED COMISSÃO AMAZON (FBA E FBM) ──────────────────────────────────
    FOR r_canal IN (SELECT id, nome FROM public.canais_venda WHERE tipo = 'amazon') LOOP
        RAISE NOTICE 'Populando comissão padrão para canal Amazon: %', r_canal.nome;
        INSERT INTO public.tarifas_comissoes_marketplaces (
            canal_venda_id, 
            categoria_nome, 
            comissao_percentual, 
            taxa_fixa_abaixo_limiar, 
            limiar_preco_taxa_fixa, 
            status
        )
        VALUES (
            r_canal.id, 
            'Padrão Geral', 
            15.00, 
            0, 
            0, 
            'ativo'
        )
        ON CONFLICT (canal_venda_id, categoria_nome) DO UPDATE
        SET comissao_percentual = EXCLUDED.comissao_percentual,
            taxa_fixa_abaixo_limiar = EXCLUDED.taxa_fixa_abaixo_limiar,
            limiar_preco_taxa_fixa = EXCLUDED.limiar_preco_taxa_fixa,
            status = EXCLUDED.status,
            updated_at = now();
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM public.canais_venda WHERE tipo = 'amazon') THEN
        RAISE NOTICE 'Aviso: Nenhum canal cadastrado do tipo amazon foi encontrado para seed de comissão.';
    END IF;

    -- ─── 2. SEED COMISSÃO MERCADO LIVRE (FULL E FLEX) ─────────────────────────
    FOR r_canal IN (SELECT id, nome FROM public.canais_venda WHERE tipo = 'mercado_livre') LOOP
        RAISE NOTICE 'Populando comissões padrão para canal Mercado Livre: %', r_canal.nome;
        
        -- Mercado Livre Clássico (Fallback base)
        INSERT INTO public.tarifas_comissoes_marketplaces (
            canal_venda_id, 
            categoria_nome, 
            comissao_percentual, 
            taxa_fixa_abaixo_limiar, 
            limiar_preco_taxa_fixa, 
            status
        )
        VALUES (
            r_canal.id, 
            'Padrão Geral Clássico', 
            11.50, 
            5.50, 
            79.00, 
            'ativo'
        )
        ON CONFLICT (canal_venda_id, categoria_nome) DO UPDATE
        SET comissao_percentual = EXCLUDED.comissao_percentual,
            taxa_fixa_abaixo_limiar = EXCLUDED.taxa_fixa_abaixo_limiar,
            limiar_preco_taxa_fixa = EXCLUDED.limiar_preco_taxa_fixa,
            status = EXCLUDED.status,
            updated_at = now();

        -- Mercado Livre Premium (Fallback base)
        INSERT INTO public.tarifas_comissoes_marketplaces (
            canal_venda_id, 
            categoria_nome, 
            comissao_percentual, 
            taxa_fixa_abaixo_limiar, 
            limiar_preco_taxa_fixa, 
            status
        )
        VALUES (
            r_canal.id, 
            'Padrão Geral Premium', 
            16.50, 
            5.50, 
            79.00, 
            'ativo'
        )
        ON CONFLICT (canal_venda_id, categoria_nome) DO UPDATE
        SET comissao_percentual = EXCLUDED.comissao_percentual,
            taxa_fixa_abaixo_limiar = EXCLUDED.taxa_fixa_abaixo_limiar,
            limiar_preco_taxa_fixa = EXCLUDED.limiar_preco_taxa_fixa,
            status = EXCLUDED.status,
            updated_at = now();
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM public.canais_venda WHERE tipo = 'mercado_livre') THEN
        RAISE NOTICE 'Aviso: Nenhum canal cadastrado do tipo mercado_livre foi encontrado para seed de comissão.';
    END IF;

    -- ─── 3. SEED COMISSÃO SHOPEE ──────────────────────────────────────────────
    FOR r_canal IN (SELECT id, nome FROM public.canais_venda WHERE tipo = 'shopee') LOOP
        RAISE NOTICE 'Populando comissão padrão para canal Shopee: %', r_canal.nome;
        INSERT INTO public.tarifas_comissoes_marketplaces (
            canal_venda_id, 
            categoria_nome, 
            comissao_percentual, 
            taxa_fixa_abaixo_limiar, 
            limiar_preco_taxa_fixa, 
            status
        )
        VALUES (
            r_canal.id, 
            'Padrão Geral', 
            18.00, 
            0, 
            0, 
            'ativo'
        )
        ON CONFLICT (canal_venda_id, categoria_nome) DO UPDATE
        SET comissao_percentual = EXCLUDED.comissao_percentual,
            taxa_fixa_abaixo_limiar = EXCLUDED.taxa_fixa_abaixo_limiar,
            limiar_preco_taxa_fixa = EXCLUDED.limiar_preco_taxa_fixa,
            status = EXCLUDED.status,
            updated_at = now();
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM public.canais_venda WHERE tipo = 'shopee') THEN
        RAISE NOTICE 'Aviso: Nenhum canal cadastrado do tipo shopee foi encontrado para seed de comissão.';
    END IF;

    -- ─── 4. SEED COMISSÃO VENDA MANUAL ────────────────────────────────────────
    FOR r_canal IN (SELECT id, nome FROM public.canais_venda WHERE tipo = 'venda_manual') LOOP
        RAISE NOTICE 'Populando comissão padrão para canal Venda Manual: %', r_canal.nome;
        INSERT INTO public.tarifas_comissoes_marketplaces (
            canal_venda_id, 
            categoria_nome, 
            comissao_percentual, 
            taxa_fixa_abaixo_limiar, 
            limiar_preco_taxa_fixa, 
            status
        )
        VALUES (
            r_canal.id, 
            'Padrão Geral', 
            0.00, 
            0, 
            0, 
            'ativo'
        )
        ON CONFLICT (canal_venda_id, categoria_nome) DO UPDATE
        SET comissao_percentual = EXCLUDED.comissao_percentual,
            taxa_fixa_abaixo_limiar = EXCLUDED.taxa_fixa_abaixo_limiar,
            limiar_preco_taxa_fixa = EXCLUDED.limiar_preco_taxa_fixa,
            status = EXCLUDED.status,
            updated_at = now();
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM public.canais_venda WHERE tipo = 'venda_manual') THEN
        RAISE NOTICE 'Aviso: Nenhum canal cadastrado do tipo venda_manual foi encontrado para seed de comissão.';
    END IF;
END $$;
