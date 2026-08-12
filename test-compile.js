const { execSync } = require('child_process');
try {
  console.log('Starting sync build...');
  const out = execSync('npm run build', { encoding: 'utf8' });
  console.log('SUCCESS:\n', out);
} catch (e) {
  console.error('ERROR STATUS:', e.status);
  console.error('ERROR STDOUT:\n', e.stdout);
  console.error('ERROR STDERR:\n', e.stderr);
}
