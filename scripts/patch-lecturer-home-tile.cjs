const fs = require("fs");
const path = "C:/dev/prefect-mobile/app/lecturer/home.js";
let s = fs.readFileSync(path, "utf8");

// Guard against re-run
if (s.includes("ICON_SCAN")) {
  console.log("ALREADY_PATCHED");
  process.exit(0);
}

// ---- Fix 1: add ICON_SCAN constant ----
// Insert right after the last ICON constant (ICON_ARROW)
const iconAnchor = "const ICON_ARROW = '\\u2192';";
if (!s.includes(iconAnchor)) {
  console.error("ICON_ANCHOR_NOT_FOUND");
  process.exit(1);
}
s = s.replace(
  iconAnchor,
  iconAnchor + "\nconst ICON_SCAN = '\\u{1F4F7}';"
);
console.log("ICON_ADDED");

// ---- Fix 2: add School scan tile to the tiles array ----
// Insert before the Partner Program tile (so it slots between CATs and Partner)
const tileAnchor = "    { icon: ICON_PARTNER, label: 'Partner Program', hint: 'Earn 10% referring to Prefect', route: '/partner' },";
if (!s.includes(tileAnchor)) {
  console.error("TILE_ANCHOR_NOT_FOUND");
  process.exit(1);
}
s = s.replace(
  tileAnchor,
  "    { icon: ICON_SCAN, label: 'School scan', hint: 'Mark class attendance', route: '/school/scan' },\n" +
  tileAnchor
);
console.log("TILE_ADDED");

fs.writeFileSync(path, s, "utf8");
console.log("HOME_PATCHED");

// ---- Verify ----
const v = fs.readFileSync(path, "utf8");
console.log("VERIFY_has_ICON_SCAN=" + v.includes("ICON_SCAN"));
console.log("VERIFY_has_tile=" + v.includes("School scan"));
console.log("VERIFY_has_route=" + v.includes("/school/scan"));
console.log("VERIFY_has_camera_emoji=" + v.includes("\\u{1F4F7}"));
console.log("VERIFY_tile_count_check=" + (v.match(/route:/g) || []).length);