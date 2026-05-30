export async function streamChat({ apiKey, baseUrl, model, messages, onChunk, onDone, onError, signal }) {
  try {
    if (!apiKey) {
      throw new Error('API Key 未配置，请在设置中填写')
    }

    const system = messages.find(m => m.role === 'system')?.content || ''
    const msgs = messages.filter(m => m.role !== 'system')

    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        ...(system ? { system } : {}),
        messages: msgs.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 4096,
        stream: true,
      }),
      signal,
    })

    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      throw new Error(`Claude API ${res.status}: ${msg || res.statusText}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n')
      buffer = parts.pop() || ''

      for (const line of parts) {
        if (line.startsWith('data: ')) {
          const payload = line.slice(6)
          try {
            const parsed = JSON.parse(payload)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              const chunk = parsed.delta.text || ''
              fullText += chunk
              onChunk(chunk)
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    }

    onDone(fullText)
  } catch (err) {
    onError(err.message || String(err))
  }
}
