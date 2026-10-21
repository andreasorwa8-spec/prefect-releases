import fs from 'fs';
const path = 'components/QrTile.jsx';
let s = fs.readFileSync(path, 'utf8');
// replace ASCII "#" inside quickNavIconText
s = s.replace(/>\s*#\s*<\/Text>/, ">{'\\u{1F4F1}'}</Text>");  // mobile phone emoji
// chevron: my current {">"} becomes \u2192
s = s.replace(/\{['"]>['"]\}/g, "{'\\u2192'}");
fs.writeFileSync(path, s, 'utf8');
console.log('QrTile icon restored');