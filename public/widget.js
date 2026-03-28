(function () {
  'use strict';

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var token   = script.getAttribute('data-token');
  var baseUrl = script.getAttribute('data-url') || 'https://lycho.vercel.app';

  if (!token) { console.warn('[LYCHO] No data-token found on widget script.'); return; }

  // ── Styles ──────────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '#lycho-bubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;',
    'background:#C9A84C;cursor:pointer;z-index:999999;display:flex;align-items:center;justify-content:center;',
    'box-shadow:0 4px 24px rgba(201,168,76,0.4);transition:transform 0.2s,box-shadow 0.2s;border:none;outline:none;}',
    '#lycho-bubble:hover{transform:scale(1.08);box-shadow:0 6px 32px rgba(201,168,76,0.55);}',
    '#lycho-container{position:fixed;bottom:92px;right:24px;width:380px;height:560px;z-index:999998;',
    'border-radius:16px;overflow:hidden;box-shadow:0 8px 48px rgba(0,0,0,0.55);',
    'transform:translateY(20px) scale(0.96);opacity:0;pointer-events:none;',
    'transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),opacity 0.2s;}',
    '#lycho-container.open{transform:translateY(0) scale(1);opacity:1;pointer-events:all;}',
    '#lycho-iframe{width:100%;height:100%;border:none;border-radius:16px;}',
    '#lycho-close{position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:50%;',
    'background:rgba(0,0,0,0.5);border:none;cursor:pointer;color:#fff;font-size:14px;',
    'display:flex;align-items:center;justify-content:center;z-index:1;transition:background 0.2s;}',
    '#lycho-close:hover{background:rgba(0,0,0,0.75);}',
    '@media(max-width:440px){#lycho-container{width:calc(100vw - 16px);right:8px;bottom:80px;}}',
  ].join('');
  document.head.appendChild(style);

  // ── Bubble ──────────────────────────────────────────────────────────────────
  var bubble = document.createElement('button');
  bubble.id = 'lycho-bubble';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#070707" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  // ── Container ───────────────────────────────────────────────────────────────
  var container = document.createElement('div');
  container.id = 'lycho-container';

  var closeBtn = document.createElement('button');
  closeBtn.id = 'lycho-close';
  closeBtn.setAttribute('aria-label', 'Close chat');
  closeBtn.innerHTML = '&#x2715;';

  var iframe = document.createElement('iframe');
  iframe.id = 'lycho-iframe';
  iframe.src = baseUrl + '/widget/' + token;
  iframe.title = 'Chat';
  iframe.allow = 'microphone';

  container.appendChild(closeBtn);
  container.appendChild(iframe);

  document.body.appendChild(bubble);
  document.body.appendChild(container);

  // ── Toggle ──────────────────────────────────────────────────────────────────
  var isOpen = false;

  function open() {
    isOpen = true;
    container.classList.add('open');
    bubble.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#070707" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    bubble.setAttribute('aria-label', 'Close chat');
  }

  function close() {
    isOpen = false;
    container.classList.remove('open');
    bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#070707" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    bubble.setAttribute('aria-label', 'Open chat');
  }

  bubble.addEventListener('click', function () { isOpen ? close() : open(); });
  closeBtn.addEventListener('click', close);
})();
