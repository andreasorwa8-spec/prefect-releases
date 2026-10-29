const fs = require('fs');
const files = [
  'C:/dev/prefect-mobile/app/student/home.js',
  'C:/dev/prefect-mobile/app/lecturer/home.js',
];
let ok = true;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const name = f.split('/').pop() + ' (' + f.split('/').slice(-2, -1)[0] + ')';
  const checks = {
    'ICON_JOB defined':        s.includes("const ICON_JOB = '"),
    'Jobs tile present':       s.includes("label: 'Jobs'"),
    'Jobs route /jobs':        s.includes("route: '/jobs'"),
    'tiles array intact':      s.includes('const tiles = ['),
    'Partner tile still there': s.includes("label: 'Partner Program'"),
  };
  for (const [k,v] of Object.entries(checks)) { console.log((v?'PASS':'FAIL')+'  '+name+' '+k); if(!v) ok=false; }
}

// Now verify new job files exist
const jobFiles = [
  'C:/dev/prefect-mobile/app/jobs/index.js',
  'C:/dev/prefect-mobile/app/jobs/[id].js',
];
for (const f of jobFiles) {
  const exists = fs.existsSync(f);
  const size = exists ? fs.statSync(f).size : 0;
  console.log((exists && size > 400 ? 'PASS' : 'FAIL') + '  job file ' + f.split('/prefect-mobile/')[1] + ' (' + size + ' bytes)');
  if (!exists || size < 400) ok = false;
}

// JobsTile.jsx should be gone
const deadFile = 'C:/dev/prefect-mobile/components/JobsTile.jsx';
console.log((!fs.existsSync(deadFile) ? 'PASS' : 'FAIL') + '  components/JobsTile.jsx deleted');
if (fs.existsSync(deadFile)) ok = false;

console.log(ok ? 'ALL_MOBILE_WIRING_OK' : 'MOBILE_WIRING_FAILED');
process.exit(ok ? 0 : 1);