const PR_URL_PATTERN = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/

function getPRUrl() {
  return window.location.href.match(PR_URL_PATTERN)?.[0] || ''
}

async function updatePRUrl() {
  const url = getPRUrl()
  if (!url) return
  await chrome.storage.session.set({ prUrl: url })
  chrome.runtime.sendMessage({ type: 'PR_URL_DETECTED', payload: { url } }).catch(() => {})
}

const originalPushState = history.pushState
const originalReplaceState = history.replaceState

function patchHistory() {
  history.pushState = function (...args) {
    originalPushState.apply(this, args)
    window.dispatchEvent(new Event('urlchange'))
  }
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args)
    window.dispatchEvent(new Event('urlchange'))
  }
}

patchHistory()
window.addEventListener('urlchange', updatePRUrl)
window.addEventListener('popstate', updatePRUrl)

updatePRUrl()
