# Instagram Friends Only

A small Chrome/Edge extension that keeps Instagram focused on people you follow.

## What it keeps

- Home feed posts from followed accounts
- Stories
- Followed profiles and individual posts
- Direct Messages and message requests

## What it filters

- Posts labeled Suggested or Recommended
- Sponsored posts
- Unlabeled posts whose header offers a **Follow** action
- Reels and Explore navigation

“Friends” means accounts followed by the signed-in user. Instagram does not expose its private Close Friends membership list to browser extensions.

## Install in Chrome

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the repository folder containing `manifest.json`.
6. Pin **Instagram Friends Only** and reload Instagram.

Use `edge://extensions` for Microsoft Edge.

## Update after pulling changes

Open `chrome://extensions`, press the extension's reload icon, and then reload the Instagram tab so Chrome injects the updated content script.

## If Instagram does not finish loading

1. Disable the extension temporarily and reload Instagram.
2. Re-enable it and press its reload icon.
3. Reload Instagram again.
4. Turn off **Friends-only mode** from the popup if Instagram changes its page structure.

## Limitations

Instagram changes its markup frequently. Filtering relies on visible English labels such as “Follow,” “Suggested for you,” and “Sponsored,” so recommendations using different labels or languages may occasionally appear. Feed articles are hidden before paint and revealed only after classification, preventing non-friend posts from flashing briefly. The extension deliberately filters only individual `article` elements to avoid hiding the whole feed.

This project is independent and is not affiliated with or endorsed by Instagram or Meta.
