# 设计规范：组件风格

## Button

按层级分圆角：

| 类型 | 圆角 | 用途 |
|------|------|------|
| 常规按钮 | `rounded-md` (6px) | 一般操作 |
| CTA 按钮 | `rounded-lg` (8px) | 创建/保存等不可逆操作 |
| 图标按钮 | `rounded` (4px) | 工具栏图标 |

Ghost 按钮是主力，Primary 只用于"不可逆操作"。

## Card

无阴影，用边框+背景区分层级：

```tsx
// 层级 1：页面背景
<div className="bg-background">
// 层级 2：卡片/面板
<div className="bg-surface border border-border rounded-lg">
// 层级 3：可交互元素
<button className="bg-card hover:border-primary/50">
```

## Input

输入框背景必须与页面背景不同：

- 页面背景 `#faf8f5`（暖白）
- 输入框背景 `#ffffff`（纯白）

用户一眼识别可编辑区域。

## Monaco Editor

主题切换时必须同步：

```ts
const monacoThemeMap = {
  midnight_scholar: 'vs-dark',
  classic_paper: 'vs',
  green_garden: 'vs',
  high_contrast: 'hc-black',
};

monaco.editor.setTheme(monacoThemeMap[currentTheme]);
```

## PDF 阅读器

暗色主题下白色 PDF 是灾难：
1. PDF 渲染区域周围用 `bg-surface` 包裹
2. 工具栏显示提示："PDF 保持原始配色以保护印刷色彩准确性"

## Agent Chat

Linear Thread 风格，不是微信气泡：
- 左侧：头像 + 时间轴细线（`w-px bg-border`）
- 右侧：内容区，无圆角气泡，用 `border-l-2 border-primary` 标记 AI 回复
