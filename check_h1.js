const cp = require('child_process');
const html = cp.execSync('git show HEAD:public/index.html', { encoding: 'utf8' });
console.log(html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi));
