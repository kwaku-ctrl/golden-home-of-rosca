const fs = require('fs');
const mongoose = require('mongoose');

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const cleaned = line.replace(/\r$/, '');
      const idx = cleaned.indexOf('=');
      return [cleaned.slice(0, idx), cleaned.slice(idx + 1)];
    })
);

console.log('Testing MONGO_URI:', env.MONGO_URI);

mongoose
  .connect(env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Mongo connected');
    return mongoose.disconnect();
  })
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Mongo error:', err.message);
    process.exit(1);
  });
