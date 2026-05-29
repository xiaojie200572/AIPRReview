import { parsePRUrl, getPRInfo, getPRFiles, getPRCommits } from './github.js'
import { streamChat } from './llm.js'
import { setCache, getCache, hasCache, clearCache } from './analysisCache.js'
import { preprocessDiff } from './diffPreprocessor.js'
import { enrichContext } from './contextEnricher.js'
import { buildSystemPrompt } from '../sidepanel/prompts/base.js'
import { walkthroughPrompt } from '../sidepanel/prompts/walkthrough.js'
import { reviewPrompt } from '../sidepanel/prompts/review.js'
import { discussPrompt, buildDiscussSystemPrompt } from '../sidepanel/prompts/discuss.js'

const MODE_PROMPTS = {
  walkthrough: walkthroughPrompt,
  review: reviewPrompt,
  discuss: discussPrompt,
}

const activeStreams = new Map()

function buildUserMessage(prInfo, files, commits) {
  const { diffText } = preprocessDiff(files)
  const commitMessages = commits.map(c => `- ${c.sha.slice(0, 7)} ${c.message.split('\n')[0]}`).join('\n')
  return `## PR 信息\n标题: ${prInfo.title}\n作者: ${prInfo.author}\n描述: ${prInfo.body.slice(0, 1000)}\n\n## Commits\n${commitMessages}\n\n## 文件变更\n${diffText}`
}

async function buildSystemMessage(mode, prInfo, files, owner, repo, head) {
  const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.walkthrough

  if (mode === 'discuss') {
    const cachedWalkthrough = getCache(`${prInfo.html_url || ''}:walkthrough`)
    const cachedReview = getCache(`${prInfo.html_url || ''}:review`)
    return buildDiscussSystemPrompt(
      cachedWalkthrough?.result || '',
      cachedReview?.result || ''
    )
  }

  let system = buildSystemPrompt(modePrompt)

  if (mode === 'review') {
    const context = await enrichContext(files, owner, repo, head)
    if (context) {
      system += `\n\n${context}`
    }
  }

  return system
}

async function handleAnalyzePR(port, payload) {
  const { prUrl, mode } = payload
  const cacheKey = `${prUrl}:${mode}`

  if (hasCache(cacheKey)) {
    const cached = getCache(cacheKey)
    port.postMessage({ type: 'STREAM_DONE', payload: { fullText: cached.result } })
    return
  }

  const abortController = new AbortController()
  activeStreams.set(port, abortController)

  try {
    const { owner, repo, prNumber } = parsePRUrl(prUrl)

    port.postMessage({ type: 'STREAM_CHUNK', payload: { chunk: '正在获取 PR 数据...\n\n' } })

    const [prInfo, files, commits] = await Promise.all([
      getPRInfo(owner, repo, prNumber),
      getPRFiles(owner, repo, prNumber),
      getPRCommits(owner, repo, prNumber),
    ])

    if (abortController.signal.aborted) return

    clearCache(prUrl)

    port.postMessage({ type: 'STREAM_CHUNK', payload: { chunk: '正在分析代码变更...\n\n' } })

    const systemContent = await buildSystemMessage(mode, prInfo, files, owner, repo, prInfo.head)
    const userMessage = buildUserMessage(prInfo, files, commits)

    await streamChat({
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userMessage },
      ],
      signal: abortController.signal,
      onChunk(chunk) {
        port.postMessage({ type: 'STREAM_CHUNK', payload: { chunk } })
      },
      onDone(fullText) {
        if (!abortController.signal.aborted) {
          setCache(cacheKey, { result: fullText, headSha: prInfo.headSha, timestamp: Date.now() })
          port.postMessage({ type: 'STREAM_DONE', payload: { fullText } })
        }
      },
      onError(error) {
        port.postMessage({ type: 'STREAM_ERROR', payload: { error } })
      },
    })
  } catch (err) {
    port.postMessage({ type: 'STREAM_ERROR', payload: { error: err.message || String(err) } })
  } finally {
    activeStreams.delete(port)
  }
}

async function handleSendMessage(port, payload) {
  const { prUrl, messages = [], userMessage } = payload
  if (!userMessage) return

  const abortController = new AbortController()
  activeStreams.set(port, abortController)

  try {
    const { owner, repo, prNumber } = parsePRUrl(prUrl)

    const [prInfo, files, commits] = await Promise.all([
      getPRInfo(owner, repo, prNumber),
      getPRFiles(owner, repo, prNumber),
      getPRCommits(owner, repo, prNumber),
    ])

    if (abortController.signal.aborted) return

    const systemContent = await buildSystemMessage('discuss', prInfo, files, owner, repo, prInfo.head)

    const llmMessages = [
      { role: 'system', content: systemContent },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ]

    await streamChat({
      messages: llmMessages,
      signal: abortController.signal,
      onChunk(chunk) {
        port.postMessage({ type: 'CHAT_STREAM_CHUNK', payload: { chunk } })
      },
      onDone(fullText) {
        if (!abortController.signal.aborted) {
          port.postMessage({ type: 'CHAT_STREAM_DONE', payload: { fullText } })
        }
      },
      onError(error) {
        port.postMessage({ type: 'CHAT_STREAM_ERROR', payload: { error } })
      },
    })
  } catch (err) {
    port.postMessage({ type: 'CHAT_STREAM_ERROR', payload: { error: err.message || String(err) } })
  } finally {
    activeStreams.delete(port)
  }
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'PR_URL_DETECTED' && msg.payload?.url) {
    chrome.storage.session.set({ prUrl: msg.payload.url }).catch(() => {})
  }
})

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sidepanel') return

  port.onMessage.addListener((msg) => {
    switch (msg.type) {
      case 'ANALYZE_PR':
        handleAnalyzePR(port, msg.payload)
        break
      case 'SEND_MESSAGE':
        handleSendMessage(port, msg.payload)
        break
      case 'CANCEL_STREAM': {
        const ac = activeStreams.get(port)
        if (ac) ac.abort()
        break
      }
      case 'GET_SETTINGS':
        handleGetSettings(port)
        break
    }
  })

  port.onDisconnect.addListener(() => {
    const ac = activeStreams.get(port)
    if (ac) ac.abort()
    activeStreams.delete(port)
    if (chrome.runtime.lastError) {
      console.error('Port disconnected:', chrome.runtime.lastError)
    }
  })
})

async function handleGetSettings(port) {
  const settings = await chrome.storage.local.get(['apiKey', 'baseUrl', 'modelName', 'githubToken'])
  port.postMessage({ type: 'SETTINGS_RESULT', payload: settings })
}
