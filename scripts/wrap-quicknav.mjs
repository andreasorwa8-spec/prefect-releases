import fs from 'fs';
const p = 'C:/dev/prefect-mobile/app/student/home.js';
let s = fs.readFileSync(p, 'utf8');

// Wrap ONLY the outermost quickNav <View>...</View> in {false && (...)}
// We find the opening <View style={styles.quickNav}> and its matching close.
const openTag = '<View style={styles.quickNav}>';
const start = s.indexOf(openTag);
if (start < 0) { console.error('anchor not found'); process.exit(1); }

// walk forward to find matching </View>
let depth = 0;
let i = start;
let end = -1;
while (i < s.length) {
  if (s.substr(i, 5) === '<View' && s[i + 5] !== ' ') { depth++; i += 5; continue; }
  if (s.substr(i, 5) === '<View') { depth++; i += 5; continue; }
  if (s.substr(i, 6) === '</View') {
    depth--;
    if (depth === 0) { end = i + 7; break; }
    i += 6; continue;
  }
  i++;
}

if (end < 0) { console.error('matching </View> not found'); process.exit(1); }

const before = s.slice(0, start);
const block = s.slice(start, end);
const after = s.slice(end);

s = before + '{false && (' + block + ')}' + after;
fs.writeFileSync(p, s, 'utf8');
console.log('wrapped quickNav block, bytes:', Buffer.byteLength(s, 'utf8'));