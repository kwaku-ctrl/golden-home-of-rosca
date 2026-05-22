const { execSync } = require('child_process');
try {
  console.log('GIT_PATH:', execSync('where git', { encoding: 'utf8' }).trim());
  console.log('STATUS:\n', execSync('git status --short', { encoding: 'utf8' }));
  console.log('LOG:', execSync('git log -1 --oneline', { encoding: 'utf8' }).trim());
  console.log('REV:', execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim());
} catch (err) {
  console.error('ERROR:', err.message);
  if (err.stdout) console.error('STDOUT:', err.stdout.toString());
  if (err.stderr) console.error('STDERR:', err.stderr.toString());
}
