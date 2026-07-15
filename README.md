# 图片编辑器

基于 Vue 3 + TypeScript + Vite + Canvas 的轻量图片编辑器。

## 功能

- 上传本地图片（JPG / PNG / WebP）
- 亮度 / 对比度 / 饱和度调整
- 旋转 90°、水平/垂直翻转
- **裁剪**：拖动选区、四角缩放，应用后写入新图
- **滤镜**：原图 / 黑白 / 复古 / 反色 / 模糊 / 胶片 / 冷色 / 暖色
- **文字水印**：文案、字号、颜色、透明度、位置
- 导出 PNG / JPG
- 撤销上一步（按钮 / Ctrl·⌘ + Z）
- 一键重置

## 快速开始

```bash
npm install
npm run dev
```

浏览器访问 http://localhost:5173

## 构建

```bash
npm run build
```

## 自动部署（GitHub Pages）

推送到 `main` 后，GitHub Actions 会自动构建并部署到 GitHub Pages。

首次启用：

1. 仓库 **Settings → Pages**
2. **Source** 选择 **GitHub Actions**
3. 推送代码到 `main`，或手动在 Actions 里运行 **Deploy to GitHub Pages**

部署完成后访问：`https://dinert.github.io/image-editor/`

## 项目结构

```
src/
├── components/
│   ├── Toolbar.vue       # 左侧工具栏
│   └── ImageCanvas.vue   # 画布预览 + 裁剪交互
├── composables/
│   └── useImageEditor.ts # 编辑逻辑
├── types/
│   └── editor.ts         # 类型与默认配置
└── App.vue
```

## 使用提示

1. 先上传图片
2. 裁剪：点「开始裁剪」→ 拖动/缩放选区 →「应用裁剪」
3. 滤镜与水印可随时调整，导出时会一并写入结果
