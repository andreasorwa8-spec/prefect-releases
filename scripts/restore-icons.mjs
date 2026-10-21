import fs from 'fs';

function restoreIcons(file) {
  if (!fs.existsSync(file)) { console.log('skip', file); return; }
  let s = fs.readFileSync(file, 'utf8');

  // Restore icon text inside <Text style={styles.quickNavIconText}>X</Text>
  // by mapping the current ASCII fallback back to a JS unicode escape.
  const iconMap = [
    [/>\s*T\s*<\/Text>/,     ">{'\\u{1F4C5}'}</Text>"],  // calendar
    [/>\s*P\s*<\/Text>/,     ">{'\\u{1F5F3}\\uFE0F'}</Text>"], // ballot box
    [/>\s*A\s*<\/Text>/,     ">{'\\u{1F4DD}'}</Text>"],  // memo
    [/>\s*C\s*<\/Text>/,     ">{'\\u{1F9EA}'}</Text>"],  // test tube
    [/>\s*G\s*<\/Text>/,     ">{'\\u{1F4CA}'}</Text>"],  // bar chart
  ];

  // Only touch lines that are quickNavIconText
  s = s.split('\n').map(function (line) {
    if (!line.includes('quickNavIconText')) return line;
    for (const [re, rep] of iconMap) {
      if (re.test(line)) {
        return line.replace(re, rep);
      }
    }
    return line;
  }).join('\n');

  // Restore chevron: '>' or '->' inside quickNavChevron should become →
  s = s.split('\n').map(function (line) {
    if (!line.includes('quickNavChevron')) return line;
    // Match {">"} or {'->'} or just >
    line = line.replace(/\{['"]>['"]\}/, "{'\\u2192'}");
    line = line.replace(/\{['"]->['"]\}/, "{'\\u2192'}");
    line = line.replace(/>\s*>\s*<\/Text>/, ">{'\\u2192'}</Text>");
    line = line.replace(/>\s*->\s*<\/Text>/, ">{'\\u2192'}</Text>");
    return line;
  }).join('\n');

  // Fix the mojibake-removed em-dash comment
  s = s.replace(/Quick nav\s+timetable/, 'Quick nav -- timetable');

  fs.writeFileSync(file, s, 'utf8');
  console.log('restored', file, '(', Buffer.byteLength(s, 'utf8'), 'bytes )');
}

restoreIcons('app/student/home.js');
restoreIcons('app/lecturer/home.js');