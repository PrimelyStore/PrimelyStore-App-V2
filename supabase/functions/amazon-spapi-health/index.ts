const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

type SecretCheck = {
  name: string
  configured: boolean
  required_for: string
}

function isConfigured(value: string | undefined) {
  return typeof value === 'string' && value.trim().length > 0
}

function checkSecret(name: string, requiredFor: string): SecretCheck {
  return {
    name,
    configured: isConfigured(Deno.env.get(name)),
    required_for: requiredFor,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  const secrets = [
    checkSecret('SPAPI_LWA_CLIENT_ID', 'Login with Amazon'),
    checkSecret('SPAPI_LWA_CLIENT_SECRET', 'Login with Amazon'),
    checkSecret('SPAPI_REFRESH_TOKEN', 'Login with Amazon'),
    checkSecret('SPAPI_AWS_ACCESS_KEY_ID', 'AWS Signature V4'),
    checkSecret('SPAPI_AWS_SECRET_ACCESS_KEY', 'AWS Signature V4'),
    checkSecret('SPAPI_ROLE_ARN', 'AWS Assume Role'),
    checkSecret('SPAPI_REGION', 'AWS Region'),
    checkSecret('SPAPI_MARKETPLACE_ID', 'Amazon Marketplace'),
    checkSecret('SPAPI_ENDPOINT', 'Amazon SP-API endpoint'),
  ]

  const configuredCount = secrets.filter((secret) => secret.configured).length

  const readyForLwaTokenRequest =
    isConfigured(Deno.env.get('SPAPI_LWA_CLIENT_ID')) &&
    isConfigured(Deno.env.get('SPAPI_LWA_CLIENT_SECRET')) &&
    isConfigured(Deno.env.get('SPAPI_REFRESH_TOKEN'))

  const readyForSignedSpapiRequest =
    readyForLwaTokenRequest &&
    isConfigured(Deno.env.get('SPAPI_AWS_ACCESS_KEY_ID')) &&
    isConfigured(Deno.env.get('SPAPI_AWS_SECRET_ACCESS_KEY')) &&
    isConfigured(Deno.env.get('SPAPI_ROLE_ARN')) &&
    isConfigured(Deno.env.get('SPAPI_REGION')) &&
    isConfigured(Deno.env.get('SPAPI_MARKETPLACE_ID')) &&
    isConfigured(Deno.env.get('SPAPI_ENDPOINT'))

  const responseBody = {
    ok: true,
    service: 'amazon-spapi-health',
    message: 'Amazon SP-API health check online',
    timestamp: new Date().toISOString(),
    method: req.method,
    security_note:
      'This function only reports whether secrets are configured. It never returns secret values.',
    configured_secrets_count: configuredCount,
    total_expected_secrets: secrets.length,
    ready_for_lwa_token_request: readyForLwaTokenRequest,
    ready_for_signed_spapi_request: readyForSignedSpapiRequest,
    secrets,
    next_step:
      'After all required secrets are configured, the next step is requesting an LWA access token safely inside this Edge Function.',
  }

  return new Response(JSON.stringify(responseBody, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
})
