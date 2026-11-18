/* 공통 도우미: 아이콘, 로고, 토스트, 테마, 시트·모달·팝오버 */
(function () {
  const I = window.WC_ICONS;
  const base = () => document.querySelector('meta[name="wc-base"]')?.content || '';

  // ic('mono/bell') · ic('glyph/chevron-right') · ic('color/nav-home') — 컬러는 현재 테마에 맞춰 고릅니다
  window.ic = function (key, cls) {
    const [tier, name] = key.split('/');
    let svg;
    if (tier === 'color') {
      const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      svg = I[theme][name];
    } else {
      svg = I[tier][name];
    }
    if (!svg) console.warn('icon missing', key);
    return `<span class="ic${cls ? ' ' + cls : ''}" aria-hidden="true">${svg || ''}</span>`;
  };

  window.logo = function (size, light) {
    return `<span class="logo${light ? ' logo-light' : ''}" style="font-size:${size || 20}px"><img src="${base()}assets/brand/symbol.png" alt=""><span>workchip</span></span>`;
  };
  window.character = (cls) => `<img class="character${cls ? ' ' + cls : ''}" src="${base()}assets/brand/character.png" alt="">`;

  /* 토스트 (되돌리기 같은 동작 버튼을 붙일 수 있음) */
  let t;
  window.toast = function (msg, action) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.innerHTML = `<span>${msg}</span>${action ? `<button type="button">${action.label}</button>` : ''}`;
    if (action) el.querySelector('button').onclick = () => { action.run(); el.classList.remove('show'); };
    el.classList.add('show');
    clearTimeout(t);
    t = setTimeout(() => el.classList.remove('show'), action ? 4000 : 1800);
  };

  /* 라이트 기본. 사용자가 바꾼 경우에만 다크 유지 */
  const saved = localStorage.getItem('wc-theme');
  document.documentElement.dataset.theme = saved === 'dark' ? 'dark' : 'light';
  window.toggleTheme = function () {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('wc-theme', next);
    window.dispatchEvent(new Event('themechange'));
  };

  /* 레이어: 시트(오른쪽 패널 / 모바일 아래 시트)와 모달 */
  const stack = [];
  function layer(kind, { title, body, footer, size, onMount, onClose }) {
    const wrap = document.createElement('div');
    wrap.className = `layer layer-${kind}${size ? ' layer-' + size : ''}`;
    wrap.innerHTML = `<div class="layer-dim"></div>
      <div class="layer-box" role="dialog" aria-modal="true" aria-label="${title || ''}">
        ${kind === 'sheet' ? '<div class="grab" aria-hidden="true"></div>' : ''}
        ${title != null ? `<header class="layer-h"><h2>${title}</h2><button type="button" class="icon-btn layer-x" aria-label="닫기">${ic('glyph/close')}</button></header>` : ''}
        <div class="layer-b">${body || ''}</div>
        ${footer ? `<footer class="layer-f">${footer}</footer>` : ''}
      </div>`;
    document.body.appendChild(wrap);
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => wrap.classList.add('open'));
    const api = {
      el: wrap,
      $: (s) => wrap.querySelector(s),
      $$: (s) => [...wrap.querySelectorAll(s)],
      close() {
        if (!wrap.isConnected) return;
        wrap.classList.remove('open');
        stack.splice(stack.indexOf(api), 1);
        if (!stack.length) document.body.classList.remove('no-scroll');
        setTimeout(() => wrap.remove(), 220);
        onClose && onClose();
      },
      setBody(html) { wrap.querySelector('.layer-b').innerHTML = html; },
      setFooter(html) { const f = wrap.querySelector('.layer-f'); if (f) f.innerHTML = html; },
    };
    stack.push(api);
    wrap.querySelector('.layer-dim').onclick = api.close;
    wrap.querySelector('.layer-x')?.addEventListener('click', api.close);
    wrap.querySelectorAll('[data-close]').forEach((b) => (b.onclick = api.close));
    bindControls(wrap);
    onMount && onMount(api);
    setTimeout(() => wrap.querySelector('[autofocus]')?.focus(), 60);
    return api;
  }
  window.openSheet = (o) => layer('sheet', o);
  window.openModal = (o) => layer('modal', o);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && stack.length) stack[stack.length - 1].close(); });

  window.confirmBox = function ({ title, desc, ok = '확인', cancel = '취소', danger, icon }) {
    return new Promise((resolve) => {
      let done = false;
      const m = openModal({
        size: 'sm',
        body: `<div class="confirm">${icon ? ic(icon, 'confirm-ic') : ''}<h2>${title}</h2>${desc ? `<p>${desc}</p>` : ''}</div>`,
        footer: `${cancel ? `<button class="btn btn-grey btn-lg" data-k="no">${cancel}</button>` : ''}<button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-lg" data-k="ok">${ok}</button>`,
        onClose: () => { if (!done) resolve(false); },
      });
      m.$$('[data-k]').forEach((b) => (b.onclick = () => { done = true; resolve(b.dataset.k === 'ok'); m.close(); }));
    });
  };

  /* 팝오버 (드롭다운) */
  let pop;
  window.closePopover = () => { if (pop) { pop.remove(); pop = null; } };
  window.popover = function (anchor, html, onMount, opts = {}) {
    const same = pop && pop._anchor === anchor;
    closePopover();
    if (same) return null;
    const el = document.createElement('div');
    el.className = 'popover';
    el.innerHTML = html;
    el._anchor = anchor;
    document.body.appendChild(el);
    const r = anchor.getBoundingClientRect();
    const w = Math.max(opts.width || 0, el.offsetWidth);
    let left = opts.align === 'right' ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, innerWidth - w - 8));
    let top = r.bottom + 6;
    if (top + el.offsetHeight > innerHeight - 8 && r.top - el.offsetHeight - 6 > 8) top = r.top - el.offsetHeight - 6;
    Object.assign(el.style, { left: left + scrollX + 'px', top: top + scrollY + 'px', minWidth: (opts.width || r.width) + 'px' });
    pop = el;
    bindControls(el);
    onMount && onMount(el);
    return el;
  };
  document.addEventListener('mousedown', (e) => { if (pop && !pop.contains(e.target) && !pop._anchor.contains(e.target)) closePopover(); });
  window.addEventListener('resize', closePopover);
  window.addEventListener('hashchange', () => { closePopover(); [...stack].forEach((s) => s.close()); });

  /* 세그먼트·스위치·칩 선택 같은 단순 컨트롤을 자동으로 연결 */
  function bindControls(root) {
    root.querySelectorAll('.segment:not([data-bound])').forEach((g) => {
      g.dataset.bound = '1';
      g.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b || !g.contains(b)) return;
        g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-selected', x === b));
        g.dispatchEvent(new CustomEvent('change', { detail: b.dataset.v ?? b.textContent.trim() }));
      });
    });
    root.querySelectorAll('.pick:not([data-bound])').forEach((g) => {
      g.dataset.bound = '1';
      const multi = g.classList.contains('multi');
      g.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b || !g.contains(b)) return;
        if (multi) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
        else g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
        g.dispatchEvent(new Event('change'));
      });
    });
  }
  window.bindControls = bindControls;
  window.segVal = (el) => { const b = el?.querySelector('[aria-selected="true"]'); return b ? (b.dataset.v ?? b.textContent.trim()) : null; };
  window.pickVals = (el) => [...(el?.querySelectorAll('[aria-pressed="true"]') || [])].map((b) => b.dataset.v ?? b.textContent.trim());

  /* 마크업 조각 */
  window.ui = {
    switch: (on, id) => `<label class="switch"><input type="checkbox" ${id ? `id="${id}"` : ''} ${on ? 'checked' : ''}><i></i></label>`,
    field: (label, inner, hint) => `<div class="field"><span class="field-label">${label}</span>${inner}${hint ? `<span class="field-hint">${hint}</span>` : ''}</div>`,
    seg: (items, sel = 0, cls = '') => `<div class="segment ${cls}">${items.map((x, i) => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<button type="button" data-v="${v}" aria-selected="${i === sel}">${l}</button>`; }).join('')}</div>`,
    select: (id, options, sel) => `<div class="select"><select id="${id}">${options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${v}" ${v === sel ? 'selected' : ''}>${l}</option>`; }).join('')}</select>${ic('glyph/chevron-down')}</div>`,
    stepper: (id, v, unit = '') => `<div class="stepper" data-id="${id}"><button type="button" data-d="-1" aria-label="빼기">${ic('glyph/minus')}</button><b class="tnum" id="${id}">${v}</b><span>${unit}</span><button type="button" data-d="1" aria-label="더하기">${ic('glyph/plus')}</button></div>`,
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.stepper button'); if (!b) return;
    const v = b.parentElement.querySelector('b');
    const min = +(b.parentElement.dataset.min ?? 0), max = +(b.parentElement.dataset.max ?? 99);
    v.textContent = Math.max(min, Math.min(max, +v.textContent + +b.dataset.d));
    b.parentElement.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* CSV 내려받기 (내보내기용) */
  window.downloadCSV = function (name, rows) {
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  /* 가짜 QR (시안용 무늬) */
  window.fakeQR = function (seed = 7, size = 25) {
    let s = seed, cells = '';
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const origins = [[0, 0], [size - 7, 0], [0, size - 7]];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const o = origins.find(([ox, oy]) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7);
      const on = o ? Math.max(Math.abs(x - o[0] - 3), Math.abs(y - o[1] - 3)) !== 2 : rnd() > 0.52;
      if (on) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    return `<svg viewBox="-2 -2 ${size + 4} ${size + 4}" class="qr" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${size + 4}" height="${size + 4}" fill="#fff"/><g fill="#191F28">${cells}</g></svg>`;
  };
})();
