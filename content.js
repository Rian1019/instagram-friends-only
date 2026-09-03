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
const ARTICLE_SETTLE_MS = 160

let focusEnabled = true
let observer
let applyTimer
const articleTimers = new WeakMap()

// Hide feed articles before Instagram can paint them. Stored settings replace
// this optimistic default as soon as Chrome returns the user's preference.
if (document.documentElement) {
  document.documentElement.dataset.friendsOnlyActive = 'true'
}

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

function hasFollowAction(article) {
  return Array.from(article.querySelectorAll('button, [role="button"]')).some((control) => {
    const visibleText = (control.textContent || '').trim().toLowerCase()
    const accessibleName = (control.getAttribute('aria-label') || '').trim().toLowerCase()
    return visibleText === 'follow' || accessibleName === 'follow'
  })
}

function hasRecommendationLabel(article) {
  const text = (article.innerText || article.textContent || '').slice(0, 900).toLowerCase()
  return UNWANTED_POST_MARKERS.some((marker) => text.includes(marker))
}

function isUnwantedPost(article) {
  return hasFollowAction(article) || hasRecommendationLabel(article)
}

function classifyArticle(article) {
  window.clearTimeout(articleTimers.get(article))

  if (!focusEnabled) {
    delete article.dataset.friendsOnlyState
    return
  }

  article.dataset.friendsOnlyState = isUnwantedPost(article) ? 'hidden' : 'allowed'
}

function queueArticleClassification(article) {
  if (!(article instanceof HTMLElement)) return

  // Follow/Sponsored controls are decisive and are hidden in the same
  // mutation turn, before the browser paints the new node.
  if (isUnwantedPost(article)) {
    window.clearTimeout(articleTimers.get(article))
    article.dataset.friendsOnlyState = 'hidden'
    return
  }

  if (article.dataset.friendsOnlyState === 'allowed') return

  window.clearTimeout(articleTimers.get(article))
  const timer = window.setTimeout(() => classifyArticle(article), ARTICLE_SETTLE_MS)
  articleTimers.set(article, timer)
}

function articlesInNode(node) {
  if (!(node instanceof Element)) return []
  const articles = []
  if (node.matches('main article')) articles.push(node)
  node.querySelectorAll('main article, article').forEach((article) => articles.push(article))
  const parentArticle = node.closest('main article')
  if (parentArticle) articles.push(parentArticle)
  return [...new Set(articles)]
}

function filterFeed(root = document) {
  root.querySelectorAll('main article').forEach(queueArticleClassification)
}

function applyFriendsOnlyMode() {
  document.documentElement.dataset.friendsOnlyActive = String(focusEnabled)

  if (!focusEnabled) {
    document.querySelectorAll('[data-friends-only-hidden="true"]').forEach((node) => node.removeAttribute('data-friends-only-hidden'))
    document.querySelectorAll('[data-friends-only-state]').forEach((node) => node.removeAttribute('data-friends-only-state'))
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

  filterFeed()

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
  applyTimer = window.setTimeout(applyFriendsOnlyMode, 120)
}

function handleMutations(records) {
  if (!focusEnabled) return

  records.forEach((record) => {
    record.addedNodes.forEach((node) => {
      articlesInNode(node).forEach(queueArticleClassification)
    })
  })

  scheduleFriendsOnlyMode()
}

function beginWatching() {
  observer?.disconnect()
  observer = new MutationObserver(handleMutations)

  const start = () => {
    observer.observe(document.documentElement, { childList: true, subtree: true })
    applyFriendsOnlyMode()
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
  applyFriendsOnlyMode()
})

window.addEventListener('popstate', applyFriendsOnlyMode)
