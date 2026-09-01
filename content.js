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
}

function beginWatching() {
  observer?.disconnect()
  observer = new MutationObserver(applyFriendsOnlyMode)
  observer.observe(document.documentElement, { childList: true, subtree: true })
  applyFriendsOnlyMode()
}

chrome.storage.local.get({ focusEnabled: true }, ({ focusEnabled: storedValue }) => {
  focusEnabled = storedValue
  beginWatching()
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.focusEnabled) return
  focusEnabled = changes.focusEnabled.newValue
  applyFriendsOnlyMode()
})

window.addEventListener('popstate', applyFriendsOnlyMode)
