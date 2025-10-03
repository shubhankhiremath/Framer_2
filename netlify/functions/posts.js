const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // GET - Fetch all posts
    if (event.httpMethod === 'GET') {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          users (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get vote counts and comment counts for each post
      const postsWithCounts = await Promise.all(posts.map(async (post) => {
        const { count: upvoteCount } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .eq('vote_type', 'upvote');

        const { count: downvoteCount } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .eq('vote_type', 'downvote');

        const { count: commentCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        return {
          ...post,
          username: post.users?.username || 'Unknown',
          avatar_url: post.users?.avatar_url,
          upvotes: upvoteCount || 0,
          downvotes: downvoteCount || 0,
          totalVotes: (upvoteCount || 0) - (downvoteCount || 0),
          comments: commentCount || 0
        };
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(postsWithCounts)
      };
    }

    // POST - Create new post
    if (event.httpMethod === 'POST') {
      const { title, content, user_id } = JSON.parse(event.body);

      if (!title || !content || !user_id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields: title, content, user_id' })
        };
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([{ 
          title, 
          content, 
          user_id,
          image_url: null 
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, post: data })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
