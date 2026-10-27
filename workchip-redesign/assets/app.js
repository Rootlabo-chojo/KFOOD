/* 직원 앱 시안 — 화면 렌더링 (데이터는 모두 예시) */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');
  document.body.classList.add('app-layers');
  const TABS = [['home', '홈', 'home'], ['schedule', '스케줄', 'calendar'], ['attendance', '근태', 'clock'], ['leave', '휴가', 'umbrella'], ['more', '전체', 'grid']];
  const S = {
    in: sessionStorage.getItem('wc-in'), out: sessionStorage.getItem('wc-out'),
    reqs: [], leaves: [{ t: '연차', a: '10.29 (목)', b: '10.30 (금)', d: 2, st: '승인' }], pendingDays: 0,
    team: false, calDay: 27, month: 10, attFilter: '전체',
    role: sessionStorage.getItem('wc-role') || 'staff',
    mgr: {
      leave: [{ n: '박서준', t: '연차', d: '11.3 (화)', days: 1, why: '병원 진료' }, { n: '최지우', t: '오후 반차', d: '11.5 (목)', days: 0.5, why: '가족 행사' }],
      req: [{ n: '이도윤', t: '퇴근 누락', d: '10.26 (월)', v: '퇴근 19:05', k: 'req-missing-out' }],
      dev: [{ n: '정민재', t: '새 기기', d: 'Galaxy S25', v: '휴대폰을 바꿨어요', k: 'dev-switch' }],
    },
  };
  // 시안 미리보기용: 주소 뒤 ?h=21 처럼 넣으면 그 시각으로 로그인 화면을 보여 줘요
  let HOV = new URLSearchParams(location.search).get('h');
  const clockNow = () => { const d = new Date(); if (HOV != null) d.setHours(+HOV); return d; };
  const loginMode = (h) => (h >= 6 && h < 20 ? 'work' : 'off');
  const roleBadge = () => `<button class="role-badge ${S.role}" data-a="role">${S.role === 'mgr' ? '매니저' : '직원'}${ic('glyph/chevron-down')}</button>`;
  const pad = (n) => String(n).padStart(2, '0');
  const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const ko = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일 ${'일월화수목금토'[d.getDay()]}요일`;

  const MTABS = [['home', '홈', 'home'], ['schedule', '스케줄', 'calendar'], ['attendance', '근태', 'clock'], ['approve', '승인', 'approval'], ['more', '전체', 'grid']];
  const tabbar = (cur) => `<footer class="tabbar"><nav>${(S.role === 'mgr' ? MTABS : TABS).map(([k, l, i]) => `<a href="#/${k}" ${k === cur ? 'aria-current="page"' : ''}>${ic('mono/' + i)}<span>${l}</span>${k === 'approve' && window.MGR?.count() ? `<i class="tb-n">${window.MGR.count()}</i>` : ''}</a>`).join('')}</nav></footer>`;
  const top = (title, right = '') => `<header class="bar-top"><h1>${title}</h1><div class="bar-r">${right}</div></header>`;
  const coTop = () => `<header class="bar-top"><div class="co-wrap"><button class="co pill" data-a="company"><img class="co-mark" src="../assets/brand/company-solv.png" alt="">SOLV${ic('glyph/chevron-down')}</button>${roleBadge()}</div>
    <a class="icon-btn bell" href="#/notifications" aria-label="알림">${ic('mono/bell')}</a></header>`;

  /* ───────────── 처음 화면 (첫 방문) — 캐릭터 ───────────── */
  function intro() {
    return `<div class="phone intro-bg"><div class="intro">
      <div class="intro-top">${logo(20)}</div>
      <div class="stage">
        <div class="fcard f1">${ic('color/gps')}<span><small>출근</small><b class="tnum">08:57</b></span></div>
        <div class="fcard f2">${ic('color/nav-schedules')}<span><small>내일 근무</small><b class="tnum">09:00 – 18:00</b></span></div>
        ${character('hero')}
        <div class="fcard f3">${ic('color/ap-approved')}<span><b>연차 승인됨</b></span></div>
        <div class="fcard f4 dark">${ic('color/noti-bell')}<span><b>퇴근 10분 전이에요</b></span></div>
      </div>
      <h1>출퇴근부터 휴가까지<br>워크칩 하나로</h1>
      <p>회사에서 초대받은 계정으로 시작하세요.</p>
      <div class="actions">
        <a class="btn btn-primary btn-lg btn-block" href="#/login">로그인</a>
        <button class="btn btn-white btn-lg btn-block" data-a="invite">초대 링크를 받았어요</button>
      </div>
    </div></div>`;
  }

  /* ───────────── 로그인 — 지금 시각이 흐르는 시계 ───────────── */
  /* 로그인 멘트 — 오전 6시~오후 8시는 출근 모드, 오후 8시~오전 6시는 퇴근 모드 */
  const LINES = {
    work: [[6, 9, ['출근 도장 찍었나요?', '좋은 아침! 오늘도 화이팅']], [9, 12, ['출근 도장 찍었나요? 아직이면 지금!', '오늘 근무표 확인해 봐요']], [12, 14, ['점심 맛있게 드세요', '휴게시간도 기록에 잘 남아요']], [14, 18, ['오후도 힘내요!', '휴가 신청도 앱에서 바로 돼요']], [18, 20, ['퇴근 도장도 잊지 마요', '오늘 하루 고생했어요']]],
    off: [[20, 24, ['오늘 하루 고생했어요. 퇴근 찍고 가요', '퇴근 한 번이면 오늘 기록 끝']], [0, 6, ['늦게까지 고생했어요. 푹 쉬어요', '내일 근무, 미리 확인해 둬요']]],
  };
  const lineFor = (h, k = 0) => { const l = LINES[loginMode(h)].find(([a, b]) => h >= a && h < b)[2]; return l[k % l.length]; };
  function login() {
    const saved = localStorage.getItem('wc-app-id');
    const mode = loginMode(clockNow().getHours()), pose = mode === 'work' ? 'working' : 'leave';
    return `<div class="phone fg login-v3 mode-${mode}">
      <header class="lg-top">${logo(20)}</header>
      <section class="lg-hero">
        <span class="lg-mode">${mode === 'work' ? `${ic('mono/log-in')}출근이 다가오는 것 같아요!` : `${ic('mono/moon')}퇴근이 다가오는 것 같아요!`}</span>
        <p class="lg-date" id="hDate"></p>
        <div class="hero-time" id="hTime" aria-live="off"></div>
        <div class="lg-stage"><span class="wc-bubble" id="hLine"></span>${charImg(pose, 'float lg-char')}<span class="hc-shadow float"></span></div>
      </section>
      <section class="lg-form">
        ${saved ? `<h2>다시 만나서 반가워요</h2><p class="ls-sub">비밀번호만 입력하면 돼요</p>` : `<h2>로그인</h2><p class="ls-sub">회사에서 초대받은 계정으로 로그인해요</p>`}
        <form id="f" novalidate>
          ${saved ? `<div class="acct"><span class="avatar">${saved[0].toUpperCase()}</span><span class="acct-t"><b>${saved}</b><small>지난번 로그인한 계정</small></span><button type="button" class="link" id="other">다른 계정</button></div><input type="hidden" id="id" value="${saved}">`
        : `<label class="ffield"><span>이메일 또는 휴대폰 번호</span><input id="id" autocomplete="username" inputmode="email" placeholder="name@company.com"></label>`}
          <label class="ffield"><span>비밀번호</span><input id="pw" type="password" autocomplete="current-password" placeholder="비밀번호 입력"><button type="button" class="icon-btn" id="eye" aria-label="비밀번호 보기">${ic('mono/eye-off')}</button></label>
          <p class="ferr" id="err" hidden></p>
          <button class="btn btn-primary btn-lg btn-block" id="go">로그인</button>
        </form>
        <button class="btn btn-ghost help-link" data-a="help">계정이 없거나 로그인이 안 되나요?</button>
        <button class="proto-mode" data-a="protoMode">${ic('mono/' + (mode === 'work' ? 'moon' : 'sun'))}시안 · ${mode === 'work' ? '밤(퇴근) 버전 보기' : '낮(출근) 버전 보기'}</button></section></div>`;
  }
  let tick;
  function bindLogin() {
    const id = $('#id'), pw = $('#pw');
    let last = '', k = 0;
    const roll = (el, v) => {
      if (el.dataset.v === v) return;
      const old = el.dataset.v;
      el.dataset.v = v;
      el.innerHTML = old != null ? `<span class="roll"><i class="out">${old}</i><i class="in">${v}</i></span>` : v;
    };
    const mode0 = loginMode(clockNow().getHours());
    const draw = () => {
      const d = clockNow(), h = d.getHours();
      if (loginMode(h) !== mode0) { clearInterval(tick); route(); return; }
      const m = d.getMinutes(), s = d.getSeconds();
      $('#hDate').textContent = ko(d);
      const ampm = h < 12 ? '오전' : '오후', h12 = h % 12 || 12;
      if (!$('#hTime').firstChild) $('#hTime').innerHTML = `<small id="ap"></small><span class="dg" id="dH"></span><span class="colon"><i></i><i></i></span><span class="dg" id="dM1"></span><span class="dg" id="dM2"></span>`;
      $('#ap').textContent = ampm;
      roll($('#dH'), String(h12)); roll($('#dM1'), String(Math.floor(m / 10))); roll($('#dM2'), String(m % 10));
      const line = lineFor(h, k);
      if (line !== last) { const el = $('#hLine'); el.classList.remove('show'); setTimeout(() => { el.textContent = line; el.classList.add('show'); }, last ? 250 : 0); last = line; }
      if (s % 8 === 0 && s) k = Math.floor(Date.now() / 8000);
    };
    clearInterval(tick); draw(); tick = setInterval(draw, 1000);
    $('#eye').onclick = () => { const v = pw.type === 'password'; pw.type = v ? 'text' : 'password'; $('#eye').innerHTML = ic(v ? 'mono/eye' : 'mono/eye-off'); };
    $('#other')?.addEventListener('click', () => { localStorage.removeItem('wc-app-id'); route(); });
    $('#f').onsubmit = (e) => {
      e.preventDefault();
      const err = $('#err');
      if (!id.value.trim()) { err.hidden = false; err.textContent = '이메일 또는 휴대폰 번호를 입력하세요.'; id.focus(); return; }
      if (!pw.value) { err.hidden = false; err.textContent = '비밀번호를 입력하세요.'; pw.focus(); return; }
      localStorage.setItem('wc-app-id', id.value.trim());
      sessionStorage.setItem('wc-app', '1'); location.hash = '#/home';
    };
    setTimeout(() => (id.type === 'hidden' ? pw : id).focus({ preventScroll: true }), 80);
  }

  const charImg = (k, cls = '') => `<img class="wc-char ${cls}" src="../assets/brand/char-${k}.${k === 'check' ? 'png' : 'webp'}" alt="">`;
  /* ───────────── 홈 (캐릭터) ───────────── */
  const PLAN = { s: '10:00', e: '19:00', label: '10:00~19:00 근무 · 8시간' };
  function home() {
    const d = new Date();
    const ph = S.out ? 'done' : S.in ? 'work' : 'before';
    const C = {
      before: { c: 'default', b: '오늘도 힘내요!', badge: ['출근 전', 'b-grey'], sub: PLAN.label, btn: `<button class="btn-main" data-a="punch">${ic('mono/log-in')}출근하기</button>` },
      work: { c: 'working', b: '출근 완료! 화이팅', badge: ['근무 중', 'b-blue'], sub: `${S.in} 출근 · ${PLAN.e} 퇴근 예정`, btn: `<button class="btn-main dark" data-a="punch">${ic('mono/log-out')}퇴근하기</button>` },
      done: { c: 'leave', b: '오늘도 수고했어요', badge: ['퇴근', 'b-grey'], sub: `${S.in} – ${S.out} · 오늘 기록 끝`, btn: `<button class="btn-main soft" data-a="noop" disabled>${ic('glyph/check')}오늘 기록을 마쳤어요</button>` },
    }[ph];
    return `<div class="phone fg">${coTop()}<div class="body fg-body">
      <section class="hero-card">
        <div class="hc-top"><span>${ko(d)}</span><span class="pbadge ${C.badge[1]}">${C.badge[0]}</span></div>
        <p class="hc-time tnum" id="homeClock">${pad(d.getHours())}:${pad(d.getMinutes())}</p>
        <p class="hc-sub">${C.sub}</p>
        <div class="hc-stage">
          <div class="hc-char">
            <span class="wc-bubble">${C.b}</span>
            <svg class="wc-star-a" width="18" height="18" viewBox="0 0 24 24"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" fill="#FFC53D"/></svg>
            <svg class="wc-star-b" width="10" height="10" viewBox="0 0 24 24"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" fill="#9CC2FF"/></svg>
            ${charImg(C.c, ph === 'work' ? 'float' : '')}
          </div>
          <span class="hc-shadow ${ph === 'work' ? 'float' : ''}"></span>
        </div>
        <button class="wp-pill" data-a="workplace">${ic('mono/map-pin')}본사 · QR 코드 + GPS · 반경 50m${ic('glyph/chevron-right')}</button>
        ${C.btn}
      </section>
      ${S.role === 'mgr' ? mgrHome() : ''}
      <a class="today-rec" href="#/attendance"><span>출근 <b class="tnum ${S.in ? 'on' : ''}">${S.in || '--:--'}</b></span><i></i><span>퇴근 <b class="tnum ${S.out ? 'on' : ''}">${S.out || '--:--'}</b></span><em>오늘 기록${ic('glyph/chevron-right')}</em></a>
    </div>${tabbar('home')}</div>`;
  }

  /* 매니저 — 팀 현황 · 처리할 일 */
  const TEAM = [['박서준', '근무 중', 'g', '09:52'], ['이도윤', '근무 중', 'g', '08:41'], ['최지우', '지각', 'o', '10:12'], ['정민재', '출근 전', 'n', '10:00 예정'], ['김하늘', '휴가', 'b', '연차']];
  function mgrHome() {
    const M = S.mgr, n = M.leave.length + M.req.length + M.dev.length;
    const c = (k) => TEAM.filter((t) => t[2] === k).length;
    return `<section class="fbox mgr">
        <div class="mg-h"><b>오늘 우리 팀</b><span>경영지원 · ${TEAM.length}명</span></div>
        <div class="mg-stat"><div><b class="tnum">${c('g') + c('o')}<small>/${TEAM.length - c('b')}</small></b><span>출근</span></div><div class="o"><b class="tnum">${c('o')}</b><span>지각</span></div><div><b class="tnum">${c('n')}</b><span>출근 전</span></div><div><b class="tnum">${c('b')}</b><span>휴가</span></div></div>
        <button class="mg-team" data-a="team">${TEAM.map(([nm, , k]) => `<span class="av ${k}">${nm.slice(-2)}</span>`).join('')}<em>자세히${ic('glyph/chevron-right')}</em></button>
      </section>
      <section class="fbox mgr">
        <div class="mg-h"><b>처리할 일</b><span class="${n ? 'on' : ''}">${n}건</span></div>
        ${[['leave', 'calendar-check', '휴가 신청'], ['req', 'time-edit', '출퇴근 기록 요청'], ['dev', 'device-check', '확인할 기기']].map(([k, i, l]) => `<button class="row" data-a="approve" data-k="${k}">${ic('color/' + i, 'lead')}<span class="txt"><b>${l}</b></span><span class="cnt tnum ${M[k].length ? 'on' : ''}">${M[k].length}</span>${ic('glyph/chevron-right')}</button>`).join('')}
      </section>`;
  }

  /* 출근 · 퇴근 — QR 인증 시트 */
  function punch() {
    const out = !!S.in;
    const sh = openSheet({
      title: null,
      body: `<div class="qr-sheet"><h2>QR 코드로 ${out ? '퇴근' : '출근'} 인증</h2><p>회사 QR 코드를 프레임 안에 비춰 주세요</p>
        <div class="qr-frame"><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><span class="qr-ghost">${ic('mono/qr-code')}</span><i class="scan"></i></div>
        <p class="qr-loc" id="loc">${ic('mono/map-pin')}<span>위치를 확인하고 있어요…</span></p>
        ${out ? `<p class="qr-work tnum" id="wt"></p>` : ''}</div>`,
      footer: `<div class="qr-btns"><button class="btn-sub" data-close>취소</button><button class="btn-cta" id="ok" disabled>${out ? '퇴근' : '출근'} 인증하기</button></div>`,
    });
    if (out) { const [h, m] = S.in.split(':').map(Number); const d = new Date(); let min = d.getHours() * 60 + d.getMinutes() - h * 60 - m; if (min < 0) min += 1440; sh.$('#wt').textContent = `${S.in} 출근 · 지금 퇴근하면 ${Math.floor(min / 60)}시간 ${min % 60}분 근무`; }
    setTimeout(() => { if (!sh.el.isConnected) return; sh.$('#loc').classList.add('ok'); sh.$('#loc span:not(.ic)').textContent = '본사 · 반경 50m 안에 있어요'; sh.$('#ok').disabled = false; }, 1100);
    sh.$('#ok').onclick = () => {
      const t = nowHM();
      if (out) { S.out = t; sessionStorage.setItem('wc-out', t); } else { S.in = t; sessionStorage.setItem('wc-in', t); }
      sh.close(); toast(out ? `${t} 퇴근을 기록했어요. 수고 많았어요` : `${t} 출근을 기록했어요`); route();
    };
  }

  /* ───────────── 스케줄 ───────────── */
  const HOL = { 3: '개천절', 5: '대체휴일', 9: '한글날' };
  const dayInfo = (m, d) => {
    const dt = new Date(2026, m - 1, d), dow = dt.getDay();
    if (m === 10 && HOL[d]) return { k: 'hol', t: HOL[d] };
    if (m === 10 && (d === 29 || d === 30)) return { k: 'leave', t: '연차', sub: '종일 휴가 · 승인됨' };
    if (dow % 6 === 0) return { k: 'off', t: '휴무', sub: '쉬는 날이에요' };
    if (m === 10 && d < 12) return null;
    return { k: 'work', s: '10:00', e: '19:00', sub: '기본 일정 · 8시간 근무', type: '본사 근무', wp: '본사', h: '8시간' };
  };
  function schedule() {
    const m = S.month, monthly = S.schView === 'month';
    const days = []; let cnt = 0;
    for (let d = 1; d <= new Date(2026, m, 0).getDate(); d++) if (dayInfo(m, d)?.k === 'work') cnt++;
    let body;
    if (S.team) body = team();
    else {
      const sel = new Date(2026, m - 1, S.calDay), info = dayInfo(m, S.calDay);
      const today = m === 10 && S.calDay === 27;
      let strip;
      if (!monthly) {
        const mon = new Date(sel); mon.setDate(sel.getDate() - ((sel.getDay() + 6) % 7));
        const wk = Array.from({ length: 7 }, (_, i) => { const x = new Date(mon); x.setDate(mon.getDate() + i); return x; });
        const range = `${wk[0].getDate()}일 – ${wk[6].getMonth() + 1 !== wk[0].getMonth() + 1 ? `${wk[6].getMonth() + 1}월 ` : ''}${wk[6].getDate()}일`;
        strip = `<div class="sc-h"><span><b>2026년 ${m}월</b><small>${range}</small></span><span class="sc-nav"><button class="rbtn" data-a="wkm" data-d="-7" aria-label="이전">${ic('glyph/chevron-left')}</button><button class="rbtn" data-a="wkm" data-d="7" aria-label="다음">${ic('glyph/chevron-right')}</button></span></div>
          <div class="wstrip">${wk.map((x, i) => { const inf = x.getMonth() + 1 === m ? dayInfo(m, x.getDate()) : dayInfo(x.getMonth() + 1, x.getDate()); const on = +x === +sel; return `<button class="${on ? 'on' : ''} ${i === 5 ? 'sat' : i === 6 ? 'sun' : ''}" data-sd="${ymd2(x)}"><span>${'월화수목금토일'[i]}</span><b class="tnum">${x.getDate()}</b><i class="${inf?.k === 'work' ? 'w' : inf?.k === 'leave' ? 'l' : ''}"></i></button>`; }).join('')}</div>`;
      } else {
        const lead = (new Date(2026, m - 1, 1).getDay() + 6) % 7, cells = [];
        for (let k = 0; k < lead; k++) cells.push('<span></span>');
        for (let d = 1; d <= new Date(2026, m, 0).getDate(); d++) { const inf = dayInfo(m, d), dow = (lead + d - 1) % 7; cells.push(`<button data-d="${d}" class="${dow === 6 || inf?.k === 'hol' ? 'sun' : dow === 5 ? 'sat' : ''} ${S.calDay === d ? 'sel' : ''} ${m === 10 && d === 27 ? 'today' : ''}"><b>${d}</b>${inf?.k === 'hol' ? `<em>${inf.t}</em>` : inf?.k === 'work' ? '<i class="w"></i>' : inf?.k === 'leave' ? '<i></i>' : ''}</button>`); }
        strip = `<div class="sc-h"><span><b>2026년 ${m}월</b></span><span class="sc-nav"><button class="rbtn" data-a="mon" data-d="-1" aria-label="이전 달">${ic('glyph/chevron-left')}</button><button class="rbtn" data-a="mon" data-d="1" aria-label="다음 달">${ic('glyph/chevron-right')}</button></span></div>
          <div class="cal mcal">${['월', '화', '수', '목', '금', '토', '일'].map((d, i) => `<span class="dow ${i === 5 ? 'sat' : i === 6 ? 'sun' : ''}">${d}</span>`).join('')}${cells.join('')}</div>`;
      }
      const detail = !info ? `<div class="sd-empty">배정된 근무가 없어요</div>`
        : info.k === 'work' ? `<p class="sd-time tnum">${info.s} – ${info.e}</p><p class="sd-sub">${info.sub}</p>
          <div class="sd-rows"><div><span>근무 유형</span><em class="type">${info.type}</em></div><div><span>근무지</span><b>${info.wp}</b></div><div><span>근무 시간</span><b>${info.h}</b></div></div>`
        : `<div class="sd-rest">${info.k === 'leave' ? charImg('leave', 'sm') : `<span class="sr-wrap">${charImg('default', 'sm')}<i class="mini-shadow"></i></span>`}<span><b>${info.t}</b><small>${info.sub || '공휴일이에요'}</small></span></div>`;
      body = `<div class="sc-top"><div class="mini-seg" id="sv"><button data-v="week" aria-pressed="${!monthly}">주간</button><button data-v="month" aria-pressed="${monthly}">월간</button></div><span class="sc-sum">${m}월 근무 예정 <b class="tnum">${cnt}일 · ${cnt * 8}시간</b></span></div>
        <section class="fbox">${strip}</section>
        <section class="fbox sd"><div class="sd-h"><span>${ko(sel)}</span>${today ? '<em class="pbadge b-blue">오늘</em>' : ''}</div>${detail}</section>`;
    }
    return `<div class="phone fg"><header class="bar-top fg-h"><h1>스케줄</h1><div class="pill-seg" id="seg"><button data-v="me" aria-pressed="${!S.team}">나</button><button data-v="team" aria-pressed="${S.team}">팀</button></div></header><div class="body fg-body">${body}</div>${tabbar('schedule')}</div>`;
  }
  const ymd2 = (x) => `${x.getMonth() + 1}-${x.getDate()}`;
  function team() {
    const T = [['박서준', 'CFO', '10:00 – 19:00', 'work'], ['이도윤', 'CTO', '08:00 – 17:00', 'work'], ['최지우', '그룹장', '10:00 – 19:00', 'work'], ['김하늘', 'CEO', '연차', 'leave']];
    return `<section class="card"><div class="card-h"><h2>오늘 같이 일해요</h2><span class="muted">경영지원 · ${T.filter((t) => t[3] === 'work').length}명</span></div>
      ${T.map(([n, t, v, k]) => `<div class="row"><span class="avatar">${n.slice(-2)}</span><span class="txt"><b>${n}</b><small>${t}</small></span><span class="badge ${k === 'leave' ? 'badge-orange' : 'badge-blue'} tnum">${v}</span></div>`).join('')}</section>
      <section class="card"><div class="card-h"><h2>이번 주 근무 인원</h2></div><div class="week-bars">${['월', '화', '수', '목', '금', '토', '일'].map((d, i) => { const n = [4, 3, 3, 4, 4, 0, 0][i]; return `<div><i style="height:${n * 18 + 4}px" class="${i === 1 ? 'on' : ''}"></i><b class="tnum">${n}</b><span>${d}</span></div>`; }).join('')}</div></section>`;
  }

  /* ───────────── 근태 ───────────── */
  const DAYS = [[27, '화', '출근 전', '10:00 ~ 19:00 예정', 'before', true], [26, '월', '정상', '09:51 ~ 19:02 · 8시간 11분', 'ok'], [25, '일', '휴무', '휴무일', 'off'], [24, '토', '휴무', '휴무일', 'off'], [23, '금', '정상', '09:54 ~ 19:03 · 8시간 9분', 'ok'], [22, '목', '정상', '09:48 ~ 19:10 · 8시간 22분', 'ok'], [21, '수', '지각', '10:07 ~ 19:02 · 7시간 55분', 'late'], [20, '화', '퇴근 누락', '09:51 ~ 퇴근 기록 없음', 'miss'], [19, '월', '정상', '09:50 ~ 19:01 · 8시간 11분', 'ok']];
  const BADGE = { leave: 'badge-blue', ok: 'badge-green', late: 'badge-orange', miss: 'badge-red', before: 'badge-grey' };
  const DOT = { ok: '#0F9D6B', late: '#E08F00', miss: '#E03131', before: '#7C8597', off: '#A3ACBB', leave: '#2F80ED' };
  function attendance() {
    const f = S.attFilter, need = DAYS.filter((d) => ['late', 'miss'].includes(d[4]));
    const list = f === '전체' ? DAYS : need;
    const worked = 121, plan = 168, pct = Math.round((worked / plan) * 100);
    return `<div class="phone fg"><header class="bar-top fg-h"><h1>근태</h1><div class="step-pill"><button data-a="mstep" data-d="-1" aria-label="이전 달">${ic('glyph/chevron-left')}</button><b class="tnum">${S.month}월</b><button data-a="mstep" data-d="1" aria-label="다음 달" ${S.month >= 10 ? 'disabled' : ''}>${ic('glyph/chevron-right')}</button></div></header><div class="body fg-body">
      <section class="sum-card"><div class="sc-row"><span>이번 달 근무</span><em>예정 ${plan}시간</em></div>
        <p class="big tnum">${worked}<small>시간</small><span>/ ${plan}시간</span></p>
        <div class="sum-bar"><i style="width:${pct}%"></i></div>
        <div class="sum-3"><div><span>근무일</span><b class="tnum">15<small>일</small></b></div><div><span>지각</span><b class="tnum">1<small>회</small></b></div><div><span>확인 필요<i class="odot"></i></span><b class="tnum">${need.length}<small>건</small></b></div></div></section>
      ${need.length ? `<button class="check-banner" data-a="fixFirst"><span class="cb-wrap">${charImg('check', 'cb-char')}<i class="mini-shadow"></i></span><span><b>확인이 필요한 기록이 ${need.length}일 있어요</b><small>10.20 (화) 퇴근 누락 외 ${need.length - 1}건</small></span>${ic('glyph/chevron-right')}</button>` : ''}
      <section class="fbox att">
        <div class="chips">${[['전체', ''], ['확인 필요', need.length], ['승인 대기', S.reqs.length]].map(([l, n]) => `<button data-af="${l}" aria-pressed="${f === l}">${l}${n !== '' ? ` <b class="tnum">${n}</b>` : ''}</button>`).join('')}</div>
        ${f === '승인 대기' ? (S.reqs.length ? S.reqs.map((r) => `<div class="arow"><span class="adate">${ic('color/' + r.k)}</span><span class="atxt"><b>${r.l}</b><small>${r.d} · ${r.t}</small></span><em class="tag-o">대기</em></div>`).join('') : '<div class="none">승인을 기다리는 요청이 없어요</div>')
        : list.map(([d, w, s, t, k, today]) => `<button class="arow ${k === 'off' ? 'off' : ''}" data-day="${d}"><span class="adate ${today ? 'today' : ''}"><b class="tnum">${d}</b><span class="${w === '일' ? 'sun' : w === '토' ? 'sat' : ''}">${w}</span></span>
          <span class="atxt"><b><i style="background:${DOT[k]}"></i>${s}</b><small class="tnum">${t}</small></span>${['late', 'miss'].includes(k) ? '<em class="tag-o">확인 필요</em>' : ''}</button>`).join('')}
      </section>
      <button class="fbox row fixrow" data-a="fix">${ic('color/time-edit', 'lead')}<span class="txt"><b>출퇴근 기록 수정 요청</b><small>빠뜨린 기록이 있나요?</small></span>${ic('glyph/chevron-right')}</button>
    </div>${tabbar('attendance')}</div>`;
  }
  function dayDetail(d) {
    const x = DAYS.find((y) => y[0] === d);
    const sh = openSheet({
      title: `10월 ${d}일 (${x[1]})`,
      body: `<div class="who-row"><span class="badge ${BADGE[x[4]] || 'badge-grey'}">${x[2]}</span><span class="muted">기본 일정 10:00 – 19:00</span></div>
        <ol class="tline">${x[4] === 'off' ? '<li><span>쉬는 날이에요</span></li>' : x[4] === 'before' ? `<li>${ic('color/ap-waiting')}<span><b>아직 출근 전이에요</b><small>10:00 출근 예정 · 홈에서 출근하기를 눌러요</small></span></li>` : x[4] === 'leave' ? `<li>${ic('color/nav-leave')}<span><b>연차</b><small>종일 휴가 · 승인됨</small></span></li>`
        : `<li>${ic('color/gps')}<span><b>출근 ${x[3].slice(0, 5)}</b><small>본사 · QR 코드 + GPS</small></span></li>${x[4] === 'miss' ? `<li>${ic('color/req-missing-out')}<span><b>퇴근 기록이 없어요</b><small>수정 요청을 보내 주세요</small></span></li>` : `<li>${ic('color/logout')}<span><b>퇴근 ${x[3].slice(8, 13)}</b><small>본사 · QR 코드 + GPS</small></span></li>`}`}</ol>`,
      footer: x[4] === 'off' || x[4] === 'leave' || x[4] === 'before' ? '<button class="btn btn-grey btn-lg" data-close>닫기</button>' : `<button class="btn btn-grey btn-lg" data-close>닫기</button><button class="btn btn-primary btn-lg" id="fx">수정 요청</button>`,
    });
    sh.$('#fx')?.addEventListener('click', () => { sh.close(); setTimeout(() => fixReq(d, x[4] === 'miss' ? 'req-missing-out' : null), 230); });
  }
  const REQ_T = [['req-missing-out', '퇴근 누락', '퇴근을 못 찍었어요'], ['req-absent', '결근으로 나와요', '실제로는 일했어요'], ['req-out-of-range', '반경 밖 출퇴근', '근무지 근처에서 찍었어요'], ['req-other-workplace', '다른 근무지', '다른 매장에서 일했어요'], ['req-new-device', '새 기기', '휴대폰을 바꿨어요'], ['req-other-member', '다른 사람 기기', '동료 휴대폰으로 찍었어요']];
  function fixReq(day = 20, kind) {
    const sh = openSheet({
      title: '기록 수정 요청',
      body: `<div class="field"><span class="field-label">어떤 기록인가요?</span><div class="pick list" id="rk">${REQ_T.map(([k, l, d]) => `<button type="button" data-v="${k}" aria-pressed="${k === (kind || 'req-missing-out')}">${ic('color/' + k)}<span><b>${l}</b><small>${d}</small></span></button>`).join('')}</div></div>
        <div class="row2">${ui.field('날짜', `<input class="input sm" type="date" id="rd" value="2026-10-${pad(day)}">`)}${ui.field('실제 시각', '<input class="input sm" type="time" id="rt" value="19:05">')}</div>
        ${ui.field('사유', '<textarea class="input" id="rw" placeholder="예: 퇴근 버튼을 못 눌렀어요"></textarea>', '그룹 리더 → 관리자 순서로 승인해요')}`,
      footer: '<button class="btn btn-primary btn-lg" id="ok">요청 보내기</button>',
    });
    sh.$('#ok').onclick = () => {
      const k = pickVals(sh.$('#rk'))[0], l = REQ_T.find((x) => x[0] === k)[1];
      S.reqs.unshift({ k, l, d: sh.$('#rd').value.slice(5).replace('-', '.'), t: sh.$('#rt').value });
      sh.close(); S.attFilter = '승인 대기'; toast('요청을 보냈어요. 승인되면 알려 드릴게요'); route();
    };
  }

  /* ───────────── 휴가 (캐릭터) ───────────── */
  function leave() {
    const grant = 17, used = 2;
    const pend = S.leaves.filter((l) => l.st === '대기'), pDays = pend.reduce((a, l) => a + l.d, 0);
    const left = grant - used - pDays;
    return `<div class="phone fg"><header class="bar-top fg-h"><h1>휴가</h1><div class="step-pill"><button data-a="ystep" data-d="-1" aria-label="이전 연도">${ic('glyph/chevron-left')}</button><b class="tnum">${S.year || 2026}</b><button data-a="ystep" data-d="1" aria-label="다음 연도">${ic('glyph/chevron-right')}</button></div></header><div class="body fg-body">
      <section class="hero-card leave-card"><div class="lc-top"><div><span>신청할 수 있는 연차</span><p class="lc-num tnum">${left}<small>일</small></p></div>${charImg('leave', 'lc-char')}</div>
        <div class="lc-bar"><i style="width:${((used + pDays) / grant) * 100}%"></i></div>
        <div class="lc-row"><span>부여 <b class="tnum">${grant}일</b></span><span>사용 <b class="tnum">${used}일</b></span><span>승인 대기 <b class="tnum">${pDays}일</b></span><span>잔여 <b class="tnum blue">${left}일</b></span></div>
        <button class="btn-main" data-a="leaveNew">${ic('glyph/plus')}휴가 신청</button></section>
      <h2 class="fg-sec">신청 내역</h2>
      ${S.leaves.length ? `<section class="fbox list">${S.leaves.map((l) => `<div class="row">${ic('color/' + (l.st === '대기' ? 'ap-pending' : 'ap-approved'), 'lead')}<span class="txt"><b>${l.t} · ${l.d}일</b><small>${l.a}${l.b !== l.a ? ` – ${l.b}` : ''}${l.st === '대기' ? ' · 그룹 리더 승인 대기' : ''}</small></span>${l.st === '대기' ? `<button class="btn btn-grey btn-sm" data-a="leaveCancel" data-i="${S.leaves.indexOf(l)}">취소</button>` : '<span class="badge badge-green">승인</span>'}</div>`).join('')}</section>`
        : `<div class="lv-empty">${ic('color/nav-leave')}<b>${S.year || 2026}년 신청한 휴가가 없어요</b><span>쉬고 싶은 날이 생기면 언제든 신청해 보세요</span></div>`}
    </div>${tabbar('leave')}</div>`;
  }
  function leaveNew() {
    let a = null, b = null;
    const sh = openSheet({
      title: '휴가 신청',
      body: `<div class="field"><span class="field-label">유형</span><div class="pick" id="lt">${['연차', '오전 반차', '오후 반차', '경조사', '병가'].map((t, i) => `<button type="button" aria-pressed="${!i}">${t}</button>`).join('')}</div></div>
        <div class="field"><span class="field-label" id="rangeL">날짜를 골라 주세요</span><div class="mini-cal" id="mc"></div></div>
        ${ui.field('사유 <span class="opt">선택</span>', '<textarea class="input" id="lr" placeholder="예: 가족 행사"></textarea>')}
        <div class="box"><div class="summary" id="ls"></div></div>`,
      footer: '<button class="btn btn-primary btn-lg" id="ok" disabled>신청하기</button>',
    });
    const half = () => pickVals(sh.$('#lt'))[0].includes('반차');
    const draw = () => {
      const lead = (new Date(2026, 10, 1).getDay() + 6) % 7, days = [];
      for (let i = 0; i < lead; i++) days.push('<span></span>');
      for (let d = 1; d <= 30; d++) {
        const dow = (lead + d - 1) % 7;
        const inR = a && (b ? d >= a && d <= b : d === a);
        days.push(`<button type="button" data-d="${d}" ${dow >= 5 ? 'class="we"' : ''} ${inR ? `aria-pressed="true" class="${d === a ? 'st' : ''} ${d === (b || a) ? 'en' : ''}"` : ''}>${d}</button>`);
      }
      sh.$('#mc').innerHTML = `<div class="mc-h">2026년 11월</div><div class="mc-g">${['월', '화', '수', '목', '금', '토', '일'].map((x) => `<em>${x}</em>`).join('')}${days.join('')}</div>`;
      $$('#mc [data-d]', sh.el).forEach((x) => (x.onclick = () => { const d = +x.dataset.d; if (!a || b || d < a || half()) { a = d; b = half() ? d : null; } else b = d; draw(); }));
      let n = 0; if (a) for (let d = a; d <= (b || a); d++) if ((lead + d - 1) % 7 < 5) n++;
      if (half() && a) n = 0.5;
      sh.$('#rangeL').textContent = a ? `11월 ${a}일${b && b !== a ? ` – 11월 ${b}일` : ''}` : '날짜를 골라 주세요';
      sh.$('#ls').innerHTML = `<div><span>쓰는 연차</span><b class="tnum">${n}일</b></div><div><span>신청 뒤 남는 연차</span><b class="tnum">${15 - n}일</b></div><div><span>승인</span><b>그룹 리더 → 관리자</b></div>`;
      sh.$('#ok').disabled = !n;
      sh.n = n;
    };
    sh.$('#lt').addEventListener('change', () => { if (half()) b = a; draw(); });
    draw();
    sh.$('#ok').onclick = () => {
      S.leaves.push({ t: pickVals(sh.$('#lt'))[0], a: `11.${pad(a)}`, b: `11.${pad(b || a)}`, d: sh.n, st: '대기' });
      sh.close(); toast('휴가를 신청했어요. 승인되면 알려 드릴게요'); route();
    };
  }

  /* ───────────── 전체 ───────────── */
  function more() {
    const r = (icon, label, val, a) => `<button class="row" data-a="${a}">${ic('color/' + icon, 'lead')}<span class="txt"><b>${label}</b></span>${val ? `<span class="val">${val}</span>` : ''}${ic('glyph/chevron-right')}</button>`;
    const blocked = !('Notification' in window) || Notification.permission !== 'granted';
    return `<div class="phone">${top('전체', `<button class="icon-btn" aria-label="메뉴 찾기" data-a="search">${ic('glyph/search')}</button>`)}<div class="body">
      <section class="card"><div class="profile"><span class="avatar">하늘</span><span style="flex:1;min-width:0"><b>김하늘 <em class="role-tag ${S.role}">${S.role === 'mgr' ? '매니저' : '직원'}</em></b><small>SOLV · 경영지원 · CEO</small></span><button class="btn btn-grey btn-sm" data-a="me">내 정보</button></div></section>
      ${blocked ? `<button class="notice" data-a="notiOn">${ic('color/alert')}<div><b>알림이 꺼져 있어요</b>눌러서 퇴근 10분 전·승인 알림을 켜세요.</div>${ic('glyph/chevron-right')}</button>` : ''}
      <section class="card list">
        ${r('noti-bell', '받은 알림', '', 'noti')}${r('gps', '내 근무지', '본사', 'workplace')}${r('device-check', '내 기기', 'iPhone 15', 'device')}${r('add-home', '홈 화면에 추가', '', 'addHome')}
      </section>
      ${S.role === 'mgr' ? `<p class="list-h">매니저 메뉴</p><section class="card list">${r('nav-members', '우리 팀 현황', '5명', 'team')}${r('calendar-check', '승인할 일', `${S.mgr.leave.length + S.mgr.req.length + S.mgr.dev.length}건`, 'approveAll')}${r('nav-schedules', '팀 근무표', '', 'teamSched')}</section>` : ''}
      <section class="card list">
        ${r('login-info', '로그인 정보', '', 'loginInfo')}${r('biz-dashboard', '사업자 대시보드', '', 'admin')}${r('logout', '로그아웃', '', 'logout')}
      </section>
      <section class="card list">${r('add-home', '앱 버전', '<span class="ver">2.4.0</span><em class="ver-ok">최신</em>', 'version')}</section>
      <button class="more center" data-a="privacy">개인정보처리방침</button>
    </div>${tabbar('more')}</div>`;
  }

  /* 알림 */
  function notifications() {
    return `<div class="phone white"><header class="bar-top"><a class="icon-btn back" href="#/home" aria-label="뒤로">${ic('glyph/chevron-left')}</a><h1 class="grow">알림</h1></header>
      ${S.reqs.length || S.leaves.some((l) => l.st === '대기') ? `<div class="body"><section class="card list">${S.reqs.map((r) => `<div class="row">${ic('color/' + r.k, 'lead')}<span class="txt"><b>${r.l} 요청을 보냈어요</b><small>${r.d} · 승인 대기</small></span></div>`).join('')}${S.leaves.filter((l) => l.st === '대기').map((l) => `<div class="row">${ic('color/ap-pending', 'lead')}<span class="txt"><b>${l.t} 신청을 보냈어요</b><small>${l.a} · 승인 대기</small></span></div>`).join('')}</section></div>`
        : `<div class="empty">${ic('color/noti-bell')}<b>새 알림이 없어요</b><span>스케줄이 바뀌거나 휴가·근태 신청이 처리되면<br>여기에 모여요.</span><a class="btn btn-grey" href="#/schedule">내 스케줄 보기</a></div>`}</div>`;
  }

  /* ───────────── 시트 모음 ───────────── */
  const info = (title, body, footer) => openSheet({ title, body, footer: footer || '<button class="btn btn-grey btn-lg" data-close>닫기</button>' });
  const ACT = {
    punch,
    help: () => info('로그인 안내', `<div class="help-li">${ic('color/add-link')}<div><b>계정이 없으면</b><p>회사 관리자에게 초대 링크를 요청하세요.</p></div></div><div class="help-li">${ic('color/login-info')}<div><b>비밀번호를 모르면</b><p>회사 관리자에게 비밀번호 초기화를 요청하세요.</p></div></div><div class="help-li">${ic('color/biz-dashboard')}<div><b>사장님이신가요?</b><p>사업자 대시보드에서 회사를 만들 수 있어요.</p></div></div>`, '<a class="btn btn-grey btn-lg" href="../admin/#/signup">회사 만들기</a><button class="btn btn-primary btn-lg" data-close>확인</button>'),
    invite: () => {
      const sh = info('초대 링크로 가입하세요', `<p class="sheet-p">회사에서 받은 문자나 카카오톡의 초대 링크를 누르면 가입 화면이 열려요. 링크를 받았다면 아래에 붙여 넣어도 돼요.</p>${ui.field('초대 링크 또는 코드', '<input class="input sm" id="code" placeholder="예: SOLV-8K2Q">')}<p class="muted sm">링크가 없으면 회사 관리자에게 요청하세요.</p>`, '<button class="btn btn-primary btn-lg" id="ok" disabled>확인</button>');
      sh.$('#code').oninput = (e) => (sh.$('#ok').disabled = !e.target.value.trim());
      sh.$('#ok').onclick = () => { sh.setBody(`<div class="done">${character('done-char')}<h3>SOLV에 초대됐어요</h3><p>이름과 비밀번호를 정하면 바로 시작해요.</p></div>${ui.field('이름', '<input class="input sm" value="">')}${ui.field('비밀번호', '<input class="input sm" type="password" placeholder="8자 이상">')}`); sh.setFooter('<button class="btn btn-primary btn-lg" id="join">가입하고 시작하기</button>'); sh.$('#join').onclick = () => { sh.close(); localStorage.setItem('wc-app-id', 'new@company.com'); sessionStorage.setItem('wc-app', '1'); location.hash = '#/home'; }; };
    },
    company: () => {
      const sh = info('회사 바꾸기', `<div class="pick list" id="co"><button type="button" aria-pressed="true"><img class="co-mark lg" src="../assets/brand/company-solv.png" alt=""><span><b>SOLV</b><small>소유자 · 본사</small></span></button><button type="button"><span class="co-mark lg alt">RL</span><span><b>루트라보 테스트</b><small>구성원 · 성수점</small></span></button></div>`, '<button class="btn btn-primary btn-lg" id="ok">바꾸기</button>');
      sh.$('#ok').onclick = () => { sh.close(); toast('회사를 바꿨어요 (시안은 같은 화면을 보여 줘요)'); };
    },
    workplace: () => info('내 근무지', `<div class="map-mini">${ic('color/gps', 'pin')}<i class="rad"></i></div><div class="summary"><div><span>근무지</span><b>본사</b></div><div><span>주소</span><b>서울 강남구 테헤란로 000</b></div><div><span>출퇴근 인증</span><b>QR 코드 + GPS · 반경 50m</b></div><div><span>오늘 근무</span><b>휴가 (연차)</b></div></div>`),
    qr: () => { const sh = info('QR 코드 찍기', `<div class="scan"><div class="scan-box"><i></i></div><p>매장에 붙은 워크칩 QR을 네모 안에 맞춰 주세요</p></div>`, '<button class="btn btn-grey btn-lg" data-close>취소</button>'); setTimeout(() => { if (sh.el.isConnected) { sh.close(); toast('QR을 확인했어요'); } }, 1800); },
    mon: (b) => { S.month = Math.min(12, Math.max(9, S.month + +b.dataset.d)); S.calDay = 1; route(); },
    wkm: (b) => { const d = new Date(2026, S.month - 1, S.calDay + +b.dataset.d); if (d.getMonth() + 1 < 9 || d.getMonth() + 1 > 12) return; S.month = d.getMonth() + 1; S.calDay = d.getDate(); route(); },
    mstep: (b) => { S.month = Math.min(10, Math.max(7, S.month + +b.dataset.d)); route(); },
    ystep: (b) => { S.year = Math.min(2026, Math.max(2025, (S.year || 2026) + +b.dataset.d)); toast(S.year === 2025 ? '2025년은 부여 15일 · 사용 15일이에요 (시안은 같은 화면)' : '2026년'); route(); },
    noop: () => {},
    protoMode: () => { HOV = loginMode(clockNow().getHours()) === 'work' ? 21 : 10; route(); },
    version: () => info('앱 버전', `<div class="done">${charImg('working', 'float sm')}<h3>최신 버전을 쓰고 있어요</h3><p>워크칩 2.4.0 · 2026.10.27 업데이트</p></div><div class="summary"><div><span>이번 업데이트</span><b>매니저 화면 · 출근/퇴근 로그인</b></div><div><span>지원 기기</span><b>iOS 15 · Android 9 이상</b></div></div>`),
    role: () => {
      const sh = info('어떤 화면으로 볼까요?', `<div class="pick list" id="rp">
        <button type="button" data-v="staff" aria-pressed="${S.role === 'staff'}">${ic('color/nav-members')}<span><b>직원 <em class="role-tag staff">직원</em></b><small>내 출퇴근 · 스케줄 · 휴가</small></span></button>
        <button type="button" data-v="mgr" aria-pressed="${S.role === 'mgr'}">${ic('color/nav-groups')}<span><b>매니저 <em class="role-tag mgr">매니저</em></b><small>내 근무 + 우리 팀 현황 · 휴가·기록 승인</small></span></button></div>
        <p class="muted sm">매니저는 회사에서 그룹 리더로 정한 사람만 고를 수 있어요.</p>`, '<button class="btn btn-primary btn-lg" id="ok">이 화면으로 보기</button>');
      sh.$('#ok').onclick = () => { S.role = pickVals(sh.$('#rp'))[0]; sessionStorage.setItem('wc-role', S.role); sh.close(); toast(S.role === 'mgr' ? '매니저 화면으로 바꿨어요' : '직원 화면으로 바꿨어요'); route(); };
    },
    team: () => { const sh = info('오늘 우리 팀', TEAM.map(([n, st, k, v]) => `<div class="row"><span class="avatar av ${k}">${n.slice(-2)}</span><span class="txt"><b>${n}</b><small class="tnum">${v}</small></span><span class="badge ${{ g: 'badge-green', o: 'badge-orange', n: 'badge-grey', b: 'badge-blue' }[k]}">${st}</span></div>`).join(''), '<button class="btn btn-grey btn-lg" data-close>닫기</button><button class="btn btn-primary btn-lg" id="nudge">출근 전 1명에게 알림</button>'); sh.$('#nudge').onclick = () => { sh.close(); toast('정민재님께 출근 알림을 보냈어요'); }; },
    approveAll: () => ACT.approve({ dataset: { k: 'leave' } }),
    teamSched: () => { S.team = true; location.hash = '#/schedule'; route(); },
    approve: (b) => {
      const k = b.dataset.k, L = S.mgr[k], T = { leave: '휴가 신청', req: '출퇴근 기록 요청', dev: '확인할 기기' }[k];
      const sh = info(T, '', '<button class="btn btn-grey btn-lg" data-close>닫기</button>');
      const draw = () => {
        sh.setBody(L.length ? L.map((x, i) => `<div class="ap-item"><div class="ap-t"><span class="avatar">${x.n.slice(-2)}</span><span><b>${x.n} · ${x.t}</b><small>${x.d}${x.days ? ` · ${x.days}일` : ''} · ${x.why || x.v}</small></span></div><div class="ap-b"><button class="btn btn-grey" data-i="${i}" data-ok="0">반려</button><button class="btn btn-primary" data-i="${i}" data-ok="1">승인</button></div></div>`).join('')
          : `<div class="empty">${ic('color/ap-approved')}<b>모두 처리했어요</b><span>새 요청이 오면 알림으로 알려 드릴게요</span></div>`);
        $$('[data-ok]', sh.el).forEach((x) => (x.onclick = () => { const it = L.splice(+x.dataset.i, 1)[0]; toast(`${it.n}님 ${it.t}을 ${x.dataset.ok === '1' ? '승인' : '반려'}했어요`); draw(); route(); }));
      };
      draw();
    },
    fixFirst: () => { S.attFilter = '확인 필요'; route(); },
    month: () => { const sh = info('월 고르기', `<div class="pick list" id="mp">${[10, 9, 8, 7].map((m) => `<button type="button" data-v="${m}" aria-pressed="${m === S.month}"><span><b>2026년 ${m}월</b><small>${m === 10 ? '이번 달' : `근무 ${20 - (10 - m)}일`}</small></span></button>`).join('')}</div>`, '<button class="btn btn-primary btn-lg" id="ok">보기</button>'); sh.$('#ok').onclick = () => { S.month = +pickVals(sh.$('#mp'))[0]; sh.close(); route(); }; },
    year: () => info('연도 고르기', `<div class="pick list">${[2026, 2025].map((y, i) => `<button type="button" aria-pressed="${!i}"><span><b>${y}년</b><small>${i ? '부여 15일 · 사용 15일' : '부여 17일 · 사용 2일'}</small></span></button>`).join('')}</div>`),
    fix: () => fixReq(),
    leaveNew,
    leaveCancel: async (b) => { if (await confirmBox({ title: '휴가 신청을 취소할까요?', ok: '신청 취소', danger: true })) { S.leaves.splice(+b.dataset.i, 1); route(); } },
    search: () => {
      const G = [['출퇴근 기록 수정 요청', '빠뜨렸거나 잘못 찍힌 출퇴근을 고쳐 달라고 요청해요.', 'time-edit', '수정 고치 잘못 빠뜨 누락 못 찍', 'fix'],
        ['휴가 신청', '연차·반차·경조사를 신청하고 남은 연차를 봐요.', 'nav-leave', '휴가 연차 반차 쉬 신청 남은', '#/leave'],
        ['내 스케줄', '이번 주·이번 달 근무 시간과 쉬는 날을 봐요.', 'nav-schedules', '스케줄 근무 언제 내일 다음 주 시간 출근 몇 시', '#/schedule'],
        ['팀 스케줄', '오늘 같이 일하는 사람을 봐요.', 'nav-groups', '팀 같이 동료 누구', 'team'],
        ['근태 기록', '이번 달 출퇴근·지각·확인 필요 기록을 봐요.', 'nav-attendance', '근태 기록 지각 결근 이번 달 근무시간', '#/attendance'],
        ['내 기기', '휴대폰을 바꿨거나 두고 왔을 때 기기를 바꿔요.', 'device-check', '기기 휴대폰 폰 바꿨 두고 배터리', 'device'],
        ['받은 알림', '승인 결과와 스케줄 변경 알림을 모아 봐요.', 'noti-bell', '알림 승인 결과', '#/notifications'],
        ['로그인 정보', '휴대폰 번호·이메일·비밀번호를 바꿔요.', 'login-info', '비밀번호 로그인 이메일 번호', 'loginInfo'],
        ['홈 화면에 추가', '앱처럼 바로 열 수 있게 홈 화면에 아이콘을 둬요.', 'add-home', '홈 화면 아이콘 앱 설치', 'addHome']];
      const EX = ['남은 연차 어디서 봐?', '어제 퇴근을 못 찍었어', '다음 주 근무 언제야?'];
      const sh = info(null, `<form class="ai-m" id="af"><span class="ai-ic">${ic('glyph/search')}</span><input id="q" placeholder="무엇을 하고 싶으세요?" autocomplete="off" autofocus><button class="ai-go" id="go" disabled>찾기</button></form><div id="ql"></div><p class="ai-foot">${ic('mono/sparkle')}메뉴 이동만 도와줘요 · 기록이나 설정은 바꾸지 않아요</p>`, ' ');
      sh.$('.layer-f').remove();
      const q = sh.$('#q'), L = sh.$('#ql');
      const exs = () => { L.innerHTML = `<p class="ai-sec">이렇게 물어보세요</p>${EX.map((e) => `<button type="button" class="ai-ex">${ic('glyph/search')}<span>${e}</span></button>`).join('')}`; $$('.ai-ex', L).forEach((b) => (b.onclick = () => { q.value = b.textContent.trim(); run(); })); };
      const go = (h) => { sh.close(); if (h === 'team') { S.team = true; location.hash = '#/schedule'; route(); } else if (h.startsWith('#')) location.hash = h; else setTimeout(() => ACT[h](), 230); };
      const run = () => {
        const v = q.value.trim(); if (!v) return exs();
        const ws = v.replace(/[?!.,]/g, ' ').split(/\s+/).filter(Boolean);
        const r = G.map((g) => [g, ws.reduce((a, w) => a + (g[3].split(' ').some((k) => w.includes(k) || k.includes(w)) ? 1 : 0), 0)]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]).slice(0, 3);
        L.innerHTML = '<div class="ai-think"><i></i><i></i><i></i><span>찾고 있어요</span></div>';
        setTimeout(() => {
          L.innerHTML = r.length ? r.map(([g]) => `<button class="ai-ans" data-h="${g[4]}">${ic('color/' + g[2], 'lead')}<span class="txt"><b>${g[0]}</b><small>${g[1]}</small></span><em class="ai-move">이동${ic('glyph/chevron-right')}</em></button>`).join('')
            : `<div class="ai-none"><b>딱 맞는 메뉴를 못 찾았어요</b><span>‘연차’, ‘퇴근’, ‘기기’처럼 넣어 다시 물어보세요.</span></div>`;
          $$('[data-h]', L).forEach((b) => (b.onclick = () => go(b.dataset.h)));
        }, 350);
      };
      q.oninput = () => { sh.$('#go').disabled = !q.value.trim(); if (!q.value.trim()) exs(); };
      sh.$('#af').onsubmit = (e) => { e.preventDefault(); run(); };
      exs();
    },
    me: () => { const sh = info('내 정보', `<div class="profile big"><span class="avatar">하늘</span><span><b>김하늘</b><small>SOLV · 경영지원 · CEO</small></span></div>${ui.field('휴대폰 번호', '<input class="input sm" value="010-0000-0000">')}${ui.field('이메일', '<input class="input sm" value="owner@company.com">')}<div class="summary"><div><span>입사일</span><b>2025.03.01</b></div><div><span>근무 정책</span><b>본사 근무 · 고정</b></div></div>`, '<button class="btn btn-primary btn-lg" id="ok">저장</button>'); sh.$('#ok').onclick = () => { sh.close(); toast('저장했어요'); }; },
    noti: () => (location.hash = '#/notifications'),
    notiOn: async () => { if ('Notification' in window) { const r = await Notification.requestPermission(); toast(r === 'granted' ? '알림을 켰어요' : '브라우저 설정에서 알림을 허용해 주세요'); route(); } },
    device: () => {
      const sh = info('내 기기', `<div class="dev">${ic('color/device-check')}<div><b>iPhone 15</b><small>2025.03.04 등록 · 이 기기로만 출퇴근해요</small></div></div>
        <p class="sec-t">기기를 바꿔야 하나요?</p><div class="pick list" id="why">
        <button type="button" data-v="dev-switch" aria-pressed="true">${ic('color/dev-switch')}<span><b>휴대폰을 바꿨어요</b><small>새 기기를 등록해요 · 관리자 확인</small></span></button>
        <button type="button" data-v="phone-forgot">${ic('color/phone-forgot')}<span><b>휴대폰을 두고 왔어요</b><small>오늘만 다른 기기로 찍어요</small></span></button>
        <button type="button" data-v="battery-empty">${ic('color/battery-empty')}<span><b>배터리가 없어요</b><small>오늘만 동료 기기로 찍어요</small></span></button></div>`, '<button class="btn btn-primary btn-lg" id="ok">요청 보내기</button>');
      sh.$('#ok').onclick = () => { sh.close(); toast('관리자에게 기기 변경을 요청했어요'); };
    },
    addHome: () => info('홈 화면에 추가', `<p class="sheet-p">앱처럼 바로 열 수 있어요.</p><ol class="steps-m"><li><b>1</b><span>Safari 아래 ${ic('mono/open-external')} 공유 버튼을 눌러요</span></li><li><b>2</b><span>‘홈 화면에 추가’를 골라요</span></li><li><b>3</b><span>오른쪽 위 ‘추가’를 누르면 끝이에요</span></li></ol><div class="home-prev"><img src="../assets/brand/app-icon-512.png" alt=""><span>워크칩</span></div>`),
    loginInfo: () => { const sh = info('로그인 정보', `${ui.field('로그인 ID', '<input class="input sm" value="owner@company.com" disabled>')}${ui.field('휴대폰 번호', '<input class="input sm" value="010-0000-0000">', '휴대폰 번호로도 로그인할 수 있어요')}<button class="btn btn-grey btn-block" id="pw">비밀번호 바꾸기</button>`, '<button class="btn btn-primary btn-lg" id="ok">저장</button>'); sh.$('#ok').onclick = () => { sh.close(); toast('저장했어요'); }; sh.$('#pw').onclick = () => { sh.setBody(`${ui.field('지금 비밀번호', '<input class="input sm" type="password">')}${ui.field('새 비밀번호', '<input class="input sm" type="password" placeholder="8자 이상">')}${ui.field('새 비밀번호 확인', '<input class="input sm" type="password">')}`); }; },
    admin: () => (location.href = '../admin/'),
    logout: async () => { if (await confirmBox({ title: '로그아웃할까요?', desc: '다음에 열면 비밀번호만 입력하면 돼요.', ok: '로그아웃' })) { sessionStorage.removeItem('wc-app'); location.hash = '#/login'; } },
    privacy: () => info('개인정보처리방침', `<div class="legal"><b>1. 모으는 정보</b><p>이름, 휴대폰 번호, 이메일, 출퇴근 시각과 위치(출퇴근 순간에만), 기기 정보</p><b>2. 쓰는 곳</b><p>근태 기록, 스케줄·휴가 관리, 알림</p><b>3. 보관 기간</b><p>퇴사 후 3년 (근로기준법 기록 보존 의무)</p><b>4. 문의</b><p>회사 관리자 또는 워크칩 고객센터</p></div>`),
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]');
    if (a && ACT[a.dataset.a]) { e.preventDefault(); ACT[a.dataset.a](a); return; }
    const d = e.target.closest('.cal [data-d]');
    if (d) { S.calDay = +d.dataset.d; route(); return; }
    const sd = e.target.closest('[data-sd]');
    if (sd) { const [mm, dd] = sd.dataset.sd.split('-').map(Number); S.month = mm; S.calDay = dd; route(); return; }
    const pb = e.target.closest('#seg button, #sv button');
    if (pb) { if (pb.closest('#seg')) S.team = pb.dataset.v === 'team'; else S.schView = pb.dataset.v; route(); return; }
    const afc = e.target.closest('[data-af]');
    if (afc) { S.attFilter = afc.dataset.af; route(); return; }
    const day = e.target.closest('[data-day]');
    if (day && !day.classList.contains('off')) dayDetail(+day.dataset.day);
  });

  /* ───────────── 라우팅 ───────────── */
  const PAGES = { home, schedule, attendance, leave, more, notifications };
  function route() {
    clearInterval(tick);
    const returning = localStorage.getItem('wc-app-id');
    const r = location.hash.replace('#/', '') || (returning ? 'login' : 'intro');
    const authed = sessionStorage.getItem('wc-app');
    if (r === 'intro' || r === 'login') {
      if (authed) { location.hash = '#/home'; return; }
      document.body.dataset.screen = r;
      setTimeout(() => window.dispatchEvent(new CustomEvent('routed', { detail: r })));
      if (r === 'login') { app.innerHTML = login(); document.title = '로그인 · 워크칩'; return bindLogin(); }
      app.innerHTML = intro(); document.title = '워크칩'; return;
    }
    if (!authed) { location.hash = '#/login'; return; }
    const MP = S.role === 'mgr' && window.MGR ? window.MGR.pages : {};
    if (!PAGES[r] && !MP[r]) { location.hash = '#/home'; return; }
    if (r === 'leave' && MP.approve) { location.hash = '#/approve'; return; }
    if (r === 'approve' && !MP.approve) { location.hash = '#/home'; return; }
    document.body.dataset.screen = r;
    app.innerHTML = (MP[r] || PAGES[r])();
    bindControls(app);
    document.title = `${([...TABS, ...MTABS].find((t) => t[0] === r) || [, '알림'])[1]} · 워크칩`;
    if (MP[r]) window.MGR.after?.[r]?.(app);
    window.dispatchEvent(new CustomEvent('routed', { detail: r }));
    window.scrollTo(0, 0);
    $('#seg')?.addEventListener('change', (e) => { S.team = e.detail === 'team'; route(); });
    $('#af')?.addEventListener('change', (e) => { S.attFilter = e.detail; route(); });
    if (r === 'home') tick = setInterval(() => { const c = $('#homeClock'); if (!c) return; const d = new Date(); c.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`; }, 5000);
  }
  window.APP = { S, $, $$, tabbar, coTop, charImg, punch, route, ko, pad, info, PLAN };
  window.addEventListener('hashchange', route);
  window.addEventListener('themechange', route);
  addEventListener('DOMContentLoaded', route);
})();
