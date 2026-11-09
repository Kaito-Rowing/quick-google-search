(() => {
  const SIZE = 40;
  const GAP = 12;
  const MARGIN = 8;
  let host;
  let button;
  let query = '';
  let timer;
  let dragging = false;
  let dismissed = false;
  const label = chrome.i18n.getMessage('searchLabel');

  function isOwnEvent(event) {
    return host && event.composedPath().includes(host);
  }

  function hide() {
    clearTimeout(timer);
    query = '';
    if (host) host.style.setProperty('display', 'none', 'important');
  }

  function readSelection() {
    // Do not offer searches for drafts, form values or password-manager fields.
    const editable = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]';
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    if (active?.closest(editable)) return null;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    const element = node => node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (element(range.startContainer)?.closest(editable) || element(range.endContainer)?.closest(editable)) return null;
    const ancestor = range.commonAncestorContainer;
    if (ancestor.querySelectorAll && [...ancestor.querySelectorAll(editable)].some(el => range.intersectsNode(el))) return null;
    const text = selection.toString().trim();
    if (!text) return null;
    const rects = range.getClientRects();
    const rect = rects[rects.length - 1];
    return rect ? { text, rect } : null;
  }

  function createButton() {
    host = document.createElement('quick-google-search');
    // The outer element is transparent; only the round inner button is painted.
    for (const [name, value] of Object.entries({
      all: 'initial', position: 'fixed', display: 'none', width: `${SIZE}px`,
      height: `${SIZE}px`, margin: '0', padding: '0', border: '0',
      background: 'transparent', 'box-shadow': 'none', 'border-radius': '50%',
      'z-index': '2147483647', 'color-scheme': 'light', transform: 'none',
      opacity: '1', visibility: 'visible', 'pointer-events': 'auto', overflow: 'visible'
    })) host.style.setProperty(name, value, 'important');
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      button { all: initial; box-sizing: border-box; display: grid; place-items: center;
        width: 40px; height: 40px; padding: 0; margin: 0; border: 0; border-radius: 50%;
        background: linear-gradient(135deg, #2563eb, #16803d); color: white;
        cursor: pointer; box-shadow: 0 3px 12px #0f172a33; appearance: none;
        -webkit-tap-highlight-color: transparent; user-select: none; }
      button:hover { background: linear-gradient(135deg, #1d4ed8, #166534); }
      button:focus-visible { outline: 3px solid #2563eb; outline-offset: 3px; }
      button:active { box-shadow: 0 1px 5px #0f172a33; }
      svg { display: block; width: 20px; height: 20px; pointer-events: none; }
      @media (forced-colors: active) {
        button { background: ButtonFace; color: ButtonText; border: 1px solid ButtonText; }
      }
    `;
    button = document.createElement('button');
    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', label);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (const [name, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round',
      'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' })) svg.setAttribute(name, value);
    const circle = document.createElementNS(svg.namespaceURI, 'circle');
    for (const [name, value] of Object.entries({ cx: '10.5', cy: '10.5', r: '6.5' })) circle.setAttribute(name, value);
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', 'm16 16 4.5 4.5');
    svg.append(circle, path);
    button.append(svg);
    button.addEventListener('pointerdown', event => {
      if (event.button === 0) event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const current = readSelection();
      if (event.isTrusted && query && current) {
        const url = new URL('https://www.google.com/search');
        // Use the live selection, including a just-completed keyboard change.
        url.searchParams.set('q', current.text);
        window.open(url.href, '_blank', 'noopener,noreferrer');
      }
      dismissed = true;
      hide();
    });
    shadow.append(style, button);
    document.documentElement.append(host);
  }

  function update(point) {
    if (dragging || dismissed) return;
    const selection = readSelection();
    if (!selection) return hide();
    if (!host) createButton();
    if (!host.isConnected) document.documentElement.append(host);
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft ?? 0;
    const top = viewport?.offsetTop ?? 0;
    const right = left + (viewport?.width ?? window.innerWidth);
    const bottom = top + (viewport?.height ?? window.innerHeight);
    const anchor = point ?? { x: selection.rect.right, y: selection.rect.bottom };
    if (selection.rect.bottom < top || selection.rect.top > bottom) return hide();
    const clamp = (v, min, max) => Math.max(min, Math.min(v, Math.max(min, max)));
    const x = anchor.x + GAP + SIZE > right - MARGIN ? anchor.x - SIZE - GAP : anchor.x + GAP;
    const y = anchor.y + GAP + SIZE > bottom - MARGIN ? anchor.y - SIZE - GAP : anchor.y + GAP;
    host.style.setProperty('left', `${clamp(x, left + MARGIN, right - SIZE - MARGIN)}px`, 'important');
    host.style.setProperty('top', `${clamp(y, top + MARGIN, bottom - SIZE - MARGIN)}px`, 'important');
    query = selection.text;
    host.style.setProperty('display', 'block', 'important');
  }

  function schedule(point) {
    clearTimeout(timer);
    timer = setTimeout(() => update(point), 20);
  }
  document.addEventListener('pointerdown', event => {
    if (isOwnEvent(event)) return;
    dragging = event.button === 0;
    dismissed = false;
    hide();
  }, true);
  document.addEventListener('pointerup', event => {
    if (isOwnEvent(event)) return;
    dragging = false;
    if (event.button === 0) schedule({ x: event.clientX, y: event.clientY });
  }, true);
  document.addEventListener('pointercancel', () => { dragging = false; hide(); }, true);
  document.addEventListener('selectionchange', () => {
    if (document.activeElement === host) return;
    dismissed = false;
    hide();
    schedule();
  });
  document.addEventListener('keydown', event => {
    // Move directly from a selection to its action without traversing page forms.
    if (event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey &&
        !dismissed && !dragging && document.activeElement !== host && readSelection()) {
      event.preventDefault();
      // A selectionchange may still be waiting for the debounced repaint.
      clearTimeout(timer);
      update();
      button.focus({ preventScroll: true });
      return;
    }
    if (event.key === 'Escape') {
      if (document.activeElement === host) button.blur();
      dismissed = true;
      hide();
    }
  }, true);
  document.addEventListener('keyup', event => {
    if (event.key === 'Escape' || event.key === 'Tab' || isOwnEvent(event)) return;
    if (event.shiftKey || event.key.startsWith('Arrow') || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a')) {
      dismissed = false;
      schedule();
    }
  });
  const dismiss = () => { dismissed = true; hide(); };
  document.addEventListener('scroll', dismiss, true);
  window.addEventListener('resize', dismiss);
  window.addEventListener('blur', () => { dragging = false; dismiss(); });
  window.addEventListener('pagehide', dismiss);
  document.addEventListener('visibilitychange', () => { if (document.hidden) dismiss(); });
  window.visualViewport?.addEventListener('resize', dismiss);
  window.visualViewport?.addEventListener('scroll', dismiss);
})();
