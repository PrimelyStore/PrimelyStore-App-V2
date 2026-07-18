type SyncRequestBody = {
    limit?: number
    maxPages?: number
    offset?: number
    itemDelayMs?: number
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function responderJson(body: unknown, status = 200) {
    return new Response(JSON.stringify(body, null, 2), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json; charset=utf-8',
        },
    })
}

function converterInteiroSeguro(valor: unknown, padrao: number) {
    const numero = Number(valor)

    if (!Number.isFinite(numero)) {
        return padrao
    }

    return Math.trunc(numero)
}

function limitarNumero(valor: number, minimo: number, maximo: number) {
    return Math.min(Math.max(valor, minimo), maximo)
}

async function validarUsuarioAutenticado(
    supabaseUrl: string,
    supabaseAnonKey: string,
    authorization: string
) {
    const resposta = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
            apikey: supabaseAnonKey,
            Authorization: authorization,
        },
    })

    if (!resposta.ok) {
        return null
    }

    return await resposta.json()
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return responderJson(
            {
                ok: false,
                error: 'Método não permitido. Use POST.',
            },
            405
        )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const internalToken = Deno.env.get('PRIMELY_INTERNAL_FUNCTION_TOKEN')

    if (!supabaseUrl || !supabaseAnonKey || !internalToken) {
        return responderJson(
            {
                ok: false,
                error:
                    'Configuração incompleta da Edge Function. Verifique SUPABASE_URL, SUPABASE_ANON_KEY e PRIMELY_INTERNAL_FUNCTION_TOKEN.',
            },
            500
        )
    }

    const authorization = req.headers.get('Authorization')

    if (!authorization) {
        return responderJson(
            {
                ok: false,
                error: 'Usuário não autenticado.',
            },
            401
        )
    }

    const usuario = await validarUsuarioAutenticado(
        supabaseUrl,
        supabaseAnonKey,
        authorization
    )

    if (!usuario) {
        return responderJson(
            {
                ok: false,
                error: 'Sessão inválida ou expirada.',
            },
            401
        )
    }

    const body = (await req.json().catch(() => ({}))) as SyncRequestBody

    // Limites bem conservadores.
    // A execução anterior com limit=3, maxPages=3 e delay alto estourou o limite
    // do worker do Supabase. Por isso esta função intermediária chama a função
    // real sempre em lote pequeno: 1 NF por chamada.
    const limit = limitarNumero(converterInteiroSeguro(body.limit, 1), 1, 1)
    const maxPages = limitarNumero(converterInteiroSeguro(body.maxPages, 1), 1, 1)
    const offset = limitarNumero(converterInteiroSeguro(body.offset, 0), 0, 1000)
    const itemDelayMs = limitarNumero(
        converterInteiroSeguro(body.itemDelayMs, 2000),
        1000,
        2500
    )

    const parametros = new URLSearchParams({
        limit: String(limit),
        maxPages: String(maxPages),
        offset: String(offset),
        detalhar: 'true',
        detalharItens: 'true',
        buscarFornecedores: 'true',
        marcadores: 'Compras',
        orderBy: 'desc',
        itemDelayMs: String(itemDelayMs),
        processar: 'false',
        dryRun: 'false',
    })

    const urlInterna = `${supabaseUrl}/functions/v1/olist-notas-entrada-sync?${parametros.toString()}`

    const respostaInterna = await fetch(urlInterna, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-primely-internal-token': internalToken,
        },
        body: '{}',
    })

    const textoResposta = await respostaInterna.text()
    let dadosResposta: unknown

    try {
        dadosResposta = JSON.parse(textoResposta)
    } catch {
        dadosResposta = {
            ok: false,
            error: textoResposta || 'Resposta interna sem JSON.',
        }
    }

    if (!respostaInterna.ok) {
        return responderJson(
            {
                ok: false,
                service: 'compras-olist-notas-entrada-sync',
                error: 'Erro ao chamar sincronização interna da Olist.',
                internal_status: respostaInterna.status,
                internal_response: dadosResposta,
            },
            respostaInterna.status
        )
    }

    return responderJson({
        ...(dadosResposta as Record<string, unknown>),
        wrapper_service: 'compras-olist-notas-entrada-sync',
        wrapper_note:
            'Busca iniciada pelo app em lote pequeno. Nenhum token interno foi exposto ao navegador.',
        wrapper_lote_seguro: {
            limit,
            maxPages,
            offset,
            itemDelayMs,
            processar: false,
            dryRun: false,
        },
    })
})
