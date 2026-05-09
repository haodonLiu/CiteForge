# 设计规范：排版系统

## 字号层级（桌面端优化）

Web 默认 16px 在桌面应用里笨拙且浪费空间。参考 Raycast/Linear：

| 层级 | 字号 | 字重 | 字距 | 用途 |
|------|------|------|------|------|
| Window Title | 13px | 600 | 0 | 窗口标题 |
| Section Title | 18px | 600 | -0.02em | 页面标题 |
| Body | 14px | 400 | 0 | 正文、列表、卡片 |
| UI Label | 12px | 500 | 0.02em | 按钮、标签、Tab |
| Caption | 11px | 500 | 0.04em | 时间戳、版本号 |

## 字体栈

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
--font-serif: 'Georgia', serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
```

注意：不要引入网络字体，会拖慢 Tauri 冷启动。

## KaTeX 特殊处理

数学公式字体必须打包进 `src-tauri/resources/fonts/`，CSS 中 `@font-face` 指向 `tauri://localhost` 路径，避免首次渲染闪屏。
