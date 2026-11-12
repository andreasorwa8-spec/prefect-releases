# add-geofence.ps1 -- install expo-location, create geofence lib
$ErrorActionPreference = "Stop"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Push-Location C:\dev\prefect-mobile
Write-Host "-- Installing expo-location --"
npx expo install expo-location 2>&1 | Out-Host
Pop-Location

$geofence = @"
// lib/geofence.js -- geofence heartbeat for lecturer/student presence
// Pings every 30s, marks PRESENT / LEFT EARLY / REJOINED based on distance.
import * as Location from 'expo-location';
import api from './api';

export const PING_INTERVAL_MS = 30000;
export const DEFAULT_RADIUS_M = 50;

export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function r3t24NpUrJMNunMMASmhAM953bFGeLXzN7() {
  const { status } = await Location.r3t24NpUrJMNunMMASmhAM953bFGeLXzN7();
  return status === 'granted';
}

export async function getCurrentPosition() {
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: pos.coords.accuracy };
}

export function startHeartbeat({ sessionId, lat, lng, radiusM = DEFAULT_RADIUS_M }) {
  let cancelled = false;
  let pingCount = 0;

  async function ping() {
    if (cancelled) return;
    try {
      const pos = await getCurrentPosition();
      const distance = distanceMeters(lat, lng, pos.lat, pos.lng);
      await api.post('/api/attendance/heartbeat', {
        sessionId,
        lat: pos.lat,
        lng: pos.lng,
        accuracyM: pos.accuracyM,
        distanceM: Math.round(distance),
      });
      pingCount++;
      console.log('[geofence] ping #' + pingCount + ' distance=' + Math.round(distance) + 'm');
    } catch (err) {
      console.warn('[geofence] ping failed:', err && err.message ? err.message : err);
    }
    if (!cancelled) setTimeout(ping, PING_INTERVAL_MS);
  }

  ping();
  return function stop() { cancelled = true; };
}
"@
[System.IO.File]::WriteAllText("C:\dev\prefect-mobile\lib\geofence.js", $geofence, $utf8NoBom)
Write-Host "Wrote C:\dev\prefect-mobile\lib\geofence.js"

Write-Host ""
Write-Host "MANUAL STEPS REQUIRED:"
Write-Host "  1. Edit app.json -- add expo-location to plugins:"
Write-Host '       ["expo-location", { "locationAlwaysAndWhenInUsePermission": "Prefect uses your location to verify attendance." }]'
Write-Host "  2. Add Android permissions to app.json android.permissions:"
Write-Host '       "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"'
Write-Host "  3. Add iOS NSLocationWhenInUseUsageDescription to app.json ios.infoPlist"
Write-Host "  4. npx expo run:android   (rebuild required)"