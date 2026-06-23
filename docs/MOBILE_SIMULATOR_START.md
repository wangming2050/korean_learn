# iOS 和 iPad 模拟器启动说明

这份文档记录本地同时启动 iPhone 和 iPad 模拟器的稳定流程。当前移动端使用同一个 Expo/React Native App，iPhone 和 iPad 不是两套代码，而是同一套 App 根据屏幕宽度适配。

## 前置条件

- Web 服务需要先启动，因为移动端会从 Web API 读取同一套数据。
- Node 建议使用 20 或更高版本。
- 当前推荐使用 iOS development build，不推荐直接用 Expo Go 跑这个项目。

检查 Node：

```bash
node -v
```

如果本机使用 nvm：

```bash
nvm use 20
```

## 1. 启动 Web 服务

在项目根目录执行：

```bash
cd /Users/king/Documents/Codex/2026-05-07/korean_learn
HOST=0.0.0.0 PORT=8008 ./start.sh
```

验证 API 是否可访问：

```bash
curl http://127.0.0.1:8008/api/letters
```

如果要给模拟器访问，建议使用 Mac 局域网 IP：

```bash
ipconfig getifaddr en0
```

例如本次启动使用的是：

```text
10.11.13.132
```

## 2. 启动 Metro

打开新终端，进入移动端目录：

```bash
cd /Users/king/Documents/Codex/2026-05-07/korean_learn/mobile
```

启动 Metro，并把 API 地址指向 Web 服务：

```bash
EXPO_PUBLIC_API_BASE_URL=http://10.11.13.132:8008 \
NODE_OPTIONS=--require=./scripts/expo-node-polyfill.cjs \
npx expo start --host lan --clear
```

如果你的 Mac IP 不是 `10.11.13.132`，把命令里的 IP 换成你自己机器的局域网 IP。

## 3. 查看可用模拟器

```bash
```

本次使用的设备是：

```text
iPhone 17 Pro: 2960E898-A7C7-4DA4-87E3-47ACAEDC610C
iPad (A16): AD960A6B-4B6E-43D1-B60A-B1EDF64735AA
```

如果模拟器没有启动，可以先启动：

```bash
open -a Simulator
```

## 4. 首次构建并安装 iPhone 版本

首次运行或原生依赖变化后，需要构建 iOS App：

```bash
cd /Users/king/Documents/Codex/2026-05-07/korean_learn/mobile
EXPO_PUBLIC_API_BASE_URL=http://10.11.13.132:8008 \
/opt/homebrew/bin/npx expo run:ios --device "iPhone 17 Pro"
```




构建成功后，会安装并打开：

```text
com.koreanlearn.app
```

## 5. 安装并启动 iPad 版本

iPad 使用同一个 App。iPhone 构建完成后，可以把同一个 `.app` 安装到 iPad 模拟器。

先确认构建产物路径。通常在：

```text
/Users/king/Library/Developer/Xcode/DerivedData/KoreanLearn-dihbnxndnmmxvxgrqrdtsyyjaiyo/Build/Products/Debug-iphonesimulator/KoreanLearn.app
```

安装到 iPad：

```bash
xcrun simctl install AD960A6B-4B6E-43D1-B60A-B1EDF64735AA \
/Users/king/Library/Developer/Xcode/DerivedData/KoreanLearn-dihbnxndnmmxvxgrqrdtsyyjaiyo/Build/Products/Debug-iphonesimulator/KoreanLearn.app
```

启动 iPad App：

```bash
xcrun simctl launch AD960A6B-4B6E-43D1-B60A-B1EDF64735AA com.koreanlearn.app
```

## 6. 日常启动命令

如果已经构建安装过，日常只需要：

1. 启动 Web 服务。
2. 启动 Metro。
3. 启动两个模拟器里的 App。

命令如下：

```bash
cd /Users/king/Documents/Codex/2026-05-07/korean_learn
HOST=0.0.0.0 PORT=8008 ./start.sh
```

新终端：

```bash
cd /Users/king/Documents/Codex/2026-05-07/korean_learn/mobile
EXPO_PUBLIC_API_BASE_URL=http://10.11.13.132:8008 \
NODE_OPTIONS=--require=./scripts/expo-node-polyfill.cjs \
npx expo start --host lan
```

新终端：

```bash
xcrun simctl launch 2960E898-A7C7-4DA4-87E3-47ACAEDC610C com.koreanlearn.app
xcrun simctl launch AD960A6B-4B6E-43D1-B60A-B1EDF64735AA com.koreanlearn.app
```

## 常见问题

### 1. 移动端显示未连接数据

确认 Web 服务是否启动：

```bash
curl http://127.0.0.1:8008/api/letters
```

确认 Metro 启动时的 `EXPO_PUBLIC_API_BASE_URL` 是否使用了正确的 Mac 局域网 IP。

### 2. 端口 8081 被占用

查看占用：

```bash
lsof -i :8081 -sTCP:LISTEN
```

结束占用进程：

```bash
lsof -ti :8081 | xargs -r kill
```

### 3. Expo Go 报原生模块缺失

如果看到类似下面的错误：

```text
Cannot find native module 'ExpoAsset'
Cannot find native module 'ExponentAV'
```

不要继续用 Expo Go，改用本文档里的 iOS development build 流程。

### 4. 原生依赖变化后重新同步

如果 `package.json` 的原生依赖发生变化，进入 `mobile/ios` 后执行：

```bash
cd /Users/king/Documents/Codex/2026-05-07/korean_learn/mobile/ios
pod install
```

然后重新执行：

```bash
cd /Users/king/Documents/Codex/2026-05-07/korean_learn/mobile
EXPO_PUBLIC_API_BASE_URL=http://10.11.13.132:8008 \
/opt/homebrew/bin/npx expo run:ios --device "iPhone 17 Pro"
```

## 当前注意点

当前为了先保证 iPhone 和 iPad 页面稳定启动，已经移除了不兼容的 `expo-av`。因此原生音频播放和录音能力需要后续换成与 Expo 56 兼容的音频方案后再接回。
