---
name: readme-writing
description: >
  书写高质量 README 文档的完整指南。适用于开源项目、参赛作品、个人项目。
  触发场景：用户需要创建或优化 README 文件时。
---

# README 书写 SKILL

## 概述

README 是潜在用户、贡献者和雇主对项目的第一印象，有研究表明拥有完善 README 的项目
获得的 Star 数量是普通项目的 3 倍、贡献者数量是 5 倍。
README 不只是文档，同时也承担着项目营销的职能——它教会所有人关于这个项目的一切。

---

## 标准结构（必须包含）

一个优秀的 README 应包含以下核心部分：项目介绍、项目独特价值、
当前状态、快速上手步骤、基本使用示例、贡献指南、关键资源链接、联系方式。

推荐章节顺序：

```markdown
# 项目名称

<!-- 徽章区 -->
[![版本](badge_url)](link)  [![License](badge_url)](link)

<!-- 一句话描述 -->
> 简洁有力的项目定位，说明做什么、为谁做、解决什么问题

## ✨ 功能特性
## 🚀 快速开始
## 📖 使用说明
## 🏗️ 架构设计（技术项目推荐）
## 🔧 配置说明
## 🗺️ 未来规划 (Roadmap)
## 🤝 贡献指南
## 📄 License
```

---

## 各章节写法规范

### 1. 项目标题 + 描述

清晰的价值主张至关重要，例如"用于构建用户界面的 JavaScript 库"——立即告诉你它做什么。

```markdown
# AI PR Review Assistant

> 一个 Chrome 浏览器插件，为开发者提供 AI 辅助的 GitHub PR 代码审查能力，
> 支持变更概览、深度审查、对话追问三种模式，直接嵌入 GitHub 页面无需切换。
```

**写法原则：**
- 一句话说清楚：做什么 + 面向谁 + 核心价值
- 避免空洞词汇："强大的"、"优雅的"、"全面的"
- 不超过 2 行

---

### 2. 徽章（Badges）

徽章能快速传达项目状态信息，包括构建是否通过、版本是否最新、测试覆盖率等。
Shields.io 是最主流的徽章生成服务，支持数十种 CI 服务、包注册表、
代码分析服务，被世界上最流行的开源项目广泛使用。

**常用徽章模板：**

```markdown
<!-- 版本 -->
![version](https://img.shields.io/badge/version-1.0.0-blue)

<!-- License -->
![license](https://img.shields.io/badge/license-MIT-green)

<!-- 技术栈 -->
![Vue3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js&logoColor=white)
![Chrome](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)

<!-- 状态 -->
![status](https://img.shields.io/badge/status-active-brightgreen)
```

徽章选取原则：只保留真正传达信息的徽章，去掉无意义的装饰性徽章；
保持徽章来源可靠且实时更新。

**参赛/个人项目推荐徽章组合：**
```
技术栈徽章 + License 徽章 + 状态徽章（3-5 个即可，不要堆砌）
```

---

### 3. 功能特性

用简洁的列表展示核心功能，每条一句话，加 emoji 提升可读性：

```markdown
## ✨ 功能特性

- 📋 **Walkthrough 模式** — 快速概览 PR 变更全貌，文件按业务模块分组
- 🔍 **Review 模式** — 深度代码审查，风险分级（🔴高风险 / 🟡中风险 / 🟢建议）
- 💬 **Discuss 模式** — 对话式追问，保持上下文，深入分析具体问题
- ⚡ **流式输出** — SSE 实时流式响应，分析结果逐步展示
- 🔌 **模型可切换** — 支持任意 OpenAI 兼容格式模型
```

---

### 4. 快速开始（Quick Start）

快速开始章节要提供逐步操作指南，让用户能够立即上手。
命令要能直接复制粘贴运行，不要有歧义：

```markdown
## 🚀 快速开始

### 安装

1. 克隆项目
   ```bash
   git clone https://github.com/your-name/pr-review-extension.git
   cd pr-review-extension
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 构建插件
   ```bash
   npm run build
   ```

4. 加载插件
   - 打开 Chrome，进入 `chrome://extensions/`
   - 开启右上角「开发者模式」
   - 点击「加载已解压的扩展程序」，选择 `dist` 目录

### 配置

点击插件图标 → 设置 → 填入以下信息：
| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| API Key | 模型服务的 API Key | - |
| Base URL | 模型 API 地址 | `https://open.bigmodel.cn/api/paas/v4` |
| 模型名称 | 模型标识符 | `glm-4-flash` |
```

---

### 5. 架构设计（技术项目加分项）

参赛作品和技术项目必须有此章节，直接对应评审维度：

```markdown
## 🏗️ 架构设计

### 系统架构图
[架构图 or 流程图]

### 设计说明

**模型选择**
默认使用智谱 GLM-4-Flash，理由：
- 完全免费，降低用户使用门槛
- 兼容 OpenAI 格式，支持一键切换任意模型
- 代码理解能力满足 PR 审查需求

**上下文获取策略**
1. 基础数据：GitHub REST API 获取 PR 元信息、文件变更、commits
2. diff 预处理：过滤噪音，按优先级分配 Token 预算（总 6000 token）
3. 上下文增强：高风险文件额外拉取完整函数体，弥补纯 diff 的上下文缺失

**误报控制**
System Prompt 明确约束：不确定问题标注「⚠️ 需人工确认」，
不做风格主观评价，只关注可量化的安全/逻辑风险。
```

---

### 6. Roadmap（未来规划）

展示项目的发展潜力，对评审者和贡献者都有吸引力：

```markdown
## 🗺️ Roadmap

- [x] GitHub PR 支持
- [x] Walkthrough / Review / Discuss 三模式
- [x] 流式输出
- [ ] GitLab / Gitee 支持
- [ ] 私有仓库 PAT 配置
- [ ] 自定义团队 Review 规则
- [ ] 分析历史记录（IndexedDB）
- [ ] 导出报告为 JSON / Markdown
- [ ] CI/CD 集成（GitHub Actions）
```

---

## 写作风格规范

保持文档与项目同步更新；善用标题、列表、图片提升可读性；段落保持简短清晰；
使用清晰语言，避免无前置知识就看不懂的术语。

避免过长的 README，过长会让用户和贡献者认为项目过于复杂而望而却步；
保持命名约定一致；确保没有失效链接和空章节；格式规范整洁。

| 原则 | 正确做法 | 错误做法 |
|------|---------|---------|
| 简洁 | 一句话说清功能 | 三段话绕圈子 |
| 可执行 | 命令可直接复制运行 | "参考官方文档安装" |
| 视觉层次 | 用 emoji + 标题分层 | 全是纯文本段落 |
| 同步更新 | 功能变更同步更新 README | README 和代码脱节 |
| 语言一致 | 全中文或全英文 | 中英混用 |

---

## 目录（Table of Contents）

README 较长时在开头加目录，使用如下格式，点击可跳转到对应章节：

```markdown
## 目录

- [功能特性](#-功能特性)
- [快速开始](#-快速开始)
- [架构设计](#️-架构设计)
- [配置说明](#-配置说明)
- [Roadmap](#️-roadmap)
- [License](#-license)
```

**注意**：章节标题含 emoji 时，锚点链接去掉 emoji 和空格，只保留文字小写。

---

## 针对参赛作品的额外建议

参赛 README 需要额外体现以下内容（对应评分维度）：

```markdown
## 💡 设计思路

### 为什么这样设计
说明核心设计决策的原因，不只是"做了什么"，而是"为什么这么做"

### 技术选型
说明每个关键技术的选型理由

### 难点与解决方案
说明遇到的技术难点以及解决思路（体现技术深度）

### 未来扩展方向
说明架构的可扩展性（体现系统设计能力）
```

---

## 完整模板（可直接使用）

```markdown
<div align="center">

# 项目名称

> 一句话项目描述

![version](https://img.shields.io/badge/version-1.0.0-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![status](https://img.shields.io/badge/status-active-brightgreen)

</div>

---

## 目录
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [架构设计](#架构设计)
- [配置说明](#配置说明)
- [Roadmap](#roadmap)
- [License](#license)

---

## ✨ 功能特性
- 功能1
- 功能2

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- Chrome >= 114

### 安装步骤
\`\`\`bash
git clone ...
npm install
npm run build
\`\`\`

## 🏗️ 架构设计
[架构图]

### 设计说明
...

## 🔧 配置说明
| 配置项 | 说明 | 默认值 |
|--------|------|--------|

## 🗺️ Roadmap
- [x] 已完成功能
- [ ] 计划功能

## 🤝 贡献
欢迎提 Issue 和 PR。

## 📄 License
MIT © [Your Name]
```

---

## 参考资源

- Shields.io 徽章生成：https://shields.io
- 徽章大全：https://github.com/inttter/md-badges
- README 模板参考：https://github.com/ian-kim/readme-best-practices
- Anthropic 文档风格参考：https://docs.anthropic.com
