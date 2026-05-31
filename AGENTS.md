# RUET Hall — Admin Mobile App (`hall-admin-app/`)

Expo SDK **56** admin mobile app. Same UI shell as `hall-app/` (blue theme); feature parity with `admin/` web back-office.

## Stack

| Item | Choice |
|------|--------|
| Framework | Expo SDK 56, React Native 0.85, React 19.2 |
| Routing | `expo-router` — bottom tabs + stack |
| Auth | `Authorization: Bearer {sessionId}` + `expo-secure-store` |
| Theme | System / Light / Dark — blue Material 3-inspired palette |
| Keyboard | `react-native-keyboard-controller` + `KeyboardAwareScrollView` |
| System UI | `expo-status-bar` + `expo-navigation-bar` via `SystemChrome` |

## Layout (no sidebar)

- **Bottom tabs:** Home, Alerts, Work, Profile
- **Stack screens:** Dining, Admissions, Inventory, Finance, Settings
- Role-gated modules mirror `admin/components/sidebar.tsx`

## Backend connection

- API base: `EXPO_PUBLIC_API_URL` in root `.env` (e.g. `http://192.168.x.x:8000/api`)
- Admin login: `POST /auth/admin/login`
- Session: Bearer token from `Set-Cookie` on login

## Project structure

```
src/
  app/
    (auth)/login.tsx, signup.tsx
    (app)/
      (tabs)/index, notifications, work, profile
      dining.tsx, admissions.tsx, inventory.tsx, finance.tsx, settings.tsx
  components/   # Same UI kit as hall-app
  contexts/     # AuthContext, ThemeContext, StatusBarContext
  lib/
    api.ts, auth-storage.ts, roles.ts
    services/   # Mirrors admin/lib/services/*
  theme/        # Blue color tokens
```

## Run

```bash
cd hall-admin-app
npm install
# set EXPO_PUBLIC_API_URL in repo root .env
npx expo start
# native Android (after app.json changes):
npx expo prebuild --platform android
npx expo run:android
```
