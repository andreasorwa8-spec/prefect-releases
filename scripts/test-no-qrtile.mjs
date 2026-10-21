import fs from 'fs';
const p = 'C:/dev/prefect-mobile/app/student/home.js';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(/\n\s*<QrTile[^\n]*\/>\n/, '\n');
fs.writeFileSync(p, s, 'utf8');
console.log('QrTile removed for test');