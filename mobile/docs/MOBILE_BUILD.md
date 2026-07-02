# Mobile Release Build

本文档说明如何把 `mobile/` 里的 Expo / React Native 项目打成 Android APK、Android AAB 和 iOS 包。

## 1. 当前打包状态

项目已经具备 EAS Build 基础配置：

```text
mobile/app.config.js
mobile/eas.json
mobile/package.json
```

默认生产 API 地址：

```text
https://web-production-3f3a8.up.railway.app
```

本地调试时可以用环境变量覆盖：

```bash
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 npm run ios
```

## 2. 前置条件

进入移动端目录：

```bash
cd /Users/king/Documents/Codex/2026-05-07/korean_learn/mobile
```

Node 建议使用 20 或更高版本：

```bash
nvm use 20
node -v
```

安装依赖：

```bash
npm install
```

登录 Expo / EAS：

```bash
npx eas-cli login
```

首次使用时可以检查项目：

```bash
npx expo config --type public
```

## 3. Android APK

APK 适合直接安装到 Android 手机测试。

```bash
npm run build:android:apk
```

等 EAS Build 完成后，终端会给出下载地址。

## 4. Android AAB

AAB 适合 Google Play 正式发布。

```bash
npm run build:android:aab
```

## 5. iOS Preview / IPA

iOS 真机安装、TestFlight、正式发布都需要 Apple Developer Program。

内部测试包：

```bash
npm run build:ios:preview
```

正式发布包：

```bash
npm run build:ios:production
```

iPhone 和 iPad 使用同一个 iOS App。当前配置里已经开启：

```json
"supportsTablet": true
```

## 6. iOS 模拟器包

这个包只能安装到 iOS Simulator，不能装到真机。

```bash
npm run build:ios:simulator
```

## 7. API 地址规则

打包配置在 `mobile/eas.json`：

```json
"EXPO_PUBLIC_API_BASE_URL": "https://web-production-3f3a8.up.railway.app"
```

如果线上域名变化，需要同步修改：

- `mobile/eas.json`
- `mobile/app.config.js` 的默认地址
- 本文档中的示例地址

## 8. 常见问题

### EAS 要求创建/关联项目

首次执行 `eas build` 时，EAS 可能会提示是否创建或关联 Expo 项目。按提示确认即可。

### iOS 要求 Apple 账号

iOS 真机包、TestFlight 和 App Store 都需要 Apple Developer Program。没有 Apple 开发者账号时，可以先打 Android APK 或 iOS Simulator 包。

### Android 签名

首次打 Android 包时，EAS 会询问是否自动生成 keystore。测试阶段建议选择让 EAS 自动管理。

### 包里访问不到数据

优先检查 `EXPO_PUBLIC_API_BASE_URL` 是否是公网 HTTPS 地址。正式包不能依赖 `127.0.0.1` 或 Mac 局域网 IP。
