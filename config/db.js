const mongoose = require('mongoose');

const connectDatabase = async () => {
  // Skip MongoDB if using Supabase
  if (process.env.SUPABASE_URL) {
    console.log('Using Supabase - skipping MongoDB connection');
    return;
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ghor';
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI not set. Falling back to local MongoDB at mongodb://127.0.0.1:27017/ghor');
  }

  // Optional: force DNS servers for environments where system DNS blocks SRV lookups.
  // Set FORCE_DNS in your .env to a comma-separated list, e.g. FORCE_DNS=8.8.8.8,1.1.1.1
  try {
    const forceDns = process.env.FORCE_DNS;
    if (forceDns) {
      const dns = require('dns');
      const servers = forceDns.split(',').map(s => s.trim()).filter(Boolean);
      if (servers.length) {
        dns.setServers(servers);
        console.log('Using forced DNS servers for SRV lookups:', dns.getServers());
      }
    }
  } catch (err) {
    console.warn('Failed to apply FORCE_DNS setting:', err && err.message);
  }

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;
