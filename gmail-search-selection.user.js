// ==UserScript==
// @name         Gmail 選字搜尋
// @namespace    https://github.com/charles0506/gmail-search-userscript
// @version      1.1.1
// @description  選取文字後按右鍵，游標旁出現「在 Gmail 搜尋」選項，點擊在新分頁用 Gmail 搜尋該文字
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

  const CSS = `
    :host { all: initial; }
    .item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px 8px 10px;
      background: #fff; color: #202124;
      border: 1px solid rgba(0,0,0,.12); border-radius: 8px;
      box-shadow: 0 4px 14px rgba(0,0,0,.2);
      font: 13px/1.3 "Segoe UI","Microsoft JhengHei",system-ui,sans-serif;
      cursor: pointer; user-select: none; white-space: nowrap;
      animation: in .12s ease-out;
    }
    .item:hover { background: #f1f3f4; }
    @media (prefers-color-scheme: dark) {
      .item { background: #2d2e30; color: #e8eaed; border-color: rgba(255,255,255,.15); }
      .item:hover { background: #3c4043; }
    }
    svg { width: 18px; height: 18px; flex: none; }
    .q { display: inline-block; max-width: 180px; overflow: hidden; text-overflow: ellipsis; vertical-align: bottom; font-weight: 600; }
    @keyframes in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
  `;
  const ICON = '<svg viewBox="0 0 24 24"><path fill="#EA4335" d="M2 6.5v11A1.5 1.5 0 0 0 3.5 19H6V9.9l6 4.5 6-4.5V19h2.5a1.5 1.5 0 0 0 1.5-1.5v-11c0-1.9-2.2-3-3.7-1.8L12 9.6 5.7 4.7C4.2 3.5 2 4.6 2 6.5z"/></svg>';

  let host = null;

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

  function hideMenu() {
    if (host) {
      host.remove();
      host = null;
    }
  }

  function showMenu(x, y, text) {
    hideMenu();
    host = document.createElement('div');
    host.style.cssText = 'position:fixed;z-index:2147483647;left:0;top:0;display:block;';
    const root = host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = CSS;
    const item = document.createElement('div');
    item.className = 'item';
    item.innerHTML = ICON;
    const label = document.createElement('span');
    label.append('在 Gmail 搜尋 ');
    const q = document.createElement('span');
    q.className = 'q';
    q.textContent = '「' + text + '」';
    label.append(q);
    item.append(label);
    root.append(style, item);
    document.documentElement.appendChild(host);

    // 優先放游標上方（原生右鍵選單往下展開，不會被蓋住）；上方沒空間就放左側
    const r = item.getBoundingClientRect();
    let left = Math.min(Math.max(4, x), window.innerWidth - r.width - 4);
    let top = y - r.height - 10;
    if (top < 4) {
      left = Math.max(4, x - r.width - 10);
      top = Math.min(y, window.innerHeight - r.height - 4);
    }
    host.style.left = left + 'px';
    host.style.top = top + 'px';

    // mousedown 就觸發，避免點擊先讓選取消失
    item.addEventListener('mousedown', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      GM_openInTab('https://mail.google.com/mail/u/0/#search/' + encodeURIComponent(text), { active: true });
      hideMenu();
    });
  }

  document.addEventListener('contextmenu', function (e) {
    const text = getSelectedText();
    if (!text) {
      hideMenu();
      return;
    }
    showMenu(e.clientX, e.clientY, text);
  }, true);

  document.addEventListener('mousedown', function (e) {
    if (host && e.target !== host) hideMenu();
  }, true);
  document.addEventListener('keydown', hideMenu, true);
  window.addEventListener('scroll', hideMenu, true);
  window.addEventListener('resize', hideMenu);
  window.addEventListener('blur', hideMenu);
})();
