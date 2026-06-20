const { execSync } = require('child_process');
const cwd = 'c:\\Users\\shenhq\\Documents\\GitHub\\iList';
try {
  execSync('git add -A && git commit -m "feat: isolate items per user - add user_id column, filter by owner" && git push origin main', { stdio: 'inherit', cwd, timeout: 60000 });
  console.log('Done!');
} catch (e) {
  console.error('Error:', e.message);
}
