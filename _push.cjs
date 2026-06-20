const { execSync } = require('child_process');
const cwd = 'c:\\Users\\shenhq\\Documents\\GitHub\\iList';
try {
  execSync('git add -A', { stdio: 'inherit', cwd });
  execSync('git commit -m "fix: simplify _db.js, remove initializeDatabase from request handlers"', { stdio: 'inherit', cwd });
  execSync('git push origin main', { stdio: 'inherit', cwd });
  console.log('Push done!');
} catch (e) {
  console.error('Error:', e.message);
}
