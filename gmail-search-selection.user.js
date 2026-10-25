// ==UserScript==
// @name         Gmail 選字搜尋
// @namespace    https://github.com/charles0506/gmail-search-userscript
// @version      1.0.0
// @description  選取文字後按右鍵，游標旁出現「Gmail 搜尋」按鈕，點擊在新分頁用 Gmail 搜尋該文字
// @author       charles0506
// @match        *://*/*
// @exclude      https://mail.google.com/*
// @grant        GM_openInTab
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/charles0506/gmail-search-userscript/main/gmail-search-selection.user.js
// @downloadURL  https://raw.githubusercontent.com/charles0506/gmail-search-userscript/main/gmail-search-selection.user.js
// ==/UserScript==

(function () {
  'use strict';

  let bubble = null;

  function getSelectedText() {
    const el = document.activeElement;
    if (el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && /^(text|search|url|tel|email)$/i.test(el.type)))) {
      try {
        const s = el.value.substring(el.selectionStart, el.selectionEnd).trim();
        if (s) return s;
      } catch (e) { /* 某些 input 型別不支援 selectionStart */ }
    }
    return (window.getSelection().toString() || '').trim();
  }

  function hideBubble() {
    if (bubble) {
      bubble.remove();
      bubble = null;
    }
  }

  function showBubble(x, y, text) {
    hideBubble();
    bubble = document.createElement('div');
    bubble.textContent = '🔍 Gmail 搜尋';
    bubble.style.cssText = [
      'position:fixed',
      'z-index:2147483647',
      'padding:6px 12px',
      'background:#d93025',
      'color:#fff',
      'font:14px/1.2 -apple-system,"Segoe UI","Microsoft JhengHei",sans-serif',
      'border-radius:16px',
      'box-shadow:0 2px 8px rgba(0,0,0,.35)',
      'cursor:pointer',
      'user-select:none',
      'white-space:nowrap'
    ].join(';');
    document.documentElement.appendChild(bubble);

    // 放在游標左上方，避免被原生右鍵選單（往右下展開）蓋住
    const w = bubble.offsetWidth;
    const left = Math.max(4, Math.min(x - w - 8, window.innerWidth - w - 4));
    const top = Math.max(4, y - 40);
    bubble.style.left = left + 'px';
    bubble.style.top = top + 'px';

    // mousedown 就觸發，避免點擊先讓選取消失
    bubble.addEventListener('mousedown', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      const url = 'https://mail.google.com/mail/u/0/#search/' + encodeURIComponent(text);
      GM_openInTab(url, { active: true });
      hideBubble();
    });
  }

  document.addEventListener('contextmenu', function (e) {
    const text = getSelectedText();
    if (!text) {
      hideBubble();
      return;
    }
    showBubble(e.clientX, e.clientY, text);
  }, true);

  document.addEventListener('mousedown', function (e) {
    if (bubble && !bubble.contains(e.target)) hideBubble();
  }, true);
  document.addEventListener('keydown', hideBubble, true);
  window.addEventListener('scroll', hideBubble, true);
  window.addEventListener('resize', hideBubble);
  window.addEventListener('blur', hideBubble);
})();
