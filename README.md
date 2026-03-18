# 🤖 Agents.md Studio

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](https://github.com/caoyachao/agentsmd-studio)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.80%2B-blue.svg)](https://code.visualstudio.com/)

AI 编码代理配置的可视化编辑器 - VS Code 扩展

## ✨ 功能特性

- 📝 **可视化表单编辑器** - 直观的表单界面编辑 Agent 配置
- 🗂️ **文件树浏览器** - 侧边栏展示所有 AGENTS.md 文件
- 📋 **模板系统** - 内置 Python/Node.js/React 项目模板
- 🔧 **YAML 解析** - 智能解析和编辑 frontmatter
- 💾 **一键保存** - 实时保存到文件
- 🎨 **VS Code 原生风格** - 完美融入编辑器主题

## 🚀 快速开始

### 安装

从 VS Code 扩展市场搜索 "Agents.md Studio" 安装，或从源码构建：

```bash
git clone https://github.com/caoyachao/agentsmd-studio.git
cd agentsmd-studio
npm install
npm run compile
```

然后在 VS Code 中按 `F5` 启动扩展开发主机。

### 使用方法

1. 打开包含 AGENTS.md 文件的工作区
2. 点击左侧活动栏的 **Agents.md Studio** 图标
3. 在侧边栏查看所有 AGENTS.md 文件
4. 点击文件使用可视化编辑器打开
5. 编辑配置并点击保存

## 📸 功能截图

### 文件树浏览
侧边栏自动扫描并展示工作区中的所有 AGENTS.md 文件

### 可视化编辑器
- 基础信息：名称、版本、描述、角色、模型
- 能力标签：动态添加/删除能力项
- 工具列表：管理 Agent 可调用的工具
- 命令管理：可视化编辑自定义命令
- 系统提示词：编辑系统级行为定义

### 模板系统
内置 4 个模板快速开始：
- 🐍 **Python Agent** - 数据分析和脚本执行
- 🟢 **Node.js Agent** - 后端 API 开发
- ⚛️ **React Agent** - 前端 UI 开发
- 🤖 **General Assistant** - 通用配置

## 🛠️ 技术栈

- **扩展核心**: VS Code Extension API + TypeScript
- **可视化界面**: Webview + 原生 JavaScript
- **配置解析**: js-yaml
- **主题适配**: VS Code CSS Variables

## 📁 项目结构

```
agentsmd-studio/
├── src/
│   ├── extension.ts              # 扩展入口
│   ├── treeView.ts               # 文件树视图
│   ├── yamlParser.ts             # YAML 解析器
│   ├── fileWatcher.ts            # 文件监听
│   ├── webview/
│   │   └── editorProvider.ts     # 可视化编辑器
│   └── templates/
│       └── templateManager.ts    # 模板管理
├── resources/
│   └── icon.svg                  # 扩展图标
├── test-workspace/               # 测试文件
├── package.json                  # 扩展配置
├── tsconfig.json                 # TypeScript 配置
└── README.md                     # 说明文档
```

## 📝 AGENTS.md 格式

```yaml
---
name: My Agent
version: 1.0.0
description: An AI agent for coding assistance
role: Developer
model: gpt-4
capabilities:
  - Code generation
  - Code review
tools:
  - web_search
  - file_read
commands:
  - name: review
    description: Review code
    prompt: Please review this code...
systemPrompt: |
  You are a helpful coding assistant.
---

# My Agent

Additional documentation...
```

## 🎯 开发计划

- [x] 文件树展示
- [x] 文件监听
- [x] YAML 解析
- [x] 可视化表单编辑器
- [x] 模板系统
- [x] GitHub 仓库
- [ ] 实时预览面板
- [ ] 配置验证
- [ ] 导出/导入功能
- [ ] VS Code 市场发布

## 📄 许可证

MIT © [Jack](https://github.com/caoyachao)

---

**Happy Coding with AI Agents! 🤖✨**
