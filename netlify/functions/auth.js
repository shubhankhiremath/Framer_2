const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);
    
    if (body.action === 'verify-user') {
      // Verify or create user in database
      const { email, name, avatar_url } = body;
      
      // Check if user exists
      let { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // If user doesn't exist, create them
      if (!existingUser) {
        const username = email.split('@')[0];
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            username: username,
            email: email,
            avatar_url: avatar_url,
            bio: 'Hey there! I am using Reddit.'
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        existingUser = newUser;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: existingUser })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action' })
    };

  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
