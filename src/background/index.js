import { parsePRUrl, getPRInfo, getPRFiles, getPRCommits } from './github.js'
import { streamChat } from './llm.js'
import { setCache, getCache, hasCache, clearCache } from './analysisCache.js'
import { preprocessDiff } from './diffPreprocessor.js'

const SYSTEM_PROMPT = '你是一位资深代码审查工程师。请对以下 PR 的代码变更进行审查，指出可能影响功能、性能、安全的问题，给出具体修改建议。'

function buildUserMessage(prInfo, files, commits) {
  const { diffText } = preprocessDiff(files)
  const commitMessages = commits.map(c => `- ${c.sha.slice(0, 7)} ${c.message.split('\n')[0]}`).join('\n')
  return `## PR 信息\n标题: ${prInfo.title}\n作者: ${prInfo.author}\n描述: ${prInfo.body.slice(0, 1000)}\n\n## Commits\n${commitMessages}\n\n## 文件变更\n${diffText}`
}

async function handleAnalyzePR(port, payload) {
  const { prUrl, mode } = payload
  const cacheKey = `${prUrl}:${mode}`

  if (hasCache(cacheKey)) {
    const cached = getCache(cacheKey)
    port.postMessage({ type: 'STREAM_DONE', payload: { fullText: cached.result } })
    return
  }

  try {
    const { owner, repo, prNumber } = parsePRUrl(prUrl)

    port.postMessage({ type: 'STREAM_CHUNK', payload: { chunk: '正在获取 PR 数据...\n\n' } })

    const [prInfo, files, commits] = await Promise.all([
      getPRInfo(owner, repo, prNumber),
      getPRFiles(owner, repo, prNumber),
      getPRCommits(owner, repo, prNumber),
    ])

    clearCache(prUrl)

    const userMessage = buildUserMessage(prInfo, files, commits)

    port.postMessage({ type: 'STREAM_CHUNK', payload: { chunk: '正在分析代码变更...\n\n' } })

    await streamChat({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      onChunk(chunk) {
        port.postMessage({ type: 'STREAM_CHUNK', payload: { chunk } })
      },
      onDone(fullText) {
        setCache(cacheKey, { result: fullText, headSha: prInfo.headSha, timestamp: Date.now() })
        port.postMessage({ type: 'STREAM_DONE', payload: { fullText } })
      },
      onError(error) {
        port.postMessage({ type: 'STREAM_ERROR', payload: { error } })
      },
    })
  } catch (err) {
    port.postMessage({ type: 'STREAM_ERROR', payload: { error: err.message || String(err) } })
  }
}

async function handleGetSettings(port) {
  const settings = await chrome.storage.local.get(['apiKey', 'baseUrl', 'modelName', 'githubToken'])
  port.postMessage({ type: 'SETTINGS_RESULT', payload: settings })
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sidepanel') return

  port.onMessage.addListener((msg) => {
    switch (msg.type) {
      case 'ANALYZE_PR':
        handleAnalyzePR(port, msg.payload)
        break
      case 'GET_SETTINGS':
        handleGetSettings(port)
        break
    }
  })

  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) {
      console.error('Port disconnected:', chrome.runtime.lastError)
    }
  })
})
