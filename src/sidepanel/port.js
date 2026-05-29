const listeners = {}
let port = null
let reconnectTimer = null

function connect() {
  if (port) return
  try {
    port = chrome.runtime.connect({ name: 'sidepanel' })
  } catch {
    reconnectTimer = setTimeout(connect, 2000)
    return
  }

  port.onMessage.addListener((msg) => {
    const fns = listeners[msg.type] || []
    fns.forEach(fn => fn(msg.payload))
  })

  port.onDisconnect.addListener(() => {
    port = null
    reconnectTimer = setTimeout(connect, 2000)
  })
}

export function send(type, payload) {
  if (!port) {
    connect()
    throw new Error('Port not connected, retrying...')
  }
  port.postMessage({ type, payload })
}

export function on(type, fn) {
  if (!listeners[type]) listeners[type] = []
  listeners[type].push(fn)
}

export function off(type, fn) {
  if (!listeners[type]) return
  listeners[type] = listeners[type].filter(f => f !== fn)
}

connect()
