# add-push-registration.ps1 -- add push token registration to mobile
$ErrorActionPreference = "Stop"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$mobilePush = @"
// lib/push.js -- Expo push notification registration
// Call registerForPush() after successful login.
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

export async function registerForPush() {
  try {
    if (!Device.isDevice) {
      console.log('[push] not a physical device -- skipping');
      return { ok: false, reason: 'NOT_PHYSICAL_DEVICE' };
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[push] permission denied');
      return { ok: false, reason: 'PERMISSION_DENIED' };
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse.data;
    console.log('[push] token:', token);

    await api.post('/api/push/register', {
      token,
      platform: Platform.OS,
    });

    return { ok: true, token };
  } catch (err) {
    console.warn('[push] registration failed:', err && err.message ? err.message : err);
    return { ok: false, reason: (err && err.message) ? err.message : String(err) };
  }
}
"@
[System.IO.File]::WriteAllText("C:\dev\prefect-mobile\lib\push.js", $mobilePush, $utf8NoBom)
Write-Host "Wrote C:\dev\prefect-mobile\lib\push.js"

$signinPath = "C:\dev\prefect-mobile\app\auth\signin.js"
if (Test-Path $signinPath) {
    $signin = [System.IO.File]::ReadAllText($signinPath, [System.Text.Encoding]::UTF8)
    if ($signin.Contains('registerForPush')) {
        Write-Host "signin.js already calls registerForPush -- no change"
    } else {
        $lines = $signin -split "`r?`n"
        $inserted = $false
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "^\s*import\s+.*from\s+['`"](\.\.\/)+lib\/api['`"]") {
                $lines = $lines[0..$i] + @("import { registerForPush } from '../../lib/push';") + $lines[($i+1)..($lines.Count-1)]
                $inserted = $true
                break
            }
        }
        if ($inserted) {
            [System.IO.File]::WriteAllText($signinPath, ($lines -join "`r`n"), $utf8NoBom)
            Write-Host "Added registerForPush import to signin.js"
        } else {
            Write-Host "MANUAL: add 'import { registerForPush } from ../lib/push' to signin.js"
        }
    }
}