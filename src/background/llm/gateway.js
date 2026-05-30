import { getConfig } from './config.js'
import { streamChat as openaiChat } from './adapters/openai.js'
import { streamChat as anthropicChat } from './adapters/anthropic.js'

function detectProvider(baseUrl) {
  if (baseUrl.includes('anthropic.com')) return 'anthropic'
  return 'openai'
}

export async function streamChat({ messages, onChunk, onDone, onError, signal }) {
  const config = await getConfig()
  const provider = detectProvider(config.baseUrl)

  const adapter = {
    openai: openaiChat,
    anthropic: anthropicChat,
  }[provider]

  if (!adapter) {
    onError(`Unsupported provider: ${provider}`)
    return
  }

  return adapter({
    ...config,
    messages,
    onChunk,
    onDone,
    onError,
    signal,
  })
}
