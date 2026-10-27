/* 관리자 시안 — 버튼을 눌렀을 때 열리는 화면 (시트 · 모달 · 메뉴) */
(function () {
  const { $, $$, S, MEMBERS, WORKPLACES, CERT, GROUPS, POLICIES, LEAVES, INVITES, ROUTES, render, initial, acts } = A;
  const opts = (arr) => arr.map((x) => [x, x]);
  const uniq = (k) => [...new Set(MEMBERS.map((m) => m[k]))];

  /* 사이드바 열고 닫기 (좁은 화면) */
  acts.side = () => $('#shell')?.classList.toggle('side-open');
  document.addEventListener('click', (e) => { if (e.target.closest('.nav a, .trial')) $('#shell')?.classList.remove('side-open'); });

  /* 도움말 */
  const HELP = {
    home: [['오늘 운영', '출근·지각·휴가 숫자를 누르면 해당 목록으로 바로 가요.'], ['처리할 일', '승인할 요청이 생기면 숫자가 올라가요. 0이면 회색이에요.']],
    attendance: [['판정 기준', '근무 정책과 스케줄로 출근 전·지각·조퇴를 판정해요.'], ['승인 탭', '직원이 앱에서 보낸 기록 수정 요청을 승인·반려해요.'], ['내보내기', '지금 고른 조건 그대로 엑셀(CSV)로 받아요.']],
    schedules: [['칸 선택', '칸을 누르거나 끌어서 고르면 아래 막대가 나와요. Shift+클릭으로 범위, ⌘/Ctrl+클릭으로 여러 칸을 더할 수 있어요.'], ['빠른 채우기', '자동 배정 · 지난주 복사 · 주 패턴 반복 · 모두 지우기. 모두 되돌리기를 할 수 있어요.'], ['근무 시간대', '자주 쓰는 시간을 저장해 두면 근무표에서 골라 넣을 수 있어요.']],
    leave: [['승인', '대기 중인 신청을 승인하면 근태와 스케줄에 바로 반영돼요.'], ['결재선', '여러 단계 승인이 필요하면 결재선 탭에서 단계를 더해요.']],
    members: [['구성원 추가', '문자 · 초대 링크 · 직접 추가 세 가지 방법이 있어요.'], ['출퇴근 기기', '새 기기로 바꾸면 확인 필요로 올라와요.']],
    groups: [['리더', '승인 권한이 있는 리더는 그룹 구성원의 휴가·근태를 승인해요.']],
    workplaces: [['인증 방법', 'GPS는 반경 안에서, QR은 매장에 붙인 코드를 찍어야 출퇴근돼요.']],
    policies: [['정책 유형', '매주 같은 시간이면 고정, 출근 시각만 다르면 시차, 요일도 바뀌면 스케줄 근무제예요.']],
    company: [['회사 이름', '대시보드와 직원 앱 맨 위에 보여요.']],
  };
  acts.help = () => openSheet({
    title: '도움말',
    body: `${(HELP[S.route] || []).map(([t, d]) => `<div class="help-item"><b>${t}</b><p>${d}</p></div>`).join('')}
      <div class="box help-more">${ic('color/tip')}<div><b>더 궁금한 게 있나요?</b><p>평일 10시–18시 채팅으로 답해 드려요.</p></div><button class="btn btn-grey btn-sm" onclick="toast('상담 채팅을 열었어요')">채팅 상담</button></div>`,
  });

  /* AI 찾기 (⌘K) — 하고 싶은 일을 말로 물으면 메뉴로 안내. 기록이나 설정은 바꾸지 않아요 */
  const GO = (hash, tab, after) => () => { if (tab != null) S.tab[hash] = tab; location.hash = '#/' + hash; if (after) setTimeout(after, 60); };
  const GUIDE = [
    { t: '출퇴근 현황', d: '직원의 출퇴근 기록을 보고, 행을 눌러 시간을 수정해요.', i: 'nav-attendance', k: '출퇴근 출근 퇴근 지각 조퇴 근태 현황 기록 누락 결근 반경', go: GO('attendance', 0) },
    { t: '출퇴근 시간 수정', d: '출퇴근 현황에서 사람을 누르고 ‘기록 고치기’를 눌러요.', i: 'time-edit', k: '수정 고치 바꾸 시간 시각 정정 잘못', go: GO('attendance', 0) },
    { t: '출퇴근 기록 요청 승인', d: '직원이 보낸 기록 수정 요청을 승인하거나 반려해요.', i: 'ap-pending', k: '요청 승인 반려 결재 처리', go: GO('attendance', 1) },
    { t: '출퇴근 월별 집계', d: '이번 달 근무일·근무시간·지각을 사람별로 모아 봐요.', i: 'excel-download', k: '월별 집계 통계 월간 합계 엑셀 급여', go: () => { S.ui.attView = 'month'; GO('attendance', 0)(); } },
    { t: '지각·조퇴 판정 기준', d: '몇 분까지 정상으로 볼지, 자동 퇴근을 쓸지 정해요.', i: 'nav-work-policies', k: '기준 허용 판정 자동 퇴근 설정', go: GO('attendance', 3) },
    { t: '근무표 (스케줄)', d: '구성원별 주간·월간 근무를 보고 칸을 골라 바꿔요.', i: 'nav-schedules', k: '스케줄 근무표 배정 교대 시프트 오픈 마감 근무', go: GO('schedules', 0) },
    { t: '자동 배정', d: '필요 인원·공통 규칙·구성원 조건으로 근무표 초안을 만들어요.', i: 'schedule-registered', k: '자동 배정 빠른 채우기 짜기 초안 채우', go: () => { GO('schedules', 0)(); setTimeout(() => document.querySelector('[data-act="quickFill"]')?.click(), 80); } },
    { t: '근무 시간대 만들기', d: '오픈·마감처럼 자주 쓰는 근무 시간을 저장해요.', i: 'schedule-changed', k: '시간대 만들 오픈 마감 미들 시간', go: GO('schedules', 1, () => acts.shiftNew()) },
    { t: '휴가 신청 승인', d: '직원이 앱에서 신청한 휴가를 승인하거나 반려해요.', i: 'calendar-check', k: '휴가 연차 반차 신청 승인 반려', go: GO('leave', 0) },
    { t: '휴가 등록', d: '관리자가 직원 대신 휴가를 넣어요.', i: 'nav-leave', k: '휴가 등록 넣기 대신', go: GO('leave', 0, () => acts.leaveAdd()) },
    { t: '연차 현황', d: '직원별 부여·사용·남은 연차를 봐요.', i: 'nav-leave', k: '연차 남은 잔여 부여 사용 현황 직원별', go: GO('leave', 2) },
    { t: '휴가 캘린더', d: '달력으로 누가 언제 쉬는지 봐요.', i: 'nav-schedules', k: '캘린더 달력 누가 쉬', go: GO('leave', 1) },
    { t: '구성원 초대', d: '문자·초대 링크·직접 추가로 직원을 들여요.', i: 'add-link', k: '초대 직원 추가 입사 가입 링크 문자', go: GO('members', 0, () => acts.memberAdd()) },
    { t: '구성원 정보', d: '역할·그룹·근무지·근무 정책을 바꿔요.', i: 'nav-members', k: '구성원 직원 역할 권한 관리자 정보 퇴사 비활성', go: GO('members', 0) },
    { t: '출퇴근 기기 확인', d: '새 기기·빌린 기기를 승인하거나 해제해요.', i: 'device-check', k: '기기 휴대폰 폰 등록 해제 바꿨', go: GO('members', 2) },
    { t: '그룹과 리더', d: '그룹을 나누고 승인할 리더를 정해요.', i: 'nav-groups', k: '그룹 팀 부서 리더 조직', go: GO('groups') },
    { t: '근무지 · QR', d: '출퇴근할 장소, GPS 반경, QR 코드를 관리해요.', i: 'nav-workplaces', k: '근무지 매장 지점 QR GPS 반경 위치', go: GO('workplaces') },
    { t: '근무 정책', d: '고정·시차·스케줄 근무 방식을 만들고 적용해요.', i: 'nav-work-policies', k: '근무 정책 고정 시차 주 52 소정 근로', go: GO('policies', 0) },
    { t: '회사 정보 · 요금제', d: '회사 이름·로고·시간대·직무와 무료 체험 기간을 봐요.', i: 'nav-company', k: '회사 로고 이름 시간대 직무 요금 결제 체험', go: GO('company') },
  ];
  const EXAMPLES = ['직원별 남은 연차 어디서 봐?', '직원 초대하고 싶어', '출근 시간을 수정하고 싶어', '다음 주 근무표 자동으로 짜줘'];
  const ask = (q) => {
    const words = q.replace(/[?？!.,]/g, ' ').split(/\s+/).filter((w) => w.length > 0);
    const score = (g) => words.reduce((a, w) => a + (g.k.split(' ').some((k) => w.includes(k) || k.includes(w.replace(/(하고|싶어|해줘|줘|어디서|봐|보고|보려면|하려면|을|를|이|가|은|는|의|에서)$/g, ''))) ? 2 : 0) + (g.t.includes(w) ? 3 : 0), 0);
    return GUIDE.map((g) => [g, score(g)]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);
  };
  acts.cmd = () => {
    const m = openModal({ size: 'lg', body: `<form class="ai-in" id="af2"><span class="ai-ic">${ic('glyph/search')}</span><input id="cq" placeholder="무엇을 하고 싶으세요?" autocomplete="off" autofocus><button class="btn btn-sm ai-go" id="cgo" disabled>찾기</button></form><div class="ai-body" id="cl"></div><div class="ai-foot">${ic('mono/sparkle')}메뉴 이동만 도와줘요 · 기록이나 설정은 바꾸지 않아요</div>` });
    m.el.classList.add('layer-cmd');
    const inp = m.$('#cq'), body = m.$('#cl'), go = m.$('#cgo');
    let cur = 0, shown = [], lastQ = null;
    const sel = () => $$('.ai-ans', body).forEach((b, i) => b.setAttribute('aria-selected', i === cur));
    const examples = () => {
      shown = [];
      body.innerHTML = `<div class="ai-sec">이렇게 물어보세요</div>${EXAMPLES.map((e) => `<button type="button" class="ai-ex">${ic('glyph/search')}<span>${e}</span></button>`).join('')}`;
      $$('.ai-ex', body).forEach((b) => (b.onclick = () => { inp.value = lastQ = b.textContent.trim(); go.disabled = false; run(); }));
    };
    const run = () => {
      const q = inp.value.trim(); if (!q) return examples();
      body.innerHTML = `<div class="ai-think"><i></i><i></i><i></i><span>찾고 있어요</span></div>`;
      setTimeout(() => {
        if (!m.el.isConnected) return;
        shown = ask(q); cur = 0;
        body.innerHTML = shown.length ? shown.map((g, i) => `<button type="button" class="ai-ans" data-i="${i}" aria-selected="${!i}">${ic('color/' + g.i, 'ai-ans-ic')}<span class="ai-ans-t"><b>${g.t}</b><small>${g.d}</small></span><span class="ai-move">이동${ic('glyph/chevron-right')}</span></button>`).join('')
          : `<div class="ai-none"><b>딱 맞는 메뉴를 못 찾았어요</b><span>‘연차’, ‘초대’, ‘근무표’처럼 하고 싶은 일을 넣어 다시 물어보세요.</span></div><div class="ai-sec">이렇게 물어보세요</div>${EXAMPLES.slice(0, 3).map((e) => `<button type="button" class="ai-ex">${ic('glyph/search')}<span>${e}</span></button>`).join('')}`;
        $$('.ai-ans', body).forEach((b) => (b.onclick = () => { m.close(); shown[+b.dataset.i].go(); }));
        $$('.ai-ex', body).forEach((b) => (b.onclick = () => { inp.value = lastQ = b.textContent.trim(); run(); }));
      }, 380);
    };
    inp.oninput = () => { go.disabled = !inp.value.trim(); if (!inp.value.trim()) examples(); };
    m.$('#af2').onsubmit = (e) => {
      e.preventDefault();
      const q = inp.value.trim();
      if (q && q === lastQ && shown[cur]) { m.close(); shown[cur].go(); return; }
      lastQ = q; run();
    };
    inp.onkeydown = (e) => {
      if (!shown.length || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      e.preventDefault(); cur = (cur + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length; sel();
    };
    examples();
  };

  /* 알림 */
  acts.notif = (b) => popover(b, `<div class="notif-h"><b>알림</b><button class="link" data-read>모두 읽음</button></div>
    <a class="p-item notif" href="#/attendance" data-goto="attendance" data-tab="1">${ic('color/req-missing-out', 'c')}<span><b>이도윤님이 퇴근 기록을 요청했어요</b><small>10.24 (금) 퇴근 19:05 · 2시간 전</small></span></a>
    <a class="p-item notif" href="#/members" data-goto="members" data-tab="2">${ic('color/dev-switch', 'c')}<span><b>서다은님이 새 기기를 등록했어요</b><small>확인이 필요해요 · 어제</small></span></a>
    <a class="p-item notif read" href="#/leave">${ic('color/ap-approved', 'c')}<span><b>김하늘님 연차가 승인됐어요</b><small>10.27–10.28 · 3일 전</small></span></a>`, (el) => {
    $('[data-read]', el).onclick = () => { $$('.notif', el).forEach((n) => n.classList.add('read')); $('.bell .dot')?.remove(); };
    $$('a', el).forEach((a) => a.addEventListener('click', closePopover));
  }, { width: 340, align: 'right' });

  /* 회사 바꾸기 */
  acts.company = (b) => popover(b, `<div class="p-sec">내 회사</div>
    <button class="p-item" aria-checked="true"><img class="company-mark sm" src="../assets/brand/company-solv.png" alt="SOLV"><span>SOLV<small>소유자 · 구성원 62명</small></span></button>
    <button class="p-item" data-co><span class="company-mark sm alt">RL</span><span>루트라보 테스트<small>관리자 · 구성원 4명</small></span></button>
    <hr><a class="p-item" href="#/signup">${ic('glyph/plus')}새 회사 만들기</a>`, (el) => {
    $('[data-co]', el).onclick = () => { closePopover(); toast('루트라보 테스트로 바꿨어요 (시안은 같은 데이터를 보여 줘요)'); };
    $('a', el).onclick = () => { sessionStorage.removeItem('wc-admin'); closePopover(); };
  }, { width: 260 });

  /* 프로필 메뉴 */
  acts.me = (b) => popover(b, A.meMenu(), (el) => {
    $$('[data-m]', el).forEach((x) => (x.onclick = () => {
      const k = x.dataset.m; closePopover();
      if (k === 'theme') toggleTheme();
      if (k === 'lang') { const en = A.lang() !== 'en'; localStorage.setItem('wc-lang', en ? 'en' : 'ko'); toast(en ? '로그인 화면이 영어로 바뀌어요 (시안은 로그인 화면만 번역)' : '한국어로 바꿨어요'); }
      if (k === 'profile') profile();
      if (k === 'logout') { sessionStorage.removeItem('wc-admin'); location.hash = '#/login'; }
    }));
  }, { width: 260, align: 'right' });
  function profile() {
    const m = openModal({
      title: '내 정보',
      body: `<div class="profile-h"><span class="avatar xl">하늘</span><label class="btn btn-grey btn-sm">사진 바꾸기<input type="file" accept="image/*" hidden></label></div>
        ${ui.field('이름', '<input class="input sm" value="김하늘">')}${ui.field('이메일 (로그인 ID)', '<input class="input sm" value="owner@company.com" disabled>', '로그인 ID는 바꿀 수 없어요')}
        ${ui.field('휴대폰 번호', '<input class="input sm" value="010-0000-0000">')}
        <button class="btn btn-grey" id="pwc">비밀번호 바꾸기</button>`,
      footer: '<button class="btn btn-grey btn-lg" data-close>닫기</button><button class="btn btn-primary btn-lg" id="ok">저장</button>',
    });
    m.$('#ok').onclick = () => { m.close(); toast('내 정보를 저장했어요'); };
    m.$('#pwc').onclick = () => { m.close(); toast('비밀번호 바꾸기 메일을 보냈어요'); };
  }

  /* 내보내기 → 실제 CSV 파일 */
  acts.export = (b) => {
    const k = b.dataset.k;
    if (k === 'schedules') return A.schedExport(b);
    const m = openModal({
      title: '내보내기',
      body: `${ui.field('범위', ui.seg([['cur', '지금 보는 조건'], ['all', '전체']], 0, 'block'))}
        ${ui.field('형식', ui.seg([['csv', '엑셀 (CSV)'], ['print', '인쇄용']], 0, 'block'))}
        <div class="box"><div class="summary"><div><span>화면</span><b>${k === 'schedules' ? `근무표 · ${A.weekLabel(S.ui.week || 0)}` : '출퇴근 · 10월 27일'}</b></div></div></div>`,
      footer: '<button class="btn btn-grey btn-lg fit" data-close>취소</button><button class="btn btn-primary btn-lg" id="ok">내려받기</button>',
    });
    m.$('#ok').onclick = () => {
      const all = segVal(m.$$('.segment')[0]) === 'all';
      const saved = S.f[S.route], q = S.q[S.route];
      if (all) { S.f[S.route] = {}; S.q[S.route] = ''; }
      const rows = k === 'schedules' ? A.schedRows() : [['이름', '그룹', '직무', '상태', '근무 계획', '출근', '근무지']].concat(A.filt(MEMBERS).map((x) => [x.n, x.g, x.t, x.st, x.plan || '', x.in || '', x.in ? x.wp : '']));
      S.f[S.route] = saved; S.q[S.route] = q;
      if (segVal(m.$$('.segment')[1]) === 'print') { m.close(); setTimeout(() => print(), 100); return; }
      downloadCSV(`워크칩_${k === 'schedules' ? '근무표' : '출퇴근'}_20261027.csv`, rows);
      m.close(); toast(`${rows.length - 1}명 파일을 내려받았어요`);
    };
  };

  /* 출퇴근 한 사람 자세히 */
  acts.attRow = (tr) => {
    const m = MEMBERS.find((x) => x.n === tr.dataset.n);
    const sheet = openSheet({
      title: m.n,
      body: `<div class="who">${A.person(m)}<span class="badge badge-grey">${m.pol}</span></div>
        <div class="box"><div class="summary"><div><span>오늘 근무 계획</span><b>${m.plan || '없음'}</b></div><div><span>근무지</span><b>${m.wp}</b></div><div><span>등록 기기</span><b>${m.n === '서다은' ? 'iPhone 13 · 확인 필요' : '1대'}</b></div></div></div>
        <p class="sec-t">오늘 기록</p>
        <ol class="timeline">${m.in ? `<li>${ic('color/gps', 'lead')}<span class="txt"><b>출근 ${m.in}</b><small>${m.wp} · QR 코드 + GPS · 반경 안</small></span></li>` : `<li>${ic('color/ap-waiting', 'lead')}<span class="txt"><b>아직 기록이 없어요</b><small>${m.st === 'leave' ? '오늘은 휴가예요' : m.st === 'off' ? '오늘은 휴무예요' : '출근 전이에요'}</small></span></li>`}</ol>`,
      footer: '<button class="btn btn-grey btn-lg" id="msg">알림 보내기</button><button class="btn btn-primary btn-lg" id="fix">기록 고치기</button>',
    });
    sheet.$('#msg').onclick = () => { sheet.close(); toast(`${m.n}님께 출근 알림을 보냈어요`); };
    sheet.$('#fix').onclick = () => {
      sheet.setBody(`<div class="who">${A.person(m)}</div>${ui.field('고칠 기록', ui.seg(['출근', '퇴근'], 0, 'block'))}
        ${ui.field('시각', '<input class="input sm" type="time" value="09:58">')}${ui.field('사유', '<textarea class="input" placeholder="예: 기기 오류로 기록이 빠졌어요"></textarea>', '고친 기록은 직원 앱에 알림으로 가고, 기록 변경 이력에 남아요.')}`);
      bindControls(sheet.el);
      sheet.setFooter('<button class="btn btn-grey btn-lg fit" data-close>취소</button><button class="btn btn-primary btn-lg" id="ok">저장</button>');
      sheet.$('[data-close]').onclick = sheet.close;
      sheet.$('#ok').onclick = () => { sheet.close(); toast('기록을 고쳤어요'); };
    };
  };

  /* 휴가 등록 */
  acts.leaveAdd = () => {
    const sheet = openSheet({
      title: '휴가 등록',
      body: `${ui.field('구성원', ui.select('lvM', MEMBERS.map((m) => [m.n, `${m.n} · ${m.g}`])))}
        <div class="field"><span class="field-label">유형</span><div class="pick" id="lvT">${['연차', '오전 반차', '오후 반차', '경조사', '병가'].map((t, i) => `<button type="button" aria-pressed="${!i}">${t}</button>`).join('')}</div></div>
        <div class="row-arrow">${ui.field('시작', '<input class="input sm" type="date" id="lvA" value="2026-10-29">')}${ic('glyph/arrow-right')}${ui.field('끝', '<input class="input sm" type="date" id="lvB" value="2026-10-29">')}</div>
        ${ui.field('사유 <span class="opt">선택</span>', '<textarea class="input" id="lvR" placeholder="예: 개인 일정"></textarea>')}
        <div class="box"><div class="summary" id="lvS"></div></div>`,
      footer: '<button class="btn btn-grey btn-lg fit" data-close>취소</button><button class="btn btn-primary btn-lg" id="ok">등록</button>',
    });
    const $s = sheet.$;
    const calc = () => {
      const t = pickVals($s('#lvT'))[0], a = new Date($s('#lvA').value), b = new Date($s('#lvB').value);
      let d = 0; for (let x = new Date(a); x <= b; x.setDate(x.getDate() + 1)) if (x.getDay() % 6) d++;
      if (t.includes('반차')) d = 0.5;
      if (t.includes('반차')) $s('#lvB').value = $s('#lvA').value;
      $s('#lvS').innerHTML = `<div><span>쓰는 일수</span><b class="tnum">${d}일</b></div><div><span>남은 연차</span><b class="tnum">${t === '연차' || t.includes('반차') ? `${15 - d}일` : '차감 없음'}</b></div>`;
      $s('#ok').disabled = !(d > 0);
      return d;
    };
    sheet.el.addEventListener('change', calc); sheet.el.addEventListener('input', calc); calc();
    $s('#ok').onclick = () => {
      const f = (v) => v.slice(5).replace('-', '.');
      LEAVES.unshift({ n: $s('#lvM').value, type: pickVals($s('#lvT'))[0], from: f($s('#lvA').value), to: f($s('#lvB').value), days: calc(), reason: $s('#lvR').value || '—', st: 'approved' });
      sheet.close(); S.st.leave = 'approved'; S.tab.leave = 0;
      toast(`${$s('#lvM').value}님 휴가를 등록했어요`); render();
    };
  };
  acts.ltypeAdd = () => {
    const m = openModal({ title: '휴가 유형 추가', body: `${ui.field('이름', '<input class="input sm" id="n" placeholder="예: 리프레시 휴가" autofocus>')}${ui.field('연차 차감', ui.seg(['차감해요', '차감 안 해요'], 1, 'block'))}${ui.field('급여', ui.seg(['유급', '무급'], 0, 'block'))}`, footer: '<button class="btn btn-grey btn-lg" data-close>취소</button><button class="btn btn-primary btn-lg" id="ok">추가</button>' });
    m.$('#ok').onclick = () => { const n = m.$('#n').value.trim(); if (!n) return; S.ui.ltypes.push([n, `${segVal(m.$$('.segment')[0]) === '차감해요' ? '연차에서 차감' : '차감 없음'} · ${segVal(m.$$('.segment')[1])}`, true]); m.close(); render(); };
  };

  /* 구성원 추가 (문자 · 링크 · 직접) */
  acts.memberAdd = () => {
    const sheet = openSheet({
      title: '구성원 추가',
      body: `<div class="pick list" id="how">
          <button type="button" data-v="sms" aria-pressed="true">${ic('color/add-phone')}<span><b>문자로 초대</b><small>휴대폰 번호로 가입 링크를 보내요</small></span></button>
          <button type="button" data-v="link">${ic('color/add-link')}<span><b>초대 링크 복사</b><small>카카오톡·단체방에 붙여 넣어요</small></span></button>
          <button type="button" data-v="direct">${ic('color/add-direct')}<span><b>직접 추가</b><small>정보를 입력해 바로 등록해요</small></span></button></div>
        <div id="howBody"></div>`,
      footer: '<button class="btn btn-grey btn-lg fit" data-close>취소</button><button class="btn btn-primary btn-lg" id="ok">초대 보내기</button>',
    });
    const $s = sheet.$;
    const common = `<div class="row2">${ui.field('그룹', ui.select('mG', uniq('g')))}${ui.field('근무지', ui.select('mW', WORKPLACES.map((w) => w.n)))}</div>${ui.field('근무 정책', ui.select('mP', POLICIES.filter((p) => p.on).map((p) => [p.type, p.n])))}`;
    const draw = () => {
      const h = pickVals($s('#how'))[0];
      if (h === 'sms') $s('#howBody').innerHTML = `${ui.field('이름', '<input class="input sm" id="mN" placeholder="홍길동">')}${ui.field('휴대폰 번호', '<input class="input sm" id="mC" type="tel" placeholder="010-0000-0000">')}${common}`;
      if (h === 'direct') $s('#howBody').innerHTML = `${ui.field('이름', '<input class="input sm" id="mN" placeholder="홍길동">')}${ui.field('이메일', '<input class="input sm" id="mC" type="email" placeholder="name@company.com">', '이 이메일로 임시 비밀번호를 보내요')}${common}${ui.field('입사일', '<input class="input sm" id="mJ" type="date" value="2026-10-27">')}`;
      if (h === 'link') $s('#howBody').innerHTML = `${ui.field('초대 링크', `<div class="copy-in"><input class="input sm" id="lnk" readonly value="https://app.workchip.co.kr/join/SOLV-8K2Q"><button type="button" class="btn btn-grey btn-sm" id="cp">${ic('mono/copy')}복사</button></div>`)}
        ${ui.field('유효 기간', ui.seg(['1일', '7일', '30일'], 1, 'block'))}${ui.field('가입하면 들어갈 그룹', ui.select('mG', uniq('g')))}
        <div class="set-row flat"><div><b>가입할 때 관리자 승인 받기</b><small>모르는 사람이 링크로 들어오는 걸 막아요</small></div>${ui.switch(true)}</div>`;
      bindControls(sheet.el);
      $s('#ok').textContent = { sms: '초대 보내기', link: '닫기', direct: '추가하기' }[h];
      $s('#cp')?.addEventListener('click', () => { navigator.clipboard?.writeText($s('#lnk').value); toast('링크를 복사했어요'); });
      const v = () => { const n = $s('#mN'), c = $s('#mC'); $s('#ok').disabled = h !== 'link' && !(n?.value.trim() && c?.value.trim()); };
      $$('#howBody input', sheet.el).forEach((i) => (i.oninput = v)); v();
    };
    $s('#how').addEventListener('change', draw); draw();
    $s('#ok').onclick = () => {
      const h = pickVals($s('#how'))[0];
      if (h === 'link') return sheet.close();
      const n = $s('#mN').value.trim();
      if (h === 'sms') { INVITES.unshift({ n, c: $s('#mC').value.replace(/(\d{3})-?\d{4}-?(\d{4})/, '$1-****-$2'), via: '문자', at: '10.27', st: '대기' }); S.tab.members = 1; toast(`${n}님께 초대 문자를 보냈어요`); }
      else { const p = POLICIES.find((x) => x.n === $s('#mP').selectedOptions[0].text); MEMBERS.push({ n, g: $s('#mG').value, t: '사원', role: '구성원', wp: $s('#mW').value, pol: p.type, join: $s('#mJ').value.replaceAll('-', '.'), st: 'before', emp: '정규직', email: $s('#mC').value }); S.tab.members = 0; toast(`${n}님을 추가했어요`); }
      sheet.close(); render();
    };
  };
  acts.memberEdit = (tr) => {
    const m = MEMBERS.find((x) => x.n === tr.dataset.n);
    const sheet = openSheet({
      title: '구성원 정보',
      body: `<div class="who">${A.person(m, m.email)}<span class="badge ${A.roleBadge(m.role)}">${m.role}</span></div>
        ${ui.field('역할', ui.seg(['소유자', '관리자', '매니저', '구성원'], ['소유자', '관리자', '매니저', '구성원'].indexOf(m.role), 'block').replace('class="segment ', 'id="eR" class="segment '))}
        <div class="row2">${ui.field('그룹', ui.select('eG', uniq('g'), m.g))}${ui.field('직무', ui.select('eT', uniq('t'), m.t))}</div>
        <div class="row2">${ui.field('근무지', ui.select('eW', WORKPLACES.map((w) => w.n), m.wp))}${ui.field('근무 정책', ui.select('eP', ['고정 근무제', '시차 출퇴근제', '스케줄 근무제'], m.pol))}</div>
        ${ui.field('고용 형태', ui.seg(['정규직', '파트타임'], m.emp === '파트타임' ? 1 : 0, 'block').replace('class="segment ', 'id="eE" class="segment '))}`,
      footer: '<button class="btn btn-ghost btn-lg fit btn-text-danger" id="off">비활성으로</button><button class="btn btn-grey btn-lg fit" data-close>취소</button><button class="btn btn-primary btn-lg" id="ok">저장</button>',
    });
    sheet.$('#ok').onclick = () => { Object.assign(m, { role: segVal(sheet.$('#eR')), g: sheet.$('#eG').value, t: sheet.$('#eT').value, wp: sheet.$('#eW').value, pol: sheet.$('#eP').value, emp: segVal(sheet.$('#eE')) }); sheet.close(); toast('저장했어요'); render(); };
    sheet.$('#off').onclick = async () => { if (await confirmBox({ title: `${m.n}님을 비활성으로 바꿀까요?`, desc: '앱에 로그인할 수 없고 과금 좌석에서 빠져요. 기록은 남아요.', ok: '비활성으로', danger: true })) { sheet.close(); toast('비활성으로 바꿨어요 (시안은 목록에 그대로 보여요)'); } };
  };

  /* 그룹 만들기 · 편집 */
  function groupSheet(g) {
    const edit = !!g;
    const sheet = openSheet({
      title: edit ? '그룹 편집' : '그룹 만들기',
      body: `${ui.field('그룹 이름', `<input class="input sm" id="gN" value="${g?.n || ''}" placeholder="예: 판교점" autofocus>`)}
        ${ui.field('상위 그룹', ui.select('gP', [['', '없음 (최상위)'], ...GROUPS.filter((x) => x !== g).map((x) => [x.n, x.n])], g?.p || ''))}
        ${ui.field('리더', ui.select('gL', [['', '정하지 않음'], ...MEMBERS.map((m) => [m.n, `${m.n} · ${m.t}`])], g?.leader || ''))}
        <div class="set-row flat"><div><b>리더에게 승인 권한 주기</b><small>그룹 구성원의 휴가·근태 요청을 승인해요</small></div>${ui.switch(g ? g.approve : true, 'gA')}</div>`,
      footer: `${edit ? '<button class="btn btn-ghost btn-lg fit btn-text-danger" id="del">삭제</button>' : ''}<button class="btn btn-grey btn-lg fit" data-close>취소</button><button class="btn btn-primary btn-lg" id="ok">${edit ? '저장' : '만들기'}</button>`,
    });
    const $s = sheet.$;
    $s('#gN').oninput = () => ($s('#ok').disabled = !$s('#gN').value.trim()); $s('#gN').oninput();
    $s('#ok').onclick = () => {
      const v = { n: $s('#gN').value.trim(), p: $s('#gP').value || null, leader: $s('#gL').value || '—', approve: $s('#gA').checked };
      if (edit) { MEMBERS.forEach((m) => m.g === g.n && (m.g = v.n)); GROUPS.forEach((x) => x.p === g.n && (x.p = v.n)); Object.assign(g, v); } else GROUPS.push(v);
      S.ui.group = v.n; sheet.close(); toast(edit ? '그룹을 저장했어요' : `${v.n} 그룹을 만들었어요`); render();
    };
    $s('#del')?.addEventListener('click', async () => {
      if (MEMBERS.some((m) => m.g === g.n)) { toast('구성원이 있는 그룹은 지울 수 없어요. 먼저 다른 그룹으로 옮겨 주세요'); return; }
      if (await confirmBox({ title: `${g.n} 그룹을 지울까요?`, ok: '삭제', danger: true })) { GROUPS.splice(GROUPS.indexOf(g), 1); S.ui.group = null; sheet.close(); render(); }
    });
  }
  acts.groupAdd = () => groupSheet(null);
  acts.groupEdit = () => groupSheet(GROUPS.find((x) => x.n === (S.ui.group || GROUPS[0].n)));

  /* 근무지 등록 · QR */
  function workplaceSheet(w) {
    const edit = !!w;
    const sheet = openSheet({
      title: edit ? '근무지 수정' : '근무지 등록', size: 'lg',
      body: `${ui.field('근무지 이름', `<input class="input sm" id="wN" value="${w?.n || ''}" placeholder="예: 판교점" autofocus>`)}
        ${ui.field('주소', `<div class="copy-in"><input class="input sm" id="wA" value="${w?.a || ''}" placeholder="도로명 주소"><button type="button" class="btn btn-grey btn-sm" id="find">${ic('glyph/search')}찾기</button></div>`)}
        <div class="map" id="map"><div class="map-grid"></div><div class="map-r" id="mapR"></div>${ic('color/gps', 'map-pin')}<span class="map-l">핀을 끌어 정확한 입구 위치를 맞춰요</span></div>
        <div class="field"><span class="field-label">출퇴근 인증</span><div class="pick cards" id="wC">${Object.entries(CERT).map(([k, [i, l]]) => `<button type="button" data-v="${k}" aria-pressed="${(w?.cert || 'qr-gps') === k}">${ic('color/' + i)}${l}</button>`).join('')}</div></div>
        <div class="field" id="rWrap"><span class="field-label">GPS 반경</span>${ui.seg(['50m', '100m', '200m', '300m'], ['50m', '100m', '200m', '300m'].indexOf(w?.r || '100m'), 'block').replace('class="segment ', 'id="wR" class="segment ')}</div>`,
      footer: `<button class="btn btn-grey btn-lg fit" data-close>취소</button><button class="btn btn-primary btn-lg" id="ok">${edit ? '저장' : '등록'}</button>`,
    });
    const $s = sheet.$;
    const sync = () => {
      const c = pickVals($s('#wC'))[0];
      $s('#rWrap').hidden = !c.includes('gps');
      const r = parseInt(segVal($s('#wR')));
      $s('#mapR').style.cssText = `width:${r * 0.9}px;height:${r * 0.9}px;display:${c.includes('gps') ? 'block' : 'none'}`;
      $s('#ok').disabled = !($s('#wN').value.trim() && $s('#wA').value.trim());
    };
    sheet.el.addEventListener('change', sync); sheet.el.addEventListener('input', sync); sync();
    $s('#find').onclick = () => { if (!$s('#wA').value) $s('#wA').value = '경기 성남시 분당구 판교역로 000'; toast('주소를 찾았어요'); sync(); };
    $s('#ok').onclick = () => {
      const v = { n: $s('#wN').value.trim(), a: $s('#wA').value.trim(), cert: pickVals($s('#wC'))[0], r: segVal($s('#wR')) };
      if (edit) Object.assign(w, v); else WORKPLACES.push(v);
      sheet.close(); toast(edit ? '근무지를 저장했어요' : `${v.n}을 등록했어요`, v.cert.includes('qr') ? { label: 'QR 보기', run: () => acts.qr({ dataset: { n: v.n } }) } : null); render();
    };
  }
  acts.workplaceAdd = () => workplaceSheet(null);
  acts.wpMenu = (b) => {
    const w = WORKPLACES.find((x) => x.n === b.dataset.n);
    popover(b, `<button class="p-item" data-k="edit">${ic('mono/edit')}수정</button><button class="p-item" data-k="people">${ic('mono/users')}구성원 보기</button><hr><button class="p-item danger" data-k="del">${ic('mono/trash')}삭제</button>`, (el) => {
      $$('[data-k]', el).forEach((x) => (x.onclick = async () => {
        closePopover();
        if (x.dataset.k === 'edit') workplaceSheet(w);
        if (x.dataset.k === 'people') { S.f.members = { 근무지: [w.n] }; S.tab.members = 0; location.hash = '#/members'; }
        if (x.dataset.k === 'del' && await confirmBox({ title: `${w.n}을 지울까요?`, desc: '이 근무지로 출퇴근하던 구성원은 근무지를 다시 정해야 해요.', ok: '삭제', danger: true })) { WORKPLACES.splice(WORKPLACES.indexOf(w), 1); render(); }
      }));
    }, { width: 180, align: 'right' });
  };
  acts.qr = (b) => {
    const w = WORKPLACES.find((x) => x.n === b.dataset.n) || { n: b.dataset.n };
    const qr = fakeQR(w.n.length * 13 + 5);
    const m = openModal({
      body: `<div class="qr-card" id="qrc">${logo(16)}<div class="qr-box">${qr}</div><b>${w.n}</b><p>워크칩 앱으로 이 QR을 찍어 출퇴근해요</p></div>
        <div class="box"><div class="summary"><div><span>코드 바뀌는 주기</span><b>바뀌지 않음 (인쇄용)</b></div><div><span>인증 방식</span><b>${CERT[w.cert || 'qr'][1]}</b></div></div></div>`,
      footer: `<button class="btn btn-grey btn-lg" id="dl">${ic('mono/download')}이미지</button><button class="btn btn-primary btn-lg" id="pr">인쇄</button>`,
    });
    m.$('#dl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([qr.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" ')], { type: 'image/svg+xml' })); a.download = `워크칩_QR_${w.n}.svg`; a.click(); toast('QR 이미지를 내려받았어요'); };
    m.$('#pr').onclick = () => { const p = window.open('', '_blank', 'width=480,height=640'); if (!p) return toast('팝업이 막혀 있어요'); p.document.write(`<title>${w.n} QR</title><body style="font-family:sans-serif;text-align:center;padding:40px">${qr.replace('class="qr"', 'style="width:320px"')}<h2>${w.n}</h2><p>워크칩 앱으로 찍어 출퇴근해요</p><script>print()<\/script>`); p.document.close(); };
  };

  /* 근무 정책 만들기 · 메뉴 */
  function policySheet(p, type) {
    const edit = !!p;
    const v = p ? { ...p } : { type: type || '고정 근무제' };
    const sheet = openSheet({
      title: edit ? '근무 정책 수정' : '근무 정책 만들기', size: 'lg',
      body: `<div class="field"><span class="field-label">유형</span><div class="pick list" id="pT">
          ${[['고정 근무제', 'nav-attendance', '요일과 시간이 매주 같아요'], ['시차 출퇴근제', 'time-edit', '정해진 시간대 안에서 출근 시각을 골라요'], ['스케줄 근무제', 'nav-schedules', '매주 근무표로 배정해요']].map(([t, i, d]) => `<button type="button" data-v="${t}" aria-pressed="${t === v.type}">${ic('color/' + i)}<span><b>${t}</b><small>${d}</small></span></button>`).join('')}</div></div>
        ${ui.field('정책 이름', `<input class="input sm" id="pN" value="${v.n || ''}" placeholder="예: 본사 근무" autofocus>`)}
        <div id="pBody"></div>
        ${ui.field('휴게시간', ui.seg(['없음', '30분', '1시간', '1시간 30분'], ['없음', '30분', '1시간', '1시간 30분'].indexOf(v.brk || '1시간'), 'block').replace('class="segment ', 'id="pB" class="segment '))}
        <div class="box"><div class="summary" id="pS"></div></div>`,
      footer: '<button class="btn btn-grey btn-lg fit" data-close>취소</button><button class="btn btn-primary btn-lg" id="ok">저장</button>',
    });
    const $s = sheet.$;
    const days = (sel) => `<div class="pick multi days" id="pD">${['월', '화', '수', '목', '금', '토', '일'].map((d, i) => `<button type="button" aria-pressed="${sel.includes(i)}">${d}</button>`).join('')}</div>`;
    const draw = () => {
      const t = pickVals($s('#pT'))[0];
      $s('#pBody').innerHTML = t === '고정 근무제' ? `${ui.field('근무 요일', days([0, 1, 2, 3, 4]))}<div class="row-arrow">${ui.field('출근', '<input class="input sm" type="time" id="pA" value="09:00">')}${ic('glyph/arrow-right')}${ui.field('퇴근', '<input class="input sm" type="time" id="pZ" value="18:00">')}</div>`
        : t === '시차 출퇴근제' ? `${ui.field('근무 요일', days([0, 1, 2, 3, 4]))}<div class="row-arrow">${ui.field('출근 가능 시작', '<input class="input sm" type="time" id="pA" value="08:00">')}${ic('glyph/arrow-right')}${ui.field('출근 가능 끝', '<input class="input sm" type="time" id="pZ" value="11:00">')}</div>${ui.field('하루 근무시간', ui.stepper('pH', 8, '시간'))}`
          : `${ui.field('1주 최대 근무', ui.stepper('pH', 44, '시간').replace('class="stepper"', 'class="stepper" data-max="52"'), '근로기준법 1주 52시간을 넘으면 경고해요')}<div class="box blue">${ic('mono/info')} 근무 요일과 시간은 스케줄 화면에서 근무표로 정해요.</div>`;
      bindControls(sheet.el); sum();
    };
    const sum = () => {
      const t = pickVals($s('#pT'))[0], d = pickVals($s('#pD') || null).length;
      const brk = ['없음', '30분', '1시간', '1시간 30분'].indexOf(segVal($s('#pB'))) * 30;
      let week = '';
      if ($s('#pA') && t === '고정 근무제') { const [a, z] = [$s('#pA').value, $s('#pZ').value].map((x) => +x.split(':')[0] * 60 + +x.split(':')[1]); week = Math.max(0, ((z - a - brk) * d) / 60); }
      else if (t === '시차 출퇴근제') week = +($s('#pH')?.textContent || 8) * d;
      else week = +($s('#pH')?.textContent || 44);
      $s('#pS').innerHTML = `<div><span>1주 소정근로</span><b class="tnum ${week > 52 ? 'err' : ''}">${week}시간${week > 52 ? ' · 52시간 초과' : ''}</b></div>`;
      $s('#ok').disabled = !$s('#pN').value.trim();
      return week;
    };
    $s('#pT').addEventListener('change', draw);
    sheet.el.addEventListener('change', sum); sheet.el.addEventListener('input', sum); sheet.el.addEventListener('click', () => setTimeout(sum));
    draw();
    $s('#ok').onclick = () => {
      const t = pickVals($s('#pT'))[0], dd = pickVals($s('#pD') || null);
      const nv = { n: $s('#pN').value.trim(), type: t, week: sum(), days: t === '스케줄 근무제' ? '배정한 날' : dd.length === 5 && dd.join('') === '월화수목금' ? '월~금' : dd.join('·'), time: t === '스케줄 근무제' ? '근무표 기준' : `${$s('#pA').value}–${$s('#pZ').value}${t === '시차 출퇴근제' ? ' 출근' : ''}`, brk: segVal($s('#pB')), m: p?.m || 0, on: true };
      if (edit) Object.assign(p, nv); else POLICIES.push(nv);
      sheet.close(); S.tab.policies = 0; toast(edit ? '정책을 저장했어요' : `${nv.n} 정책을 만들었어요`); render();
    };
  }
  acts.policyAdd = (b) => policySheet(null, b?.dataset?.type);
  acts.policyMenu = (b) => {
    const p = POLICIES[+b.dataset.i];
    popover(b, `<button class="p-item" data-k="edit">${ic('mono/edit')}수정</button><button class="p-item" data-k="copy">${ic('mono/copy')}복제</button><button class="p-item" data-k="move">${ic(p.on ? 'mono/eye-off' : 'mono/eye')}${p.on ? '비활성으로 옮기기' : '다시 쓰기'}</button><hr><button class="p-item danger" data-k="del">${ic('mono/trash')}삭제</button>`, (el) => {
      $$('[data-k]', el).forEach((x) => (x.onclick = async () => {
        closePopover();
        const k = x.dataset.k;
        if (k === 'edit') policySheet(p);
        if (k === 'copy') { POLICIES.push({ ...p, n: p.n + ' 사본', m: 0 }); toast('정책을 복제했어요'); render(); }
        if (k === 'move') { if (p.m && p.on) { toast(`구성원 ${p.m}명이 쓰고 있어요. 먼저 다른 정책으로 옮겨 주세요`); return; } p.on = !p.on; render(); }
        if (k === 'del') { if (p.m) { toast(`구성원 ${p.m}명이 쓰고 있어 지울 수 없어요`); return; } if (await confirmBox({ title: `${p.n}을 지울까요?`, ok: '삭제', danger: true })) { POLICIES.splice(POLICIES.indexOf(p), 1); render(); } }
      }));
    }, { width: 200, align: 'right' });
  };

  A.start();
})();
