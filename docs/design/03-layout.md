# 设计规范：布局密度

## 侧边栏

- 固定宽度 **260px**（macOS Finder / VS Code 验证过的黄金宽度）
- 不要百分比
- 背景色与主内容区不同，用 **1px 右边框** 分割，不用阴影

```tsx
<aside className="w-[260px] h-screen bg-surface border-r border-border shrink-0">
```

## 阅读/编辑区域

最大宽度限制 **72ch（约 680px）**，居中显示：

```tsx
<div className="max-w-[72ch] mx-auto">
```

学术写作和 PDF 标准行宽是 66-75 字符，超过效率下降。

## 工具栏高度

**40px**，图标 16px，间距 8px。不要做成 Web 应用的 56px 顶栏。

## 层级体系

```
页面背景 (bg-background)
  └── 卡片/面板 (bg-surface, border)
        └── 可交互元素 (bg-card, hover:border-primary)
```

不要用阴影分割层级。
