# 设计规范：色彩系统

## 主题功能差异化

4 个主题不是"换色"，而是针对不同场景的功能定位：

| 主题 | 使用场景 | 设计意图 |
|------|---------|---------|
| `ivory_press` (默认) | 日常学术写作 | 象牙白底 + 烫金墨色 + 深红木副色，学术奢华感 |
| `midnight_scholar` | 深夜写作/编码 | 低蓝光，避免纯黑 `#000`，Monaco 必须暗色 |
| `green_garden` | 长时间编辑 | 低刺激，适合 3+ 小时连续工作 |
| `high_contrast` | 演示/无障碍 | 金色替代蓝色，避免光敏性癫痫 |

## 主题色值

### Ivory Press (默认 - 学术烫金风格)
```css
--color-background: #faf8f5;
--color-surface: #f5f2ed;
--color-surface-hover: #ebe6df;
--color-card: #ffffff;
--color-border: #e0d8cc;
--color-text-primary: #1a1915;
--color-text-secondary: #4a4640;
--color-text-muted: #8a857a;
--color-primary: #8b7355;
--color-secondary: #6b4423;
--color-accent: #c9a962;
```

**设计理念**：老式印刷书籍、烫金封面、深红木书架。适合长时间阅读和写作。

### Midnight Scholar (深蓝黑)
```css
--color-background: #0b1120;
--color-surface: #151e32;
--color-surface-hover: #1e2a42;
--color-card: #1a2744;
--color-border: #2a3a5c;
--color-text-primary: #e2e8f0;
--color-text-secondary: #94a3b8;
--color-text-muted: #64748b;
--color-primary: #6366f1;
```

### Green Garden (低刺激绿)
```css
--color-background: #f0f4f1;
--color-surface: #e6ebe8;
--color-surface-hover: #dce5df;
--color-card: #ffffff;
--color-border: #c8d5cc;
--color-text-primary: #2d3b2d;
--color-text-secondary: #4a5d4a;
--color-text-muted: #6b7c6b;
--color-primary: #4a7c59;
```

### High Contrast (高对比度/金色)
```css
--color-background: #000000;
--color-surface: #1a1a1a;
--color-surface-hover: #2d2d2d;
--color-card: #1a1a1a;
--color-border: #4a4a4a;
--color-text-primary: #ffffff;
--color-text-secondary: #e0e0e0;
--color-text-muted: #a0a0a0;
--color-primary: #ffd700;
```

## 统一规则

主色亮度公式：
- 深色背景：主色亮度 ≥ 60%
- 浅色背景：主色亮度 ≤ 50%

切换主题时，按钮、Badge 的视觉重量保持一致。
