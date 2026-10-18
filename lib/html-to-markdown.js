/**
 * 外部ライブラリ不要の軽量 HTML -> Markdown 変換関数
 * ブラウザ標準の DOM API のみを利用します。
 */
(function (global) {
  function htmlToMarkdown(htmlOrNode) {
    let root;
    if (typeof htmlOrNode === 'string') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlOrNode, 'text/html');
      root = doc.body;
    } else {
      root = htmlOrNode;
    }

    function formatTable(table) {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (!rows.length) return '';
      const tableData = rows.map((r) =>
        Array.from(r.querySelectorAll('th, td')).map((c) =>
          c.textContent.trim().replace(/\|/g, '\\|')
        )
      );
      const colCount = Math.max(...tableData.map((r) => r.length));
      if (colCount === 0) return '';

      let md = '\n\n';
      const header = tableData[0] || [];
      while (header.length < colCount) header.push('');
      md += `| ${header.join(' | ')} |\n`;
      md += `| ${Array(colCount).fill('---').join(' | ')} |\n`;

      for (let i = 1; i < tableData.length; i++) {
        const row = tableData[i];
        while (row.length < colCount) row.push('');
        md += `| ${row.join(' | ')} |\n`;
      }
      return md + '\n';
    }

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.nodeValue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }

      const tag = node.tagName.toLowerCase();

      // 不要なタグの除外
      if (['script', 'style', 'noscript', 'svg', 'iframe', 'button', 'nav', 'footer'].includes(tag)) {
        return '';
      }

      const children = Array.from(node.childNodes).map(walk).join('');

      switch (tag) {
        case 'h1': return `\n\n# ${children.trim()}\n\n`;
        case 'h2': return `\n\n## ${children.trim()}\n\n`;
        case 'h3': return `\n\n### ${children.trim()}\n\n`;
        case 'h4': return `\n\n#### ${children.trim()}\n\n`;
        case 'h5': return `\n\n##### ${children.trim()}\n\n`;
        case 'h6': return `\n\n###### ${children.trim()}\n\n`;
        case 'p': return `\n\n${children.trim()}\n\n`;
        case 'br': return '\n';
        case 'hr': return '\n\n---\n\n';
        case 'strong':
        case 'b': return children.trim() ? `**${children.trim()}**` : '';
        case 'em':
        case 'i': return children.trim() ? `*${children.trim()}*` : '';
        case 's':
        case 'del':
        case 'strike': return children.trim() ? `~~${children.trim()}~~` : '';
        case 'code': {
          if (node.parentNode && node.parentNode.tagName.toLowerCase() === 'pre') {
            return children;
          }
          return children.trim() ? ` \`${children.trim()}\` ` : '';
        }
        case 'pre': {
          const codeEl = node.querySelector('code');
          const className = (codeEl && codeEl.className) || node.className || '';
          const match = className.match(/language-(\S+)/);
          const lang = match ? match[1] : '';
          const text = (codeEl ? codeEl.textContent : node.textContent) || '';
          return `\n\n\`\`\`${lang}\n${text.replace(/\n+$/, '')}\n\`\`\`\n\n`;
        }
        case 'blockquote': {
          const lines = children.trim().split('\n');
          return `\n\n${lines.map((l) => `> ${l}`).join('\n')}\n\n`;
        }
        case 'a': {
          const href = node.getAttribute('href');
          const text = children.trim();
          if (!href) return text;
          if (!text) return href;
          return `[${text}](${href})`;
        }
        case 'ul':
        case 'ol':
          return `\n\n${children.trim()}\n\n`;
        case 'li': {
          const isOl = node.parentNode && node.parentNode.tagName.toLowerCase() === 'ol';
          if (isOl) {
            const index = Array.from(node.parentNode.children).indexOf(node) + 1;
            return `${index}. ${children.trim()}\n`;
          }
          return `- ${children.trim()}\n`;
        }
        case 'table':
          return formatTable(node);
        default:
          return children;
      }
    }

    const raw = walk(root);
    // 3行以上の連続改行を2行に圧縮
    return raw.replace(/\n{3,}/g, '\n\n').trim();
  }

  global.htmlToMarkdown = htmlToMarkdown;
})(typeof window !== 'undefined' ? window : this);
