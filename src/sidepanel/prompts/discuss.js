export const discussPrompt = `
## 当前任务：对话式深入分析（Discuss 模式）

你已经对这个 PR 有了基本了解，现在进入对话模式。
用户会针对具体问题向你追问，请保持上下文理解，给出深入具体的回答。

## 对话原则
- 回答要具体，直接针对用户的问题
- 如果需要给出代码示例，请给出完整可运行的片段
- 保持对话历史上下文，不要重复之前已经说过的结论
- 如果用户的问题超出当前 PR 范围，礼貌说明`

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
