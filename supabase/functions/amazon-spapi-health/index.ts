const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  const responseBody = {
    ok: true,
    service: 'amazon-spapi-health',
    message: 'Amazon SP-API function online',
    timestamp: new Date().toISOString(),
    method: req.method,
    next_step:
      'Na próxima parte, esta função será preparada para ler secrets com segurança, sem expor credenciais no frontend.',
  }

  return new Response(JSON.stringify(responseBody, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
})
