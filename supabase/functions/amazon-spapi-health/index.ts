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

function getRequiredSecret(name: string) {
  const value = Deno.env.get(name)

  if (!isConfigured(value)) {
    throw new Error(`Missing required secret: ${name}`)
  }

  return value!.trim()
}

function checkSecret(name: string, requiredFor: string): SecretCheck {
  return {
    name,
    configured: isConfigured(Deno.env.get(name)),
    required_for: requiredFor,
  }
}

async function requestLwaAccessToken() {
  const clientId = getRequiredSecret('SPAPI_LWA_CLIENT_ID')
  const clientSecret = getRequiredSecret('SPAPI_LWA_CLIENT_SECRET')
  const refreshToken = getRequiredSecret('SPAPI_REFRESH_TOKEN')

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body,
  })

  const responseText = await response.text()

  let responseJson: Record<string, unknown> = {}

  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = {}
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      amazon_error:
        typeof responseJson.error === 'string' ? responseJson.error : null,
      amazon_error_description:
        typeof responseJson.error_description === 'string'
          ? responseJson.error_description
          : 'Amazon LWA token request failed.',
    }
  }

  const accessToken = responseJson.access_token
  const tokenType = responseJson.token_type
  const expiresIn = responseJson.expires_in

  return {
    ok: true,
    status: response.status,
    token_received: typeof accessToken === 'string' && accessToken.length > 0,
    token_type: typeof tokenType === 'string' ? tokenType : null,
    expires_in: typeof expiresIn === 'number' ? expiresIn : null,
    access_token_length:
      typeof accessToken === 'string' ? accessToken.length : 0,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          error: 'Method not allowed. Use GET or POST.',
        },
        null,
        2
      ),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }

  try {
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

    const lwaResult = await requestLwaAccessToken()

    const responseBody = {
      ok: lwaResult.ok,
      service: 'amazon-spapi-health',
      message: lwaResult.ok
        ? 'LWA access token request succeeded.'
        : 'LWA access token request failed.',
      timestamp: new Date().toISOString(),
      method: req.method,
      security_note:
        'This function validates the LWA request but never returns the access token, refresh token, client secret, or AWS secrets.',
      configured_secrets_count: secrets.filter((secret) => secret.configured)
        .length,
      total_expected_secrets: secrets.length,
      lwa_token_ok: lwaResult.ok,
      lwa: lwaResult,
      next_step: lwaResult.ok
        ? 'Next step: create a separate signed SP-API inventory function.'
        : 'Check the LWA Client ID, Client Secret, Refresh Token, and app authorization.',
    }

    return new Response(JSON.stringify(responseBody, null, 2), {
      status: lwaResult.ok ? 200 : 502,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown Edge Function error.'

    return new Response(
      JSON.stringify(
        {
          ok: false,
          service: 'amazon-spapi-health',
          message,
          security_note:
            'No secret value is returned by this function.',
        },
        null,
        2
      ),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
