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

export async function streamChat({ apiKey, baseUrl, model, messages, onChunk, onDone, onError, signal }) {
  try {
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

    while (true) {
      const { done, value } = await reader.read()
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

    if (buffer.trim()) {
      const tokens = parseSSE(buffer)
      for (const token of tokens) {
        fullText += token
        onChunk(token)
      }
    }

    onDone(fullText)
  } catch (err) {
    onError(err.message || String(err))
  }
}
