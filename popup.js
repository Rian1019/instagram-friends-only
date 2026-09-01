const focusToggle = document.getElementById('focus-toggle')

chrome.storage.local.get({ focusEnabled: true }, ({ focusEnabled }) => {
  focusToggle.checked = focusEnabled
})

focusToggle.addEventListener('change', () => {
  chrome.storage.local.set({ focusEnabled: focusToggle.checked })
})

document.getElementById('open-home').addEventListener('click', () => {
  chrome.tabs.update({ url: 'https://www.instagram.com/' })
  window.close()
})

document.getElementById('open-inbox').addEventListener('click', () => {
  chrome.tabs.update({ url: 'https://www.instagram.com/direct/inbox/' })
  window.close()
})

document.getElementById('open-requests').addEventListener('click', () => {
  chrome.tabs.update({ url: 'https://www.instagram.com/direct/requests/' })
  window.close()
})
