const DEFAULTS = {
  baseUrl: import.meta.env.VITE_DEFAULT_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
  model: import.meta.env.VITE_DEFAULT_MODEL || 'glm-4-flash',
}

async function getConfig() {
  const stored = await chrome.storage.local.get(['apiKey', 'baseUrl', 'modelName'])
  const apiKey = stored.apiKey || import.meta.env.VITE_DEV_API_KEY || ''
  return {
    apiKey,
    baseUrl: (stored.baseUrl || DEFAULTS.baseUrl).replace(/\/+$/, ''),
    model: stored.modelName || DEFAULTS.model,
  }
}

function parseSSE(chunk) {
  const lines = chunk.split('\n')
  const results = []
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue
    const payload = line.slice(6)
    if (payload === '[DONE]') continue
    try {
      const parsed = JSON.parse(payload)
      const content = parsed.choices?.[0]?.delta?.content || ''
      if (content) results.push(content)
    } catch {
      // skip malformed JSON lines
    }
  }
  return results
}

export async function streamChat({ messages, onChunk, onDone, onError, signal }) {
  try {
    const { apiKey, baseUrl, model } = await getConfig()
    if (!apiKey) {
      throw new Error('API Key 未配置，请在设置中填写')
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
      signal,
    })

    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      throw new Error(`LLM API ${res.status}: ${msg || res.statusText}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''
    let aborted = false

    let abortResolve
    const abortPromise = new Promise(r => { abortResolve = r })

    function onAbort() {
      aborted = true
      abortResolve({ done: true, value: undefined })
      try { reader.cancel() } catch {}
    }

    if (signal) {
      if (signal.aborted) {
        aborted = true
      } else {
        signal.addEventListener('abort', onAbort, { once: true })
      }
    }

    try {
      while (true) {
        if (aborted) break
        const result = await Promise.race([reader.read(), abortPromise])
        const { done, value } = result
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''

        for (const part of parts) {
          const tokens = parseSSE(part)
          for (const token of tokens) {
            fullText += token
            onChunk(token)
          }
        }
      }

      if (!aborted && buffer.trim()) {
        const tokens = parseSSE(buffer)
        for (const token of tokens) {
          fullText += token
          onChunk(token)
        }
      }

      if (!aborted) {
        onDone(fullText)
      }
    } finally {
      signal?.removeEventListener('abort', onAbort)
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      onError('已取消')
    } else {
      onError(err.message || String(err))
    }
  }
}
