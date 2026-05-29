const memory = new Map()

function sessionKey(key) {
  return `ac:${key}`
}

async function loadFromSession(key) {
  try {
    const data = await chrome.storage.session.get(sessionKey(key))
    const entry = data[sessionKey(key)]
    if (entry) {
      memory.set(key, entry)
    }
    return entry || null
  } catch {
    return memory.get(key) || null
  }
}

async function persistToSession(key) {
  const entry = memory.get(key)
  if (!entry) return
  try {
    await chrome.storage.session.set({ [sessionKey(key)]: entry })
  } catch {
    // session storage full, keep only in memory
  }
}

function removeFromSession(key) {
  chrome.storage.session.remove(sessionKey(key)).catch(() => {})
}

export async function setCache(key, data) {
  memory.set(key, data)
  await persistToSession(key)
}

export async function getCache(key) {
  const mem = memory.get(key)
  if (mem) return mem
  return loadFromSession(key)
}

export async function hasCache(key) {
  if (memory.has(key)) return true
  const entry = await loadFromSession(key)
  return entry !== null
}

export async function clearCache(prUrl) {
  const toDelete = []
  for (const key of memory.keys()) {
    if (key.startsWith(prUrl)) {
      memory.delete(key)
      toDelete.push(key)
    }
  }
  if (toDelete.length) {
    chrome.storage.session.remove(toDelete.map(sessionKey)).catch(() => {})
  }
}

export function getCacheSize() {
  return memory.size
}

// Preload all cached entries from session on module init
chrome.storage.session.get(null).then((all) => {
  if (!all) return
  for (const [sk, val] of Object.entries(all)) {
    if (sk.startsWith('ac:') && val) {
      memory.set(sk.slice(3), val)
    }
  }
}).catch(() => {})
