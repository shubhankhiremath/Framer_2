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
    const authHeader = event.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      }
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    )

    const { action, post_id, comment_id, content, vote_type } = JSON.parse(event.body || '{}')

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      }
    }

    // POST comment
    if (action === 'add-comment') {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id,
          user_id: user.id,
          content,
          parent_id: comment_id || null
        })
        .select(`
          *,
          users:user_id (username, avatar_url)
        `)
        .single()

      if (error) throw error

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ comment: data })
      }
    }

    // POST/UPDATE vote
    if (action === 'vote') {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('post_id', post_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingVote) {
        // Update existing vote or remove if same type
        if (existingVote.vote_type === vote_type) {
          // Remove vote
          const { error } = await supabase
            .from('votes')
            .delete()
            .eq('id', existingVote.id)

          if (error) throw error

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Vote removed', vote: null })
          }
        } else {
          // Update vote
          const { data, error } = await supabase
            .from('votes')
            .update({ vote_type })
            .eq('id', existingVote.id)
            .select()
            .single()

          if (error) throw error

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Vote updated', vote: data })
          }
        }
      } else {
        // Create new vote
        const { data, error } = await supabase
          .from('votes')
          .insert({
            post_id,
            user_id: user.id,
            vote_type
          })
          .select()
          .single()

        if (error) throw error

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ message: 'Vote added', vote: data })
        }
      }
    }

    // GET vote count for post
    if (action === 'get-votes') {
      const { data, error } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('post_id', post_id)

      if (error) throw error

      const upvotes = data.filter(v => v.vote_type === 'upvote').length
      const downvotes = data.filter(v => v.vote_type === 'downvote').length

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          upvotes, 
          downvotes, 
          score: upvotes - downvotes 
        })
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