const cache = new Map()

export function setCache(key, data) {
  cache.set(key, data)
}

export function getCache(key) {
  return cache.get(key) || null
}

export function hasCache(key) {
  return cache.has(key)
}

export function clearCache(prUrl) {
  for (const key of cache.keys()) {
    if (key.startsWith(prUrl)) cache.delete(key)
  }
}

export function getCacheSize() {
  return cache.size
}
