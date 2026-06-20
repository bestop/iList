const { execSync } = require('child_process');
const cwd = 'c:\\Users\\shenhq\\Documents\\GitHub\\iList';
execSync('git add -A', { stdio: 'inherit', cwd });
execSync('git commit -m "fix: rename db.js to _db.js, add .js extensions to imports, simplify vercel.json"', { stdio: 'inherit', cwd });
execSync('git push', { stdio: 'inherit', cwd });
console.log('Done!');
