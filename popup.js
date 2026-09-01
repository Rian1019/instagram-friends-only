document.getElementById('open-inbox').addEventListener('click', () => {
  chrome.tabs.update({ url: 'https://www.instagram.com/direct/inbox/' })
  window.close()
})
