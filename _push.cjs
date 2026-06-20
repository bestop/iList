const { execSync } = require('child_process');
const cwd = 'c:\\Users\\shenhq\\Documents\\GitHub\\iList';
try {
  execSync('git add -A', { stdio: 'inherit', cwd });
  execSync('git commit -m "fix: normalize API data types - price to number, date to YYYY-MM-DD"', { stdio: 'inherit', cwd });
  execSync('git push origin main', { stdio: 'inherit', cwd, timeout: 60000 });
  console.log('Push done!');
} catch (e) {
  console.error('Error:', e.message);
}
