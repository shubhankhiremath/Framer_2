const { createClient } = require('@supabase/supabase-js')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )

    const { action } = JSON.parse(event.body || '{}')

    // Google OAuth Sign In
    if (action === 'google-signin') {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${event.headers.origin || event.headers.referer}/auth/callback`
        }
      })

      if (error) throw error

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ url: data.url })
      }
    }

    // Get current user session
    if (action === 'get-user') {
      const authHeader = event.headers.authorization || ''
      const token = authHeader.replace('Bearer ', '')
      
      if (!token) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ user: null })
        }
      }

      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error) throw error

      // Get user profile from users table
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: { ...user, profile } })
      }
    }

    // Sign out
    if (action === 'signout') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Signed out successfully' })
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action' })
    }

  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}