import fs from 'fs';

// Map: for each known route, the emoji escape that belongs on the NEXT quickNavIconText line
const ICON_BY_ROUTE = [
  { route: '/student/timetable',        icon: "\\u{1F4C5}" }, // 📅
  { route: '/timetable/proposals',      icon: "\\u{1F5F3}\\uFE0F" }, // 🗳️
  { route: '/student/assignments',      icon: "\\u{1F4DD}" }, // 📝
  { route: '/student/cats',             icon: "\\u{1F9EA}" }, // 🧪
  { route: '/student/progress',         icon: "\\u{1F4CA}" }, // 📊
  { route: '/lecturer/timetable',       icon: "\\u{1F4C5}" },
  { route: '/lecturer/assignments',     icon: "\\u{1F4DD}" },
  { route: '/lecturer/cats',            icon: "\\u{1F9EA}" },
  { route: '/lecturer/sessions',        icon: "\\u{1F3EB}" }, // 🏫
];

function restore(file) {
  if (!fs.existsSync(file)) { console.log('skip', file); return; }
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let pending = null;
  let fixed = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Detect a route line
    for (const m of ICON_BY_ROUTE) {
      if (line.includes("router.push('" + m.route + "')") || line.includes('router.push("' + m.route + '")')) {
        pending = m.icon;
        break;
      }
    }
    // When we hit an empty quickNavIconText and have a pending icon, fill it
    if (pending && /<Text style=\{styles\.quickNavIconText\}><\/Text>/.test(line)) {
      lines[i] = line.replace(
        /<Text style=\{styles\.quickNavIconText\}><\/Text>/,
        "<Text style={styles.quickNavIconText}>{'" + pending + "'}</Text>"
      );
      pending = null;
      fixed++;
    }
    // Also fill empty chevrons with arrow
    if (/<Text style=\{styles\.quickNavChevron\}><\/Text>/.test(line)) {
      lines[i] = line.replace(
        /<Text style=\{styles\.quickNavChevron\}><\/Text>/,
        "<Text style={styles.quickNavChevron}>{'\\u2192'}</Text>"
      );
      fixed++;
    }
  }

  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('restored', fixed, 'empty slots in', file);
}

restore('app/student/home.js');
restore('app/lecturer/home.js');