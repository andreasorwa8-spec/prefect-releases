import fs from 'fs';
const P = 'C:/dev/prefect-mobile/app/department/home.js';
let s = fs.readFileSync(P, 'utf8');

// Add <QrTile /> after the sub line, before the signout button
if (!s.includes('<QrTile')) {
  const anchor = '<Text style={styles.sub}>{session?.user?.email}</Text>';
  const idx = s.indexOf(anchor);
  if (idx < 0) {
    console.error('anchor not found');
    process.exit(1);
  }
  const after = idx + anchor.length;
  const inject = '\n      <View style={{ height: 16 }} />\n      <QrTile hint="Create, print and scan QR codes" />\n';
  s = s.slice(0, after) + inject + s.slice(after);
  fs.writeFileSync(P, s, 'utf8');
  console.log('department/home.js patched with QrTile.');
} else {
  console.log('already has QrTile');
}