/* 관리자 시안 — 스케줄 (근무표 · 칸 선택 · 빠른 채우기 · 근무 시간대) */
(function () {
  const { $, $$, S, MEMBERS, WORKPLACES, PAGES, ph, tabs, fchip, tsearch, filt, initial, tabOf, render } = A;

  /* ───────────── 근무 시간대 ───────────── */
  const COLORS = ['#4A90F7', '#2EC28B', '#FFB31F', '#F7716C', '#8F76F4', '#30AFE2', '#E2454B', '#0F9D6B', '#E08F00', '#6A4BE3', '#1A93C7', '#8B95A1'];
  const SHIFTS = [
    { id: 'base', n: '기본 일정', s: '10:00', e: '19:00', brk: 60, wp: null, c: '#4A90F7' },
    { id: 'flex', n: '시차 출근', s: '08:00', e: '17:00', brk: 60, wp: null, c: '#8F76F4' },
    { id: 'ss', n: '성수 기본', s: '10:00', e: '22:00', brk: 60, wp: '성수점', c: '#2EC28B' },
    { id: 'ss-o', n: '성수 오픈', s: '09:00', e: '15:00', brk: 30, wp: '성수점', c: '#30AFE2' },
    { id: 'gj', n: '고잔 기본', s: '11:00', e: '21:00', brk: 60, wp: '고잔점', c: '#E08F00' },
    { id: 'gw', n: '구월 마감', s: '15:00', e: '23:00', brk: 30, wp: '구월점', c: '#F7716C' },
    { id: 'bg', n: '배곧 기본', s: '10:00', e: '20:00', brk: 60, wp: '배곧점', c: '#0F9D6B' },
    { id: 'ny', n: '남영 야간', s: '14:00', e: '02:00', brk: 60, wp: '남영점', c: '#6A4BE3' },
  ];
  const WP_SHIFT = { 본사: 'base', '외식 본부': 'base', 성수점: 'ss', 고잔점: 'gj', 구월점: 'gw', 배곧점: 'bg', 남영점: 'ny' };
  const sh = (id) => SHIFTS.find((x) => x.id === id);
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const dur = (x) => { let d = toMin(x.e) - toMin(x.s); if (d <= 0) d += 1440; return d; };
  const work = (x) => dur(x) - x.brk;
  const night = (x) => toMin(x.e) <= toMin(x.s);
  const hm = (min) => { const h = Math.floor(min / 60), m = min % 60; return m ? `${h}시간 ${m}분` : `${h}시간`; };
  const hShort = (min) => (min % 60 ? (min / 60).toFixed(1) : min / 60) + 'h';
  const brkL = (b) => (b ? (b >= 60 ? `${b / 60}시간`.replace('.5시간', '시간 30분') : `${b}분`) : '없음');

  /* ───────────── 근무표 데이터 (주별) ───────────── */
  const SCHED = {};
  const BASE = new Date(2026, 9, 26); // 이번 주 월요일
  const TODAY = new Date(2026, 9, 27);
  const weekDays = (off) => Array.from({ length: 7 }, (_, i) => new Date(BASE.getFullYear(), BASE.getMonth(), BASE.getDate() + off * 7 + i));
  const md = (d) => `${d.getMonth() + 1}.${d.getDate()}`;
  const weekLabel = (off) => { const d = weekDays(off); return `${d[0].getMonth() + 1}월 ${d[0].getDate()}일 – ${d[6].getMonth() + 1}월 ${d[6].getDate()}일`; };
  function genRow(m, i, off) {
    return Array.from({ length: 7 }, (_, d) => {
      if (m.pol === '고정 근무제') { if (d >= 5) return { k: 'off', pol: 1 }; if (m.st === 'leave' && off === 0 && (d === 1 || d === 2)) return { k: 'leave', t: '연차' }; return { k: 's', id: 'base', pol: 1 }; }
      if (m.pol === '시차 출퇴근제') return d >= 5 ? { k: 'off', pol: 1 } : { k: 's', id: 'flex', pol: 1 };
      if (off !== 0 && off !== -1) return null;
      if ([0, 3].includes((i * 2 + d + off) % 7)) return { k: 'off' };
      return { k: 's', id: WP_SHIFT[m.wp] || 'base' };
    });
  }
  function week(off) {
    const w = (SCHED[off] = SCHED[off] || []);
    MEMBERS.forEach((m, i) => { if (!w[i]) w[i] = genRow(m, i, off); });
    return w;
  }
  const cellMin = (c) => (c && c.k === 's' && sh(c.id) ? work(sh(c.id)) : 0);
  const snap = (offs) => offs.map((o) => [o, JSON.stringify(week(o))]);
  const restore = (s) => s.forEach(([o, j]) => (SCHED[o] = JSON.parse(j)));
  const scheduled = (m) => m.pol === '스케줄 근무제';
  function done(msg, s) { toast(msg, { label: '되돌리기', run: () => { restore(s); render(); } }); render(); }

  /* ───────────── 칸 그리기 ───────────── */
  const VIEW = [['name', '시간대 이름'], ['time', '시간'], ['actual', '실제 출퇴근'], ['wp', '근무지'], ['hours', '근무시간'], ['memo', '메모']];
  const view = () => (S.ui.view = S.ui.view || ['name', 'time', 'wp']);
  const ACTUAL = { '박서준': ['09:52', '19:04'], '이도윤': ['08:41', '17:46'], '최지우': ['09:58', '19:02'] };
  function cellHTML(c, ctx = {}) {
    const v = view(), has = (k) => v.includes(k);
    if (!c) return '<div class="cell-empty">+</div>';
    const memo = c.memo ? (has('memo') ? `<span class="memo-l">${c.memo}</span>` : `<i class="memo-dot" title="${c.memo}"></i>`) : '';
    const chg = c.chg ? '<em class="chg">변경</em>' : '';
    if (c.k === 'off') return `<div class="shift off ${c.pol ? 'pol' : ''}">휴무${chg}${memo}</div>`;
    if (c.k === 'leave') return `<div class="shift leave ${c.wait ? 'wait' : ''}"><b>${c.t}</b><span>${c.wait ? '승인 대기' : '종일 휴가'}</span>${memo}</div>`;
    const x = sh(c.id); if (!x) return '<div class="cell-empty">+</div>';
    const lines = [];
    if (has('time')) lines.push(`<b class="tnum">${x.s}–${x.e}${night(x) ? '<sup>+1</sup>' : ''}</b>`);
    if (has('name')) lines.push(has('time') ? `<span>${x.n}</span>` : `<b>${x.n}</b>`);
    if (has('wp') && (c.place || ctx.wp)) lines.push(`<span class="pl">${ic('mono/map-pin')}${c.place || ctx.wp}</span>`);
    if (has('hours')) lines.push(`<span class="tnum">근무 ${hm(work(x))}</span>`);
    if (has('actual')) { const a = ctx.past && ACTUAL[ctx.n]; lines.push(`<span class="tnum act">${a ? `실제 ${a[0]}–${a[1]}` : '실제 —'}</span>`); }
    if (!lines.length) lines.push(`<b>${x.n}</b>`);
    return `<div class="shift ${c.pol ? 'pol' : ''} ${c.place && c.place !== ctx.wp ? 'away' : ''}" style="--c:${x.c}">${lines.join('')}${chg}${memo}</div>`;
  }
  const tip = (c) => { const x = c && c.k === 's' && sh(c.id); return x ? `${x.n} ${x.s}–${x.e} · ${hm(dur(x))} − 휴게 ${brkL(x.brk)} = 근무 ${hm(work(x))}${c.memo ? ' · 메모: ' + c.memo : ''}` : c?.memo || ''; };

  PAGES.schedules = function () {
    const tab = tabOf('schedules');
    const head = ph(tab ? '근무 시간대' : '스케줄', tab ? '자주 쓰는 근무 시간을 저장해 두고 근무표에서 골라 넣어요. 근무지 전용 시간대를 넣으면 그날 그 근무지 근무가 돼요.' : '칸을 누르거나 끌어서 고른 뒤 아래 막대에서 시간대·휴무·메모를 넣어요.',
      tab ? `<button class="btn btn-primary" data-act="shiftNew">${ic('glyph/plus')}근무 시간대 만들기</button>`
        : `<button class="btn btn-grey" data-act="export" data-k="schedules">${ic('mono/download')}<span class="hide-sm">내보내기</span></button><button class="btn btn-primary" data-act="quickFill">${ic('mono/zap')}빠른 채우기${ic('glyph/chevron-down')}</button>`) +
      tabs(['근무표', ['근무 시간대', SHIFTS.length]]);
    return head + (tab ? shiftList() : grid());
  };

  function grid() {
    const off = S.ui.week || 0;
    const monthly = S.ui.schedView === 'month';
    const toolbar = `<div class="toolbar">
      <div class="segment" id="schedView"><button data-v="week" aria-selected="${!monthly}">주간</button><button data-v="month" aria-selected="${monthly}">월간</button></div>
      <div class="datenav"><button class="icon-btn" data-act="wk" data-d="-1" aria-label="이전">${ic('glyph/chevron-left')}</button><b class="tnum">${monthly ? monthLabel(off) : weekLabel(off)}</b><button class="icon-btn" data-act="wk" data-d="1" aria-label="다음">${ic('glyph/chevron-right')}</button></div>
      ${off ? `<button class="btn btn-sm btn-weak" data-act="wk" data-d="0">${monthly ? '이번 달' : '이번 주'}</button>` : ''}
      <div class="spacer"></div>${fchip('근무지')}${fchip('그룹')}${tsearch('이름 찾기')}${monthly ? '' : `<button class="chip" data-act="viewOpt">${ic('mono/table')}보기 <span class="num tnum">${view().length}개 항목</span>${ic('glyph/chevron-down')}</button>`}</div>`;
    if (monthly) return toolbar + monthGrid(off);
    const days = weekDays(off);
    const w = week(off);
    const list = filt(MEMBERS);
    const sel = S.ui.sel || (S.ui.sel = new Set());
    const rows = list.map((m) => {
      const r = MEMBERS.indexOf(m);
      const total = w[r].reduce((a, c) => a + cellMin(c), 0);
      return `<tr><th class="mcol" scope="row"><div class="person"><span class="avatar">${initial(m.n)}</span><span class="person-t"><b>${m.n}</b><small>${m.g} · ${m.t}</small></span></div></th>
        <td class="hcol tnum"><b>${hShort(total)}</b><small>${{ '고정 근무제': '고정', '시차 출퇴근제': '시차', '스케줄 근무제': '스케줄' }[m.pol]}</small></td>
        ${days.map((d, c) => `<td class="cell ${+d === +TODAY ? 'today' : ''} ${sel.has(r + ':' + c) ? 'sel' : ''}" data-r="${r}" data-c="${c}" title="${tip(w[r][c])}">${cellHTML(w[r][c], { wp: m.wp, n: m.n, past: d < TODAY })}</td>`).join('')}</tr>`;
    }).join('');
    const foot = days.map((d, c) => {
      const people = list.filter((m) => w[MEMBERS.indexOf(m)][c]?.k === 's');
      const min = people.reduce((a, m) => a + cellMin(w[MEMBERS.indexOf(m)][c]), 0);
      return `<td class="${+d === +TODAY ? 'today' : ''}"><b class="tnum">${people.length}명</b><small class="tnum">${hShort(min)}</small></td>`;
    }).join('');
    const assigned = list.reduce((a, m) => a + w[MEMBERS.indexOf(m)].filter((c) => c?.k === 's').length, 0);
    const empties = list.filter(scheduled).reduce((a, m) => a + w[MEMBERS.indexOf(m)].filter((c) => !c).length, 0);
    return toolbar + `
      <div class="sched-meta"><span>${ic('glyph/check')}칸을 누르거나 끌어서 선택 · <kbd>Shift</kbd>+클릭은 범위 선택 · 두 번 누르면 바로 넣기</span>
        <span class="tnum">배정 ${assigned}건${empties ? ` · <b class="warn">빈 칸 ${empties}</b>` : ''}</span></div>
      <div class="table-card sched-card"><div class="sched-scroll" id="schedScroll"><table class="sched">
        <colgroup><col class="c-m"><col class="c-h">${days.map(() => '<col class="c-d">').join('')}</colgroup>
        <thead><tr><th class="mcol">구성원 <span class="tnum">${list.length}</span></th><th class="hcol">이번 주</th>
          ${days.map((d) => { const dow = d.getDay(); return `<th class="${+d === +TODAY ? 'today' : ''} ${dow === 0 ? 'sun' : dow === 6 ? 'sat' : ''}"><span>${'일월화수목금토'[dow]}</span><b class="tnum">${d.getDate()}</b>${+d === +TODAY ? '<em>오늘</em>' : ''}</th>`; }).join('')}</tr></thead>
        <tbody>${rows || `<tr><td colspan="9" class="empty-td">조건에 맞는 구성원이 없어요</td></tr>`}</tbody>
        <tfoot><tr><th class="mcol">근무 인원</th><td class="hcol"></td>${foot}</tr></tfoot>
      </table></div></div>
      <div class="legend-row">${[['', 'st', '배정한 근무'], ['pol', 'st', '근무 정책 일정'], ['', 'chg', '그날만 변경'], ['off', 'st', '휴무'], ['none', '', '배정 없음'], ['leave', 'st', '휴가'], ['leave wait', 'st', '휴가 대기']].map(([c, k, l]) => `<span class="lg-i"><i class="lg-s ${c} ${k}"></i>${l}</span>`).join('')}</div>
      <div class="selbar" id="selbar" hidden></div>`;
  }

  const monthLabel = (off) => { const d = weekDays(off)[3]; return `${d.getFullYear()}년 ${d.getMonth() + 1}월`; };
  function monthGrid(off) {
    const mid = weekDays(off)[3];
    const y = mid.getFullYear(), mo = mid.getMonth();
    const first = new Date(y, mo, 1), last = new Date(y, mo + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push('<div class="mc dim"></div>');
    const list = filt(MEMBERS);
    for (let d = 1; d <= last; d++) {
      const date = new Date(y, mo, d);
      const wo = Math.floor((date - BASE) / 864e5 / 7), di = (((date - BASE) / 864e5) % 7 + 7) % 7;
      const w = week(wo);
      const by = {};
      list.forEach((m) => { const c = w[MEMBERS.indexOf(m)][di]; if (c?.k === 's') by[c.id] = (by[c.id] || 0) + 1; });
      const n = Object.values(by).reduce((a, b) => a + b, 0);
      const empty = list.filter(scheduled).filter((m) => !w[MEMBERS.indexOf(m)][di]).length;
      const dow = date.getDay();
      cells.push(`<button class="mc ${+date === +TODAY ? 'today' : ''} ${dow === 0 ? 'sun' : dow === 6 ? 'sat' : ''}" data-act="toWeek" data-w="${wo}">
        <span class="mc-d tnum">${d}</span>${n ? `<b class="mc-n tnum">${n}명</b>` : ''}
        <span class="mc-dots">${Object.entries(by).slice(0, 4).map(([id, k]) => `<i style="--c:${sh(id).c}" title="${sh(id).n} ${k}명"></i>`).join('')}</span>
        ${empty ? `<small class="mc-warn">빈 칸 ${empty}</small>` : ''}</button>`);
    }
    return `<div class="table-card"><div class="t-scroll"><div class="month">${['월', '화', '수', '목', '금', '토', '일'].map((d) => `<div class="mh">${d}</div>`).join('')}${cells.join('')}</div></div></div>`;
  }
  A.acts.toWeek = (b) => { S.ui.week = +b.dataset.w; S.ui.schedView = 'week'; render(); };
  A.acts.wk = (b) => { const d = +b.dataset.d; const step = S.ui.schedView === 'month' ? 4 : 1; S.ui.week = d ? (S.ui.week || 0) + d * step : 0; S.ui.sel = new Set(); render(); };

  /* ───────────── 칸 선택 ───────────── */
  let drag = null;
  A.after.schedules = (p) => {
    $('#schedView', p)?.addEventListener('change', (e) => { S.ui.schedView = e.detail; render(); });
    $$('[data-sid]', p).forEach((b) => (b.onclick = () => shiftSheet(sh(b.dataset.sid))));
    const table = $('.sched', p); if (!table) return;
    const sel = S.ui.sel;
    const key = (td) => td.dataset.r + ':' + td.dataset.c;
    const paint = () => { $$('td.cell', table).forEach((td) => td.classList.toggle('sel', sel.has(key(td)))); bar(); };
    const rect = (a, b) => {
      const rs = [...new Set($$('td.cell', table).map((t) => +t.dataset.r))];
      const ri = [rs.indexOf(a[0]), rs.indexOf(b[0])].sort((x, y) => x - y), ci = [a[1], b[1]].sort((x, y) => x - y);
      const out = [];
      for (let i = ri[0]; i <= ri[1]; i++) for (let c = ci[0]; c <= ci[1]; c++) out.push(rs[i] + ':' + c);
      return out;
    };
    table.addEventListener('pointerdown', (e) => {
      const td = e.target.closest('td.cell'); if (!td || e.button) return;
      const at = [+td.dataset.r, +td.dataset.c];
      if (e.pointerType === 'touch' || e.pointerType === 'pen' || matchMedia('(pointer: coarse)').matches) { sel.has(key(td)) ? sel.delete(key(td)) : sel.add(key(td)); S.ui.anchor = at; paint(); return; }
      e.preventDefault();
      if (e.shiftKey && S.ui.anchor) { rect(S.ui.anchor, at).forEach((k) => sel.add(k)); paint(); return; }
      const keep = e.metaKey || e.ctrlKey;
      const was = sel.has(key(td)) && sel.size === 1;
      drag = { at, base: keep ? new Set(sel) : new Set(), moved: false, was };
      if (!keep) sel.clear();
      sel.add(key(td)); S.ui.anchor = at; paint();
    });
    table.addEventListener('pointerover', (e) => {
      if (!drag) return;
      const td = e.target.closest('td.cell'); if (!td) return;
      drag.moved = true;
      sel.clear(); drag.base.forEach((k) => sel.add(k)); rect(drag.at, [+td.dataset.r, +td.dataset.c]).forEach((k) => sel.add(k)); paint();
    });
    table.addEventListener('dblclick', (e) => {
      const td = e.target.closest('td.cell'); if (!td || matchMedia('(pointer: coarse)').matches) return;
      sel.clear(); sel.add(key(td)); paint(); shiftPick(td);
    });
    bar();
  };
  window.addEventListener('pointerup', () => {
    if (drag && !drag.moved && drag.was) { S.ui.sel.clear(); $$('td.cell.sel').forEach((t) => t.classList.remove('sel')); bar(); }
    drag = null;
  });

  function bar() {
    const el = $('#selbar'); if (!el) return;
    const n = S.ui.sel.size;
    if (el.hidden && n) el.dataset.t = Date.now(); // 막대가 나타난 그 탭이 버튼을 누르지 않도록
    el.hidden = !n;
    if (!n) return;
    const one = n === 1 && cellOf([...S.ui.sel][0]);
    el.innerHTML = `<div class="selbar-in">
      <span class="sel-n"><b class="tnum">${n}</b>칸 선택</span>
      ${n === 1 ? `<span class="sel-info">${MEMBERS[+[...S.ui.sel][0].split(':')[0]].n} · ${md(weekDays(S.ui.week || 0)[+[...S.ui.sel][0].split(':')[1]])}${one && one.k === 's' ? ` · ${sh(one.id)?.n}` : ''}</span>` : ''}
      <span class="sel-sep"></span>
      <button class="sb" data-sb="shift">${ic('mono/clock')}시간대 넣기${ic('glyph/chevron-up')}</button>
      <button class="sb" data-sb="off">${ic('mono/moon')}휴무</button>
      <button class="sb" data-sb="place">${ic('mono/map-pin')}근무 장소</button>
      <button class="sb" data-sb="memo">${ic('mono/edit')}메모</button>
      <button class="sb" data-sb="swap" ${n === 2 ? '' : 'disabled title="두 칸을 고르면 서로 바꿀 수 있어요"'}>${ic('glyph/swap')}바꾸기</button>
      <button class="sb" data-sb="reset">${ic('mono/undo')}원래대로</button>
      <button class="sb" data-sb="clear">${ic('mono/eraser')}비우기</button>
      <span class="sel-sep"></span>
      <button class="sb ghost" data-sb="none">선택 해제</button></div>`;
    $$('[data-sb]', el).forEach((b) => (b.onclick = () => { if (Date.now() - el.dataset.t > 350) SB[b.dataset.sb](b); }));
  }
  const cellOf = (k) => { const [r, c] = k.split(':').map(Number); return week(S.ui.week || 0)[r][c]; };
  function applySel(fn, msg) {
    const off = S.ui.week || 0, w = week(off), s = snap([off]);
    let n = 0, skipped = 0;
    S.ui.sel.forEach((k) => { const [r, c] = k.split(':').map(Number); if (w[r][c]?.k === 'leave') { skipped++; return; }
      const v = fn(w[r][c], r, c); if (v && !v.pol && !scheduled(MEMBERS[r]) && !v.keepPol) v.chg = 1; if (v) delete v.keepPol; w[r][c] = v; n++; });
    S.ui.sel = new Set();
    done(`${n}칸${msg}${skipped ? ` · 휴가 ${skipped}칸은 그대로 뒀어요` : ''}`, s);
  }
  function shiftPick(anchor) {
    const groups = [['공용', SHIFTS.filter((x) => !x.wp)], ...[...new Set(SHIFTS.filter((x) => x.wp).map((x) => x.wp))].map((wp) => [wp, SHIFTS.filter((x) => x.wp === wp)])];
    popover(anchor, groups.map(([g, xs]) => `<div class="p-sec">${g}</div>${xs.map((x) => `<button class="p-item" data-id="${x.id}"><i class="dot" style="background:${x.c}"></i><span>${x.n}<small class="tnum">${x.s}–${x.e}${night(x) ? ' 다음 날' : ''} · 근무 ${hm(work(x))}</small></span></button>`).join('')}`).join('') +
      `<hr><button class="p-item" data-new>${ic('glyph/plus')}새 시간대 만들고 넣기</button>`, (el) => {
      $$('[data-id]', el).forEach((b) => (b.onclick = () => { closePopover(); applySel(() => ({ k: 's', id: b.dataset.id }), `에 ${sh(b.dataset.id).n}을 넣었어요`); }));
      $('[data-new]', el).onclick = () => { closePopover(); shiftSheet(null, (x) => applySel(() => ({ k: 's', id: x.id }), `에 ${x.n}을 넣었어요`)); };
    }, { width: 260 });
  }
  const SB = {
    shift: (b) => shiftPick(b),
    off: () => applySel((c) => ({ k: 'off', memo: c?.memo }), '을 휴무로 바꿨어요'),
    clear: () => applySel(() => null, '을 비웠어요'),
    reset: () => applySel((c, r, col) => { const m = MEMBERS[r]; if (scheduled(m)) return null; const o = genRow(m, r, S.ui.week || 0)[col]; return o ? { ...o, keepPol: 1 } : null; }, '을 근무 정책 일정으로 되돌렸어요'),
    place: (b) => popover(b, `<div class="p-sec">이 날 근무할 곳</div>${WORKPLACES.map((w) => `<button class="p-item" data-p="${w.n}">${ic('mono/map-pin')}${w.n}</button>`).join('')}<hr><button class="p-item" data-p="외근">${ic('mono/briefcase')}외근 · 근무지 밖</button><button class="p-item" data-p="">${ic('mono/undo')}원래 근무지로</button>`, (el) => {
      $$('[data-p]', el).forEach((x) => (x.onclick = () => { closePopover(); const v = x.dataset.p; applySel((c) => (c && c.k === 's' ? { ...c, place: v || undefined, pol: undefined } : c), v ? `의 근무 장소를 ${v}(으)로 바꿨어요` : '을 원래 근무지로 되돌렸어요'); }));
    }, { width: 220 }),
    none: () => { S.ui.sel = new Set(); $$('td.cell.sel').forEach((t) => t.classList.remove('sel')); bar(); },
    swap: () => {
      const off = S.ui.week || 0, w = week(off), s = snap([off]);
      const [a, b] = [...S.ui.sel].map((k) => k.split(':').map(Number));
      [w[a[0]][a[1]], w[b[0]][b[1]]] = [w[b[0]][b[1]], w[a[0]][a[1]]];
      S.ui.sel = new Set();
      done('두 칸을 서로 바꿨어요', s);
    },
    memo: () => {
      const first = cellOf([...S.ui.sel][0]);
      const m = openModal({
        title: '메모', body: `${ui.field(`${S.ui.sel.size}칸에 남길 메모`, `<textarea class="input" id="memo" maxlength="60" placeholder="예: 재고 정리 · 오픈 30분 일찍" autofocus>${first?.memo || ''}</textarea>`, '직원 앱 스케줄에도 보여요')}`,
        footer: `<button class="btn btn-grey btn-lg" data-close>취소</button><button class="btn btn-primary btn-lg" id="ok">저장</button>`,
      });
      m.$('#ok').onclick = () => { const v = m.$('#memo').value.trim(); m.close(); applySel((c) => ({ ...(c || { k: 'off' }), memo: v || undefined }), v ? '에 메모를 남겼어요' : '의 메모를 지웠어요'); };
    },
  };

  /* ───────────── 빠른 채우기 ───────────── */
  A.acts.quickFill = (b) => popover(b, `
    <button class="p-item qf" data-q="auto">${ic('color/schedule-registered', 'c')}<span><b>자동 배정</b><small>필요 인원만큼 빈 칸을 골고루 채워요</small></span></button>
    <button class="p-item qf" data-q="copy">${ic('color/schedule-changed', 'c')}<span><b>지난주 그대로 복사</b><small>${weekLabel((S.ui.week || 0) - 1)}</small></span></button>
    <button class="p-item qf" data-q="repeat">${ic('color/nav-schedules', 'c')}<span><b>주 패턴 반복</b><small>이번 주를 다음 몇 주에 똑같이</small></span></button>
    <hr><button class="p-item qf danger" data-q="clear">${ic('mono/trash')}<span><b>이번 주 배정 모두 지우기</b><small>스케줄 근무제 구성원만</small></span></button>`, (el) => {
    $$('[data-q]', el).forEach((x) => (x.onclick = () => { closePopover(); QF[x.dataset.q](); }));
  }, { width: 300, align: 'right' });

  const QF = {
    auto() { autoAssign(); },
    copy() {
      const off = S.ui.week || 0, prev = week(off - 1), cur = week(off);
      const count = prev.reduce((a, row, r) => a + (scheduled(MEMBERS[r]) ? row.filter((c) => c?.k === 's').length : 0), 0);
      const m = openModal({
        title: '지난주 그대로 복사', size: 'lg',
        body: `<div class="copy-flow"><div><small>지난주</small><b>${weekLabel(off - 1)}</b><span class="tnum">배정 ${count}건</span></div>${ic('glyph/arrow-right')}<div class="on"><small>이번 주</small><b>${weekLabel(off)}</b><span class="tnum">빈 칸 ${cur.reduce((a, row, r) => a + (scheduled(MEMBERS[r]) ? row.filter((c) => !c).length : 0), 0)}</span></div></div>
          ${ui.field('이미 채운 칸은', ui.seg([['keep', '그대로 두기'], ['over', '지난주로 덮어쓰기']], 0, 'block'), '휴가 칸은 어느 쪽이든 그대로 둬요. 스케줄 근무제 구성원만 복사해요.')}`,
        footer: `<button class="btn btn-grey btn-lg fit" data-close>취소</button><button class="btn btn-primary btn-lg" id="ok" ${count ? '' : 'disabled'}>${count ? '복사하기' : '지난주 배정이 없어요'}</button>`,
      });
      m.$('#ok').onclick = () => {
        const over = segVal(m.$('.segment')) === 'over', s = snap([off]); let n = 0;
        cur.forEach((row, r) => { if (!scheduled(MEMBERS[r])) return; row.forEach((c, d) => { if (c?.k === 'leave') return; if (!c || over) { if (prev[r][d]?.k !== 'leave') { row[d] = prev[r][d] ? { ...prev[r][d] } : row[d]; n++; } } }); });
        m.close(); done(`지난주 근무표를 ${n}칸에 복사했어요`, s);
      };
    },
    repeat() {
      const off = S.ui.week || 0;
      const sheet = openSheet({
        title: '주 패턴 반복',
        body: `<p class="sheet-desc">${weekLabel(off)} 근무표를 다음 주부터 똑같이 반복해요.</p>
          <div class="mini-week">${weekDays(off).map((d, c) => { const n = week(off).filter((row, r) => scheduled(MEMBERS[r]) && row[c]?.k === 's').length; return `<div><span>${'일월화수목금토'[d.getDay()]}</span><b class="tnum">${n}</b><small>명</small></div>`; }).join('')}</div>
          ${ui.field('반복할 주', ui.stepper('rpN', 4, '주').replace('class="stepper"', 'class="stepper" data-min="1" data-max="12"'), '<span id="rpUntil"></span>')}
          ${ui.field('이미 채운 칸은', ui.seg([['keep', '그대로 두기'], ['over', '덮어쓰기']], 0, 'block'))}
          ${ui.field('공휴일', `<div class="set-row flat"><div><b>공휴일은 비워 두기</b><small>11월 3일 같은 공휴일엔 넣지 않아요</small></div>${ui.switch(true, 'rpHol')}</div>`)}`,
        footer: `<button class="btn btn-grey btn-lg fit" data-close>취소</button><button class="btn btn-primary btn-lg" id="ok">반복하기</button>`,
      });
      const upd = () => { const n = +sheet.$('#rpN').textContent; sheet.$('#rpUntil').textContent = `${weekLabel(off + 1).split(' – ')[0]}부터 ${weekLabel(off + n).split(' – ')[1]}까지 ${n}주`; };
      sheet.el.addEventListener('change', upd); upd();
      sheet.$('#ok').onclick = () => {
        const n = +sheet.$('#rpN').textContent, over = segVal(sheet.$('.segment')) === 'over';
        const offs = Array.from({ length: n }, (_, i) => off + 1 + i), s = snap(offs), src = week(off); let cnt = 0;
        offs.forEach((o) => week(o).forEach((row, r) => { if (!scheduled(MEMBERS[r])) return; row.forEach((c, d) => { if (c?.k === 'leave' || src[r][d]?.k === 'leave') return; if (!c || over) { row[d] = src[r][d] ? { ...src[r][d] } : null; cnt++; } }); }));
        sheet.close();
        toast(`${n}주에 ${cnt}칸을 채웠어요`, { label: '다음 주 보기', run: () => { S.ui.week = off + 1; render(); } });
        render();
        void s;
      };
    },
    async clear() {
      const off = S.ui.week || 0, w = week(off);
      const n = w.reduce((a, row, r) => a + (scheduled(MEMBERS[r]) ? row.filter((c) => c && c.k !== 'leave').length : 0), 0);
      if (!n) { toast('지울 배정이 없어요'); return; }
      if (!(await confirmBox({ title: `이번 주 배정 ${n}칸을 지울까요?`, desc: `${weekLabel(off)} · 스케줄 근무제 구성원만 지워요. 휴가는 그대로 둬요.`, ok: '모두 지우기', danger: true, icon: 'color/alert' }))) return;
      const s = snap([off]);
      w.forEach((row, r) => { if (scheduled(MEMBERS[r])) row.forEach((c, d) => { if (c && c.k !== 'leave') row[d] = null; }); });
      done(`${n}칸을 지웠어요`, s);
    },
  };

  /* ───────────── 자동 배정 (기간과 방식 · 요일별 필요 인원 · 공통 규칙 · 구성원 조건) ───────────── */
  const DOW = ['월', '화', '수', '목', '금', '토', '일'];
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = (v) => { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d); };
  const pos = (d) => { const n = Math.round((d - BASE) / 864e5); const wo = Math.floor(n / 7); return [wo, n - wo * 7, n]; };
  const shortDate = (v) => { const d = parse(v); return `${d.getMonth() + 1}.${d.getDate()} (${'일월화수목금토'[d.getDay()]})`; };
  function autoAssign() {
    const wps = [...new Set(MEMBERS.filter(scheduled).map((m) => m.wp))];
    const pickedWp = (S.f.schedules?.근무지 || []).find((w) => wps.includes(w));
    const st = (S.ui.auto = S.ui.auto || { wp: pickedWp || wps[0], mode: 'keep', need: {}, rules: { off: 2, max: 52, rest: 11, cons: 6 }, mem: {} });
    if (pickedWp) st.wp = pickedWp;
    const wk = weekDays(S.ui.week || 0);
    st.from = st.from || ymd(wk[0]); st.to = st.to || ymd(wk[6]);
    const m = openModal({ title: '자동 배정', size: 'xl', body: '<div id="af"></div>', footer: '<div id="aff" class="af-foot"></div>' });
    m.el.classList.add('layer-af');
    const shiftsOf = () => SHIFTS.filter((x) => x.wp === st.wp).concat(SHIFTS.filter((x) => !x.wp));
    const people = () => MEMBERS.map((x, r) => [x, r]).filter(([x]) => scheduled(x) && x.wp === st.wp);
    const memOf = (r) => (st.mem[r] = st.mem[r] || { on: true, off: null, pref: [], no: [], noShift: [] });
    const needOf = (x) => (st.need[x.id] = st.need[x.id] || DOW.map(() => (x.wp && x === SHIFTS.find((y) => y.wp === x.wp) ? 1 : 0)));
    const dates = () => { const out = []; const a = parse(st.from), b = parse(st.to); for (let d = new Date(a); d <= b && out.length < 31; d.setDate(d.getDate() + 1)) out.push(new Date(d)); return out; };
    const sec = (n, title, desc, badge, body) => `<section class="af-sec"><div class="af-h"><span class="af-n">${n}</span><h3>${title}</h3>${badge ? `<span class="af-badge tnum">${badge}</span>` : ''}</div>${desc ? `<p class="af-d">${desc}</p>` : ''}${body}</section>`;
    const tagList = (arr, empty = '없음') => (arr.length ? arr.join(' · ') : `<span class="muted">${empty}</span>`);

    function form() {
      const ds = dates(), xs = shiftsOf(), ppl = people();
      const seats = xs.reduce((a, x) => a + needOf(x).reduce((p, q) => p + +q, 0), 0);
      const on = ppl.filter(([, r]) => memOf(r).on).length;
      const days = Math.round((parse(st.to) - parse(st.from)) / 864e5) + 1;
      m.setBody(`<div id="af">
        ${sec(1, '기간과 방식', '', `${ds.length}일`, `<div class="af-g3">
          ${ui.field('근무지', ui.select('afWp', wps, st.wp), '고른 근무지의 스케줄 근무 구성원만 짜요')}
          <div class="field"><span class="field-label">기간 <span class="opt">최대 31일</span></span><div class="af-range"><input class="input sm" type="date" id="afFrom" value="${st.from}"><span>→</span><input class="input sm" type="date" id="afTo" value="${st.to}"></div>${days > 31 ? '<span class="field-hint err">31일까지만 짤 수 있어요. 앞 31일만 짜요</span>' : days < 1 ? '<span class="field-hint err">끝 날짜가 시작보다 빨라요</span>' : ''}</div>
          <div class="field"><span class="field-label">이미 넣은 배정</span>${ui.seg([['keep', '남기고 빈 칸만 채우기'], ['rebuild', '전부 다시 짜기']], st.mode === 'keep' ? 0 : 1, 'block').replace('class="segment ', 'id="afMode" class="segment ')}<span class="field-hint">근무·휴무를 넣어 둔 칸 · 다른 근무지·외근 배정은 늘 남겨요</span></div></div>`)}
        ${sec(2, '요일별 필요 인원', '근무 시간대마다 그 요일에 몇 명이 필요한지 넣으세요. 0이면 그 시간대는 배정하지 않아요. 넣은 인원은 근무지 필요 인원으로 저장되어 다음 자동 배정 때 그대로 불러와요.', `주 ${seats}자리`,
          `<div class="af-scroll"><table class="af-t need-t"><thead><tr><th>근무 시간대</th>${DOW.map((d, i) => `<th class="${i === 5 ? 'sat' : i === 6 ? 'sun' : ''}">${d}</th>`).join('')}<th class="r">주 합계</th></tr></thead><tbody>
            ${xs.map((x) => `<tr><td><span class="af-shift"><i class="dot" style="background:${x.c}"></i><b>${x.n}</b><small class="tnum">${x.s}–${x.e}${night(x) ? ' 다음 날' : ''}</small>${x.wp ? '' : '<em>공용</em>'}</span></td>
              ${needOf(x).map((v, i) => `<td><input class="num-in tnum" type="number" min="0" max="20" inputmode="numeric" data-need="${x.id}" data-i="${i}" value="${v}"></td>`).join('')}<td class="r tnum"><b>${needOf(x).reduce((a, b) => a + +b, 0)}</b></td></tr>`).join('')}
          </tbody></table></div>`)}
        ${sec(3, '공통 규칙', '모든 구성원에게 적용하는 기본 규칙이에요. 주 휴무일은 구성원마다 따로 정할 수 있어요.', '', `<div class="af-g4">
          ${[['off', '주 휴무일 기본값', '일', '구성원 조건에서 사람마다 바꿀 수 있어요'], ['max', '주 최대 근무시간', '시간', '법정 상한은 52시간(연장 포함)이에요. 비우면 제한하지 않아요'], ['rest', '퇴근~다음 출근 최소 휴식', '시간', '법정 기준은 11시간이에요. 비우면 제한하지 않아요'], ['cons', '최대 연속 근무', '일', '주 휴무 0일인 사람은 받지 않아요']]
            .map(([k, l, u, h]) => `<div class="rule"><b>${l}</b><label class="unit-in"><input class="tnum" type="number" min="0" data-rule="${k}" value="${st.rules[k] ?? ''}" placeholder="제한 없음"><span>${u}</span></label><small>${h}</small></div>`).join('')}</div>`)}
        ${sec(4, '구성원 조건', '희망 휴무 요일은 되도록 쉬게 하고, 안 되는 날은 반드시 휴무로, 안 되는 근무 시간대는 그 사람에게 넣지 않아요. 승인된 휴가·입사 전 날짜는 자동으로 빼요.', `${on} / ${ppl.length}명 포함`,
          ppl.length ? `<div class="af-scroll"><table class="af-t mem-t"><thead><tr><th class="cbc"><input type="checkbox" class="cb" id="afAll" ${on === ppl.length ? 'checked' : ''} aria-label="모두 포함"></th><th>구성원</th><th>주 휴무일</th><th><i class="lg b"></i>희망 휴무 요일</th><th><i class="lg o"></i>안 되는 날</th><th><i class="lg r"></i>안 되는 근무 시간대</th></tr></thead><tbody>
            ${ppl.map(([x, r]) => { const c = memOf(r); return `<tr class="${c.on ? '' : 'off'}"><td class="cbc"><input type="checkbox" class="cb" data-on="${r}" ${c.on ? 'checked' : ''} aria-label="${x.n} 포함"></td>
              <td><b class="strong">${x.n}</b> <span class="muted">${x.t}</span></td>
              <td><label class="unit-in sm"><input class="tnum" type="number" min="0" max="7" data-moff="${r}" value="${c.off ?? ''}" placeholder="${st.rules.off ?? 0}"><span>일</span></label></td>
              <td><button type="button" class="pickbtn" data-mp="pref" data-r="${r}">${tagList(c.pref)}${ic('glyph/chevron-down')}</button></td>
              <td><button type="button" class="pickbtn" data-mp="no" data-r="${r}">${tagList(c.no.map(shortDate))}${ic('glyph/chevron-down')}</button></td>
              <td><button type="button" class="pickbtn" data-mp="noShift" data-r="${r}">${tagList(c.noShift.map((id) => sh(id)?.n).filter(Boolean))}${ic('glyph/chevron-down')}</button></td></tr>`; }).join('')}
          </tbody></table></div>` : '<div class="none-line">이 근무지에 스케줄 근무제 구성원이 없어요</div>')}
      </div>`);
      bindControls(m.el);
      m.setFooter(`<span class="af-sum tnum">구성원 ${on}명 · ${ds.length}일</span><button class="btn btn-grey btn-lg fit" data-x>취소</button><button class="btn btn-primary btn-lg fit" id="afGo" ${on && ds.length && seats ? '' : 'disabled'}>초안 만들기</button>`);
      m.$('[data-x]').onclick = m.close;
      m.$('#afGo').onclick = preview;
      m.$('#afWp').onchange = (e) => { st.wp = e.target.value; form(); };
      m.$('#afFrom').onchange = (e) => { st.from = e.target.value; if (st.to < st.from) st.to = st.from; form(); };
      m.$('#afTo').onchange = (e) => { st.to = e.target.value; form(); };
      m.$('#afMode').addEventListener('change', (e) => { st.mode = e.detail; });
      $$('[data-need]', m.el).forEach((i) => (i.onchange = () => { st.need[i.dataset.need][+i.dataset.i] = Math.max(0, +i.value || 0); form(); }));
      $$('[data-rule]', m.el).forEach((i) => (i.onchange = () => { st.rules[i.dataset.rule] = i.value === '' ? null : Math.max(0, +i.value); form(); }));
      $$('[data-moff]', m.el).forEach((i) => (i.onchange = () => { memOf(+i.dataset.moff).off = i.value === '' ? null : Math.min(7, Math.max(0, +i.value)); }));
      $$('[data-on]', m.el).forEach((i) => (i.onchange = () => { memOf(+i.dataset.on).on = i.checked; form(); }));
      m.$('#afAll')?.addEventListener('change', (e) => { ppl.forEach(([, r]) => (memOf(r).on = e.target.checked)); form(); });
      $$('[data-mp]', m.el).forEach((b) => (b.onclick = () => memberPick(b)));
    }
    function memberPick(b) {
      const c = memOf(+b.dataset.r), k = b.dataset.mp;
      const opts = k === 'pref' ? DOW.map((d) => [d, d]) : k === 'no' ? dates().map((d) => [ymd(d), shortDate(ymd(d))]) : shiftsOf().map((x) => [x.id, `${x.n} · ${x.s}–${x.e}`]);
      const cur = new Set(c[k]);
      popover(b, `<div class="p-sec">${{ pref: '희망 휴무 요일 · 되도록 쉬게 해요', no: '안 되는 날 · 반드시 휴무', noShift: '안 되는 근무 시간대' }[k]}</div>
        <div class="${k === 'pref' ? 'pop-days' : 'pop-list'}">${opts.map(([v, l]) => `<button class="p-item" data-o="${v}" aria-checked="${cur.has(v)}">${l}</button>`).join('')}</div>
        <div class="p-foot"><button class="btn btn-grey btn-sm" data-r>없음</button><button class="btn btn-primary btn-sm" data-ok>적용</button></div>`, (el) => {
        $$('[data-o]', el).forEach((x) => (x.onclick = () => { cur.has(x.dataset.o) ? cur.delete(x.dataset.o) : cur.add(x.dataset.o); x.setAttribute('aria-checked', cur.has(x.dataset.o)); }));
        $('[data-r]', el).onclick = () => { c[k] = []; closePopover(); form(); };
        $('[data-ok]', el).onclick = () => { c[k] = opts.map(([v]) => v).filter((v) => cur.has(v)); closePopover(); form(); };
      }, { width: k === 'pref' ? 260 : 240 });
    }
    function plan() {
      const ds = dates(), xs = shiftsOf().filter((x) => needOf(x).some((v) => +v > 0)), ppl = people().filter(([, r]) => memOf(r).on).map(([, r]) => r);
      const R = st.rules, get = (r, wo, di) => week(wo)[r][di];
      const cell = {}; // `${r}:${n}` → 셀 (작업본)
      const key = (r, n) => r + ':' + n;
      ds.forEach((d) => { const [wo, di, n] = pos(d); ppl.forEach((r) => { let c = get(r, wo, di); if (st.mode === 'rebuild' && c && c.k !== 'leave' && !c.place) c = null; cell[key(r, n)] = c; }); });
      const weekCount = (r, wo) => { let k = 0, min = 0; for (let di = 0; di < 7; di++) { const n = wo * 7 + di; const c = key(r, n) in cell ? cell[key(r, n)] : get(r, wo, di); if (c?.k === 's') { k++; min += cellMin(c); } } return [k, min]; };
      const lastEnd = {}, streak = {};
      const out = [], short = [], skip = [];
      ds.forEach((d) => {
        const [wo, di, n] = pos(d), dow = (d.getDay() + 6) % 7, ds2 = ymd(d);
        ppl.forEach((r) => { const c = memOf(r); if (c.no.includes(ds2) && !cell[key(r, n)]) cell[key(r, n)] = { k: 'off', auto: 1 }; });
        xs.forEach((x) => {
          let need = +needOf(x)[dow] - ppl.filter((r) => cell[key(r, n)]?.k === 's' && cell[key(r, n)].id === x.id).length;
          if (need <= 0) return;
          const start = n * 1440 + toMin(x.s), end = start + dur(x);
          const cands = ppl.filter((r) => {
            const c = memOf(r), offDays = c.off ?? R.off ?? 0;
            if (cell[key(r, n)] || c.noShift.includes(x.id) || c.no.includes(ds2)) return false;
            if (offDays >= 7) return false;
            const [cnt, min] = weekCount(r, wo);
            if (cnt >= 7 - offDays) return false;
            if (R.max != null && min + work(x) > R.max * 60) return false;
            if (R.rest != null && lastEnd[r] != null && start - lastEnd[r] < R.rest * 60) return false;
            if (R.cons != null && (streak[r] || 0) >= R.cons) return false;
            return true;
          }).sort((a, b) => (memOf(a).pref.includes(DOW[dow]) - memOf(b).pref.includes(DOW[dow])) || (weekCount(a, wo)[0] - weekCount(b, wo)[0]));
          for (const r of cands) { if (need <= 0) break; cell[key(r, n)] = { k: 's', id: x.id, auto: 1 }; out.push([r, n, x.id]); lastEnd[r] = end; need--; }
          if (need > 0) short.push([ds2, x, need]);
        });
        ppl.forEach((r) => { const c = cell[key(r, n)]; if (c?.k === 's') { streak[r] = (streak[r] || 0) + 1; if (!c.auto) lastEnd[r] = n * 1440 + toMin(sh(c.id).s) + dur(sh(c.id)); } else streak[r] = 0;
          if (!c) cell[key(r, n)] = { k: 'off', auto: 1 }; });
      });
      ds.forEach((d) => { const [, , n] = pos(d); ppl.forEach((r) => { const c = cell[key(r, n)]; if (c?.k === 'off' && c.auto && memOf(r).pref.length && !memOf(r).pref.includes(DOW[(d.getDay() + 6) % 7])) skip.push([r, ymd(d)]); }); });
      return { ds, ppl, cell, key, out, short, xs };
    }
    function preview() {
      const P = plan();
      const offN = Object.values(P.cell).filter((c) => c?.k === 'off' && c.auto).length;
      const rows = P.ppl.map((r) => { let d = 0, min = 0, off = 0; P.ds.forEach((x) => { const c = P.cell[P.key(r, pos(x)[2])]; if (c?.k === 's') { d++; min += cellMin(c); } else if (c?.k === 'off') off++; }); return [MEMBERS[r], d, min, off]; });
      m.setBody(`<div class="af-result">
        <div class="af-stats"><div><span>새로 넣은 근무</span><b class="tnum">${P.out.length}칸</b></div><div><span>휴무로 채운 칸</span><b class="tnum">${offN}칸</b></div><div class="${P.short.length ? 'warn' : ''}"><span>못 채운 자리</span><b class="tnum">${P.short.reduce((a, s) => a + s[2], 0)}자리</b></div><div><span>기간</span><b class="tnum">${shortDate(st.from)} – ${shortDate(st.to)}</b></div></div>
        ${P.short.length ? `<div class="box warnbox">${ic('color/alert')}<div><b>규칙 때문에 채우지 못한 자리가 있어요</b><p>${P.short.slice(0, 6).map(([d, x, n]) => `${shortDate(d)} ${x.n} ${n}명`).join(' · ')}${P.short.length > 6 ? ` 외 ${P.short.length - 6}건` : ''}</p><small>필요 인원을 줄이거나, 공통 규칙(주 휴무일 · 최대 근무 · 휴식 · 연속 근무)을 느슨하게 하거나, 구성원을 더 포함해 보세요.</small></div></div>` : `<div class="box okbox">${ic('color/ap-approved')}<div><b>필요한 자리를 모두 채웠어요</b><p>규칙을 지키면서 배정했어요. 아래 내용을 확인하고 근무표에 넣으세요.</p></div></div>`}
        ${st.rules.max != null && rows.some(([, , min]) => min > st.rules.max * 60) ? `<div class="box warnbox">${ic('color/alert')}<div><b>주 최대 근무시간(${st.rules.max}시간)을 넘는 사람이 있어요</b><p>이미 넣어 둔 배정 때문이에요. ‘전부 다시 짜기’로 다시 짜면 규칙에 맞춰 줄여요.</p></div></div>` : ''}
        <table class="af-t"><thead><tr><th>구성원</th><th class="r">근무</th><th class="r">근무시간</th><th class="r">휴무</th><th>조건</th></tr></thead><tbody>
          ${rows.map(([x, d, min, off]) => { const c = memOf(MEMBERS.indexOf(x)); return `<tr><td><b class="strong">${x.n}</b> <span class="muted">${x.t}</span></td><td class="r tnum">${d}일</td><td class="r tnum ${st.rules.max != null && min > st.rules.max * 60 ? 'err' : ''}">${hm(min)}</td><td class="r tnum">${off}일</td><td class="muted">${[c.pref.length ? '희망 휴무 ' + c.pref.join('·') : '', c.no.length ? `안 되는 날 ${c.no.length}일` : '', c.noShift.length ? `시간대 제외 ${c.noShift.length}` : ''].filter(Boolean).join(' · ') || '—'}</td></tr>`; }).join('')}
        </tbody></table>
        <p class="muted-t">${st.mode === 'keep' ? '이미 넣은 근무·휴무는 그대로 두고 빈 칸만 채웠어요.' : '휴가·다른 근무지·외근 배정만 남기고 다시 짰어요.'} 넣은 뒤에도 되돌리기로 취소할 수 있어요.</p></div>`);
      m.setFooter(`<span class="af-sum tnum">초안 · 구성원 ${P.ppl.length}명 · ${P.ds.length}일</span><button class="btn btn-grey btn-lg fit" id="afBack">${ic('glyph/chevron-left')}조건 고치기</button><button class="btn btn-primary btn-lg fit" id="afApply">근무표에 넣기</button>`);
      m.$('#afBack').onclick = form;
      m.$('#afApply').onclick = () => {
        const wos = [...new Set(P.ds.map((d) => pos(d)[0]))], s = snap(wos);
        P.ds.forEach((d) => { const [wo, di, n] = pos(d); P.ppl.forEach((r) => { const c = P.cell[P.key(r, n)]; if (c) { const { auto, ...v } = c; week(wo)[r][di] = v.k ? v : null; } }); });
        S.ui.week = pos(P.ds[0])[0]; S.ui.schedView = 'week';
        m.close(); done(`자동 배정 초안을 넣었어요 · 근무 ${P.out.length}칸`, s);
      };
    }
    form();
  }

  /* ───────────── 근무 시간대 목록 ───────────── */
  function timeline(x) {
    const a = toMin(x.s) / 14.4, b = toMin(x.e) / 14.4;
    const segs = night(x) ? [[a, 100], [0, b]] : [[a, b]];
    return `<div class="tl"><div class="tl-track">${segs.map(([l, r]) => `<i style="left:${l}%;width:${r - l}%;background:${x.c}"></i>`).join('')}</div></div>`;
  }
  const used = (id) => Object.values(SCHED).flat().flat().filter((c) => c?.k === 's' && c.id === id).length;
  function shiftList() {
    const f = A.S.f.schedules?.근무지 || [];
    const groups = [[null, '공용 · 모든 근무지']].concat(WORKPLACES.map((w) => [w.n, w.n])).filter(([k]) => (!f.length || f.includes(k)) && SHIFTS.some((x) => x.wp === k));
    return `<div class="toolbar"><span class="muted-t">시간대 <b class="tnum">${SHIFTS.length}</b>개</span><div class="spacer"></div>${fchip('근무지')}</div>
      <div class="tl-axis-wrap"><div class="tl-axis">${[0, 6, 12, 18, 24].map((h) => `<span style="left:${h / 0.24}%">${h}시</span>`).join('')}</div></div>
      ${groups.map(([k, label]) => `<section class="shift-group"><h3>${ic(k ? 'mono/map-pin' : 'mono/buildings')}${label}<span class="tnum">${SHIFTS.filter((x) => x.wp === k).length}</span></h3>
        <div class="table-card">${SHIFTS.filter((x) => x.wp === k).map((x) => `<button class="shift-row" data-sid="${x.id}">
          <span class="sr-name"><i class="dot" style="background:${x.c}"></i><b>${x.n}</b></span>
          ${timeline(x)}
          <span class="sr-time"><b class="tnum">${x.s} – ${x.e}${night(x) ? '<em>다음 날</em>' : ''}</b><small class="tnum">근무 ${hm(work(x))} · 휴게 ${brkL(x.brk)}</small></span>
          <span class="sr-use tnum">${used(x.id) ? `${used(x.id)}칸` : '<span class="muted">안 씀</span>'}</span>${ic('glyph/chevron-right')}</button>`).join('')}</div></section>`).join('')}`;
  }
  A.acts.shiftNew = () => shiftSheet(null);

  /* 근무 시간대 만들기 · 수정 */
  const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
  function shiftSheet(x, onSaved) {
    const edit = !!x;
    const v = x ? { ...x } : { n: '', s: '09:00', e: '18:00', brk: 60, wp: null, c: COLORS[SHIFTS.length % COLORS.length] };
    const sheet = openSheet({
      title: edit ? '근무 시간대 수정' : '새 근무 시간대',
      body: `${ui.field('이름', `<input class="input sm" id="shN" maxlength="16" placeholder="예: 오픈, 마감, 미들" value="${v.n}" autofocus>`)}
        <div class="field"><span class="field-label">근무 시간</span>
          <div class="row-arrow">${ui.select('shS', TIMES, v.s)}${ic('glyph/arrow-right')}${ui.select('shE', TIMES, v.e)}</div>
          <div class="pick quick" id="shQ"><span class="muted-t">출근 +</span>${[8, 9, 10, 11, 12].map((h) => `<button type="button" data-v="${h}">${h}시간</button>`).join('')}</div>
          <div class="tl-preview"><div id="shTl"></div><div class="tl-axis sm">${[0, 6, 12, 18, 24].map((h) => `<span style="left:${h / 0.24}%">${h}시</span>`).join('')}</div><p id="shSum"></p></div></div>
        ${ui.field('휴게시간', ui.seg([[0, '없음'], [30, '30분'], [60, '1시간'], [90, '1시간 30분'], [120, '2시간']], [0, 30, 60, 90, 120].indexOf(v.brk), 'block').replace('class="segment ', 'id="shB" class="segment '))}
        ${ui.field('근무지', ui.select('shW', [['', '공용 (모든 근무지)'], ...WORKPLACES.map((w) => [w.n, w.n])], v.wp || ''), '근무지를 고르면 그 근무지 전용 시간대예요. 넣으면 그날 그 근무지 근무가 돼요.')}
        <div class="field"><span class="field-label">색</span><div class="swatches" id="shC">${COLORS.map((c) => `<button type="button" style="--c:${c}" aria-pressed="${c === v.c}" aria-label="색 ${c}"></button>`).join('')}</div></div>
        ${edit ? `<p class="muted-t">이 시간대는 근무표 ${used(x.id)}칸에 쓰이고 있어요. 고치면 그 칸에도 바로 반영돼요.</p>` : ''}`,
      footer: `${edit ? '<button class="btn btn-ghost btn-lg fit btn-text-danger" id="shDel">삭제</button>' : ''}<button class="btn btn-grey btn-lg fit" data-close>취소</button><button class="btn btn-primary btn-lg" id="shOk">저장</button>`,
    });
    const $s = sheet.$;
    const sync = () => {
      v.s = $s('#shS').value; v.e = $s('#shE').value; v.brk = +segVal($s('#shB'));
      const d = dur(v);
      $s('#shTl').innerHTML = timeline({ ...v, c: v.c });
      $s('#shSum').innerHTML = d - v.brk > 0 ? `${night(v) ? '<span class="badge badge-orange">다음 날 퇴근</span> ' : ''}총 ${hm(d)} − 휴게 ${brkL(v.brk)} = <b>실제 근무 ${hm(d - v.brk)}</b>` : '<span class="err">휴게시간이 근무시간보다 길어요</span>';
      $$('#shQ button', sheet.el).forEach((b) => b.setAttribute('aria-pressed', +b.dataset.v * 60 === d));
      $s('#shOk').disabled = !$s('#shN').value.trim() || d - v.brk <= 0;
    };
    $s('#shS').onchange = $s('#shE').onchange = sync;
    $s('#shN').oninput = sync;
    $s('#shB').addEventListener('change', sync);
    $$('#shQ button', sheet.el).forEach((b) => (b.onclick = () => { $s('#shE').value = TIMES[(TIMES.indexOf($s('#shS').value) + +b.dataset.v * 2) % 48]; sync(); }));
    $$('#shC button', sheet.el).forEach((b) => (b.onclick = () => { $$('#shC button', sheet.el).forEach((y) => y.setAttribute('aria-pressed', y === b)); v.c = b.style.getPropertyValue('--c'); sync(); }));
    $s('#shOk').onclick = () => {
      v.n = $s('#shN').value.trim(); v.wp = $s('#shW').value || null;
      if (edit) Object.assign(x, v); else { v.id = 's' + Date.now(); SHIFTS.push(v); }
      sheet.close();
      toast(edit ? `${v.n}을 고쳤어요` : `${v.n} 시간대를 만들었어요`);
      if (onSaved) onSaved(edit ? x : v); else render();
    };
    $s('#shDel')?.addEventListener('click', async () => {
      const n = used(x.id);
      if (!(await confirmBox({ title: `${x.n}을 지울까요?`, desc: n ? `근무표 ${n}칸에 쓰이고 있어요. 지우면 그 칸은 비어요.` : '아직 근무표에 쓰이지 않았어요.', ok: '삭제', danger: true }))) return;
      SHIFTS.splice(SHIFTS.indexOf(x), 1);
      Object.values(SCHED).forEach((w) => w.forEach((row) => row.forEach((c, d) => { if (c?.k === 's' && c.id === x.id) row[d] = null; })));
      sheet.close(); toast('시간대를 지웠어요'); render();
    });
    sync();
  }

  /* 보기 · 내보내기 */
  A.acts.viewOpt = (b) => {
    const cur = new Set(view());
    popover(b, `<div class="p-sec">칸에 보일 항목</div>${VIEW.map(([k, l]) => `<button class="p-item" data-v="${k}" aria-checked="${cur.has(k)}">${l}</button>`).join('')}
      <div class="p-foot"><button class="btn btn-grey btn-sm" data-r>기본값</button><button class="btn btn-primary btn-sm" data-ok>적용</button></div>`, (el) => {
      $$('[data-v]', el).forEach((x) => (x.onclick = () => { cur.has(x.dataset.v) ? cur.delete(x.dataset.v) : cur.add(x.dataset.v); x.setAttribute('aria-checked', cur.has(x.dataset.v)); }));
      $('[data-r]', el).onclick = () => { S.ui.view = null; closePopover(); render(); };
      $('[data-ok]', el).onclick = () => { S.ui.view = VIEW.map(([k]) => k).filter((k) => cur.has(k)); closePopover(); render(); };
    }, { width: 220, align: 'right' });
  };
  const cellText = (c) => (!c ? '' : c.k === 'off' ? '휴무' : c.k === 'leave' ? c.t : `${sh(c.id).n} ${sh(c.id).s}-${sh(c.id).e}${c.place ? ' @' + c.place : ''}`);
  A.schedExport = (b) => popover(b, `
    <button class="p-item qf" data-x="png">${ic('mono/image', 'c')}<span><b>이미지로 내보내기</b><small>보고 있는 주간 표를 그대로 PNG 이미지로 내보내요</small></span></button>
    <button class="p-item qf" data-x="xls">${ic('mono/excel', 'c')}<span><b>엑셀로 내보내기</b><small>주간 표와 배정 목록 시트를 엑셀 파일로 내보내요</small></span></button>`, (el) => {
    $$('[data-x]', el).forEach((x) => (x.onclick = () => { closePopover(); x.dataset.x === 'png' ? exportPNG() : exportXLS(); }));
  }, { width: 320, align: 'right' });
  function exportXLS() {
    const off = S.ui.week || 0, days = weekDays(off), w = week(off), list = filt(MEMBERS);
    const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const row = (cells) => `<Row>${cells.map((c) => `<Cell><Data ss:Type="${typeof c === 'number' ? 'Number' : 'String'}">${esc(c)}</Data></Cell>`).join('')}</Row>`;
    const head = ['구성원', '그룹', ...days.map((d) => `${md(d)} (${'일월화수목금토'[d.getDay()]})`), '주 근무시간'];
    const t1 = [head, ...list.map((m) => { const r = MEMBERS.indexOf(m); return [m.n, m.g, ...w[r].map(cellText), +(w[r].reduce((a, c) => a + cellMin(c), 0) / 60).toFixed(1)]; })];
    const t2 = [['날짜', '구성원', '그룹', '구분', '근무 시간대', '출근', '퇴근', '휴게(분)', '실제 근무(시간)', '근무 장소', '메모']];
    list.forEach((m) => { const r = MEMBERS.indexOf(m); w[r].forEach((c, i) => { if (!c) return; const x = c.k === 's' && sh(c.id); t2.push([ymd(days[i]), m.n, m.g, c.k === 's' ? '근무' : c.k === 'off' ? '휴무' : '휴가', x ? x.n : c.t || '', x ? x.s : '', x ? x.e : '', x ? x.brk : '', x ? +(work(x) / 60).toFixed(1) : '', c.place || (x ? m.wp : ''), c.memo || '']); }); });
    const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
      <Worksheet ss:Name="주간 표"><Table>${t1.map(row).join('')}</Table></Worksheet><Worksheet ss:Name="배정 목록"><Table>${t2.map(row).join('')}</Table></Worksheet></Workbook>`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + xml], { type: 'application/vnd.ms-excel' })); a.download = `워크칩_근무표_${ymd(days[0])}.xls`; a.click();
    toast(`엑셀 파일을 내려받았어요 · 시트 2개 (주간 표 · 배정 목록 ${t2.length - 1}건)`);
  }
  function exportPNG() {
    const off = S.ui.week || 0, days = weekDays(off), w = week(off), list = filt(MEMBERS);
    const cw = 150, nw = 170, rh = 56, hh = 64, W = nw + cw * 7 + 40, H = hh + 44 + rh * list.length + 40, k = 2;
    const cv = document.createElement('canvas'); cv.width = W * k; cv.height = H * k;
    const g = cv.getContext('2d'); g.scale(k, k);
    const F = (wt, sz) => `${wt} ${sz}px Pretendard, 'Apple SD Gothic Neo', sans-serif`;
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#191F28'; g.font = F(700, 20); g.fillText(`근무표 · ${weekLabel(off)}`, 20, 38);
    g.font = F(500, 12); g.fillStyle = '#8B95A1'; g.fillText('워크칩 · 사업자 대시보드에서 내보냄', 20, 56);
    const y0 = hh + 20;
    g.fillStyle = '#F9FAFB'; g.fillRect(20, y0 - 24, W - 40, 34);
    g.font = F(600, 13); g.fillStyle = '#4E5968'; g.fillText('구성원', 32, y0 - 2);
    days.forEach((d, i) => { g.fillStyle = d.getDay() === 0 ? '#E2454B' : d.getDay() === 6 ? '#0A65E8' : '#4E5968'; g.fillText(`${'일월화수목금토'[d.getDay()]} ${d.getDate()}`, 20 + nw + i * cw + 10, y0 - 2); });
    list.forEach((m, j) => {
      const r = MEMBERS.indexOf(m), y = y0 + 16 + j * rh;
      g.fillStyle = '#F2F4F6'; g.fillRect(20, y - 6, W - 40, 1);
      g.fillStyle = '#191F28'; g.font = F(700, 14); g.fillText(m.n, 32, y + 18); g.fillStyle = '#8B95A1'; g.font = F(500, 12); g.fillText(`${m.g} · ${m.t}`, 32, y + 36);
      w[r].forEach((c, i) => {
        const x = 20 + nw + i * cw + 4; if (!c) return;
        if (c.k === 's') { const z = sh(c.id); g.fillStyle = z.c + '22'; g.beginPath(); g.roundRect(x, y, cw - 8, rh - 12, 8); g.fill(); g.fillStyle = z.c; g.fillRect(x, y + 6, 3, rh - 24);
          g.fillStyle = '#191F28'; g.font = F(700, 13); g.fillText(`${z.s}–${z.e}`, x + 10, y + 18); g.fillStyle = '#6B7684'; g.font = F(500, 11); g.fillText(z.n.slice(0, 12), x + 10, y + 34); }
        else { g.fillStyle = c.k === 'leave' ? '#E08F00' : '#B0B8C1'; g.font = F(600, 13); g.fillText(c.k === 'leave' ? c.t : '휴무', x + 10, y + 26); }
      });
    });
    cv.toBlob((bl) => { const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = `워크칩_근무표_${ymd(days[0])}.png`; a.click(); toast('근무표 이미지를 내려받았어요'); });
  }

  /* 내보내기용 행 */
  A.schedRows = () => {
    const off = S.ui.week || 0, days = weekDays(off), w = week(off);
    return [['구성원', '그룹', ...days.map((d) => `${md(d)} (${'일월화수목금토'[d.getDay()]})`)]].concat(filt(MEMBERS).map((m) => [m.n, m.g, ...w[MEMBERS.indexOf(m)].map((c) => (!c ? '' : c.k === 'off' ? '휴무' : c.k === 'leave' ? c.t : `${sh(c.id).n} ${sh(c.id).s}-${sh(c.id).e}`))]));
  };
  A.weekLabel = weekLabel;
})();
