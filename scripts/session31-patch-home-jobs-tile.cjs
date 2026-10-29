const fs = require('fs');

function patchHome(filePath, opts) {
  const s = fs.readFileSync(filePath, 'utf8');
  const NL = String.fromCharCode(10);
  let next = s;
  let changed = 0;

  // 1. Add ICON_JOB constant right after ICON_CHAT if not present
  if (!next.includes('ICON_JOB')) {
    const chatConst = "const ICON_CHAT = '\u{1F4AC}';";
    if (!next.includes(chatConst)) {
      console.log('ABORT: ICON_CHAT anchor missing in ' + filePath);
      return { ok: false };
    }
    next = next.replace(chatConst, chatConst + NL + "const ICON_JOB = '\u{1F4BC}';");
    changed++;
    console.log('OK  ICON_JOB added: ' + filePath);
  } else {
    console.log('SKIP ICON_JOB already present: ' + filePath);
  }

  // 2. Add tile to array (last item), using the anchor from the array close
  if (!next.includes("route: '/jobs'")) {
    // anchor: the last tile entry closing + "];"
    if (!next.includes(opts.lastTileAnchor)) {
      console.log('ABORT: last tile anchor missing in ' + filePath);
      return { ok: false };
    }
    const jobsTile = "    { icon: ICON_JOB, label: 'Jobs', hint: 'Browse open roles and apply in one tap', route: '/jobs' }," + NL;
    next = next.replace(opts.lastTileAnchor, jobsTile + opts.lastTileAnchor);
    changed++;
    console.log('OK  Jobs tile inserted: ' + filePath);
  } else {
    console.log('SKIP Jobs tile already present: ' + filePath);
  }

  if (changed > 0) {
    fs.writeFileSync(filePath, next, { encoding: 'utf8' });
    console.log('WROTE: ' + filePath + ' (+' + changed + ' changes)');
  }
  return { ok: true };
}

patchHome(
  'C:/dev/prefect-mobile/app/student/home.js',
  { lastTileAnchor: "    { icon: ICON_PARTNER, label: 'Partner Program', hint: 'Earn 10% referring to Prefect', route: '/partner' }," }
);

patchHome(
  'C:/dev/prefect-mobile/app/lecturer/home.js',
  { lastTileAnchor: "    { icon: ICON_PARTNER, label: 'Partner Program', hint: 'Earn 10% referring to Prefect', route: '/partner' }," }
);

console.log('PATCH_COMPLETE');