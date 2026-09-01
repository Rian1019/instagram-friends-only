chrome.storage.local.get({ focusEnabled: true }, ({ focusEnabled }) => {
  document.documentElement.dataset.friendsOnlyActive = String(focusEnabled)
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.focusEnabled) return
  document.documentElement.dataset.friendsOnlyActive = String(changes.focusEnabled.newValue)
})
