# AI PR Review Assistant

AI 辅助 GitHub PR 代码审查工具 — Chrome 浏览器插件（Manifest V3）。

以侧边栏（Side Panel）形式嵌入 GitHub PR 页面，开发者无需离开页面即可获得 AI 分析结果。

---

## 功能

### 三种分析模式

| 模式 | 用途 |
|------|------|
| **Walkthrough** | PR 概览：TL;DR、变更模块分组、变更规模评估、Review 重点建议 |
| **Review** | 深度代码审查：逐文件分析风险，标注 🔴 高风险 / 🟡 中风险 / 🟢 建议 |
| **Discuss** | 对话式追问：基于前序分析结果，与 AI 持续对话深入探讨 |

### 模型选择 — 设计思路

插件要求用户自行设置Base URL和API-key，支持通过 **AI Gateway 架构**支持无缝切换任意模型：

```
Background SW 发起分析
  └─ gateway.js ── detectProvider(baseUrl) ──→ OpenAI 兼容格式
  │                                            ├─ OpenAI / DeepSeek / Groq / Together / ...
  │                                            ├─ 智谱 / 通义千问 / Kimi / SiliconFlow / ...
  │                                            └─ 本地 Ollama 等任意兼容服务
  │
  └─ detectProvider() 路由 ──→ Anthropic 原生格式
                               └─ Claude Sonnet / Haiku
```

设计要点：

- **统一配置入口** — 用户只需在设置中修改 Base URL 和模型名称，无需了解底层协议差异
- **自动协议适配** — 根据 Base URL 自动检测供应商协议（OpenAI 兼容 vs Anthropic），对用户透明
- **辅助下拉 + 自由输入** — 内置 14 家主流供应商的 URL 和模型列表，同时允许任意自定义输入

### 上下文获取策略

#### 1. 基础数据获取（`github.js`）

通过 GitHub REST API 获取三组核心数据：

- **PR 元信息**：标题、描述、作者、head SHA、状态
- **文件变更**：含 diff patch、增删行数、状态（modified/added/deleted）
- **Commits**：SHA、提交信息、作者

自动携带 GitHub Token（可选）：有 Token 5000 次/小时 + 私有仓库，无 Token 60 次/小时。

#### 2. diff 预处理（`diffPreprocessor.js`）

对原始 diff 进行三段式处理以控制 Token 预算：

1. **噪音过滤** — 移除纯空行变更、纯注释变更、无意义 import 行
2. **优先级排序** — 业务代码（.ts/.vue/.java/.py）> 测试文件 > 配置文件（.yml/.json），同级按文件大小降序
3. **预算分配** — 总预算 6000 Token，高优先级文件最多 800 Token/个，超出部分截断并标注 `[已截断]`

#### 3. 上下文增强（`contextEnricher.js`，Review 模式专用）

当 diff 存在函数签名变更或单文件改动超过 50 行时，标记为高风险文件（最多 3 个），自动拉取对应函数的完整函数体（前后各 20 行上下文）追加到 prompt 中，弥补纯 diff 视角的上下文缺失：

```js
/* 高风险识别条件 */
isHighRisk(file) = file.filename 是核心业务代码
                    && (有函数签名变更 || 改动超过 50 行)
```

#### 4. 分析缓存（`analysisCache.js`）

- **混合缓存**：Map 内存 + `chrome.storage.session` 持久化
- **缓存存活**：Service Worker 重启后自动恢复（不再被 MV3 惰性销毁清空）
- **缓存失效**：PR head SHA 变化或新分析触发时自动清除
- **Discuss 复用**：注入前序 Walkthrough / Review 分析摘要作为上下文

### Prompt 设计

三种模式共享基底 System Prompt（`base.js`），通过组合模式注入各自专属指令：

- **基底**：资深审查工程师角色设定、审查原则、输出规范、CoT 提示、Few-shot 示例
- **Walkthrough**：高层概览任务，不分析具体代码
- **Review**：逐文件深度审查，附必须检查清单
- **Discuss**：对话式深入分析 + 上下文注入 + 自评估相关度评分（<6/10 拒答）

---

## 安装使用

### 方式一：普通用户

直接使用预构建的 `dist/` 目录或 `.zip` 包加载扩展：

1. 下载最新构建产物（从 Releases 或项目 `dist/` 目录）
2. 打开 `chrome://extensions`
3. 启用「开发者模式」
4. 点击「加载已解压的扩展程序」，选择 `dist/` 目录
5. 打开任意 GitHub PR 页面，按 `Ctrl+Shift+I` 打开侧边栏

### 方式二：开发者自行构建

```bash
npm install
npm run build
```

构建产物在 `dist/` 目录，同时在 `release/` 下生成 `.zip` 包。

> **注意**：构建使用了 CRXJS v2.4.0 + Vite 8，由于 CRXJS 的一个已知 bug，`fix-build.ps1` 会在构建后自动修正 `service-worker-loader.js` 的 bundle 引用路径，无需手动干预。

### 前置条件

- Chrome 浏览器
- 一个 LLM API 密钥（推荐智谱 GLM-4-Flash，免费）

### 配置

打开侧边栏 → 点击右上角 ⚙ 图标，配置：

| 配置项 | 说明 |
|--------|------|
| API Key | 必填，LLM 服务商密钥 |
| Base URL | 必填，内置 14 家供应商下拉辅助，支持自由输入 |
| 模型名称 | 必填，选中供应商后自动填充默认模型，支持自由输入 |
| GitHub Token | 选填，私有仓库需要 |

---

## 架构

![架构图](/public/architecture.jpg)

### 关键设计

| 设计决策 | 说明 |
|---------|------|
| **Port 长连接** | 取代 sendMessage，保持 SW 存活并支持逐 chunk 推送 |
| **流式渲染** | SSE 分块 → 实时更新 UI，大结果无需等待全部完成 |
| **缓存恢复** | SW 重启后自动从 `chrome.storage.session` 恢复缓存，避免重复分析 |
| **XSS 防护** | 所有 Markdown 渲染结果经 DOMPurify 消毒 |
| **截断检测** | SSE finish_reason=length 时追加截断警告 |
| **取消流式** | AbortController 中断进行中的请求，立即释放资源 |

---

## 未来扩展方向

- **更多 Git 平台** — 抽象 Platform Adapter 接口，支持 GitLab / Gitee / Bitbucket
- **私有化部署** — 配合 Ollama 本地模型，代码不出内网
- **CI 集成** — 导出分析报告为 JSON/SARIF，接入 GitHub Actions
- **自定义审查规则** — 用户在设置中填写团队规范，动态注入 System Prompt
- **历史记录** — IndexedDB 持久化分析历史，支持回溯检索

---

## 技术栈

- Chrome Extension Manifest V3
- Vue 3 + Vite 8
- @crxjs/vite-plugin v2.4.0
- marked + DOMPurify（Markdown 渲染 & 安全消毒）
- highlight.js（代码语法高亮）
- GitHub REST API
- SSE 流式 API（OpenAI 兼容 / Anthropic 原生）

## 许可证

MIT
