# Agents.md Studio

AI编码代理配置可视化编辑器 - VS Code扩展

## 功能特性

- 📝 **Monaco Editor** 驱动的 Markdown 编辑器
- 🎨 可视化代理配置界面
- 🔍 配置预览和验证
- 🤖 支持多种AI模型配置
- 📊 侧边栏集成

## 快速开始

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
# 编译扩展主代码
npm run compile

# 构建 Webview 前端
npm run build-webview
```

或者一次性构建：

```bash
npm run vscode:prepublish
```

### 运行扩展

1. 在 VS Code 中打开本项目
2. 按 `F5` 打开扩展开发主机
3. 在新窗口中打开命令面板 (`Ctrl+Shift+P` / `Cmd+Shift+P`)
4. 输入并选择 `Agents.md: Open Agents.md Studio`
5. 或者点击左侧活动栏的 Agents.md Studio 图标

### 开发模式

启动监视模式，自动重新编译：

```bash
# 终端1: 监视扩展代码
npm run watch

# 终端2: 监视 Webview 代码
npm run watch-webview
```

## 项目结构

```
agentsmd-studio/
├── .vscode/                  # VS Code 工作区配置
│   ├── launch.json          # 调试配置
│   └── tasks.json           # 任务配置
├── out/                     # 编译输出
│   ├── extension.js         # 扩展主代码
│   └── webview/             # Webview 前端代码
│       ├── app.js           # React 应用
│       └── style.css        # 样式
├── resources/               # 静态资源
│   └── icon.svg             # 扩展图标
├── src/                     # 源代码
│   ├── extension.ts         # 扩展入口
│   └── webview/             # Webview 源码
│       ├── index.tsx        # React 应用入口
│       ├── components/      # React 组件
│       │   └── MonacoEditor.tsx
│       └── styles.css       # 样式
├── package.json             # 扩展配置和依赖
├── tsconfig.json            # TypeScript 配置（扩展）
├── tsconfig.webview.json    # TypeScript 配置（Webview）
├── webpack.config.js        # Webpack 配置
└── README.md                # 说明文档
```

## 技术栈

- **扩展**: VS Code Extension API (TypeScript)
- **前端**: React 18 + TypeScript
- **编辑器**: Monaco Editor (@monaco-editor/react)
- **构建**: Webpack 5 + ts-loader
- **样式**: CSS

## 命令

| 命令 | 描述 |
|------|------|
| `Agents.md: Open Agents.md Studio` | 打开主编辑器面板 |

## 视图

- **侧边栏**: 左侧活动栏的 "Agents.md Studio" 图标

## 开发计划

- [ ] AGENTS.md 文件解析
- [ ] 可视化表单编辑器
- [ ] 实时预览
- [ ] 配置验证
- [ ] 导出/导入功能

## 许可证

MIT
