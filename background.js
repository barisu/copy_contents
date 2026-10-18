/**
 * Quick Article Copy - Background Service Worker (Vanilla JS)
 */

// 右クリックメニューの登録
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'copy-article-markdown',
    title: '記事をMarkdownでコピー',
    contexts: ['page', 'selection', 'link'],
  });
});

// アクティブタブでスクリプトを実行してコピーする共通関数
async function triggerQuickCopyInActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  // chrome:// 等の保護URLをスキップ
  if (
    tab.url &&
    (tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://') ||
      tab.url.startsWith('edge://') ||
      tab.url.startsWith('about:'))
  ) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'QUICK_COPY' });
  } catch (_err) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['lib/Readability.js', 'lib/html-to-markdown.js', 'content.js'],
      });
      await chrome.tabs.sendMessage(tab.id, { action: 'QUICK_COPY' });
    } catch (injectErr) {
      console.error('Failed to execute script on tab:', injectErr);
    }
  }
}

// ショートカットキーのリスナー
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'copy-markdown') {
    await triggerQuickCopyInActiveTab();
  }
});

// コンテキストメニューのリスナー
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'copy-article-markdown') {
    await triggerQuickCopyInActiveTab();
  }
});
