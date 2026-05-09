# 设计规范：交互细节

## 滚动条

Web 默认滚动条像"网页"，自定义：

```css
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover { background: var(--color-text-muted); }
```

## 自定义标题栏

`tauri.conf.json`：

```json
{
  "app": {
    "windows": [{ "decorations": false, "transparent": true }]
  }
}
```

React 标题栏（40px）：
- 左侧：应用图标 + 标题（13px, font-semibold）
- 中间：Tab 切换
- 右侧：窗口控制按钮

## 右键菜单

用 Tauri 原生菜单 API，不用 Web 自定义：

```rust
tauri::menu::MenuBuilder::new(app)
    .item(&tauri::menu::MenuItemBuilder::new("复制").build(app)?)
    .item(&tauri::menu::MenuItemBuilder::new("引用").build(app)?)
    .build()?;
```

## 动画策略

桌面用户期待"即时感"：

| 交互 | 时长 | 缓动 | 原因 |
|------|------|------|------|
| 按钮 hover | 100ms | `ease-out` | 立即反馈 |
| 页面切换 | 0ms | none | 即时 |
| 模态框 | 150ms | `cubic-bezier(0.16, 1, 0.3, 1)` | 快起慢停 |
| 侧边栏展开 | 200ms | `ease-out` | 比 Web 抽屉快一倍 |

超过 200ms 的过渡像卡顿。
