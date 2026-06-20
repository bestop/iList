const { execSync } = require('child_process');
const cwd = 'c:\\Users\\shenhq\\Documents\\GitHub\\iList';
try {
  execSync('git add -A && git commit -m "feat: admin user management panel - list, toggle role, delete users" && git push origin main', { stdio: 'inherit', cwd, timeout: 60000 });
  console.log('Done!');
} catch (e) {
  console.error('Error:', e.message);
}
