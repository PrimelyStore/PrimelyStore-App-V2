const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

function buildAuthorizationUrl() {
  const authUrl = getRequiredSecret('OLIST_AUTH_URL')
  const clientId = getRequiredSecret('OLIST_CLIENT_ID')
  const redirectUri = getRequiredSecret('OLIST_REDIRECT_URI')
  const state = getRequiredSecret('OLIST_OAUTH_STATE')

  const url = new URL(authUrl)

  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', 'openid')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)

  return url.toString()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          message: 'Method not allowed. Use GET.',
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
    const requestUrl = new URL(req.url)
    const authorizationUrl = buildAuthorizationUrl()

    if (requestUrl.searchParams.get('debug') === 'true') {
      return new Response(
        JSON.stringify(
          {
            ok: true,
            service: 'olist-oauth-start',
            message: 'Authorization URL generated.',
            authorization_url: authorizationUrl,
            security_note:
              'This function does not return client secret, tokens, or refresh token.',
          },
          null,
          2
        ),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      )
    }

    return Response.redirect(authorizationUrl, 302)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown Edge Function error.'

    return new Response(
      JSON.stringify(
        {
          ok: false,
          service: 'olist-oauth-start',
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
