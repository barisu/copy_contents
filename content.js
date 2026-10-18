/**
 * Quick Article Copy - Content Script (Vanilla JS)
 */
(function () {
  // トースト通知の表示 (Shadow DOM によるスタイル完全隔離)
  function showToast(message, durationMs = 2500) {
    const HOST_ID = 'readability-quick-copy-toast-host';
    let host = document.getElementById(HOST_ID);
    if (host) {
      host.remove();
    }

    host = document.createElement('div');
    host.id = HOST_ID;
    host.style.position = 'fixed';
    host.style.top = '24px';
    host.style.right = '24px';
    host.style.zIndex = '2147483647';
    host.style.pointerEvents = 'none';

    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      .toast-container {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 20px;
        background: rgba(18, 18, 20, 0.88);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
        opacity: 0;
        transform: translateY(-16px) scale(0.95);
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: auto;
      }
      .toast-container.show {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      .toast-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #10b981;
        color: #ffffff;
        flex-shrink: 0;
      }
      .toast-icon svg {
        width: 14px;
        height: 14px;
        stroke-width: 2.5;
      }
      .toast-text {
        color: #f3f4f6;
        letter-spacing: -0.01em;
      }
    `;

    const container = document.createElement('div');
    container.className = 'toast-container';
    container.innerHTML = `
      <div class="toast-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <div class="toast-text">${message}</div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(container);
    document.body.appendChild(host);

    requestAnimationFrame(() => {
      container.classList.add('show');
    });

    setTimeout(() => {
      container.classList.remove('show');
      setTimeout(() => host?.remove(), 250);
    }, durationMs);
  }

  // クリップボードへの書き込み
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_err) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      textarea.remove();
      return success;
    }
  }

  // 記事抽出と整形
  function extractArticle(options = { includeTitle: true, includeUrl: true }) {
    if (typeof Readability === 'undefined') {
      throw new Error('Readability library not loaded');
    }

    const docClone = document.cloneNode(true);
    const reader = new Readability(docClone, { charThreshold: 20 });
    const parsed = reader.parse();

    let title = (parsed && parsed.title) || document.title || 'Untitled Article';
    let bodyHtml = (parsed && parsed.content) || '';
    let siteName = (parsed && parsed.siteName) || null;
    let length = (parsed && parsed.length) || 0;

    // フォールバック
    if (!bodyHtml || bodyHtml.trim().length === 0) {
      const articleEl =
        document.querySelector('article') ||
        document.querySelector('main') ||
        document.querySelector('[role="main"]') ||
        document.body;

      if (articleEl) {
        const clonedEl = articleEl.cloneNode(true);
        clonedEl.querySelectorAll('nav, footer, header, aside, .ad, .ads, script, style').forEach((el) => el.remove());
        bodyHtml = clonedEl.innerHTML;
        length = clonedEl.textContent?.length || 0;
      }
    }

    const bodyMarkdown = typeof htmlToMarkdown === 'function' ? htmlToMarkdown(bodyHtml) : bodyHtml;

    const parts = [];
    if (options.includeTitle !== false && title) {
      parts.push(`# ${title.trim()}`);
    }
    if (options.includeUrl !== false && window.location.href) {
      parts.push(`URL: ${window.location.href.trim()}`);
    }
    if (parts.length > 0 && bodyMarkdown.trim()) {
      parts.push('---');
    }
    if (bodyMarkdown.trim()) {
      parts.push(bodyMarkdown.trim());
    }

    const fullMarkdown = parts.join('\n\n');

    return {
      title,
      url: window.location.href,
      siteName,
      markdown: fullMarkdown,
      rawBodyMarkdown: bodyMarkdown,
      length: length || bodyMarkdown.length,
    };
  }

  // クイックコピー実行
  async function executeQuickCopy(options) {
    try {
      const article = extractArticle(options);
      if (!article.markdown || article.markdown.trim().length === 0) {
        showToast('⚠️ 記事本文を検出できませんでした');
        return { success: false, error: '記事本文を検出できませんでした' };
      }

      const copied = await copyToClipboard(article.markdown);
      if (copied) {
        showToast('📋 Markdownをコピーしました！');
        return { success: true, article };
      } else {
        showToast('❌ クリップボードへのコピーに失敗しました');
        return { success: false, error: 'コピーに失敗しました' };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      showToast(`❌ エラー: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  // メッセージハンドラ
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'QUICK_COPY') {
      executeQuickCopy(message.options).then(sendResponse);
      return true;
    } else if (message.action === 'GET_ARTICLE') {
      try {
        const article = extractArticle(message.options);
        sendResponse({ success: true, article });
      } catch (e) {
        sendResponse({ success: false, error: e instanceof Error ? e.message : String(e) });
      }
      return false;
    }
  });

  // グローバルアクセス用
  window.__quickArticleCopy = {
    extractArticle,
    executeQuickCopy,
  };
})();
