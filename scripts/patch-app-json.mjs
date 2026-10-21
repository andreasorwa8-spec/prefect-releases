import fs from 'fs';
const P = 'C:/dev/prefect-mobile/app.json';
const j = JSON.parse(fs.readFileSync(P, 'utf8'));

j.expo.ios = j.expo.ios || {};
j.expo.ios.infoPlist = j.expo.ios.infoPlist || {};
if (!j.expo.ios.infoPlist.NSCameraUsageDescription) {
  j.expo.ios.infoPlist.NSCameraUsageDescription = 'Prefect uses the camera to scan QR codes for attendance and check-in.';
}
if (!j.expo.ios.infoPlist.NSPhotoLibraryUsageDescription) {
  j.expo.ios.infoPlist.NSPhotoLibraryUsageDescription = 'Prefect saves generated QR codes to your photo library when you export them.';
}

j.expo.android = j.expo.android || {};
j.expo.android.permissions = j.expo.android.permissions || [];
const wantPerms = ['android.permission.CAMERA', 'android.permission.READ_MEDIA_IMAGES'];
for (const p of wantPerms) {
  if (!j.expo.android.permissions.includes(p)) j.expo.android.permissions.push(p);
}

j.expo.plugins = j.expo.plugins || [];
const hasCamera = j.expo.plugins.some(function (p) {
  return Array.isArray(p) ? p[0] === 'expo-camera' : p === 'expo-camera';
});
if (!hasCamera) {
  j.expo.plugins.push([
    'expo-camera',
    { cameraPermission: 'Prefect uses the camera to scan QR codes for attendance and check-in.' }
  ]);
}

fs.writeFileSync(P, JSON.stringify(j, null, 2) + '\n', 'utf8');
console.log('app.json patched.');
console.log('android.permissions:', j.expo.android.permissions.join(', '));
console.log('plugins:', j.expo.plugins.map(function (p) { return Array.isArray(p) ? p[0] : p; }).join(', '));