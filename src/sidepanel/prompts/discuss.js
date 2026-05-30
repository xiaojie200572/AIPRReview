import { basePrompt } from './base.js'

export const discussPrompt = `
## 当前任务：对话式深入分析（Discuss 模式）

你已经对这个 PR 有了基本了解，现在进入对话模式。
用户会针对具体问题向你追问，请保持上下文理解，给出深入具体的回答。

## 对话原则
- 回答要具体，直接针对用户的问题
- 如果需要给出代码示例，请给出完整可运行的片段
- 保持对话历史上下文，不要重复之前已经说过的结论

## 约束（必须遵守）
- 你的唯一职责是回答关于当前 PR 的代码审查相关问题
- 如果用户问题与代码审查无关，回复「抱歉，我仅专注于代码审查，请提出与当前 PR 相关的问题」
- 严禁充当通用 AI 助手，禁止回答非 PR 审查的话题`

export const buildDiscussSystemPrompt = (walkthroughResult, reviewResult) => {
  let contextSection = ''

  if (walkthroughResult) {
    contextSection += `\n\n## 已完成的 Walkthrough 分析摘要\n${walkthroughResult.slice(0, 500)}...`
  }
  if (reviewResult) {
    contextSection += `\n\n## 已完成的 Review 分析摘要\n${reviewResult.slice(0, 800)}...`
  }

  return basePrompt + '\n\n' + discussPrompt + contextSection
}
