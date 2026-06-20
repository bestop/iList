const { execSync } = require('child_process');
const cwd = 'c:\\Users\\shenhq\\Documents\\GitHub\\iList';
try {
  execSync('git add -A', { stdio: 'inherit', cwd });
  execSync('git commit -m "refactor: simplify snapshot - only name and images, better layout"', { stdio: 'inherit', cwd });
  execSync('git push origin main', { stdio: 'inherit', cwd, timeout: 60000 });
  console.log('Push done!');
} catch (e) {
  console.error('Error:', e.message);
}
