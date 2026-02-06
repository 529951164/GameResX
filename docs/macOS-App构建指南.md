# macOS .app 应用构建指南

## 概述

本文档详细说明如何为任何命令行项目创建一个可双击启动的 macOS 应用程序（.app）。

## 适用场景

- Electron 项目（如本项目）
- Node.js 项目
- Python 项目
- 任何需要在终端中运行的项目

---

## 构建步骤

### 1. 创建 .app 目录结构

macOS 应用程序的标准目录结构：

```
YourApp.app/
├── Contents/
    ├── Info.plist          # 应用程序配置文件
    ├── MacOS/
    │   └── launcher        # 启动脚本
    └── Resources/
        └── icon.icns       # 应用图标（可选）
```

**执行命令：**

```bash
mkdir -p "项目路径/YourApp.app/Contents/MacOS"
mkdir -p "项目路径/YourApp.app/Contents/Resources"
```

### 2. 创建 Info.plist 配置文件

Info.plist 是 macOS 应用的配置文件，定义应用的基本信息。

**文件路径：** `YourApp.app/Contents/Info.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
    <key>CFBundleIconFile</key>
    <string>icon</string>
    <key>CFBundleIdentifier</key>
    <string>com.yourcompany.yourapp</string>
    <key>CFBundleName</key>
    <string>YourApp</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.12</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
```

**关键字段说明：**

- `CFBundleExecutable`: 启动脚本名称（必须与 MacOS 目录下的脚本文件名一致）
- `CFBundleIdentifier`: 应用唯一标识符（建议使用反向域名格式）
- `CFBundleName`: 应用显示名称
- `CFBundleIconFile`: 图标文件名（不含 .icns 扩展名）

### 3. 创建启动脚本

**文件路径：** `YourApp.app/Contents/MacOS/launcher`

```bash
#!/bin/bash

# 获取 .app 所在的项目根目录
PROJECT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"

# 使用 AppleScript 打开终端并执行命令
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$PROJECT_DIR' && npm run dev"
end tell
EOF
```

**脚本说明：**

- `PROJECT_DIR`: 自动获取项目根目录路径
- `osascript`: 使用 AppleScript 启动终端
- `npm run dev`: 替换为你的实际启动命令

**常见启动命令示例：**

```bash
# Electron 项目
do script "cd '$PROJECT_DIR' && npm run dev"

# Python 项目
do script "cd '$PROJECT_DIR' && python3 main.py"

# Node.js 项目
do script "cd '$PROJECT_DIR' && node index.js"

# Unity 项目（打开编辑器）
do script "cd '$PROJECT_DIR' && open -a Unity YourProject.unity"
```

### 4. 设置权限

**执行命令：**

```bash
# 1. 给启动脚本添加执行权限
chmod +x "YourApp.app/Contents/MacOS/launcher"

# 2. 设置整个 .app 的权限
chmod -R 755 "YourApp.app"

# 3. 清除 macOS 隔离属性（解决"无法验证开发者"问题）
xattr -cr "YourApp.app"
```

---

## 高级功能

### 添加自定义图标

1. **准备图标文件**（.icns 格式）
   - 推荐尺寸：512x512 或 1024x1024
   - 可以使用在线工具将 PNG 转换为 ICNS

2. **放置图标文件**
   ```bash
   cp icon.icns "YourApp.app/Contents/Resources/icon.icns"
   ```

3. **Info.plist 中已配置**（见第2步）

### 后台运行（不显示终端窗口）

如果你不想显示终端窗口，可以修改启动脚本：

```bash
#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$PROJECT_DIR"

# 后台运行，不显示终端
nohup npm run dev > /dev/null 2>&1 &
```

**注意：** 后台运行模式下无法看到日志输出。

### 添加到 Dock 栏

1. 将 `YourApp.app` 拖动到 Dock 栏
2. 右键点击 → "选项" → "在 Dock 中保留"

---

## 常见问题解决

### 问题1：无法打开，提示"无法验证开发者"

**解决方法：**

```bash
xattr -cr "YourApp.app"
```

或者：
- 右键点击 .app → 选择"打开"（而不是双击）
- 点击弹出对话框中的"打开"按钮

### 问题2：双击没反应

**排查步骤：**

1. 检查启动脚本权限
   ```bash
   ls -la "YourApp.app/Contents/MacOS/launcher"
   ```
   应该显示 `-rwxr-xr-x`

2. 手动测试脚本
   ```bash
   ./YourApp.app/Contents/MacOS/launcher
   ```

3. 查看系统日志
   ```bash
   log show --predicate 'process == "launcher"' --last 1m
   ```

### 问题3：终端打开但命令执行失败

**可能原因：**
- 项目路径获取错误
- 启动命令不正确
- 缺少依赖（如 Node.js、npm 未安装）

**调试方法：**

在启动脚本中添加日志：

```bash
#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"

# 输出调试信息
echo "Project Directory: $PROJECT_DIR"
echo "Running command..."

osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$PROJECT_DIR' && npm run dev"
end tell
EOF
```

### 问题4：.app 图标显示为白板

**原因：** 图标未正确加载

**解决方法：**
1. 确保 `icon.icns` 文件存在于 `Contents/Resources/` 目录
2. 重启 Finder：`killall Finder`
3. 清除图标缓存：
   ```bash
   sudo rm -rf /Library/Caches/com.apple.iconservices.store
   sudo find /private/var/folders/ -name com.apple.iconservices -exec rm -rf {} \;
   killall Finder
   ```

---

## 快速模板

### 完整构建脚本

将以下内容保存为 `create-macos-app.sh`，一键创建 macOS 应用：

```bash
#!/bin/bash

# 配置参数
APP_NAME="YourApp"          # 应用名称
BUNDLE_ID="com.yourcompany.yourapp"  # Bundle ID
START_COMMAND="npm run dev"  # 启动命令

# 创建目录结构
mkdir -p "${APP_NAME}.app/Contents/MacOS"
mkdir -p "${APP_NAME}.app/Contents/Resources"

# 创建 Info.plist
cat > "${APP_NAME}.app/Contents/Info.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
    <key>CFBundleIconFile</key>
    <string>icon</string>
    <key>CFBundleIdentifier</key>
    <string>BUNDLE_ID_PLACEHOLDER</string>
    <key>CFBundleName</key>
    <string>APP_NAME_PLACEHOLDER</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.12</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
PLIST

# 替换占位符
sed -i '' "s/BUNDLE_ID_PLACEHOLDER/${BUNDLE_ID}/g" "${APP_NAME}.app/Contents/Info.plist"
sed -i '' "s/APP_NAME_PLACEHOLDER/${APP_NAME}/g" "${APP_NAME}.app/Contents/Info.plist"

# 创建启动脚本
cat > "${APP_NAME}.app/Contents/MacOS/launcher" << 'LAUNCHER'
#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"

osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$PROJECT_DIR' && START_COMMAND_PLACEHOLDER"
end tell
EOF
LAUNCHER

# 替换启动命令
sed -i '' "s/START_COMMAND_PLACEHOLDER/${START_COMMAND}/g" "${APP_NAME}.app/Contents/MacOS/launcher"

# 设置权限
chmod +x "${APP_NAME}.app/Contents/MacOS/launcher"
chmod -R 755 "${APP_NAME}.app"
xattr -cr "${APP_NAME}.app"

echo "✅ ${APP_NAME}.app 创建成功！"
```

**使用方法：**

1. 修改脚本顶部的配置参数
2. 执行脚本：`bash create-macos-app.sh`

---

## 最佳实践

1. **命名规范**
   - .app 名称使用 PascalCase（如 GameResX.app）
   - Bundle ID 使用反向域名（如 com.company.appname）

2. **版本控制**
   - 将 .app 添加到 .gitignore
   - 提供构建脚本而不是直接提交 .app

3. **图标设计**
   - 使用高分辨率图标（至少 512x512）
   - 保持图标风格与 macOS 系统一致
   - 使用圆角矩形（macOS 风格）

4. **用户体验**
   - 启动脚本中添加必要的错误检查
   - 提供清晰的错误提示
   - 在 README 中说明首次运行可能需要授权

---

## 参考资料

- [Apple Bundle Programming Guide](https://developer.apple.com/library/archive/documentation/CoreFoundation/Conceptual/CFBundles/Introduction/Introduction.html)
- [Info.plist Key Reference](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Introduction/Introduction.html)
- [AppleScript Language Guide](https://developer.apple.com/library/archive/documentation/AppleScript/Conceptual/AppleScriptLangGuide/introduction/ASLR_intro.html)

---

## 更新记录

- **2026-02-06**: 创建初始版本，适配 GameResX 项目
