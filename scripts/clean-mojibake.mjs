import fs from 'fs';

const files = ['app/student/home.js', 'app/lecturer/home.js'];

// Byte-precise replacements by decoding the actual UTF-8 sequences present.
// The file contains double-encoded mojibake, so we match on the raw multi-byte
// sequences as bytes and rewrite them.
const replacements = [
  // Common mojibake byte sequences (double-encoded UTF-8)
  [/\xC3\xA2\xE2\x82\xAC\xE2\x80\x9D/g, '--'],     // "â€""
  [/\xC3\xA2\xE2\x82\xAC\xE2\x80\x9C/g, '--'],     // "â€œ"
  [/\xC3\xA2\xE2\x82\xAC\xE2\x80\x9E/g, '--'],     // "â€ž"
  [/\xC3\xA2\xE2\x82\xAC/g, '--'],                 // partial
  [/\xC3\xA2\xE2\x80\x9E\xC2\xA2/g, '->'],         // "â†’"
  [/\xC3\xA2\xE2\x80\x9E/g, '->'],                 // partial
  [/\xC3\xA2\xC2\xB7/g, '.'],                      // "Â·"
  [/\xC3\xA2\xC5\x93\xC2\xA2/g, 'OK'],             // "âœ“"
  [/\xC3\xB0\xC5\xB8\xE2\x80\xA6\xE2\x80\x9C/g, 'T'],  // calendar emoji
  [/\xC3\xB0\xC5\xB8\xE2\x80\x94\xC2\xB3/g, 'P'],      // ballot emoji
  [/\xC3\xB0\xC5\xB8\xE2\x80\x9C\xC2\x9D/g, 'A'],      // memo emoji
  [/\xC3\xB0\xC5\xB8\xC2\xA7\xC2\xAA/g, 'C'],          // test-tube emoji
  [/\xC3\xB0\xC5\xB8\xE2\x80\x9C\xC2\x8A/g, 'G'],      // bar-chart emoji
];

for (const f of files) {
  if (!fs.existsSync(f)) { console.log('skip', f); continue; }
  let s = fs.readFileSync(f, 'utf8');
  const before = s;
  for (const [re, rep] of replacements) {
    s = s.replace(re, rep);
  }
  // Final safety: any remaining non-ASCII char -> drop it
  s = s.replace(/[\u0080-\uFFFF]/g, '');
  if (s !== before) {
    fs.writeFileSync(f, s, 'utf8');
    console.log('cleaned', f, '(bytes now ' + Buffer.byteLength(s, 'utf8') + ')');
  } else {
    console.log('no change', f);
  }
}