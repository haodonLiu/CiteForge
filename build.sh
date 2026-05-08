#!/bin/bash
set -e

MODE="${1:---release}"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$ROOT_DIR/dist"

echo "🔨 CiteForge 构建开始..."
echo "模式: $MODE"

# 1. 前端构建
echo ""
echo "📦 [1/3] 构建前端..."
cd "$ROOT_DIR/src"
npm install --silent
npm run build
echo "✅ 前端构建完成"

# 2. Rust 后端构建
echo ""
echo "🦀 [2/3] 构建 Rust 后端..."
cd "$ROOT_DIR/src-tauri"
if [ "$MODE" = "--debug" ]; then
  cargo build
else
  cargo build --release
fi
echo "✅ Rust 构建完成"

# 3. 收集构建产物
echo ""
echo "📁 [3/3] 收集构建产物..."
mkdir -p "$OUT_DIR"
BUNDLE_DIR="target/release/bundle"
if [ "$MODE" = "--debug" ]; then
  BUNDLE_DIR="target/debug/bundle"
fi

if [ -d "$BUNDLE_DIR" ]; then
  cp -r "$BUNDLE_DIR"/* "$OUT_DIR/" 2>/dev/null || true
  echo "✅ 构建产物已复制到 $OUT_DIR"
else
  echo "⚠️  未找到 bundle 目录，请检查构建日志"
fi

# 4. 显示结果
echo ""
echo "=========================================="
echo "✅ 构建完成！"
echo "📁 输出目录: $OUT_DIR"
echo "=========================================="
ls -la "$OUT_DIR" 2>/dev/null || echo "（目录为空）"
