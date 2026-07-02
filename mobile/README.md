# Korean Learn Mobile

Universal iPhone/iPad prototype for `korean_learn`.

## Run Locally

```bash
cd mobile
npm install
npm run ios
```

Expo SDK 52 requires Node 18 or newer. If startup reports missing runtime APIs such as
`ReadableStream`, check `node -v` and switch to Node 18/20.

The app reads the same data as the Web app by default:

```bash
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 npm run ios
```

For physical iPhone/iPad testing, start the Web server on the LAN and use your Mac LAN IP:

```bash
HOST=0.0.0.0 PORT=8000 .venv/bin/python server.py
EXPO_PUBLIC_API_BASE_URL=http://<Mac-LAN-IP>:8000 npm run ios
```

For iPad testing, choose an iPad simulator from Expo/Xcode. The same app adapts layouts by screen width:

- iPhone: single-column task flow.
- iPad: split learning workspace.

## Build Release Packages

Release build config is in:

```text
app.config.js
eas.json
docs/MOBILE_BUILD.md
```

Android APK for direct testing:

```bash
npm run build:android:apk
```

Android AAB for Google Play:

```bash
npm run build:android:aab
```

iOS preview / production builds:

```bash
npm run build:ios:preview
npm run build:ios:production
```

iOS real-device packages require Apple Developer Program. The same iOS app supports both iPhone and iPad.

## Current Prototype

- Today training dashboard.
- Compact Hangul pronunciation trainer.
- Vocabulary review cards.
- Scene sentence follow-reading with recording controls.
- Textbook workspace with page notes and audio checklist.

This prototype fetches Web API data first and falls back to local seed data only when the Web server is unavailable. Login, offline packages, and real asset download are planned next.
