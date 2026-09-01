const BLOCKED_ROUTE_PREFIXES = ['/explore/', '/reels/']
const BLOCKED_LINK_PREFIXES = ['/explore/', '/reels/']
const UNWANTED_POST_MARKERS = [
  'suggested for you',
  'suggested post',
  'because you watched',
  'recommended for you',
  'popular on instagram',
  'sponsored',
]

let focusEnabled = true
let observer
let applyTimer

function normalizePath(href) {
  try {
    return new URL(href, window.location.origin).pathname
  } catch {
    return ''
  }
}

function isBlockedRoute(pathname) {
  return BLOCKED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isRecommendedPost(article) {
  const text = (article.innerText || '').slice(0, 700).toLowerCase()
  return UNWANTED_POST_MARKERS.some((marker) => text.includes(marker))
}

function applyFriendsOnlyMode() {
  document.documentElement.dataset.friendsOnlyActive = String(focusEnabled)

  if (!focusEnabled) {
    document.querySelectorAll('[data-friends-only-hidden="true"]').forEach((node) => node.removeAttribute('data-friends-only-hidden'))
    document.getElementById('friends-only-badge')?.remove()
    return
  }

  if (isBlockedRoute(window.location.pathname)) {
    window.location.replace('https://www.instagram.com/')
    return
  }

  document.querySelectorAll('a[href]').forEach((link) => {
    const pathname = normalizePath(link.getAttribute('href') || '')
    if (BLOCKED_LINK_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      link.dataset.friendsOnlyHidden = 'true'
    }
  })

  document.querySelectorAll('main article').forEach((article) => {
    if (isRecommendedPost(article)) article.dataset.friendsOnlyHidden = 'true'
  })

  if (document.body) {
    let badge = document.getElementById('friends-only-badge')
    if (!badge) {
      badge = document.createElement('div')
      badge.id = 'friends-only-badge'
      document.body.appendChild(badge)
    }
    badge.textContent = window.location.pathname.startsWith('/direct/')
      ? 'Friends Only · messages'
      : 'Friends Only · followed feed'
  }
}

function scheduleFriendsOnlyMode() {
  window.clearTimeout(applyTimer)
  applyTimer = window.setTimeout(applyFriendsOnlyMode, 300)
}

function beginWatching() {
  observer?.disconnect()
  observer = new MutationObserver(scheduleFriendsOnlyMode)

  const start = () => {
    observer.observe(document.documentElement, { childList: true, subtree: true })
    scheduleFriendsOnlyMode()
  }

  if (document.documentElement) start()
  else document.addEventListener('DOMContentLoaded', start, { once: true })
}

chrome.storage.local.get({ focusEnabled: true }, ({ focusEnabled: storedValue }) => {
  focusEnabled = storedValue
  beginWatching()
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.focusEnabled) return
  focusEnabled = changes.focusEnabled.newValue
  scheduleFriendsOnlyMode()
})

window.addEventListener('popstate', scheduleFriendsOnlyMode)
