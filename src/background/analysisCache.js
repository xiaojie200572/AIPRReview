const CACHE_KEY = 'analysis_cache_store'
const map = new Map()

export async function initCache() {
  const { [CACHE_KEY]: all } = await chrome.storage.session.get(CACHE_KEY)
  if (all) {
    for (const [k, v] of Object.entries(all)) map.set(k, v)
  }
}

export function setCache(key, data) {
  map.set(key, data)
  persistCache()
}

export function getCache(key) {
  return map.get(key) || null
}

export function hasCache(key) {
  return map.has(key)
}

export function clearCache(prUrl) {
  for (const key of map.keys()) {
    if (key.startsWith(prUrl)) map.delete(key)
  }
  persistCache()
}

export function getCacheSize() {
  return map.size
}

async function persistCache() {
  const all = {}
  for (const [k, v] of map) all[k] = v
  await chrome.storage.session.set({ [CACHE_KEY]: all }).catch(() => {})
}
