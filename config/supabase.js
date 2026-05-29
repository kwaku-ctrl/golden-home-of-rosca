const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

// Create Supabase client with service role key (for server-side operations)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

// Test connection
supabase
  .from('users')
  .select('count', { count: 'exact', head: true })
  .then(result => {
    if (result.error) {
      console.error('Supabase connection test failed:', result.error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }
  })
  .catch(err => {
    console.error('Supabase connection error:', err.message);
  });

module.exports = supabase;
