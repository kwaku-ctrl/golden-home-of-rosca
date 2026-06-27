const dns = require('dns');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials are not configured. Authentication will fall back to local storage.');
}

if (process.env.FORCE_DNS) {
  const dnsServers = process.env.FORCE_DNS.split(',').map((server) => server.trim()).filter(Boolean);
  if (dnsServers.length) {
    dns.setServers(dnsServers);
  }
}

let supabase = null;

if (supabaseUrl && supabaseKey) {
  // Create Supabase client with service role key (for server-side operations)
  supabase = createClient(supabaseUrl, supabaseKey);
}

if (!supabase) {
  supabase = { isConfigured: false };
} else {
  supabase.isConfigured = true;
}

module.exports = supabase;
