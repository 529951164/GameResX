#!/bin/bash

# ============================================
# macOS .app 快速构建脚本
# 使用方法: bash create-macos-app.sh
# ============================================

# 配置参数（根据项目修改）
APP_NAME="GameResX"                          # 应用名称
BUNDLE_ID="com.gameresx.app"                 # Bundle ID
START_COMMAND="npm run dev"                  # 启动命令
VERSION="1.0.0"                              # 版本号

echo "🚀 开始创建 ${APP_NAME}.app..."

# 创建目录结构
mkdir -p "${APP_NAME}.app/Contents/MacOS"
mkdir -p "${APP_NAME}.app/Contents/Resources"
echo "✓ 目录结构创建完成"

# 创建 Info.plist
cat > "${APP_NAME}.app/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
    <key>CFBundleIconFile</key>
    <string>icon</string>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_ID}</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION}</string>
    <key>CFBundleVersion</key>
    <string>${VERSION}</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.12</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF
echo "✓ Info.plist 创建完成"

# 创建启动脚本
cat > "${APP_NAME}.app/Contents/MacOS/launcher" << 'EOF'
#!/bin/bash

# 获取项目根目录
PROJECT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"

# 使用 AppleScript 打开终端并执行命令
osascript <<APPLESCRIPT
tell application "Terminal"
    activate
    do script "cd '$PROJECT_DIR' && ${START_COMMAND}"
end tell
APPLESCRIPT
EOF

# 替换启动命令占位符
sed -i '' "s/\${START_COMMAND}/${START_COMMAND}/g" "${APP_NAME}.app/Contents/MacOS/launcher"
echo "✓ 启动脚本创建完成"

# 设置权限
chmod +x "${APP_NAME}.app/Contents/MacOS/launcher"
chmod -R 755 "${APP_NAME}.app"
echo "✓ 权限设置完成"

# 清除隔离属性
xattr -cr "${APP_NAME}.app"
echo "✓ 安全属性清除完成"

echo ""
echo "✅ ${APP_NAME}.app 创建成功！"
echo ""
echo "📝 使用方法："
echo "   - 双击 ${APP_NAME}.app 启动项目"
echo "   - 或拖动到 Dock 栏快速访问"
echo ""
echo "📚 详细文档: docs/macOS-App构建指南.md"
