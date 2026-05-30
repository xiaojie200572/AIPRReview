# 提示词工程 (Prompt Engineering) SKILL

## 概述

提示词工程是通过精心设计输入指令，引导大语言模型（LLM）输出准确、相关、可操作结果的技术。
质量的提示词直接决定 AI 输出的质量。

---

## 核心技术

### 1. Zero-Shot 提示（零样本）

不提供任何示例，直接描述任务。适合简单、通用任务。

```
# 基础写法
分析以下代码中的安全漏洞：
{code}

# 加一句魔法词显著提升推理质量（Zero-shot CoT）
分析以下代码中的安全漏洞，请逐步思考：
{code}
```

**关键发现**：在 Zero-shot 提示末尾加上 "Let's think step by step" / "请逐步思考"，
可显著激活模型的推理能力，无需提供任何示例。

---

### 2. Few-Shot 提示（少样本）

提供 2-5 个示例，让模型学习输出模式。适合需要一致格式的复杂任务。

```
# 示例：代码审查风险分级
示例1：
代码：`user_input = request.get('name'); query = "SELECT * FROM users WHERE name=" + user_input`
输出：🔴 高风险 - SQL注入漏洞，用户输入直接拼接查询

示例2：
代码：`if user != null { user.getName() }`  
输出：🟢 建议 - 可简化为可选链写法

现在分析：
{your_code}
```

**最佳实践**：
- 示例覆盖多种情况（边界条件、不同难度）
- 保持每个示例格式完全一致
- 3-5 个示例效果最佳，过多反而干扰

---

### 3. Chain-of-Thought（思维链，CoT）

让模型展示推理过程，再给出结论。适合多步骤推理、逻辑判断任务。

```
# Few-shot CoT 示例
问题：这段代码在并发场景下是否安全？
```java
private int count = 0;
public void increment() { count++; }
```
推理过程：
1. count 是实例变量，多线程共享
2. count++ 是非原子操作（读-改-写三步）
3. 多线程同时执行会产生竞态条件
结论：🔴 高风险 - 线程不安全，建议使用 AtomicInteger 或 synchronized

现在分析：{your_code}
推理过程：
```

**适用场景**：代码风险分析、复杂逻辑判断、需要解释原因的任务

---

### 4. Role Prompting（角色提示）

给模型分配专家角色，激活特定领域的知识和语言模式。

```
# 弱写法
Review this code.

# 强写法
你是一位有10年经验的资深后端工程师，
熟悉 Java、Spring Boot、分布式系统和安全最佳实践。
你做代码审查时以严谨著称，只指出有把握的问题。
```

**关键**：角色描述越具体越好，包含：领域专长 + 工作风格 + 输出偏好。
"资深工程师" 比 "工程师" 效果好，"只指出有把握的问题" 能有效控制误报。

---

### 5. Prompt Chaining（提示链）

将复杂任务拆分为多步，前一步输出作为后一步输入。

```
步骤1（概览）：
基于 PR 文件列表，输出变更模块和影响范围

步骤2（深度）：
基于上一步的概览结果，对高风险模块进行逐行分析

步骤3（建议）：
基于以上分析，生成具体修改建议
```

**实测结论**：三步链（分类意图 → 收集上下文 → 生成回复）
比单个精心设计的超长 Prompt 效果更好，即使消耗更多 Token。

---

### 6. Structured Output（结构化输出）

明确指定输出格式，提高可解析性。

```
# 指定 JSON 输出
以 JSON 格式输出分析结果，格式如下：
{
  "risk_level": "high|medium|low",
  "file": "文件名",
  "line": 行号,
  "issue": "问题描述",
  "suggestion": "修改建议",
  "confidence": "certain|uncertain"
}
只输出 JSON，不要有任何前言或解释。

# 指定 Markdown 输出
以 Markdown 格式输出，使用以下结构：
## 文件名
- [🔴/🟡/🟢] 行号 - 问题描述
  → 修改建议
```

---

## System Prompt 设计模式

### 分层结构（推荐）

```
System Prompt = 基底层 + 模式层

基底层（所有场景共用）：
- 角色定义
- 核心原则
- 误报控制规则
- 输出格式规范

模式层（动态注入）：
- 当前任务描述
- 特定输出要求
- 上下文信息
```

### 完整 System Prompt 模板

```
## 角色
你是 [具体角色描述，包含经验年限和专长领域]

## 核心原则
- [原则1]
- [原则2]
- 对不确定的内容，标注「⚠️ 需人工确认」而非猜测

## 输出格式
[明确的格式规范，最好带示例]

## 当前任务
[具体任务描述]

## 输入数据
[数据内容]
```

---

## 误报与漏报控制

这是 AI 代码审查等严肃场景的核心挑战：

### 控制误报（减少假阳性）
```
# 在 System Prompt 中明确：
- 只指出有充分把握的问题
- 不确定时标注「⚠️ 需人工确认」
- 不对代码风格做主观评价
- 不建议大规模重构，只关注实际风险
```

### 控制漏报（减少假阴性）
```
# 通过上下文补全减少漏报：
- 不只看 diff，补充完整函数体上下文
- 提供被修改函数的调用方信息
- 明确列出必须检查的问题类型清单

# 在 Prompt 中明确检查清单：
必须检查以下类型：
1. 空指针/空引用
2. SQL注入/XSS
3. 并发安全
4. 资源泄漏
5. 接口兼容性
```

---

## Token 管理最佳实践

### Token 预算分配策略
```
总预算（如 8000 token）分配：
├── System Prompt：~500 token（固定）
├── PR 元信息：~300 token（固定）
└── diff 内容：~7200 token（动态分配）
    ├── 高优先级文件（业务代码）：800 token/文件
    ├── 中优先级文件（测试代码）：400 token/文件
    └── 低优先级文件（配置文件）：200 token/文件
```

### 噪音过滤
```
过滤以下内容节省 Token：
- 纯空行变更
- 纯注释变更（不影响逻辑）
- 自动格式化变更（缩进调整等）
- 锁文件变更（package-lock.json 等）
```

---

## 常见错误

| 错误 | 正确做法 |
|------|---------|
| 提示词过于模糊："分析这段代码" | 明确任务、格式、关注点 |
| 角色太泛："你是工程师" | 具体化："你是专注安全的资深Java工程师" |
| 单个超长 Prompt | 拆分为 Prompt Chain |
| 没有格式约束 | 明确指定输出结构 |
| 不确定的问题直接输出 | 标注「需人工确认」 |
| 忽略 Token 限制 | 按优先级裁剪输入内容 |

---

## 适用场景速查

| 场景 | 推荐技术 |
|------|---------|
| 代码审查 | Role + CoT + Structured Output + 误报控制 |
| 文本摘要 | Zero-shot + 格式约束 |
| 分类任务 | Few-shot + Structured Output |
| 复杂推理 | CoT + Prompt Chain |
| 多轮对话 | 注入历史摘要 + Role |
| 结构化数据提取 | Few-shot + JSON Output |

---

## 参考资源

- Anthropic Prompt Engineering Guide: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
- OpenAI Prompt Engineering: https://platform.openai.com/docs/guides/prompt-engineering
- Chain-of-Thought 论文: Wei et al. 2022
- Zero-shot CoT: Kojima et al. 2022
