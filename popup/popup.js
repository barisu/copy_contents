/**
 * Quick Article Copy - Popup Logic (Vanilla JS)
 */
document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading');
  const errorStateEl = document.getElementById('error-state');
  const errorMessageEl = document.getElementById('error-message');
  const contentEl = document.getElementById('content');
  const articleTitleEl = document.getElementById('article-title');
  const siteNameEl = document.getElementById('site-name');
  const charCountEl = document.getElementById('char-count');
  const readTimeEl = document.getElementById('read-time');
  const toggleTitleEl = document.getElementById('toggle-title');
  const toggleUrlEl = document.getElementById('toggle-url');
  const copyBtn = document.getElementById('copy-btn');
  const btnText = document.getElementById('btn-text');
  const copyIcon = copyBtn.querySelector('.copy-icon');
  const checkIcon = copyBtn.querySelector('.check-icon');
  const previewTextEl = document.getElementById('preview-text');

  let currentArticle = null;

  // 設定の読み込み
  async function loadOptions() {
    try {
      const saved = await chrome.storage.local.get(['includeTitle', 'includeUrl']);
      return {
        includeTitle: typeof saved.includeTitle === 'boolean' ? saved.includeTitle : true,
        includeUrl: typeof saved.includeUrl === 'boolean' ? saved.includeUrl : true,
      };
    } catch (_e) {
      return { includeTitle: true, includeUrl: true };
    }
  }

  // 設定の保存
  async function saveOptions(options) {
    try {
      await chrome.storage.local.set(options);
    } catch (e) {
      console.error('Failed to save options:', e);
    }
  }

  // Markdownの組み立て
  function formatMarkdown(title, url, bodyMarkdown, options) {
    const parts = [];
    if (options.includeTitle !== false && title) {
      parts.push(`# ${title.trim()}`);
    }
    if (options.includeUrl !== false && url) {
      parts.push(`URL: ${url.trim()}`);
    }
    if (parts.length > 0 && bodyMarkdown.trim()) {
      parts.push('---');
    }
    if (bodyMarkdown.trim()) {
      parts.push(bodyMarkdown.trim());
    }
    return parts.join('\n\n');
  }

  function updateMarkdownPreview() {
    if (!currentArticle) return;
    const options = {
      includeTitle: toggleTitleEl.checked,
      includeUrl: toggleUrlEl.checked,
    };
    const formatted = formatMarkdown(
      currentArticle.title,
      currentArticle.url,
      currentArticle.rawBodyMarkdown || '',
      options
    );
    currentArticle.markdown = formatted;
    previewTextEl.textContent = formatted;
  }

  function showError(msg) {
    loadingEl.classList.add('hidden');
    contentEl.classList.add('hidden');
    errorStateEl.classList.remove('hidden');
    errorMessageEl.textContent = msg;
  }

  function displayArticle(article) {
    loadingEl.classList.add('hidden');
    errorStateEl.classList.add('hidden');
    contentEl.classList.remove('hidden');

    articleTitleEl.textContent = article.title;
    articleTitleEl.title = article.title;

    try {
      const domain = new URL(article.url).hostname.replace(/^www\./, '');
      siteNameEl.textContent = article.siteName || domain;
    } catch (_e) {
      siteNameEl.textContent = article.siteName || 'Web Page';
    }

    charCountEl.textContent = `${article.length.toLocaleString()} 文字`;
    const minutes = Math.max(1, Math.round(article.length / 500));
    readTimeEl.textContent = `約 ${minutes} 分`;

    updateMarkdownPreview();
  }

  // 初期化
  const options = await loadOptions();
  toggleTitleEl.checked = !!options.includeTitle;
  toggleUrlEl.checked = !!options.includeUrl;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      showError('アクティブなタブが見つかりません');
      return;
    }

    if (
      tab.url &&
      (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:'))
    ) {
      showError('このページでは拡張機能を利用できません');
      return;
    }

    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { action: 'GET_ARTICLE', options });
    } catch (_err) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['lib/Readability.js', 'lib/html-to-markdown.js', 'content.js'],
      });
      response = await chrome.tabs.sendMessage(tab.id, { action: 'GET_ARTICLE', options });
    }

    if (!response || !response.success || !response.article) {
      showError(response?.error || '記事本文を検出できませんでした');
      return;
    }

    currentArticle = response.article;
    displayArticle(currentArticle);
  } catch (error) {
    showError(error instanceof Error ? error.message : '解析中にエラーが発生しました');
  }

  // コピーボタン
  copyBtn.addEventListener('click', async () => {
    if (!currentArticle || !currentArticle.markdown) return;

    try {
      await navigator.clipboard.writeText(currentArticle.markdown);
      copyBtn.classList.add('copied');
      btnText.textContent = 'コピー完了！';
      copyIcon.classList.add('hidden');
      checkIcon.classList.remove('hidden');

      setTimeout(() => {
        copyBtn.classList.remove('copied');
        btnText.textContent = 'Markdownをコピー';
        copyIcon.classList.remove('hidden');
        checkIcon.classList.add('hidden');
      }, 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
      btnText.textContent = 'コピーに失敗しました';
      setTimeout(() => {
        btnText.textContent = 'Markdownをコピー';
      }, 2000);
    }
  });

  toggleTitleEl.addEventListener('change', () => {
    saveOptions({ includeTitle: toggleTitleEl.checked, includeUrl: toggleUrlEl.checked });
    updateMarkdownPreview();
  });

  toggleUrlEl.addEventListener('change', () => {
    saveOptions({ includeTitle: toggleTitleEl.checked, includeUrl: toggleUrlEl.checked });
    updateMarkdownPreview();
  });
});
