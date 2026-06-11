const DEFAULTS = {
  baseUrl: import.meta.env.VITE_DEFAULT_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
  model: import.meta.env.VITE_DEFAULT_MODEL || 'glm-4-flash',
}

export async function getConfig() {
  const stored = await chrome.storage.local.get(['apiKey', 'baseUrl', 'modelName'])
  const apiKey = stored.apiKey || ''
  return {
    apiKey,
    baseUrl: (stored.baseUrl || DEFAULTS.baseUrl).replace(/\/+$/, ''),
    model: stored.modelName || DEFAULTS.model,
  }
}
