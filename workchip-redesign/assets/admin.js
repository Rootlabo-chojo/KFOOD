/* 관리자 시안 — 데이터 · 상태 · 셸 · 로그인/회사 만들기 · 라우팅 (데이터는 모두 예시) */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');

  /* ───────────── 예시 데이터 ───────────── */
  const MEMBERS = [
    { n: '김하늘', g: '경영지원', t: 'CEO', role: '소유자', wp: '본사', pol: '고정 근무제', join: '2025.03.01', st: 'leave', emp: '정규직' },
    { n: '이도윤', g: '경영지원', t: 'CTO', role: '관리자', wp: '본사', pol: '시차 출퇴근제', join: '2025.03.01', st: 'before', plan: '08:00–11:00 출근', sub: '시차 · 8시간', emp: '정규직' },
    { n: '박서준', g: '경영지원', t: 'CFO', role: '매니저', wp: '본사', pol: '고정 근무제', join: '2022.05.30', st: 'work', plan: '10:00–19:00', in: '09:52', emp: '정규직' },
    { n: '최지우', g: '외식사업', t: '그룹장', role: '매니저', wp: '외식 본부', pol: '고정 근무제', join: '2022.12.01', st: 'before', plan: '10:00–19:00', emp: '정규직' },
    { n: '정민재', g: '외식사업', t: '부서장', role: '매니저', wp: '외식 본부', pol: '고정 근무제', join: '2022.12.01', st: 'before', plan: '10:00–19:00', emp: '정규직' },
    { n: '한유진', g: '성수점', t: '실장', role: '매니저', wp: '성수점', pol: '스케줄 근무제', join: '2024.09.30', st: 'before', plan: '10:00–22:00', emp: '정규직' },
    { n: '오세린', g: '성수점', t: '사원', role: '구성원', wp: '성수점', pol: '스케줄 근무제', join: '2025.01.06', st: 'off', emp: '파트타임' },
    { n: '윤태오', g: '고잔점', t: '지점장', role: '매니저', wp: '고잔점', pol: '스케줄 근무제', join: '2023.04.17', st: 'before', plan: '11:00–21:00', emp: '정규직' },
    { n: '서다은', g: '고잔점', t: '사원', role: '구성원', wp: '고잔점', pol: '스케줄 근무제', join: '2025.06.02', st: 'before', plan: '11:00–21:00', emp: '파트타임' },
    { n: '임재현', g: '구월점', t: '지점장', role: '매니저', wp: '구월점', pol: '스케줄 근무제', join: '2023.08.21', st: 'before', plan: '15:00–23:00', emp: '정규직' },
    { n: '강하린', g: '구월점', t: '사원', role: '구성원', wp: '구월점', pol: '스케줄 근무제', join: '2025.08.11', st: 'off', emp: '파트타임' },
    { n: '조은호', g: '배곧점', t: '지점장', role: '매니저', wp: '배곧점', pol: '스케줄 근무제', join: '2024.02.05', st: 'before', plan: '10:00–20:00', emp: '정규직' },
  ];
  MEMBERS.forEach((m, i) => (m.email = `member${String(i + 1).padStart(2, '0')}@company.com`));
  const WORKPLACES = [
    { n: '본사', a: '서울 강남구 테헤란로 000', cert: 'qr-gps', r: '50m' },
    { n: '외식 본부', a: '경기 안산시 단원구 광덕서로 000', cert: 'qr-gps', r: '100m' },
    { n: '성수점', a: '서울 성동구 왕십리로 000', cert: 'qr-gps', r: '100m' },
    { n: '분당점', a: '경기 성남시 분당구 황새울로 000', cert: 'gps', r: '100m' },
    { n: '고잔점', a: '경기 안산시 단원구 광덕대로 000', cert: 'qr-gps', r: '100m' },
    { n: '구월점', a: '인천 남동구 구월동 000', cert: 'qr', r: '100m' },
    { n: '배곧점', a: '경기 시흥시 서울대학로 000', cert: 'qr-gps', r: '100m' },
    { n: '남영점', a: '서울 용산구 남영동 000', cert: 'qr-gps', r: '100m' },
  ];
  const CERT = { gps: ['gps', 'GPS'], qr: ['qr', 'QR 코드'], 'qr-gps': ['auth-qr-gps', 'QR 코드 + GPS'], none: ['auth-none', '인증 없음'] };
  const GROUPS = [
    { n: '경영지원', p: null, leader: '김하늘', approve: true },
    { n: '외식사업', p: null, leader: '최지우', approve: true },
    { n: '성수점', p: '외식사업', leader: '한유진', approve: true },
    { n: '고잔점', p: '외식사업', leader: '윤태오', approve: false },
    { n: '구월점', p: '외식사업', leader: '임재현', approve: true },
    { n: '배곧점', p: '외식사업', leader: '조은호', approve: false },
  ];
  const POLICIES = [
    { n: '본사 근무', type: '고정 근무제', week: 40, days: '월~금', time: '10:00–19:00', brk: '1시간', m: 5, on: true },
    { n: '개발팀 시차 근무', type: '시차 출퇴근제', week: 40, days: '월~금', time: '08:00–11:00 출근', brk: '1시간', m: 2, on: true },
    { n: '매장 스케줄 근무', type: '스케줄 근무제', week: 44, days: '배정한 날', time: '근무표 기준', brk: '1시간', m: 54, on: true },
    { n: '2025 하계 단축 근무', type: '고정 근무제', week: 35, days: '월~금', time: '10:00–18:00', brk: '1시간', m: 0, on: false },
  ];
  const LEAVES = [
    { n: '김하늘', type: '연차', from: '10.27', to: '10.28', days: 2, reason: '개인 일정', st: 'approved' },
    { n: '오세린', type: '오후 반차', from: '10.20', to: '10.20', days: 0.5, reason: '병원', st: 'rejected' },
    { n: '서다은', type: '연차', from: '10.24', to: '10.24', days: 1, reason: '가족 행사', st: 'rejected' },
    { n: '강하린', type: '연차', from: '10.30', to: '10.31', days: 2, reason: '여행', st: 'cancelled' },
  ];
  const REQS = [
    { n: '이도윤', k: 'req-missing-out', l: '퇴근 누락', d: '10.24 (금)', v: '퇴근 19:05 로 기록 요청', why: '퇴근 버튼을 못 눌렀어요' },
    { n: '서다은', k: 'req-out-of-range', l: '반경 밖 출퇴근', d: '10.26 (월)', v: '출근 10:58 · 반경 밖 120m', why: '매장 앞 건물에서 찍었어요' },
  ];
  const INVITES = [
    { n: '문하준', c: '010-****-1234', via: '문자', at: '10.25', st: '대기' },
    { n: '배수아', c: 'sua@company.com', via: '초대 링크', at: '10.22', st: '대기' },
    { n: '신예린', c: '010-****-5678', via: '문자', at: '10.18', st: '만료' },
  ];
  const DEVICES = [
    { n: '박서준', d: 'iPhone 15', st: 'ok', at: '2025.03.04' },
    { n: '한유진', d: 'Galaxy S24', st: 'ok', at: '2024.10.02' },
    { n: '서다은', d: 'iPhone 13', st: 'pending', at: '10.26' },
    { n: '오세린', d: 'Galaxy A54', st: 'borrowed', at: '10.21' },
  ];
  const ROUTES = [
    ['home', '홈', 'nav-home', null],
    ['attendance', '출퇴근', 'nav-attendance', '근태'],
    ['schedules', '스케줄', 'nav-schedules', '근태'],
    ['leave', '휴가', 'nav-leave', '근태'],
    ['members', '구성원', 'nav-members', '조직'],
    ['groups', '그룹', 'nav-groups', '조직'],
    ['workplaces', '근무지', 'nav-workplaces', '근무 기준'],
    ['policies', '근무 정책', 'nav-work-policies', '근무 기준'],
    ['company', '회사 정보', 'nav-company', '설정'],
  ];

  /* ───────────── 상태 ───────────── */
  const S = { route: null, tab: {}, f: {}, q: {}, st: {}, ui: {} };
  const tabOf = (r) => S.tab[r] || 0;
  const flt = (r) => (S.f[r] = S.f[r] || {});

  /* ───────────── 조각 ───────────── */
  const initial = (n) => n.slice(-2);
  const roleBadge = (r) => ({ 소유자: 'badge-orange', 관리자: 'badge-blue' }[r] || 'badge-grey');
  const person = (m, sub) => `<div class="person"><span class="avatar">${initial(m.n)}</span><span class="person-t"><b>${m.n}</b><small>${sub ?? `${m.g} · ${m.t}`}</small></span></div>`;
  const ph = (title, desc, actions = '') => `
    <div class="ph"><div class="ph-t"><h1>${title}<button class="help" aria-label="도움말" data-act="help">${ic('mono/help')}</button></h1>${desc ? `<p>${desc}</p>` : ''}</div>
    <div class="ph-actions">${actions}</div></div>`;
  const tabs = (items) => `<div class="tabs" role="tablist" data-tabs>${items.map((t, i) => {
    const [label, count] = Array.isArray(t) ? t : [t];
    return `<button role="tab" data-i="${i}" aria-selected="${i === tabOf(S.route)}">${label}${count != null ? `<span class="count">${count}</span>` : ''}</button>`;
  }).join('')}</div>`;
  const FIELD = { 근무지: 'wp', 그룹: 'g', 직무: 't', 역할: 'role', '고용 형태': 'emp' };
  const fchip = (label, icon) => {
    const n = flt(S.route)[label]?.length;
    return `<button class="chip ${n ? 'on' : ''}" data-f="${label}">${icon ? ic(icon) : ''}${label}${n ? `<span class="num tnum">${n}</span>` : ''}${ic('glyph/chevron-down')}</button>`;
  };
  const tsearch = (p) => `<label class="tsearch">${ic('glyph/search')}<input data-q placeholder="${p}" value="${S.q[S.route] || ''}"></label>`;
  const filt = (list) => {
    const f = flt(S.route), q = (S.q[S.route] || '').trim();
    return list.filter((m) => Object.entries(f).every(([k, vs]) => !vs.length || vs.includes(m[FIELD[k]] ?? m[k])) &&
      (!q || [m.n, m.email, m.t, m.g].some((x) => x && x.includes(q))));
  };
  const empty = (icon, t, d, act = '') => `<div class="empty">${ic('color/' + icon)}<b>${t}</b><span>${d}</span>${act}</div>`;
  const tfoot = (shown, total, unit = '명') => `<div class="t-foot"><span>${shown === total ? `${total}${unit}` : `${total}${unit} 중 ${shown}${unit}`}</span></div>`;

  /* ───────────── 로그인 · 회사 만들기 · 비밀번호 찾기 ───────────── */
  const L = {
    ko: { h: '사업자 대시보드에<br>로그인해 주세요', sub: '출퇴근·스케줄·휴가를 한 화면에서 관리해요.', email: '이메일', phone: '휴대폰 번호', pw: '비밀번호', pwph: '비밀번호 입력', rememberE: '이메일 기억하기', rememberP: '휴대폰 번호 기억하기', forgot: '비밀번호 찾기', go: '로그인', none: '아직 회사가 없나요?', make: '회사 만들기', app: '직원 앱으로 가기' },
    en: { h: 'Log in to your<br>business dashboard', sub: 'Manage attendance, schedules and leave in one place.', email: 'Email', phone: 'Phone', pw: 'Password', pwph: 'Enter password', rememberE: 'Remember email', rememberP: 'Remember phone', forgot: 'Forgot password', go: 'Log in', none: 'No company yet?', make: 'Create a company', app: 'Go to employee app' },
  };
  const lang = () => (localStorage.getItem('wc-lang') === 'en' ? 'en' : 'ko');
  const authShell = (inner) => `
    <div class="login">
      <header class="login-top">${logo(20)}<a class="btn btn-ghost btn-sm" href="../app/">${L[lang()].app}</a></header>
      <main class="login-main"><div class="login-box">${inner}</div></main>
      <footer class="login-foot"><span>© Rootlabo</span>
        <div class="lang"><button data-lang="ko" aria-pressed="${lang() === 'ko'}">한국어</button><button data-lang="en" aria-pressed="${lang() === 'en'}">English</button></div></footer>
    </div>`;
  const bindAuth = () => $$('[data-lang]').forEach((b) => (b.onclick = () => { localStorage.setItem('wc-lang', b.dataset.lang); route(); }));
  const eye = (input, btn) => (btn.onclick = () => { const s = input.type === 'password'; input.type = s ? 'text' : 'password'; btn.innerHTML = ic(s ? 'mono/eye' : 'mono/eye-off'); });

  function renderLogin() {
    const t = L[lang()];
    document.title = '로그인 · 워크칩 대시보드';
    app.innerHTML = authShell(`
      <h1>${t.h}</h1><p class="sub">${t.sub}</p>
      <div class="segment block" style="margin-bottom:24px"><button data-v="email" aria-selected="true">${t.email}</button><button data-v="phone" aria-selected="false">${t.phone}</button></div>
      <form id="f" novalidate>
        <div class="field"><label class="field-label" for="id">${t.email}</label><input class="input" id="id" type="email" autocomplete="username" placeholder="name@company.com" value="${localStorage.getItem('wc-admin-id') || ''}"></div>
        <div class="field"><label class="field-label" for="pw">${t.pw}</label>
          <div class="input-wrap"><input class="input" id="pw" type="password" autocomplete="current-password" placeholder="${t.pwph}"><button type="button" class="icon-btn" id="eye" aria-label="비밀번호 보기">${ic('mono/eye-off')}</button></div></div>
        <div class="row-between"><label class="check"><input type="checkbox" id="rem" checked><span id="remT">${t.rememberE}</span></label><a class="link" href="#/forgot">${t.forgot}</a></div>
        <button class="btn btn-primary btn-lg btn-block" id="go" disabled>${t.go}</button>
      </form>
      <div class="login-links"><span>${t.none}</span><a href="#/signup" class="link-primary">${t.make}</a></div>`);
    bindAuth(); bindControls(app);
    const id = $('#id'), pw = $('#pw'), go = $('#go');
    const sync = () => (go.disabled = !(id.value.trim() && pw.value));
    id.oninput = pw.oninput = sync;
    $('.segment').addEventListener('change', (e) => {
      const phone = e.detail === 'phone';
      $('label[for=id]').textContent = phone ? t.phone : t.email;
      id.type = phone ? 'tel' : 'email'; id.placeholder = phone ? '010-0000-0000' : 'name@company.com'; id.value = '';
      $('#remT').textContent = phone ? t.rememberP : t.rememberE; sync();
    });
    eye(pw, $('#eye'));
    $('#f').onsubmit = (e) => {
      e.preventDefault();
      if ($('#rem').checked) localStorage.setItem('wc-admin-id', id.value.trim()); else localStorage.removeItem('wc-admin-id');
      sessionStorage.setItem('wc-admin', '1'); location.hash = '#/home';
    };
    setTimeout(() => (id.value ? pw : id).focus(), 50);
  }

  function renderForgot() {
    document.title = '비밀번호 찾기 · 워크칩 대시보드';
    app.innerHTML = authShell(`
      <a class="back-link" href="#/login">${ic('glyph/chevron-left')}로그인</a>
      <h1>비밀번호를 잊으셨나요?</h1><p class="sub">가입한 이메일로 비밀번호 재설정 링크를 보내 드려요.</p>
      <form id="f" novalidate><div class="field"><label class="field-label" for="em">이메일</label><input class="input" id="em" type="email" placeholder="name@company.com"></div>
      <span class="field-hint err" id="err" hidden>이메일 형식을 확인해 주세요.</span>
      <button class="btn btn-primary btn-lg btn-block" id="go" disabled>재설정 메일 받기</button></form>`);
    bindAuth();
    const em = $('#em');
    em.oninput = () => ($('#go').disabled = !em.value.trim());
    $('#f').onsubmit = (e) => {
      e.preventDefault();
      if (!/^\S+@\S+\.\S+$/.test(em.value)) { $('#err').hidden = false; return; }
      $('.login-box').innerHTML = `<div class="done">${ic('color/noti-bell')}<h3>메일을 보냈어요</h3><p><b>${em.value}</b> 으로 보낸 링크를 눌러<br>새 비밀번호를 정해 주세요. 링크는 30분 동안 쓸 수 있어요.</p></div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:24px"><a class="btn btn-primary btn-lg btn-block" href="#/login">로그인으로 돌아가기</a><button class="btn btn-ghost btn-block" id="again">메일이 안 왔어요 · 다시 보내기</button></div>`;
      $('#again').onclick = () => toast('메일을 다시 보냈어요');
    };
    setTimeout(() => em.focus(), 50);
  }

  const SU = { step: 1, data: {} };
  function renderSignup() {
    document.title = '회사 만들기 · 워크칩 대시보드';
    const step = SU.step;
    const prog = `<div class="steps"><i class="on"></i><i class="${step >= 2 ? 'on' : ''}"></i><span>${Math.min(step, 2)}/2</span></div>`;
    if (step === 1) {
      app.innerHTML = authShell(`${prog}
        <h1>워크칩 무료 체험을 위한<br>회사 정보를 알려 주세요</h1><p class="sub">90일 동안 모든 기능을 무료로 쓸 수 있어요.</p>
        <form id="f" novalidate>
          ${ui.field('회사 이름', '<input class="input" id="co" placeholder="예: 루트라보">')}
          ${ui.field('대표자 이름', '<input class="input" id="ceo" placeholder="홍길동">')}
          ${ui.field('이메일 (로그인 ID)', '<input class="input" id="em" type="email" placeholder="owner@company.com">')}
          ${ui.field('휴대폰 번호 <span class="opt">선택</span>', '<input class="input" id="ph" type="tel" placeholder="010-0000-0000">')}
          ${ui.field('비밀번호', `<div class="input-wrap"><input class="input" id="pw" type="password" placeholder="8자 이상"><button type="button" class="icon-btn" id="eye1" aria-label="비밀번호 보기">${ic('mono/eye-off')}</button></div>`, '<span id="pwh">영문·숫자를 섞어 8자 이상</span>')}
          ${ui.field('비밀번호 확인', `<div class="input-wrap"><input class="input" id="pw2" type="password" placeholder="한 번 더 입력"><button type="button" class="icon-btn" id="eye2" aria-label="비밀번호 보기">${ic('mono/eye-off')}</button></div>`, '<span id="pw2h"></span>')}
          <label class="check"><input type="checkbox" id="agree"><span>이용약관과 개인정보 처리방침에 동의해요</span></label>
          <button class="btn btn-primary btn-lg btn-block" id="go" disabled>다음</button>
        </form>
        <div class="login-links"><span>이미 계정이 있나요?</span><a href="#/login" class="link-primary">로그인</a></div>`);
      const v = (id) => $('#' + id).value.trim();
      const check = () => {
        const pwOk = v('pw').length >= 8 && /[a-zA-Z]/.test(v('pw')) && /\d/.test(v('pw'));
        const same = v('pw2') && v('pw') === v('pw2');
        $('#pwh').className = v('pw') ? (pwOk ? 'ok' : 'err') : '';
        $('#pwh').textContent = v('pw') && !pwOk ? '영문과 숫자를 섞어 8자 이상 입력해 주세요' : '영문·숫자를 섞어 8자 이상';
        $('#pw2h').className = v('pw2') ? (same ? 'ok' : 'err') : '';
        $('#pw2h').textContent = v('pw2') ? (same ? '비밀번호가 같아요' : '비밀번호가 달라요') : '';
        $('#go').disabled = !(v('co') && v('ceo') && /^\S+@\S+\.\S+$/.test(v('em')) && pwOk && same && $('#agree').checked);
      };
      $$('#f input').forEach((i) => (i.oninput = i.onchange = check));
      eye($('#pw'), $('#eye1')); eye($('#pw2'), $('#eye2'));
      $('#f').onsubmit = (e) => { e.preventDefault(); SU.data = { co: v('co'), ceo: v('ceo'), em: v('em') }; SU.step = 2; renderSignup(); };
      setTimeout(() => $('#co').focus(), 50);
    } else if (step === 2) {
      const inds = [['ind-office', '사무실'], ['ind-startup', '스타트업'], ['ind-cafe', '카페'], ['ind-restaurant', '레스토랑'], ['ind-franchise', '프랜차이즈'], ['ind-hospital', '병원'], ['ind-logistics', '물류']];
      app.innerHTML = authShell(`${prog}
        <h1>${SU.data.co}에 맞게<br>처음 설정을 준비할게요</h1><p class="sub">고른 내용으로 근무 정책과 메뉴를 미리 맞춰 드려요. 나중에 바꿀 수 있어요.</p>
        <div class="su-sec"><p class="sec-t">업종</p><div class="pick cards" id="ind">${inds.map(([i, l]) => `<button type="button" data-v="${l}">${ic('color/' + i)}${l}</button>`).join('')}</div></div>
        <div class="su-sec"><p class="sec-t">구성원 수</p>${ui.seg(['1–9명', '10–29명', '30–99명', '100명 이상'], 1, 'block')}</div>
        <div class="su-sec"><p class="sec-t">주로 쓰는 근무 방식 <span class="opt">여러 개 고를 수 있어요</span></p>
          <div class="pick multi list" id="mode">
            <button type="button" data-v="고정" aria-pressed="true">${ic('color/nav-attendance')}<span><b>매일 같은 시간</b><small>고정 근무제 · 예: 월~금 09:00~18:00</small></span></button>
            <button type="button" data-v="시차">${ic('color/time-edit')}<span><b>출근 시간을 직원이 선택</b><small>시차 출퇴근제</small></span></button>
            <button type="button" data-v="스케줄">${ic('color/nav-schedules')}<span><b>매주 근무표를 짜서 배정</b><small>스케줄 근무제 · 매장·교대</small></span></button>
          </div></div>
        <div class="row2" style="margin-top:8px"><button class="btn btn-grey btn-lg" id="prev">이전</button><button class="btn btn-primary btn-lg" id="go" disabled>회사 만들고 시작하기</button></div>`);
      bindControls(app);
      const sync = () => ($('#go').disabled = !(pickVals($('#ind')).length && pickVals($('#mode')).length));
      $('#ind').addEventListener('change', sync); $('#mode').addEventListener('change', sync);
      $('#prev').onclick = () => { SU.step = 1; renderSignup(); };
      $('#go').onclick = () => { SU.data.ind = pickVals($('#ind'))[0]; SU.data.mode = pickVals($('#mode')); SU.step = 3; renderSignup(); };
    } else {
      app.innerHTML = authShell(`
        <div class="done">${character('done-char')}<h3>${SU.data.co} 회사를 만들었어요</h3><p>무료 체험이 시작됐어요 · 2027년 1월 25일까지</p></div>
        <div class="box" style="margin:24px 0 8px"><div class="summary">
          <div><span>대표자</span><b>${SU.data.ceo}</b></div><div><span>로그인 ID</span><b>${SU.data.em}</b></div>
          <div><span>업종</span><b>${SU.data.ind}</b></div><div><span>미리 만든 근무 정책</span><b>${SU.data.mode.map((m) => ({ 고정: '고정 근무제', 시차: '시차 출퇴근제', 스케줄: '스케줄 근무제' })[m]).join(' · ')}</b></div>
        </div></div>
        <p class="sec-t" style="margin:16px 0 8px">다음으로 할 일</p>
        <div class="todo-steps"><div>${ic('color/nav-workplaces')}<span><b>근무지 등록</b><small>출퇴근할 장소와 인증 방법</small></span></div>
          <div>${ic('color/add-link')}<span><b>구성원 초대</b><small>문자나 링크로 초대해요</small></span></div></div>
        <button class="btn btn-primary btn-lg btn-block" id="go" style="margin-top:24px">대시보드 시작하기</button>`);
      $('#go').onclick = () => { SU.step = 1; sessionStorage.setItem('wc-admin', '1'); location.hash = '#/home'; };
    }
    bindAuth();
  }

  /* ───────────── 공통 셸 ───────────── */
  function shell(route) {
    let sec = null, nav = '';
    for (const [k, label, icon, s] of ROUTES) {
      if (s !== sec) { sec = s; if (s) nav += `<div class="nav-sec">${s}</div>`; }
      nav += `<a href="#/${k}" ${k === route ? 'aria-current="page"' : ''}>${ic('color/' + icon)}${label}${k === 'attendance' && REQS.length ? `<span class="nav-n tnum">${REQS.length}</span>` : ''}</a>`;
    }
    const dark = document.documentElement.dataset.theme === 'dark';
    return `
    <div class="shell" id="shell">
      <aside class="side" id="side">
        <div class="side-logo">${logo(18)}<button class="icon-btn side-x" data-act="side" aria-label="메뉴 닫기">${ic('glyph/close')}</button></div>
        <button class="company" data-act="company"><img class="company-mark" src="../assets/brand/company-solv.png" alt="SOLV"><span><b>SOLV</b><small>소유자</small></span>${ic('glyph/chevrons-up-down')}</button>
        <nav class="nav">${nav}</nav>
        <a class="trial" href="#/company">
          <div class="trial-head"><span>무료 체험</span><b>D-71</b></div>
          <div class="bar"><i style="width:21%"></i></div>
          <div style="margin-top:8px">2027년 1월 6일까지 · 구성원 62명</div>
        </a>
      </aside>
      <div class="side-dim" data-act="side"></div>
      <div class="main">
        <header class="top">
          <button class="icon-btn burger" data-act="side" aria-label="메뉴 열기">${ic('glyph/menu')}</button>
          <button class="search" data-act="cmd">${ic('glyph/search')}<span>메뉴 찾기 · 무엇을 하고 싶으세요?</span><kbd>⌘K</kbd></button>
          <div class="spacer"></div>
          <a class="btn btn-ghost btn-sm top-app" href="../app/">${ic('mono/smartphone')}<span>직원 앱</span></a>
          <button class="icon-btn bell" aria-label="알림" data-act="notif">${ic('mono/bell')}<i class="dot"></i></button>
          <div class="me">
            <button id="meBtn" data-act="me"><span class="avatar">하늘</span><b>김하늘</b>${ic('glyph/chevron-down')}</button>
          </div>
        </header>
        <main class="page" id="page"></main>
      </div>
    </div>`;
  }
  const meMenu = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    return `<div class="menu-head"><b>김하늘</b><small>소유자 · owner@company.com</small></div>
      <button class="p-item" data-m="theme">${ic(dark ? 'mono/moon' : 'mono/sun')}화면 모드<span class="end">${dark ? '다크' : '라이트'}</span></button>
      <button class="p-item" data-m="lang">${ic('mono/globe')}언어<span class="end">${lang() === 'en' ? 'English' : '한국어'}</span></button>
      <button class="p-item" data-m="profile">${ic('mono/user')}내 정보</button>
      <hr><button class="p-item" data-m="logout">${ic('mono/log-out')}로그아웃</button>`;
  };

  /* ───────────── 렌더링 ───────────── */
  const PAGES = {};
  function render() {
    const page = $('#page'); if (!page) return;
    const focused = document.activeElement?.matches?.('[data-q]') ? document.activeElement.selectionStart : null;
    page.innerHTML = PAGES[S.route]();
    bindControls(page);
    if (focused != null) { const q = $('[data-q]', page); if (q) { q.focus(); q.setSelectionRange(focused, focused); } }
    A.after[S.route]?.(page);
  }

  // 페이지 공통 이벤트 (위임)
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tabs] button');
    if (t) { S.tab[S.route] = +t.dataset.i; render(); return; }
    const f = e.target.closest('[data-f]');
    if (f) { filterPop(f); return; }
    const a = e.target.closest('[data-act]');
    if (a && A.acts[a.dataset.act]) { e.preventDefault(); A.acts[a.dataset.act](a, e); }
  });
  document.addEventListener('input', (e) => {
    if (e.target.matches('[data-q]')) { S.q[S.route] = e.target.value; render(); }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && sessionStorage.getItem('wc-admin')) { e.preventDefault(); A.acts.cmd(); }
  });

  // 필터 팝오버: 데이터에서 고를 값을 모아 체크 목록으로
  function filterPop(btn) {
    const key = btn.dataset.f;
    const src = key === '지역' ? WORKPLACES.map((w) => w.a.split(' ')[0]) : MEMBERS.map((m) => m[FIELD[key]]);
    const opts = [...new Set(src)];
    const cur = new Set(flt(S.route)[key] || []);
    popover(btn, `<div class="p-sec">${key}</div>${opts.map((o) => `<button class="p-item" data-o="${o}" aria-checked="${cur.has(o)}">${o}</button>`).join('')}
      <div class="p-foot"><button class="btn btn-grey btn-sm" data-r>초기화</button><button class="btn btn-primary btn-sm" data-ok>적용</button></div>`, (el) => {
      $$('[data-o]', el).forEach((b) => (b.onclick = () => { cur.has(b.dataset.o) ? cur.delete(b.dataset.o) : cur.add(b.dataset.o); b.setAttribute('aria-checked', cur.has(b.dataset.o)); }));
      $('[data-r]', el).onclick = () => { delete flt(S.route)[key]; closePopover(); render(); };
      $('[data-ok]', el).onclick = () => { flt(S.route)[key] = [...cur]; closePopover(); render(); };
    }, { width: 200 });
  }

  /* ───────────── 라우팅 ───────────── */
  const PUBLIC = { login: renderLogin, forgot: renderForgot, signup: renderSignup };
  function route() {
    const r = location.hash.replace('#/', '').split('?')[0] || 'login';
    const authed = sessionStorage.getItem('wc-admin');
    closePopover();
    if (PUBLIC[r]) { if (r === 'login' && authed) { location.hash = '#/home'; return; } S.route = r; return PUBLIC[r](); }
    if (!authed) { location.hash = '#/login'; return; }
    if (!PAGES[r]) { location.hash = '#/home'; return; }
    S.route = r;
    document.title = `${ROUTES.find((x) => x[0] === r)[1]} · 워크칩 대시보드`;
    app.innerHTML = shell(r);
    render();
    window.scrollTo(0, 0);
  }

  const A = (window.A = {
    $, $$, S, MEMBERS, WORKPLACES, CERT, GROUPS, POLICIES, LEAVES, REQS, INVITES, DEVICES, ROUTES, PAGES,
    ph, tabs, fchip, tsearch, filt, person, initial, roleBadge, empty, tfoot, tabOf, render, route, meMenu, lang,
    acts: {}, after: {},
    start() { window.addEventListener('hashchange', route); window.addEventListener('themechange', route); route(); },
  });
})();
