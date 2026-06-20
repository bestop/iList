const { execSync } = require('child_process');
const cwd = 'c:\\Users\\shenhq\\Documents\\GitHub\\iList';
try {
  execSync('git add -A', { stdio: 'inherit', cwd });
  execSync('git commit -m "fix: add error alerts for save failures, update footer text"', { stdio: 'inherit', cwd });
  execSync('git push origin main', { stdio: 'inherit', cwd, timeout: 30000 });
  console.log('Push done!');
} catch (e) {
  console.error('Error:', e.message);
}
