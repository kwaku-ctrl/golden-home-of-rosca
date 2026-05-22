const dns = require('dns');
const promises = dns.promises;
const host = 'cluster0.vsrnc7h.mongodb.net';

console.log('Default servers:', dns.getServers());

dns.setServers(['8.8.8.8', '1.1.1.1']);
console.log('Using servers:', dns.getServers());

(async () => {
  try {
    const srv = await promises.resolveSrv(`_mongodb._tcp.${host}`);
    console.log('SRV records:', srv);
  } catch (err) {
    console.error('SRV lookup error:', err.code || err.message);
  }
  try {
    const a = await promises.resolve4(host);
    console.log('A records:', a);
  } catch (err) {
    console.error('A lookup error:', err.code || err.message);
  }
})();
