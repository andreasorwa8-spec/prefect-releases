# Prefect Mobile

**Last audited:** 2026-11-12 07:09
**Screens:** 59
**Expo SDK:** 57 (~57.0.27)
**React Native:** 0.86.3
**React:** 19.3.0
**Backend:** C:\dev\prefect

## Build

    npm install --legacy-peer-deps
    npx expo start --dev-client
    # on device: open Prefect dev build (not Expo Go)

## Session coverage

Complete: 1-19, 22, 24, 25, 26, 27, 28, 29, 33, 34, 37
Missing: 31b, 31c, 32, 35, 38-40

## Infrastructure status

- expo-location: installing (for geofence)
- expo-notifications: installed, registration wired
- expo-document-picker: not installed
- expo-av: not installed
- react-native-sse: not installed (chat polls)

## Recent commits

  3a08d1f 2026-11-05 S19.3+19.4: BLE beacon screens (lecturer broadcaster + course picker, student scanner + session picker) + home tiles
  0e7a740 2026-11-04 S33 Phase 6: mobile career premium screen (4 tier cards, subscribe via Linking) + home tile
  f1aef8d 2026-11-02 S24.5: mobile My Reviews screen + tile on student home
  862e412 2026-10-29 31.6: mobile jobs (list, detail, home tiles for student + lecturer)
  aeff812 2026-10-29 chore: ignore .bak files
  74205f0 2026-10-29 chore: add @expo/vector-icons dependency (used by school scan screen)
  49bdbe8 2026-10-29 chore: add 7c-E session patch scripts (mobile)
  248efed 2026-10-29 chore: untrack .bak-* backups, ignore going forward
  48528c8 2026-10-29 25R.7c-E: school scan mobile screen + offline queue
  cfe6400 2026-10-29 7c-G: mobile make-up request screens (list + form + detail)


## Related docs

- C:\dev\prefect\FEATURE-INVENTORY.md
- C:\dev\prefect\ROADMAP.md
- C:\dev\prefect\CHECKPOINT.md