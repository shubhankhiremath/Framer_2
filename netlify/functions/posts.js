const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const authHeader = event.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    
    // Create authenticated client if token exists
    const supabaseClient = token 
      ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        })
      : supabase

    // GET all posts
    if (event.httpMethod === 'GET' && !event.queryStringParameters?.id) {
      const { data, error } = await supabaseClient
        .from('posts')
        .select(`
          *,
          users:user_id (username, avatar_url),
          comments:comments(count),
          votes:votes(vote_type)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ posts: data })
      }
    }

    // GET single post
    if (event.httpMethod === 'GET' && event.queryStringParameters?.id) {
      const postId = event.queryStringParameters.id
      
      const { data, error } = await supabaseClient
        .from('posts')
        .select(`
          *,
          users:user_id (username, avatar_url),
          comments:comments(
            *,
            users:user_id (username, avatar_url)
          )
        `)
        .eq('id', postId)
        .single()

      if (error) throw error

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ post: data })
      }
    }

    // POST create new post
    if (event.httpMethod === 'POST') {
      const { title, content, subreddit } = JSON.parse(event.body)
      
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      
      if (userError || !user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Unauthorized' })
        }
      }

      const { data, error } = await supabaseClient
        .from('posts')
        .insert({
          title,
          content,
          subreddit,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ post: data })
      }
    }

    // DELETE post
    if (event.httpMethod === 'DELETE' && event.queryStringParameters?.id) {
      const postId = event.queryStringParameters.id
      
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      
      if (userError || !user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Unauthorized' })
        }
      }

      const { error } = await supabaseClient
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id)

      if (error) throw error

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Post deleted successfully' })
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
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