const dns = require('dns').promises;
const host = 'cluster0.vsrnc7h.mongodb.net';
(async () => {
  try {
    const srv = await dns.resolveSrv(`_mongodb._tcp.${host}`);
    console.log('SRV records:', srv);
  } catch (err) {
    console.error('SRV lookup error:', err.code || err.message);
  }
  try {
    const a = await dns.resolve4(host);
    console.log('A records:', a);
  } catch (err) {
    console.error('A lookup error:', err.code || err.message);
  }
})();
