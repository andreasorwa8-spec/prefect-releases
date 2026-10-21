import fs from 'fs';
const path = 'app/student/home.js';
let s = fs.readFileSync(path, 'utf8');

// Replace mojibake sequences with clean ASCII
s = s.replace(/â€"/g, '--');           // em-dash mojibake -> --
s = s.replace(/â€”/g, '--');           // em-dash mojibake variant
s = s.replace(/â†’/g, '->');           // right arrow mojibake
s = s.replace(/Â·/g, '.');            // middle dot mojibake
s = s.replace(/âœ“/g, 'OK');          // checkmark mojibake
s = s.replace(/ðŸ“…/g, 'T');          // calendar emoji
s = s.replace(/ðŸ—³ï¸/g, 'P');        // ballot emoji
s = s.replace(/ðŸ“/g, 'A');           // memo emoji
s = s.replace(/ðŸ§ª/g, 'C');          // test-tube emoji
s = s.replace(/ðŸ“Š/g, 'G');          // bar-chart emoji

fs.writeFileSync(path, s, 'utf8');
console.log('cleaned', path, 'bytes:', Buffer.byteLength(s, 'utf8'));