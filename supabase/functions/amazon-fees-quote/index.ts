import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  montarPayloadFeesAsin,
  montarPayloadFeesSku,
  normalizarModoConsulta,
  sanitizarPayloadAmazonFees,
  validarEntradaFeesQuote,
} from "./_helpers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type FeesQuoteRequestBody = {
  mapeamento_id?: unknown;
  preco_consultado?: unknown;
  atualizar_precificacao?: unknown;
  force_refresh?: unknown;
  modo_consulta?: unknown;
  permitir_fallback_asin?: unknown;
};

type ValidatedBody = {
  mapeamento_id: string;
  preco_consultado: number;
  atualizar_precificacao: boolean;
  force_refresh: boolean;
};

type AppSupabaseClient = SupabaseClient<any, "public", any>;

type AuthContext = {
  user_id: string;
  email: string | null;
  userClient: AppSupabaseClient;
};

type MarketplaceMapping = {
  id: string;
  produto_id: string;
  canal_venda_id: string;
  marketplace: string;
  seller_sku: string | null;
  asin?: string | null;
  marketplace_id: string | null;
  is_amazon_fulfilled: boolean | null;
  status: string;
  manual_override: boolean;
  moeda?: string | null;
};

class AppError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function sanitizarErro(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Erro interno sanitizado.";
}

function errorResponse(message: string, status = 400) {
  return jsonResponse(
    {
      success: false,
      status: "erro",
      origem: "mock",
      erro: message,
    },
    status,
  );
}

function isConfigured(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function getRequiredSecret(name: string) {
  const value = Deno.env.get(name);

  if (!isConfigured(value)) {
    throw new AppError(`Secret obrigatorio nao configurado: ${name}`, 500);
  }

  return value!.trim();
}

function validarUuid(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(
      value,
    );
}

function parseBooleanDefault(value: unknown, defaultValue: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return defaultValue;
}

function validarBody(body: FeesQuoteRequestBody): ValidatedBody {
  if (!validarUuid(body.mapeamento_id)) {
    throw new AppError("mapeamento_id obrigatorio ou invalido.", 400);
  }

  const precoConsultado = Number(body.preco_consultado);
  if (!Number.isFinite(precoConsultado) || precoConsultado <= 0) {
    throw new AppError("preco_consultado deve ser maior que zero.", 400);
  }

  return {
    mapeamento_id: body.mapeamento_id as string,
    preco_consultado: precoConsultado,
    atualizar_precificacao: parseBooleanDefault(
      body.atualizar_precificacao,
      false,
    ),
    force_refresh: parseBooleanDefault(body.force_refresh, false),
  };
}

async function lerJsonBody(req: Request): Promise<FeesQuoteRequestBody> {
  try {
    return (await req.json()) as FeesQuoteRequestBody;
  } catch {
    throw new AppError("Body JSON invalido.", 400);
  }
}

async function validarAuth(req: Request): Promise<AuthContext> {
  const authorization = req.headers.get("authorization") ?? "";
  const bearerToken = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!bearerToken) {
    throw new AppError("Authorization Bearer obrigatorio.", 401);
  }

  const supabaseUrl = getRequiredSecret("SUPABASE_URL");
  const supabaseAnonKey = getRequiredSecret("SUPABASE_ANON_KEY");

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await userClient.auth.getUser();

  if (error || !data.user) {
    throw new AppError("Usuario nao autenticado ou token invalido.", 401);
  }

  return {
    user_id: data.user.id,
    email: data.user.email ?? null,
    userClient,
  };
}

async function validarPermissaoFinanceira(userClient: AppSupabaseClient) {
  const { data, error } = await userClient.rpc(
    "usuario_pode_acessar_financeiro",
  );

  if (error) {
    throw new AppError("Nao foi possivel validar permissao financeira.", 403);
  }

  if (data !== true) {
    throw new AppError("Usuario sem permissao financeira.", 403);
  }
}

async function carregarMapeamento(
  userClient: AppSupabaseClient,
  mapeamentoId: string,
) {
  const { data, error } = await userClient
    .from("produto_canal_marketplace_mapeamento")
    .select(
      "id, produto_id, canal_venda_id, marketplace, seller_sku, asin, marketplace_id, is_amazon_fulfilled, status, manual_override, moeda",
    )
    .eq("id", mapeamentoId)
    .maybeSingle();

  if (error) {
    throw new AppError("Erro ao carregar mapeamento marketplace.", 403);
  }

  if (!data) {
    throw new AppError("Mapeamento marketplace nao encontrado.", 404);
  }

  return data as MarketplaceMapping;
}

function validarMapeamentoAmazon(mapeamento: MarketplaceMapping) {
  if (mapeamento.status !== "ativo") {
    throw new AppError("Mapeamento marketplace inativo.", 400);
  }

  if (mapeamento.marketplace !== "amazon") {
    throw new AppError("Mapeamento nao pertence ao marketplace Amazon.", 400);
  }

  if (!mapeamento.seller_sku?.trim()) {
    throw new AppError("seller_sku e obrigatorio para cotacao Amazon.", 400);
  }

  if (!mapeamento.marketplace_id?.trim()) {
    throw new AppError(
      "marketplace_id e obrigatorio para cotacao Amazon.",
      400,
    );
  }

  if (
    mapeamento.is_amazon_fulfilled === null ||
    mapeamento.is_amazon_fulfilled === undefined
  ) {
    throw new AppError(
      "is_amazon_fulfilled deve estar definido para cotacao Amazon.",
      400,
    );
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Metodo nao permitido. Use POST.", 405);
  }

  try {
    const auth = await validarAuth(req);
    const bodyJson = await lerJsonBody(req);
    const body = validarBody(bodyJson);

    await validarPermissaoFinanceira(auth.userClient);

    // Se service_role for necessario em fases futuras, ele so pode
    // inicializado depois de JWT e autorizacao financeira validados.
    const mapeamento = await carregarMapeamento(
      auth.userClient,
      body.mapeamento_id,
    );

    validarMapeamentoAmazon(mapeamento);

    let modoConsulta;
    let entradaValidada;
    let resultadoPayload;
    try {
      const modoConsultaInput = bodyJson.modo_consulta ?? "auto";
      modoConsulta = normalizarModoConsulta(modoConsultaInput);

      const entradaConsolidada: Record<string, unknown> = {
        mapeamento_id: mapeamento.id,
        marketplace_id: mapeamento.marketplace_id ?? "",
        preco_consultado: body.preco_consultado,
        moeda:
          typeof mapeamento.moeda === "string" && mapeamento.moeda.trim() !== ""
            ? mapeamento.moeda
            : "BRL",
        is_amazon_fulfilled: mapeamento.is_amazon_fulfilled === true,
        seller_sku: mapeamento.seller_sku,
        asin: mapeamento.asin,
        modo_consulta: modoConsulta,
        permitir_fallback_asin: bodyJson.permitir_fallback_asin !== false,
      };

      entradaValidada = validarEntradaFeesQuote(entradaConsolidada);

      if (entradaValidada.modo_consulta === "sku") {
        resultadoPayload = montarPayloadFeesSku({
          seller_sku: entradaValidada.seller_sku!,
          marketplace_id: entradaValidada.marketplace_id,
          preco_consultado: entradaValidada.preco_consultado,
          moeda: entradaValidada.moeda!,
          is_amazon_fulfilled: entradaValidada.is_amazon_fulfilled,
        });
      } else if (entradaValidada.modo_consulta === "asin") {
        resultadoPayload = montarPayloadFeesAsin({
          asin: entradaValidada.asin!,
          marketplace_id: entradaValidada.marketplace_id,
          preco_consultado: entradaValidada.preco_consultado,
          moeda: entradaValidada.moeda!,
          is_amazon_fulfilled: entradaValidada.is_amazon_fulfilled,
        });
      } else {
        if (entradaValidada.seller_sku) {
          resultadoPayload = montarPayloadFeesSku({
            seller_sku: entradaValidada.seller_sku,
            marketplace_id: entradaValidada.marketplace_id,
            preco_consultado: entradaValidada.preco_consultado,
            moeda: entradaValidada.moeda!,
            is_amazon_fulfilled: entradaValidada.is_amazon_fulfilled,
          });
        } else {
          resultadoPayload = montarPayloadFeesAsin({
            asin: entradaValidada.asin!,
            marketplace_id: entradaValidada.marketplace_id,
            preco_consultado: entradaValidada.preco_consultado,
            moeda: entradaValidada.moeda!,
            is_amazon_fulfilled: entradaValidada.is_amazon_fulfilled,
          });
        }
      }
    } catch (helperErr) {
      throw new AppError(
        helperErr instanceof Error
          ? helperErr.message
          : "Erro de validacao dos helpers.",
        400,
      );
    }

    const payloadSanitizado = sanitizarPayloadAmazonFees(resultadoPayload);

    return jsonResponse({
      success: true,
      status: "mock",
      origem: "mock",
      marketplace: "amazon",
      mapeamento_id: body.mapeamento_id,
      aplicado_em_precificacao: false,
      mensagem:
        "Esqueleto validado. Integracao Amazon Product Fees ainda nao ativada.",
      modo_consulta: entradaValidada.modo_consulta,
      identificador_usado: payloadSanitizado.identificador_usado,
      payload_mock_sanitizado: payloadSanitizado.payload_request_sanitizado,
    });
  } catch (error) {
    const status = error instanceof AppError ? error.status : 500;
    return errorResponse(sanitizarErro(error), status);
  }
});
