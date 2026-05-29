# AI PR Review Assistant — 开发提示词

## 项目概述

开发一个 Chrome 浏览器插件，帮助开发者在 GitHub PR 页面进行 AI 辅助代码审查。
插件以侧边栏（Side Panel）形式嵌入 GitHub PR 页面，用户无需离开当前页面即可获得 AI 分析结果。

---

## PR（Pull Request）提交规范**

1. 请基于PR添加新功能。

2. 每个PR只做一件事：每个PR只实现或修改单一功能；鼓励尽可能小、粒度尽可能细的PR；大功能应拆分为多个独立PR分步提交。

3. PR标题与描述需清晰完整，内容包含：

   - **标题**：一句话说明本PR新增/修改了什么。
   - **功能描述**：说明该功能的作用与使用方式。
   - **实现思路**：简要说明技术选型或核心实现逻辑。
   - **测试方式**：如何验证该功能正常运行。

## 技术栈

- **Chrome Extension Manifest V3**
- **Vue 3 + Vite**（Side Panel UI）
- **@crxjs/vite-plugin**（Chrome 插件构建工具）
- **Background Service Worker**（处理所有 API 请求）
- **GitHub REST API**（获取 PR 数据）
- **LLM API**（OpenAI 兼容格式，默认 GLM-4-Flash）
- **localStorage**（持久化用户配置）

---

## 项目目录结构

请严格按照以下结构组织代码：

```
pr-review-extension/
├── manifest.json
├── vite.config.js
├── package.json
├── README.md
├── src/
│   ├── background/
│   │   ├── index.js              # Service Worker 入口，IPC 消息中枢
│   │   ├── github.js             # GitHub REST API 封装
│   │   ├── llm.js                # LLM API 调用 + SSE 流式处理
│   │   ├── diffPreprocessor.js   # diff 预处理：去噪音 + Token 裁剪
│   │   ├── contextEnricher.js    # 高风险文件拉取完整函数体
│   │   └── analysisCache.js      # 内存缓存，跨模式分析结果复用
│   ├── content/
│   │   └── index.js              # 注入 GitHub 页面，读取当前 PR URL
│   └── sidepanel/
│       ├── index.html
│       ├── main.js
│       ├── App.vue
│       ├── components/
│       │   ├── PRInput.vue        # PR URL 输入框 + 解析
│       │   ├── ModeSelector.vue   # 三模式切换 Tab
│       │   ├── ResultPanel.vue    # 流式结果展示（Markdown 渲染）
│       │   └── SettingsModal.vue  # API Key / Base URL / Model 配置
│       └── prompts/
│           ├── base.js            # 基底 System Prompt（所有模式共用）
│           ├── walkthrough.js     # Walkthrough 模式专属 Prompt
│           ├── review.js          # Review 模式专属 Prompt
│           └── discuss.js         # Discuss 模式专属 Prompt + 注入前序摘要
```

---

## manifest.json

```json
{
  "manifest_version": 3,
  "name": "AI PR Review Assistant",
  "version": "1.0.0",
  "description": "AI 辅助 GitHub PR 代码审查工具",
  "permissions": [
    "sidePanel",
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://api.github.com/*",
    "https://open.bigmodel.cn/*",
    "https://github.com/*",
    "https://api.deepseek.com/*",
    "https://api.siliconflow.cn/*"
  ],
  "background": {
    "service_worker": "src/background/index.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://github.com/*/pull/*"],
      "js": ["src/content/index.js"]
    }
  ],
  "side_panel": {
    "default_path": "src/sidepanel/index.html"
  },
  "action": {
    "default_title": "AI PR Review"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

## 核心模块实现要求

### 1. src/background/index.js — IPC 消息中枢

监听来自 Content Script 和 Side Panel 的消息，统一分发处理：

```js
// 监听消息类型：
// - GET_PR_URL：Content Script 发来当前页面 PR URL
// - ANALYZE_PR：Side Panel 发起分析请求，包含 { prUrl, mode, conversationHistory }
// - GET_SETTINGS：获取存储的配置

// 分析流程：
// 1. 调用 github.js 获取 PR 数据
// 2. 调用 diffPreprocessor.js 处理 diff
// 3. 若 Review 模式，调用 contextEnricher.js 补全高风险文件
// 4. 检查 analysisCache.js 是否有缓存
// 5. 构建 Prompt，调用 llm.js 流式请求
// 6. 通过 chrome.tabs.sendMessage 或 chrome.runtime.sendMessage 将流式结果转发给 Side Panel
```

### 2. src/background/github.js — GitHub API 封装

```js
// 实现以下函数：

// getPRInfo(owner, repo, prNumber)
// 调用 GET /repos/{owner}/{repo}/pulls/{prNumber}
// 返回：{ title, body, author, base, head, state, createdAt }

// getPRFiles(owner, repo, prNumber)
// 调用 GET /repos/{owner}/{repo}/pulls/{prNumber}/files
// 返回：文件列表，每项包含 { filename, status, additions, deletions, patch }

// getPRCommits(owner, repo, prNumber)
// 调用 GET /repos/{owner}/{repo}/pulls/{prNumber}/commits
// 返回：commit 列表，每项包含 { sha, message, author }

// getFileContent(owner, repo, path, ref)
// 调用 GET /repos/{owner}/{repo}/contents/{path}?ref={ref}
// 返回：文件完整内容（base64 解码后的字符串）
// 用于 contextEnricher 补全高风险文件

// parsePRUrl(url)
// 解析 GitHub PR URL，提取 owner, repo, prNumber
// 支持格式：https://github.com/{owner}/{repo}/pull/{number}
```

### 3. src/background/llm.js — LLM API 调用

```js
// 实现 streamChat({ messages, onChunk, onDone, onError })
// 使用 OpenAI 兼容格式
// 从 chrome.storage.local 读取 { apiKey, baseUrl, modelName }

// 默认配置：
// baseUrl: 'https://open.bigmodel.cn/api/paas/v4'
// modelName: 'glm-4-flash'

// 流式处理：
// 解析 SSE 响应，每收到一个 chunk 调用 onChunk(text)
// 结束时调用 onDone(fullText)
// 错误时调用 onError(error)
```

### 4. src/background/diffPreprocessor.js — diff 预处理

```js
// 实现 preprocessDiff(files)
// 输入：GitHub API 返回的 files 数组
// 输出：处理后的 diff 字符串，控制在 Token 预算内

// 处理步骤：
// 1. 文件优先级排序：业务代码(.java/.ts/.vue/.py) > 测试文件 > 配置文件(.yml/.json) > 其他
// 2. 过滤纯空行变更、纯注释变更（噪音）
// 3. Token 预算分配（总预算 6000 token，按优先级分配）
//    - 高优先级文件：最多 800 token/文件
//    - 低优先级文件：最多 200 token/文件
// 4. 超出部分截断并标注 "[内容已截断，仅展示前 N 行]"
// 5. 返回格式化后的 diff 字符串
```

### 5. src/background/contextEnricher.js — 上下文增强

```js
// 实现 enrichContext(files, owner, repo, head)
// 仅在 Review 模式下调用
// 识别高风险文件标准：
//   - 核心业务文件（非测试、非配置）
//   - diff 中有函数签名变更（新增/删除 function/method 定义行）
//   - 单文件改动超过 50 行

// 对识别出的高风险文件（最多 3 个）：
// 调用 github.js 的 getFileContent 拉取完整内容
// 截取被修改函数的完整函数体（前后各 20 行上下文）
// 附加到对应文件的 diff 后面，标注 "[完整函数体补充]"
```

### 6. src/background/analysisCache.js — 分析缓存

```js
// 内存缓存，页面刷新后清空（不需要持久化）

const cache = new Map()

// setCache(prUrl, mode, result)
// getCache(prUrl, mode) → result | null
// hasCache(prUrl, mode) → boolean
// clearCache(prUrl)  // PR 有新 push 时清除

// 缓存 key：prUrl + ':' + mode
// 缓存内容：{ summary, result, timestamp, headSha }
// headSha 变化时缓存失效
```

### 7. src/content/index.js — Content Script

```js
// 注入到所有 https://github.com/*/pull/* 页面
// 功能：
// 1. 读取当前页面 URL
// 2. 通过 chrome.runtime.sendMessage 发送给 Background SW
// 3. 监听 URL 变化（GitHub 是 SPA，URL 可能动态变化）
//    使用 MutationObserver 或 popstate 事件监听
// 4. Side Panel 打开时自动填入当前 PR URL
```

---

## Prompt 设计（重点）

### src/sidepanel/prompts/base.js

```js
export const basePrompt = `你是一位资深代码审查工程师，有10年以上的软件开发经验，熟悉 Java、Python、JavaScript、Vue、Spring Boot 等主流技术栈。

## 审查原则
- 只指出有把握的问题，不确定的问题必须标注「⚠️ 需人工确认」
- 不对代码风格做主观评价，只关注可能影响功能、性能、安全的问题
- 给出的建议必须具体可操作，不说空话
- 对修改行为保持克制，不建议大规模重构

## 输出规范
- 使用 Markdown 格式输出
- 风险等级使用：🔴 高风险 / 🟡 中风险 / 🟢 建议
- 每条问题格式：[风险等级] 文件名（行号）- 问题描述 → 修改建议`

export const buildSystemPrompt = (modePrompt) => {
  return basePrompt + '\n\n' + modePrompt
}
```

### src/sidepanel/prompts/walkthrough.js

```js
export const walkthroughPrompt = `
## 当前任务：PR 概览分析（Walkthrough 模式）

请基于 PR 标题、描述、commits 和文件变更列表，输出以下内容：

### 输出格式
**TL;DR**
一句话总结本次 PR 的目的。

**变更模块**
按业务模块分组列出变更文件（不要按字母排序，要按逻辑分组）。

**变更规模**
- 涉及文件数 / 新增行数 / 删除行数
- 评估：小型变更 / 中型变更 / 大型变更

**Review 建议**
列出 2-3 个最值得人工重点关注的文件或模块，说明原因。

注意：此模式不需要分析具体代码内容，只需基于文件列表和 PR 描述做高层次概览。`
```

### src/sidepanel/prompts/review.js

```js
export const reviewPrompt = `
## 当前任务：深度代码审查（Review 模式）

请对以下 diff 内容进行逐文件深度分析，重点关注：

### 必须检查的问题类型
1. **空指针 / 空引用风险**：未做判空就直接调用
2. **并发安全**：共享状态、线程安全问题
3. **SQL 注入 / XSS**：用户输入未经过滤直接拼接
4. **接口兼容性**：对外接口的参数、返回值变更
5. **资源泄漏**：文件、连接、流未关闭
6. **逻辑错误**：边界条件、off-by-one、条件判断错误
7. **依赖变更风险**：版本升级可能带来的兼容性问题

### 输出格式
对每个有问题的文件输出：

**文件名**
- [风险等级] 行号 - 问题描述
  → 修改建议（给出具体改法）

### 结尾输出
**总体评估**
- 是否建议合并：✅ 可合并 / ⚠️ 修改后合并 / ❌ 不建议合并
- 最需要关注的 1-2 个核心问题`
```

### src/sidepanel/prompts/discuss.js

```js
export const discussPrompt = `
## 当前任务：对话式深入分析（Discuss 模式）

你已经对这个 PR 有了基本了解，现在进入对话模式。
用户会针对具体问题向你追问，请保持上下文理解，给出深入具体的回答。

## 对话原则
- 回答要具体，直接针对用户的问题
- 如果需要给出代码示例，请给出完整可运行的片段
- 保持对话历史上下文，不要重复之前已经说过的结论
- 如果用户的问题超出当前 PR 范围，礼貌说明`

// Discuss 模式需要注入前序分析摘要
export const buildDiscussSystemPrompt = (walkthroughResult, reviewResult) => {
  let contextSection = ''

  if (walkthroughResult) {
    contextSection += `\n\n## 已完成的 Walkthrough 分析摘要\n${walkthroughResult.slice(0, 500)}...`
  }
  if (reviewResult) {
    contextSection += `\n\n## 已完成的 Review 分析摘要\n${reviewResult.slice(0, 800)}...`
  }

  return discussPrompt + contextSection
}
```

---

## Side Panel UI 实现要求

### App.vue 整体布局

```
┌─────────────────────────────┐
│  🔍 AI PR Review            │  ← 标题栏 + 设置按钮(齿轮图标)
├─────────────────────────────┤
│  PR URL 输入框  [分析]       │  ← PRInput.vue
├─────────────────────────────┤
│  [Walkthrough][Review][Discuss] │  ← ModeSelector.vue (Tab 切换)
├─────────────────────────────┤
│                             │
│  分析结果区域（流式输出）     │  ← ResultPanel.vue
│  支持 Markdown 渲染          │
│                             │
└─────────────────────────────┘
```

### ResultPanel.vue 流式展示

- 使用 `marked` 库渲染 Markdown（`npm install marked`）
- 流式输出时，每收到新 chunk 追加到内容末尾并重新渲染
- 显示加载动画（分析中...）
- 风险等级用颜色区分：🔴红色 / 🟡黄色 / 🟢绿色

### SettingsModal.vue 配置项

```
API Key: [________________]
Base URL: [https://open.bigmodel.cn/api/paas/v4]
模型名称: [glm-4-flash]
GitHub Token (可选，私有仓库): [________________]

[保存配置]
```

说明文字：支持任意 OpenAI 兼容格式的模型，切换模型只需修改 Base URL 和模型名称。

---

## IPC 通信协议

Background SW 和 Side Panel 之间的消息格式：

```js
// Side Panel → Background SW（发起分析）
{
  type: 'ANALYZE_PR',
  payload: {
    prUrl: 'https://github.com/owner/repo/pull/123',
    mode: 'walkthrough' | 'review' | 'discuss',
    conversationHistory: [], // Discuss 模式传入对话历史
    userMessage: ''          // Discuss 模式传入用户消息
  }
}

// Background SW → Side Panel（流式响应）
{
  type: 'STREAM_CHUNK',
  payload: { chunk: '分析文字片段' }
}

{
  type: 'STREAM_DONE',
  payload: { fullText: '完整分析结果' }
}

{
  type: 'STREAM_ERROR',
  payload: { error: '错误信息' }
}

// Content Script → Background SW（上报当前 PR URL）
{
  type: 'PR_URL_DETECTED',
  payload: { url: 'https://github.com/owner/repo/pull/123' }
}
```

---

## README.md 设计说明（必须包含以下内容）

```markdown
# AI PR Review Assistant

## 功能介绍
...

## 安装使用
...

## 设计说明

### 模型选择
默认使用智谱 GLM-4-Flash，理由：
- 完全免费，无需付费
- 支持 OpenAI 兼容格式，可随时切换
- 代码理解能力满足审查需求

支持切换任意 OpenAI 兼容模型（DeepSeek、SiliconFlow、Gemini、Ollama 本地模型），
只需在设置中修改 Base URL 和模型名称。

### 上下文获取策略
1. **基础数据**：通过 GitHub REST API 获取 PR 元信息、文件变更列表、commits
2. **diff 预处理**：过滤空行/注释噪音，按文件优先级分配 Token 预算（总 6000 token）
3. **上下文增强**：对高风险文件（函数签名变更、大量改动）额外拉取完整函数体，
   弥补单纯 diff 视角的上下文缺失
4. **分析缓存**：相同 PR、相同 headSha 的分析结果内存缓存复用，Discuss 模式注入前序摘要

### 误报控制
- System Prompt 明确要求：不确定的问题必须标注「⚠️ 需人工确认」
- 不对代码风格做主观评价
- 高风险标准明确：空指针、并发、SQL注入、接口兼容性等可量化维度

### 未来扩展方向
- **更多平台**：GitLab、Gitee、Bitbucket（抽象 git platform adapter 接口）
- **私有部署**：支持 Ollama 本地模型，代码不出内网
- **CI 集成**：导出分析报告为 JSON，接入 GitHub Actions
- **自定义规则**：用户在设置中填写团队规范，注入 System Prompt
- **历史记录**：IndexedDB 持久化历史分析结果
```

---

## 注意事项

1. **CORS 问题**：所有 HTTP 请求必须在 Background Service Worker 中发出，不能在 Side Panel（渲染进程）中直接 fetch 外部 API
2. **MV3 限制**：Background SW 是事件驱动的，不能用长连接，用 `chrome.runtime.sendMessage` 通信
3. **流式转发**：SSE 流式响应在 Background SW 收到后，通过 `chrome.tabs.sendMessage` 分块转发给 Side Panel
4. **Side Panel API**：需要在 manifest 声明 `"sidePanel"` 权限，用 `chrome.sidePanel.open()` 打开
5. **Content Script 注入时机**：GitHub 是 SPA，URL 变化不会触发页面刷新，需要监听 `pushState`

---

## 开发顺序建议

1. 先完成 `manifest.json` + `vite.config.js` 配置
2. 实现 `github.js` 并测试 PR 数据获取
3. 实现 `llm.js` 流式调用
4. 实现 `diffPreprocessor.js`
5. 实现 Background SW 的 IPC 消息中枢
6. 实现 Side Panel 基础 UI（输入框 + 结果展示）
7. 打通完整链路：输入 URL → 分析 → 流式展示
8. 实现三模式 Prompt + ModeSelector
9. 实现 `contextEnricher.js` + `analysisCache.js`
10. 实现 Settings 配置弹窗
11. 实现 Content Script 自动填入 URL
12. 完善 README
