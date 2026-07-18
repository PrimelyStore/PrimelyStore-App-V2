// supabase/functions/mercado-livre-fees-quote/index.ts

import {
  calcularComissaoML,
  calcularMargemLucroROI,
  calcularPrecoMinimoRecomendado,
  validarEntradaFeesQuote,
} from "./_helpers_ml_fees.ts";

import {
  calcularFreteEnvios,
  sanitizarPayloadML,
} from "./_helpers_ml_shipping.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // Nota de Seguranca: Substituir por origem especifica em producao
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function handleMercadoLivreFeesQuote(
  req: Request,
  checkAuth?: (authHeader: string | null) => boolean,
): Promise<Response> {
  // 1. OPTIONS (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: CORS_HEADERS,
    });
  }

  // 2. Apenas POST permitido
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Metodo nao permitido. Use POST." }),
      {
        status: 405,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    // 3. Validacao de Authorization
    const authHeader = req.headers.get("Authorization");

    let envToken: string | undefined = undefined;
    try {
      envToken = Deno.env.get("PRIMELY_INTERNAL_FUNCTION_TOKEN");
    } catch (_err) {
      // Ignora erro de permissao de env nos testes offline
    }

    const isAuthorized = checkAuth
      ? checkAuth(authHeader)
      : (authHeader !== null && envToken !== undefined &&
        authHeader === `Bearer ${envToken}`);

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Nao autorizado. Token invalido ou ausente." }),
        {
          status: 401,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // 4. Validacao de JSON
    let body: unknown;
    try {
      body = await req.json();
    } catch (_err) {
      return new Response(
        JSON.stringify({ error: "JSON de entrada malformado ou invalido." }),
        {
          status: 400,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Sanitizar payload contra chaves/valores sensiveis
    const bodySanitizado = sanitizarPayloadML(body);

    if (!bodySanitizado || typeof bodySanitizado !== "object") {
      return new Response(
        JSON.stringify({ error: "Erro de validacao: Payload invalido." }),
        {
          status: 400,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // 5. Validar os campos basicos usando o helper
    let dadosValidados;
    try {
      dadosValidados = validarEntradaFeesQuote(bodySanitizado);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      return new Response(
        JSON.stringify({ error: `Erro de validacao: ${msg}` }),
        {
          status: 400,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const {
      mapeamento_id,
      preco_consultado,
      category_id,
      listing_type_id,
      cogs,
      aliquota_imposto,
      custo_logistico_sem_frete = 0,
      custo_logistico_frete_gratis = 0,
    } = dadosValidados;

    // 6. Validar peso e reputacao opcionais lidos EXCLUSIVAMENTE do bodySanitizado
    const bodyObj = bodySanitizado as Record<string, unknown>;
    const pesoGramas = bodyObj.peso_gramas;
    const reputacao = bodyObj.reputacao;

    let freteCalculado = 0;
    let reputacaoNormalizada = "none";
    let custoLogisticoFreteGratisFinal = custo_logistico_frete_gratis;

    const warnings: string[] = [];

    if (pesoGramas !== undefined && pesoGramas !== null) {
      if (
        typeof pesoGramas !== "number" || !Number.isFinite(pesoGramas) ||
        pesoGramas < 0
      ) {
        return new Response(
          JSON.stringify({
            error: "peso_gramas deve ser um numero finito nao negativo.",
          }),
          {
            status: 400,
            headers: {
              ...CORS_HEADERS,
              "Content-Type": "application/json",
            },
          },
        );
      }

      let reputacaoValida = "none";
      if (reputacao !== undefined && reputacao !== null) {
        if (typeof reputacao !== "string") {
          return new Response(
            JSON.stringify({ error: "reputacao deve ser uma string." }),
            {
              status: 400,
              headers: {
                ...CORS_HEADERS,
                "Content-Type": "application/json",
              },
            },
          );
        }
        reputacaoValida = reputacao;
      } else {
        warnings.push(
          "Reputacao omitida. Usando reputacao 'none' por padrao para o calculo de frete.",
        );
      }

      try {
        freteCalculado = calcularFreteEnvios(pesoGramas, reputacaoValida);
        reputacaoNormalizada = reputacaoValida.trim().toLowerCase();
        // Se custo_logistico_frete_gratis nao foi passado ou e zero, usamos o frete calculado
        if (
          !custo_logistico_frete_gratis || custo_logistico_frete_gratis === 0
        ) {
          custoLogisticoFreteGratisFinal = freteCalculado;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        return new Response(
          JSON.stringify({ error: `Erro no calculo de frete: ${msg}` }),
          {
            status: 400,
            headers: {
              ...CORS_HEADERS,
              "Content-Type": "application/json",
            },
          },
        );
      }
    }

    // 7. Calcular comissao
    const comissaoInfo = calcularComissaoML(
      preco_consultado,
      category_id,
      listing_type_id,
    );

    // 8. Definir custo logistico aplicado na margem
    const custoLogisticoAplicado = preco_consultado < 79.00
      ? custo_logistico_sem_frete
      : custoLogisticoFreteGratisFinal;

    // 9. Calcular margem
    const margemInfo = calcularMargemLucroROI(
      preco_consultado,
      cogs,
      aliquota_imposto,
      comissaoInfo.totalComissao,
      custoLogisticoAplicado,
    );

    // 10. Calcular Preco Minimo Recomendado (Break-even)
    const precoMinimo = calcularPrecoMinimoRecomendado(
      cogs,
      aliquota_imposto,
      category_id,
      listing_type_id,
      custo_logistico_sem_frete,
      custoLogisticoFreteGratisFinal,
    );

    // 11. Validar alertas e warnings
    if (margemInfo.lucroLiquido < 0) {
      warnings.push("Lucro liquido negativo detectado na simulacao.");
    }
    if (preco_consultado < precoMinimo) {
      warnings.push(
        `Preco consultado (R$ ${
          preco_consultado.toFixed(2)
        }) esta abaixo do break-even estimado (R$ ${precoMinimo.toFixed(2)}).`,
      );
    }

    // 12. Retornar resposta formatada
    const resposta = {
      status: "sucesso",
      origem: "simulacao_mock",
      payload_recebido: {
        mapeamento_id,
        preco_consultado,
        category_id,
        listing_type_id,
        cogs,
        aliquota_imposto,
        custo_logistico_sem_frete,
        custo_logistico_frete_gratis: custoLogisticoFreteGratisFinal,
      },
      calculos: {
        comissao: {
          taxaPercentual: comissaoInfo.taxaPercentual,
          valorComissao: comissaoInfo.valorComissao,
          tarifaFixa: comissaoInfo.tarifaFixa,
          totalComissao: comissaoInfo.totalComissao,
        },
        frete_e_logistica: {
          custo_logistico_aplicado: custoLogisticoAplicado,
          reputacao_normalizada: reputacaoNormalizada,
          peso_gramas: pesoGramas !== undefined ? pesoGramas : null,
          frete_calculado: pesoGramas !== undefined ? freteCalculado : null,
        },
        margem: {
          lucroLiquido: margemInfo.lucroLiquido,
          margemLiquida: margemInfo.margemLiquida,
          roi: margemInfo.roi,
        },
        break_even: {
          preco_minimo_recomendado: precoMinimo,
        },
      },
      warnings,
    };

    return new Response(JSON.stringify(resposta), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    });
  } catch (err: unknown) {
    console.error("Erro interno detectado no processamento da simulacao.");
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor." }),
      {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      },
    );
  }
}

if (import.meta.main) {
  Deno.serve((req) => handleMercadoLivreFeesQuote(req));
}
