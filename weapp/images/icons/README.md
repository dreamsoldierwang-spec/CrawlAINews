# 图标下载指南

## 设计风格
科技小清新风格，使用渐变色和圆润设计

## 配色方案
- 主色：#6366f1 (靛蓝紫)
- 辅色：#06b6d4 (青色)
- 强调色：#f472b6 (粉色)
- 背景：#f8fafc (浅灰白)

## 需要下载的图标

### 1. TabBar 图标 (24x24px, PNG)
在 [阿里巴巴矢量图标库](https://www.iconfont.cn/) 搜索下载：

| 图标名称 | 搜索关键词 | 风格要求 |
|---------|-----------|---------|
| 首页 | "home" | 线性风格，圆角 |
| 首页选中 | "home" | 填充风格，圆角 |
| 收藏 | "star" 或 "bookmark" | 线性风格，圆角 |
| 收藏选中 | "star" 或 "bookmark" | 填充风格，圆角 |
| 我的 | "user" 或 "person" | 线性风格，圆角 |
| 我的选中 | "user" 或 "person" | 填充风格，圆角 |

**配色**：
- 未选中：#94a3b8 (灰色)
- 选中：#6366f1 (主色)

### 2. 功能图标 (建议 48x48px)

| 用途 | 搜索关键词 | 颜色 |
|-----|-----------|-----|
| AI机器人 | "robot" "AI" | 渐变紫蓝 |
| 日历 | "calendar" | #6366f1 |
| 统计 | "chart" "analytics" | #6366f1 |
| 闪电/实时 | "lightning" "zap" | #06b6d4 |
| 分享 | "share" | #6366f1 |
| 链接 | "link" | #06b6d4 |
| 收藏星星 | "star" | #f59e0b |
| 返回箭头 | "arrow-left" | #6366f1 |
| 钻石/装饰 | "diamond" "sparkle" | 渐变色 |

### 3. 来源图标 (24x24px)
为每个信息源准备一个小图标：

| 来源 | 图标建议 |
|-----|---------|
| GitHub | GitHub logo |
| Hacker News | "HN" 或 "news" |
| 知乎 | "知" 字图标 |
| 36氪 | "36" 或 "tech" |
| arXiv | "论文" 或 "academic" |

## 下载步骤

1. 访问 [iconfont.cn](https://www.iconfont.cn/)
2. 搜索上述关键词
3. 选择"线性"或"填充"风格
4. 下载 PNG 格式
5. 按下方文件结构放置

## 文件结构

```
weapp/images/
├── tabbar/
│   ├── home.png          # 首页未选中
│   ├── home-active.png   # 首页选中
│   ├── favorite.png      # 收藏未选中
│   ├── favorite-active.png # 收藏选中
│   ├── profile.png       # 我的未选中
│   └── profile-active.png # 我的选中
└── icons/
    ├── robot.png         # AI机器人
    ├── calendar.png      # 日历
    ├── chart.png         # 统计
    ├── lightning.png     # 实时
    ├── share.png         # 分享
    ├── link.png          # 链接
    ├── star.png          # 收藏
    ├── arrow-left.png    # 返回
    └── sparkle.png       # 装饰
```

## 注意事项

1. 所有图标保持统一风格（线性或填充）
2. 尺寸建议：TabBar 81x81px，功能图标 48x48px
3. 文件大小不超过 40KB
4. 命名使用英文小写，单词间用连字符
