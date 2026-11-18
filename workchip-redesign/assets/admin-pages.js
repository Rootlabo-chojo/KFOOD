/* 관리자 시안 — 페이지 (스케줄 제외) */
(function () {
  const { $, $$, S, MEMBERS, WORKPLACES, CERT, GROUPS, POLICIES, LEAVES, REQS, INVITES, DEVICES, PAGES, ph, tabs, fchip, tsearch, filt, person, initial, roleBadge, empty, tfoot, tabOf, render } = A;
  const byName = (n) => MEMBERS.find((m) => m.n === n) || { n, g: '', t: '' };
  const muted = '<span class="muted">—</span>';

  /* ───────────── 홈 ───────────── */
  PAGES.home = function () {
    const pts = [83, 90, 86, 80, 88, 92, 85, 79, 84, 87, 91, 83, 86, 80, 88, 84, 89, 83];
    const late = [12, 6, 9, 14, 7, 4, 10, 16, 11, 8, 5, 12, 9, 15, 7, 11, 6, 17];
    const sel = S.ui.homeChart || 'ok';
    const data = sel === 'ok' ? pts : late;
    const [lo, hi] = sel === 'ok' ? [60, 100] : [0, 20];
    const W = 600, H = 160, step = W / (data.length - 1);
    const y = (v) => H - ((v - lo) / (hi - lo)) * H;
    const path = data.map((v, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) / 4) * i);
    const grid = ticks.map((g) => `<line x1="0" x2="${W}" y1="${y(g)}" y2="${y(g)}" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join('');
    const ylab = ticks.map((g) => `<span class="yl tnum" style="top:${(y(g) / H) * 100}%">${g}%</span>`).join('');
    const xlab = ['10.6', '10.10', '10.14', '10.20', '10.26'].map((l, i) => `<span class="xl tnum" style="left:${i * 25}%">${l}</span>`).join('');
    const avg = (data.reduce((a, b) => a + b, 0) / data.length).toFixed(1);
    const todo = [['time-edit', '출퇴근 기록 요청', REQS.length, 'attendance', 1], ['calendar-check', '휴가 신청', LEAVES.filter((l) => l.st === 'pending').length, 'leave', 0], ['device-check', '확인할 기기', DEVICES.filter((d) => d.st === 'pending').length, 'members', 2], ['schedule-notify', '알리지 않은 스케줄 변경', 0, 'schedules', 0]];
    const issues = [['출근 전', 8], ['반경 밖', 0], ['지각', 0], ['다른 근무지', 0], ['조퇴', 0], ['다른 기기', 0], ['퇴근 누락', 0], ['예정 없는 출근', 1]];
    const groups = [['경영지원', 92], ['외식사업', 88], ['성수점', 84], ['고잔점', 79], ['구월점', 95], ['배곧점', 81]];
    const onLeave = LEAVES.filter((l) => l.st === 'approved');
    return ph('오늘 운영', '10월 27일 화요일 · 오후 5:53 기준', `${fchip('근무지', 'mono/map-pin')}<a class="btn btn-primary" href="#/attendance">출퇴근 현황 보기</a>`) + `
    <div class="home-grid">
      <div class="grid">
        <div class="kpis">
          <a class="kpi" href="#/attendance"><span>오늘 출근</span><b class="tnum">1<small>/ 9명</small></b><em>출근 전 8명</em></a>
          <a class="kpi" href="#/attendance"><span>지금 근무 중</span><b class="tnum">1<small>명</small></b><em>예정 없는 출근 1명</em></a>
          <a class="kpi" href="#/attendance"><span>오늘 지각</span><b class="tnum">0<small>건</small></b><em>최근 평균 10.5%</em></a>
          <a class="kpi" href="#/leave"><span>오늘 휴가</span><b class="tnum">${onLeave.length}<small>명</small></b><em>내일 1명</em></a>
        </div>
        <section class="card">
          <div class="card-h"><h2>${sel === 'ok' ? '정상 출근율' : '지각률'}<small>최근 근무일 18일 · 평균 ${avg}%</small></h2>
            <div class="segment" id="homeSeg"><button data-v="ok" aria-selected="${sel === 'ok'}">정상 출근율</button><button data-v="late" aria-selected="${sel === 'late'}">지각률</button></div></div>
          <div class="chart"><div class="chart-plot" style="left:0;right:0;bottom:24px">${ylab}</div>
            <div class="chart-plot"><div style="position:absolute;inset:0 0 -24px">${xlab}</div>
            <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${grid}
              <path d="${path} L${W} ${H} L0 ${H}Z" fill="var(--primary)" opacity=".06"/>
              <path d="${path}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
            <span class="chart-dot" style="top:calc(${(y(data.at(-1)) / H) * 100}% - 5px)"></span>
          </div></div>
        </section>
        <section class="card">
          <div class="card-h"><h2>특이사항<small>근태 이상 0명</small></h2><a class="link" href="#/attendance">출퇴근 현황에서 보기${ic('glyph/chevron-right')}</a></div>
          <div class="stat-list">${issues.map(([l, v]) => `<div class="stat-row"><span>${l}</span><b class="tnum ${v ? '' : 'zero'}">${v}</b></div>`).join('')}</div>
        </section>
        <section class="card">
          <div class="card-h"><h2>그룹별 정상 출근율<small>이번 달</small></h2><a class="link" href="#/attendance" data-act="monthly">월간 집계${ic('glyph/chevron-right')}</a></div>
          ${groups.map(([g, v]) => `<div class="hbar"><span>${g}</span><div class="bar"><i style="width:${v}%"></i></div><b class="tnum">${v}%</b></div>`).join('')}
        </section>
      </div>
      <div class="grid">
        <section class="card">
          <div class="card-h"><h2>처리할 일<small>${todo.reduce((a, t) => a + t[2], 0)}건</small></h2></div>
          ${todo.map(([i, l, n, r, tab]) => `<a class="list-row" href="#/${r}" data-goto="${r}" data-tab="${tab}">${ic('color/' + i, 'lead')}<span class="txt"><b>${l}</b></span><span class="val tnum ${n ? '' : 'zero'}">${n}</span>${ic('glyph/chevron-right')}</a>`).join('')}
        </section>
        <section class="card">
          <div class="card-h"><h2>휴가</h2><a class="link" href="#/leave" data-goto="leave" data-tab="1">캘린더${ic('glyph/chevron-right')}</a></div>
          <div class="day-group"><div class="day-h"><b>오늘 10.27 (화)</b><span>${onLeave.length}명</span></div>
            ${onLeave.map((l) => `<div class="list-row"><span class="avatar">${initial(l.n)}</span><span class="txt"><b>${l.n}</b><small>${byName(l.n).g} · ${l.type} · ${l.to}까지</small></span></div>`).join('')}</div>
          <div class="day-group"><div class="day-h"><b>내일 10.28 (수)</b><span>1명</span></div>
            <div class="list-row"><span class="avatar">하늘</span><span class="txt"><b>김하늘</b><small>경영지원 · 연차</small></span></div></div>
          <div class="day-group"><div class="day-h"><b>모레 10.29 (목)</b><span>0명</span></div>
            <div class="none-line">휴가 없음</div></div>
        </section>
      </div>
    </div>`;
  };
  A.after.home = (p) => {
    $('#homeSeg', p).addEventListener('change', (e) => { S.ui.homeChart = e.detail; render(); });
  };
  // 다른 화면의 특정 탭으로 바로 가기
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-goto]'); if (!g) return;
    S.tab[g.dataset.goto] = +g.dataset.tab;
  });

  /* ───────────── 출퇴근 ───────────── */
  const ST = { work: ['근무 중', 'badge-green'], before: ['출근 전', 'badge-grey'], leave: ['휴가', 'badge-blue'], off: ['휴무', 'badge-grey'] };
  const ISSUE = ['지각', '조퇴', '퇴근 누락', '반경 밖', '다른 근무지', '다른 기기'];
  PAGES.attendance = function () {
    const tab = tabOf('attendance');
    const head = ph('출퇴근', '근무 정책·스케줄 기준으로 판정한 오늘의 출퇴근이에요.', tab === 0 ? `<button class="btn btn-grey" data-act="export" data-k="attendance">${ic('mono/download')}내보내기</button>` : '') +
      tabs(['현황', ['승인', REQS.length || null], '결재선', '설정']);
    if (tab === 1) return head + approvals();
    if (tab === 2) return head + approvalLine('출퇴근 기록 요청');
    if (tab === 3) return head + attSettings();
    const daily = (S.ui.attView || 'day') === 'day';
    const st = S.st.attendance || 'all';
    const all = filt(MEMBERS);
    const rows = all.filter((m) => st === 'all' || m.st === st || (st === 'rest' && (m.st === 'leave' || m.st === 'off')));
    const cnt = (k) => all.filter((m) => m.st === k).length;
    const sc = (k, l, n, icon) => `<button class="chip" data-st="${k}" aria-pressed="${st === k}">${icon ? ic(icon) : ''}${l} <span class="num tnum">${n}</span></button>`;
    const off = S.ui.attDay || 0;
    const d = new Date(2026, 9, 27 + off);
    const dl = `${d.getMonth() + 1}월 ${d.getDate()}일 (${'일월화수목금토'[d.getDay()]})`;
    const toolbar = `
      <div class="toolbar">
        <div class="segment" id="attView"><button data-v="day" aria-selected="${daily}">일별</button><button data-v="month" aria-selected="${!daily}">월별 집계</button></div>
        <div class="datenav"><button class="icon-btn" data-act="attDay" data-d="-1" aria-label="이전">${ic('glyph/chevron-left')}</button><b class="tnum">${daily ? dl : `${d.getFullYear()}년 ${d.getMonth() + 1}월`}</b><button class="icon-btn" data-act="attDay" data-d="1" aria-label="다음">${ic('glyph/chevron-right')}</button></div>
        ${off ? '<button class="btn btn-sm btn-weak" data-act="attDay" data-d="0">오늘</button>' : ''}
        <div class="spacer"></div>${fchip('근무지')}${fchip('그룹')}${fchip('직무')}${tsearch('이름 찾기')}
      </div>`;
    if (!daily) {
      const mrows = all.map((m, i) => { const w = 18 - (i % 3), l = i % 4 === 1 ? 1 : 0; return `<tr data-act="attRow" data-n="${m.n}"><td>${person(m)}</td><td class="tnum r">${w}일</td><td class="tnum r">${w * 8}시간</td><td class="tnum r ${l ? '' : 'muted'}">${l}회</td><td class="tnum r muted">0회</td><td class="tnum r muted">0회</td><td class="tnum r">${(((w - l) / w) * 100).toFixed(1)}%</td></tr>`; }).join('');
      return head + toolbar + `<div class="table-card"><div class="t-scroll"><table class="t"><thead><tr><th>구성원</th><th class="r">근무일</th><th class="r">근무시간</th><th class="r">지각</th><th class="r">조퇴</th><th class="r">결근</th><th class="r">정상 출근율</th></tr></thead><tbody>${mrows}</tbody></table></div>${tfoot(all.length, 62)}</div>`;
    }
    const body = rows.map((m) => {
      const [l, c] = ST[m.st];
      return `<tr data-act="attRow" data-n="${m.n}"><td>${person(m)}</td><td><span class="badge ${c}">${l}</span></td>
        <td>${m.plan ? `${m.plan}${m.sub ? `<div class="muted sm">${m.sub}</div>` : ''}` : muted}</td>
        <td class="tnum">${m.in || muted}</td><td>${muted}</td><td class="tnum">${m.in ? '7시간 58분' : muted}</td><td>${m.in ? m.wp : muted}</td></tr>`;
    }).join('');
    return head + toolbar + `
      <div class="toolbar chips-scroll">
        ${sc('all', '전체', all.length)}${sc('work', '근무 중', cnt('work'))}${sc('before', '출근 전', cnt('before'))}${sc('rest', '휴가·휴무', cnt('leave') + cnt('off'))}
        <button class="chip" data-act="issues">${ic('color/alert')}근태 이상 <span class="num tnum">0</span>${ic('glyph/chevron-down')}</button>
      </div>
      <div class="table-card"><div class="t-scroll"><table class="t clickable">
        <thead><tr><th>구성원</th><th>상태</th><th>근무 계획</th><th>출근</th><th>퇴근</th><th>근무</th><th>근무지</th></tr></thead>
        <tbody>${body || `<tr><td colspan="7" class="empty-td">조건에 맞는 구성원이 없어요</td></tr>`}</tbody></table></div>
        ${tfoot(rows.length, 62)}</div>`;
  };
  A.after.attendance = (p) => {
    $('#attView', p)?.addEventListener('change', (e) => { S.ui.attView = e.detail; render(); });
    $$('[data-st]', p).forEach((b) => (b.onclick = () => { S.st.attendance = b.dataset.st; render(); }));
  };
  A.acts.attDay = (b) => { const d = +b.dataset.d; S.ui.attDay = d ? (S.ui.attDay || 0) + d * ((S.ui.attView || 'day') === 'day' ? 1 : 30) : 0; render(); };
  A.acts.issues = (b) => popover(b, `<div class="p-sec">근태 이상 · 오늘</div>${ISSUE.map((l) => `<button class="p-item">${l}<span class="end tnum">0명</span></button>`).join('')}`, null, { width: 200 });
  A.acts.monthly = () => { S.tab.attendance = 0; S.ui.attView = 'month'; };

  function approvals() {
    if (!REQS.length) return `<div class="table-card">${empty('ap-approved', '처리할 요청이 없어요', '직원이 앱에서 출퇴근 기록을 고쳐 달라고 하면 여기에 모여요.')}</div>`;
    return `<div class="req-list">${REQS.map((r, i) => `
      <div class="req">${ic('color/' + r.k, 'lead')}
        <div class="req-t"><div class="req-top"><b>${r.n}</b><span class="badge badge-orange">${ic('color/ap-pending')}승인 대기</span></div>
          <p><b>${r.l}</b> · ${r.d} · ${r.v}</p><small>“${r.why}”</small></div>
        <div class="req-a"><button class="btn btn-grey btn-sm" data-act="reqDo" data-i="${i}" data-ok="0">반려</button><button class="btn btn-primary btn-sm" data-act="reqDo" data-i="${i}" data-ok="1">승인</button></div>
      </div>`).join('')}</div>`;
  }
  A.acts.reqDo = async (b) => {
    const r = REQS[+b.dataset.i], ok = b.dataset.ok === '1';
    if (!ok && !(await confirmBox({ title: `${r.n}님의 요청을 반려할까요?`, desc: '반려하면 직원 앱에 알림이 가요.', ok: '반려', danger: true }))) return;
    REQS.splice(+b.dataset.i, 1);
    toast(ok ? `${r.n}님의 ${r.l} 요청을 승인했어요` : '요청을 반려했어요', { label: '되돌리기', run: () => { REQS.splice(+b.dataset.i, 0, r); A.route(); } });
    A.route();
  };
  function approvalLine(what) {
    const steps = S.ui.line = S.ui.line || [{ who: '그룹 리더', d: '구성원이 속한 그룹의 리더' }, { who: '관리자', d: '소유자 · 관리자 중 한 명' }];
    return `<section class="card form-card"><div class="card-h"><h2>${what} 결재선</h2><button class="btn btn-grey btn-sm" data-act="lineAdd">${ic('glyph/plus')}단계 추가</button></div>
      <p class="card-desc">요청이 들어오면 위에서부터 차례로 승인해요. 앞 단계가 승인해야 다음 단계에 알림이 가요.</p>
      <ol class="line">${steps.map((s, i) => `<li><span class="line-n">${i + 1}</span><span class="txt"><b>${s.who}</b><small>${s.d}</small></span>${steps.length > 1 ? `<button class="icon-btn" data-act="lineDel" data-i="${i}" aria-label="단계 삭제">${ic('mono/trash')}</button>` : ''}</li>`).join('')}
        <li class="line-end">${ic('color/ap-approved')}<span class="txt"><b>승인 완료</b><small>근태·스케줄에 바로 반영돼요</small></span></li></ol></section>`;
  }
  A.acts.lineAdd = (b) => popover(b, ['그룹 리더', '상위 그룹 리더', '관리자', '소유자'].map((w) => `<button class="p-item" data-w="${w}">${w}</button>`).join(''), (el) => $$('[data-w]', el).forEach((x) => (x.onclick = () => { S.ui.line.push({ who: x.dataset.w, d: x.dataset.w === '소유자' ? '회사 소유자' : '지정한 역할 중 한 명' }); closePopover(); render(); })), { width: 180, align: 'right' });
  A.acts.lineDel = (b) => { S.ui.line.splice(+b.dataset.i, 1); render(); };
  function attSettings() {
    const row = (t, d, ctl) => `<div class="set-row"><div><b>${t}</b><small>${d}</small></div>${ctl}</div>`;
    return `<section class="card form-card form-sec"><div class="card-h"><h2>판정 기준</h2></div>
        ${row('지각 허용 시간', '출근 시각보다 이만큼 늦어도 정상으로 봐요.', ui.stepper('late', 5, '분'))}
        ${row('조퇴 허용 시간', '퇴근 시각보다 이만큼 일찍 나가도 정상으로 봐요.', ui.stepper('early', 0, '분'))}
        ${row('출근 가능 시간', '출근 시각 몇 분 전부터 출근을 찍을 수 있어요.', ui.stepper('before', 60, '분'))}</section>
      <section class="card form-card form-sec"><div class="card-h"><h2>자동 처리</h2></div>
        ${row('자동 퇴근', '퇴근을 안 찍으면 퇴근 시각 4시간 뒤 자동으로 퇴근 처리해요.', ui.switch(true))}
        ${row('퇴근 10분 전 알림', '직원 앱으로 퇴근 기록 알림을 보내요.', ui.switch(true))}
        ${row('다른 기기 출퇴근 막기', '등록한 기기로만 출퇴근할 수 있어요.', ui.switch(false))}</section>
      <div class="form-actions"><button class="btn btn-primary btn-lg" data-act="saved">저장</button></div>`;
  }
  A.acts.saved = () => toast('저장했어요');

  /* ───────────── 휴가 ───────────── */
  const LST = { pending: ['대기', 'ap-pending', 'badge-orange'], approved: ['승인', 'ap-approved', 'badge-green'], rejected: ['반려', 'ap-rejected', 'badge-red'], cancelled: ['취소', 'ap-cancelled', 'badge-grey'] };
  PAGES.leave = function () {
    const tab = tabOf('leave');
    const head = ph('휴가', '직원이 앱에서 신청한 휴가를 승인해요. 승인하면 근태와 스케줄에 바로 반영돼요.', `<button class="btn btn-primary" data-act="leaveAdd">${ic('glyph/plus')}휴가 등록</button>`) +
      tabs(['신청', '캘린더', '연차 현황', '유형', '결재선']);
    if (tab === 1) return head + leaveCal();
    if (tab === 2) return head + leaveBalance();
    if (tab === 3) return head + leaveTypes();
    if (tab === 4) return head + approvalLine('휴가 신청');
    const st = S.st.leave || 'pending';
    const list = filt(LEAVES.map((l) => ({ ...byName(l.n), ...l })));
    const rows = list.filter((l) => st === 'all' || l.st === st);
    const chip = (k) => `<button class="chip" data-lst="${k}" aria-pressed="${st === k}">${k === 'all' ? '' : ic('color/' + LST[k][1])}${k === 'all' ? '전체' : LST[k][0]} <span class="num tnum">${k === 'all' ? list.length : list.filter((l) => l.st === k).length}</span></button>`;
    const body = rows.map((l) => `<tr><td>${person(l)}</td><td>${l.type}</td><td class="tnum">${l.from === l.to ? l.from : `${l.from} – ${l.to}`}</td><td class="tnum">${l.days}일</td><td class="ellip">${l.reason}</td>
      <td><span class="badge ${LST[l.st][2]}">${LST[l.st][0]}</span></td>
      <td class="r">${l.st === 'pending' ? `<button class="btn btn-grey btn-sm" data-act="leaveDo" data-i="${LEAVES.indexOf(LEAVES.find((x) => x.n === l.n && x.from === l.from))}" data-ok="0">반려</button> <button class="btn btn-primary btn-sm" data-act="leaveDo" data-i="${LEAVES.findIndex((x) => x.n === l.n && x.from === l.from)}" data-ok="1">승인</button>` : muted}</td></tr>`).join('');
    return head + `
      <div class="toolbar"><div class="chips-scroll">${chip('pending')}${chip('approved')}${chip('rejected')}${chip('cancelled')}${chip('all')}</div>
        <div class="spacer"></div>${fchip('그룹')}${tsearch('이름 찾기')}</div>
      <div class="table-card">${rows.length ? `<div class="t-scroll"><table class="t"><thead><tr><th>구성원</th><th>유형</th><th>기간</th><th>일수</th><th>사유</th><th>상태</th><th class="r">처리</th></tr></thead><tbody>${body}</tbody></table></div>` :
        empty('nav-leave', st === 'pending' ? '대기 중인 휴가 신청이 없어요' : '해당하는 휴가가 없어요', '직원이 앱에서 휴가를 신청하면 여기에 보여요.')}</div>`;
  };
  A.after.leave = (p) => $$('[data-lst]', p).forEach((b) => (b.onclick = () => { S.st.leave = b.dataset.lst; render(); }));
  A.acts.leaveDo = (b) => { const l = LEAVES[+b.dataset.i]; l.st = b.dataset.ok === '1' ? 'approved' : 'rejected'; toast(`${l.n}님 휴가를 ${l.st === 'approved' ? '승인' : '반려'}했어요`); render(); };
  function leaveCal() {
    const first = new Date(2026, 9, 1).getDay(); // 목
    const lead = (first + 6) % 7;
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push('<div class="mc dim"></div>');
    for (let d = 1; d <= 31; d++) {
      const ls = LEAVES.filter((l) => l.st !== 'cancelled' && l.st !== 'rejected' && +l.from.split('.')[1] <= d && d <= +l.to.split('.')[1]);
      const dow = (lead + d - 1) % 7;
      cells.push(`<div class="mc ${d === 27 ? 'today' : ''} ${dow === 6 ? 'sun' : dow === 5 ? 'sat' : ''}"><span class="mc-d tnum">${d}</span>${ls.map((l) => `<span class="mc-ev ${l.st}">${l.n} · ${l.type}</span>`).join('')}</div>`);
    }
    return `<div class="toolbar"><div class="datenav"><button class="icon-btn" aria-label="이전 달" data-act="noop">${ic('glyph/chevron-left')}</button><b>2026년 10월</b><button class="icon-btn" aria-label="다음 달" data-act="noop">${ic('glyph/chevron-right')}</button></div><div class="spacer"></div><span class="legend-i"><i class="approved"></i>승인</span><span class="legend-i"><i class="pending"></i>대기</span></div>
      <div class="table-card"><div class="t-scroll"><div class="month">${['월', '화', '수', '목', '금', '토', '일'].map((d) => `<div class="mh">${d}</div>`).join('')}${cells.join('')}</div></div></div>`;
  }
  A.acts.noop = () => {};
  function leaveBalance() {
    const rows = filt(MEMBERS).map((m, i) => { const g = 15 + (i % 3), u = m.n === '김하늘' ? 2 : i % 5; return `<tr><td>${person(m)}</td><td class="tnum r">${g}일</td><td class="tnum r">${u}일</td><td class="tnum r"><b>${g - u}일</b></td><td style="width:30%"><div class="bar"><i style="width:${(u / g) * 100}%"></i></div></td></tr>`; }).join('');
    return `<div class="toolbar"><span class="muted-t">2026년 · 입사일 기준</span><div class="spacer"></div>${fchip('그룹')}${tsearch('이름 찾기')}</div>
      <div class="table-card"><div class="t-scroll"><table class="t"><thead><tr><th>구성원</th><th class="r">부여</th><th class="r">사용</th><th class="r">잔여</th><th>사용률</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }
  function leaveTypes() {
    const T = S.ui.ltypes = S.ui.ltypes || [['연차', '1일 · 연차에서 차감', true], ['오전 반차', '0.5일 · 연차에서 차감', true], ['오후 반차', '0.5일 · 연차에서 차감', true], ['경조사', '회사 규정 일수 · 유급', true], ['병가', '최대 30일 · 무급', false], ['무급 휴가', '차감 없음 · 무급', false]];
    return `<section class="card form-card"><div class="card-h"><h2>휴가 유형</h2><button class="btn btn-grey btn-sm" data-act="ltypeAdd">${ic('glyph/plus')}유형 추가</button></div>
      ${T.map(([n, d, on], i) => `<div class="set-row"><div><b>${n}</b><small>${d}</small></div><label class="switch"><input type="checkbox" data-lt="${i}" ${on ? 'checked' : ''}><i></i></label></div>`).join('')}</section>`;
  }
  document.addEventListener('change', (e) => { if (e.target.matches('[data-lt]')) { S.ui.ltypes[+e.target.dataset.lt][2] = e.target.checked; toast(e.target.checked ? '직원 앱에서 고를 수 있어요' : '직원 앱에서 숨겼어요'); } });

  /* ───────────── 구성원 ───────────── */
  const DEV = { ok: ['사용 중', 'badge-green', 'device-check'], pending: ['확인 필요', 'badge-orange', 'dev-switch'], borrowed: ['빌린 기기', 'badge-blue', 'dev-borrowed'] };
  PAGES.members = function () {
    const tab = tabOf('members');
    const head = ph('구성원', '회사에 소속된 사람들이에요. 재직 중인 구성원 수가 과금 좌석이 돼요.', `<button class="btn btn-primary" data-act="memberAdd">${ic('glyph/plus')}구성원 추가</button>`) +
      tabs([['구성원', MEMBERS.length], ['초대 현황', INVITES.filter((x) => x.st === '대기').length], '출퇴근 기기', '기기 변경 기록']);
    if (tab === 1) {
      return head + `<div class="table-card"><div class="t-scroll"><table class="t"><thead><tr><th>이름</th><th>연락처</th><th>방법</th><th>보낸 날</th><th>상태</th><th class="r"></th></tr></thead><tbody>
        ${INVITES.map((v, i) => `<tr><td><b class="strong">${v.n}</b></td><td class="tnum">${v.c}</td><td>${v.via}</td><td class="tnum">${v.at}</td><td><span class="badge ${v.st === '대기' ? 'badge-orange' : 'badge-grey'}">${v.st}</span></td>
          <td class="r"><button class="btn btn-grey btn-sm" data-act="invAgain" data-i="${i}">다시 보내기</button> <button class="btn btn-ghost btn-sm" data-act="invDel" data-i="${i}">취소</button></td></tr>`).join('')}
        </tbody></table></div></div>`;
    }
    if (tab === 2) {
      return head + `<div class="table-card"><div class="t-scroll"><table class="t"><thead><tr><th>구성원</th><th>기기</th><th>상태</th><th>등록일</th><th class="r"></th></tr></thead><tbody>
        ${DEVICES.map((d, i) => `<tr><td>${person(MEMBERS.find((m) => m.n === d.n))}</td><td><span class="wp-cert">${ic('color/' + DEV[d.st][2])}${d.d}</span></td><td><span class="badge ${DEV[d.st][1]}">${DEV[d.st][0]}</span></td><td class="tnum">${d.at}</td>
          <td class="r">${d.st === 'pending' ? `<button class="btn btn-primary btn-sm" data-act="devOk" data-i="${i}">이 기기 승인</button>` : `<button class="btn btn-grey btn-sm" data-act="devOff" data-i="${i}">등록 해제</button>`}</td></tr>`).join('')}
        </tbody></table></div></div>`;
    }
    if (tab === 3) {
      const H = [['10.26 14:02', '서다은', 'dev-switch', '새 기기로 바꾸기 요청', 'iPhone 13 · 휴대폰을 바꿨어요'], ['10.21 09:58', '오세린', 'dev-borrowed', '빌린 기기로 출근', 'Galaxy A54 · 휴대폰을 두고 왔어요'], ['10.12 18:40', '박서준', 'dev-released', '기기 등록 해제', '관리자 · 김하늘'], ['10.03 10:11', '한유진', 'device-check', '기기 승인', 'Galaxy S24']];
      return head + `<section class="card"><ol class="timeline">${H.map(([t, n, i, l, d]) => `<li>${ic('color/' + i, 'lead')}<span class="txt"><b>${n} · ${l}</b><small>${d}</small></span><span class="tl-t tnum">${t}</span></li>`).join('')}</ol></section>`;
    }
    const seg = S.ui.memSeg || '재직';
    const list = filt(MEMBERS);
    const rows = list.map((m) => `<tr data-act="memberEdit" data-n="${m.n}"><td>${person(m, m.email)}</td>
      <td><span class="badge ${roleBadge(m.role)}">${m.role}</span></td><td>${m.g}</td><td>${m.wp}</td><td>${m.t}</td><td>${m.pol}</td><td class="tnum">${m.join}</td>
      <td class="r"><span class="badge badge-green">재직</span></td></tr>`).join('');
    return head + `
      <div class="toolbar">${ui.seg(['재직', '비활성', '전체'], ['재직', '비활성', '전체'].indexOf(seg)).replace('class="segment ', 'id="memSeg" class="segment ')}
        <div class="spacer"></div>${fchip('근무지')}${fchip('그룹')}${fchip('역할')}${fchip('고용 형태')}${tsearch('이름·이메일')}</div>
      <div class="table-card">${seg === '비활성' ? empty('nav-members', '비활성 구성원이 없어요', '퇴사하거나 쉬는 구성원을 비활성으로 바꾸면 여기에 모여요.') : `<div class="t-scroll"><table class="t clickable">
        <thead><tr><th>이름</th><th>역할</th><th>그룹</th><th>근무지</th><th>직무</th><th>근무 정책</th><th>입사일</th><th class="r">상태</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="8" class="empty-td">조건에 맞는 구성원이 없어요</td></tr>`}</tbody></table></div>${tfoot(list.length, MEMBERS.length)}`}</div>`;
  };
  A.after.members = (p) => $('#memSeg', p)?.addEventListener('change', (e) => { S.ui.memSeg = e.detail; render(); });
  A.acts.invAgain = (b) => { const v = INVITES[+b.dataset.i]; v.st = '대기'; v.at = '10.27'; toast(`${v.n}님께 초대를 다시 보냈어요`); render(); };
  A.acts.invDel = async (b) => { if (await confirmBox({ title: '초대를 취소할까요?', desc: '보낸 링크로 더는 가입할 수 없어요.', ok: '초대 취소', danger: true })) { INVITES.splice(+b.dataset.i, 1); render(); } };
  A.acts.devOk = (b) => { DEVICES[+b.dataset.i].st = 'ok'; toast('이 기기로 출퇴근할 수 있어요'); render(); };
  A.acts.devOff = async (b) => { const d = DEVICES[+b.dataset.i]; if (await confirmBox({ title: `${d.n}님 기기 등록을 해제할까요?`, desc: '다음 출근 때 새 기기를 등록해요.', ok: '해제', danger: true, icon: 'color/dev-released' })) { DEVICES.splice(+b.dataset.i, 1); render(); } };

  /* ───────────── 그룹 ───────────── */
  PAGES.groups = function () {
    const cur = S.ui.group || GROUPS[0].n;
    const g = GROUPS.find((x) => x.n === cur) || GROUPS[0];
    const cnt = (n) => MEMBERS.filter((m) => m.g === n || GROUPS.find((x) => x.n === m.g)?.p === n).length;
    const tree = [`<button data-g="" class="d0 ${''}">${ic('mono/org')}전체<span class="n tnum">62</span></button>`]
      .concat(GROUPS.filter((x) => !x.p).flatMap((top) => [top, ...GROUPS.filter((c) => c.p === top.n)]).map((x) => `<button data-g="${x.n}" class="d${x.p ? 1 : 0}" aria-current="${x.n === g.n}">${ic('mono/team')}${x.n}<span class="n tnum">${cnt(x.n)}</span></button>`));
    const mem = MEMBERS.filter((m) => m.g === g.n);
    return ph('그룹', '그룹마다 리더를 정하면 휴가·근태 승인을 나눠 맡길 수 있어요.', `<button class="btn btn-primary" data-act="groupAdd">${ic('glyph/plus')}그룹 만들기</button>`) + `
      <div class="org">
        <section class="card tree">${tree.join('')}</section>
        <section class="card">
          <div class="card-h"><h2>${g.n}<small>${mem.length}명 · ${g.p ? `${g.p} 아래` : '최상위'}</small></h2><button class="btn btn-grey btn-sm" data-act="groupEdit">${ic('mono/edit')}편집</button></div>
          <div class="list-row leader">${ic(g.approve ? 'color/ap-approved' : 'color/ap-waiting', 'lead')}<span class="txt"><b>리더 · ${g.leader}</b><small>${g.approve ? '휴가·근태 승인 권한 있음' : '승인 권한 없음 · 알림만 받아요'}</small></span></div>
          ${mem.length ? mem.map((m) => `<div class="list-row"><span class="avatar">${initial(m.n)}</span><span class="txt"><b>${m.n}</b><small>${m.t}</small></span><span class="badge ${roleBadge(m.role)}">${m.role}</span></div>`).join('') : '<div class="none-line">아직 구성원이 없어요</div>'}
        </section>
      </div>`;
  };
  A.after.groups = (p) => $$('[data-g]', p).forEach((b) => (b.onclick = () => { if (b.dataset.g) { S.ui.group = b.dataset.g; render(); } else location.hash = '#/members'; }));

  /* ───────────── 근무지 ───────────── */
  PAGES.workplaces = function () {
    const st = S.st.workplaces || 'all';
    const reg = A.S.f.workplaces?.지역 || [];
    const q = (S.q.workplaces || '').trim();
    const base = WORKPLACES.filter((w) => (!reg.length || reg.includes(w.a.split(' ')[0])) && (!q || (w.n + w.a).includes(q)));
    const list = base.filter((w) => st === 'all' || w.cert === st);
    const count = (n) => MEMBERS.filter((m) => m.wp === n).length;
    const chip = (k) => `<button class="chip" data-wst="${k}" aria-pressed="${st === k}">${k === 'all' ? '' : ic('color/' + CERT[k][0])}${k === 'all' ? '전체' : CERT[k][1]} <span class="num tnum">${k === 'all' ? base.length : base.filter((w) => w.cert === k).length}</span></button>`;
    const rows = list.map((w, i) => `<tr><td><div class="person"><span class="lead36">${ic('color/nav-workplaces')}</span><span class="person-t"><b>${w.n}</b><small>${w.a}</small></span></div></td>
      <td><span class="wp-cert">${ic('color/' + CERT[w.cert][0])}${CERT[w.cert][1]}${w.cert !== 'qr' && w.cert !== 'none' ? `<span class="muted"> · ${w.r}</span>` : ''}</span></td>
      <td class="tnum">${count(w.n)}명</td>
      <td class="r">${w.cert.includes('qr') ? `<button class="btn btn-grey btn-sm" data-act="qr" data-n="${w.n}">${ic('mono/qr-code')}QR 보기</button>` : ''}<button class="icon-btn" data-act="wpMenu" data-n="${w.n}" aria-label="더 보기">${ic('mono/more')}</button></td></tr>`).join('');
    return ph('근무지', '직원이 출퇴근할 장소와 인증 방법을 정해요.', `<button class="btn btn-primary" data-act="workplaceAdd">${ic('glyph/plus')}근무지 등록</button>`) + `
      <div class="toolbar"><div class="chips-scroll">${chip('all')}${chip('gps')}${chip('qr')}${chip('qr-gps')}${chip('none')}</div>
        <div class="spacer"></div>${fchip('지역')}${tsearch('근무지명·주소')}</div>
      <div class="table-card">${list.length ? `<div class="t-scroll"><table class="t"><thead><tr><th>근무지</th><th>출퇴근 인증</th><th>구성원</th><th class="r"></th></tr></thead><tbody>${rows}</tbody></table></div>` : empty('nav-workplaces', '해당하는 근무지가 없어요', '필터를 바꾸거나 새 근무지를 등록해 보세요.')}</div>`;
  };
  A.after.workplaces = (p) => $$('[data-wst]', p).forEach((b) => (b.onclick = () => { S.st.workplaces = b.dataset.wst; render(); }));

  /* ───────────── 근무 정책 ───────────── */
  const PT = { '고정 근무제': 'nav-attendance', '시차 출퇴근제': 'time-edit', '스케줄 근무제': 'nav-schedules' };
  PAGES.policies = function () {
    const tab = tabOf('policies');
    const list = POLICIES.filter((p) => p.on === (tab === 0));
    const used = (t) => POLICIES.filter((p) => p.on && p.type === t).reduce((a, p) => a + p.m, 0);
    const card = (t, d) => `<button class="ptype" data-act="policyAdd" data-type="${t}">${ic('color/' + PT[t])}<b>${t}</b><p>${d}</p><span class="badge badge-blue">사용 중 · ${used(t)}명</span></button>`;
    return ph('근무 정책', '근무 방식에 맞는 정책을 골라 구성원에게 적용해요.', `<button class="btn btn-primary" data-act="policyAdd">${ic('glyph/plus')}근무 정책 만들기</button>`) + `
      <div class="policy-types">${card('고정 근무제', '요일과 시간이 매주 같아요.<br>예: 월~금 09:00~18:00')}${card('시차 출퇴근제', '정해진 시간대 안에 출근해<br>하루 근무시간을 채워요.')}${card('스케줄 근무제', '매주 근무표를 짜서 배정해요.<br>매장·교대 근무에 맞아요.')}</div>
      ${tabs([['활성', POLICIES.filter((p) => p.on).length], ['비활성', POLICIES.filter((p) => !p.on).length]])}
      <div class="table-card">${list.length ? `<div class="t-scroll"><table class="t"><thead><tr><th>근무 정책</th><th>유형</th><th>1주 소정근로</th><th>근무 요일</th><th>근무시간</th><th>구성원</th><th class="r"></th></tr></thead><tbody>
        ${list.map((p) => `<tr><td><b class="strong">${p.n}</b></td><td><span class="wp-cert">${ic('color/' + PT[p.type])}${p.type}</span></td><td class="tnum">${p.week}시간</td><td>${p.days}</td><td class="tnum">${p.time} <span class="muted">· 휴게 ${p.brk}</span></td><td class="tnum">${p.m}명</td>
          <td class="r"><button class="icon-btn" data-act="policyMenu" data-i="${POLICIES.indexOf(p)}" aria-label="더 보기">${ic('mono/more')}</button></td></tr>`).join('')}
        </tbody></table></div>` : empty('nav-work-policies', '비활성 근무 정책이 없어요', '쓰지 않는 정책을 비활성으로 옮기면 여기에 모여요.')}</div>`;
  };

  /* ───────────── 회사 정보 ───────────── */
  PAGES.company = function () {
    const titles = S.ui.titles = S.ui.titles || ['CEO', 'CTO', 'CFO', '그룹장', '부서장', '지점장', '스토어 매니저', '실장', '부실장', '사원', '파트타임'];
    return ph('회사 정보', '대시보드와 직원 앱에 보이는 회사 정보를 관리해요.') + `
      <section class="card form-card form-sec">
        <div class="card-h"><h2>기본 정보</h2></div>
        <div class="form-row"><div><b>로고</b><small>10MB 이하 · PNG·JPG·WebP</small></div><div class="logo-row"><img class="logo-pick" id="logoPick" src="../assets/brand/company-solv.png" alt="SOLV 로고"><label class="btn btn-grey btn-sm">바꾸기<input type="file" accept="image/*" id="logoFile" hidden></label></div></div>
        <div class="form-row"><div><b>회사 이름</b><small>대시보드와 직원 앱 상단에 보여요.</small></div><div><input class="input sm" value="SOLV"></div></div>
        <div class="form-row"><div><b>사업자등록번호</b><small>선택 사항이에요.</small></div><div><input class="input sm" placeholder="000-00-00000"></div></div>
      </section>
      <section class="card form-card form-sec">
        <div class="card-h"><h2>시간대와 캘린더</h2></div>
        <div class="form-row"><div><b>시간대</b><small>근태 시각을 이 시간대로 표시해요.</small></div><div>${ui.select('tz', ['한국 (Asia/Seoul, UTC+9)', '일본 (Asia/Tokyo, UTC+9)', '베트남 (Asia/Ho_Chi_Minh, UTC+7)'])}</div></div>
        <div class="form-row"><div><b>주 시작 요일</b><small>스케줄·근태의 한 주를 이 요일부터 세어요.</small></div><div>${ui.seg(['월요일', '일요일'])}</div></div>
      </section>
      <section class="card form-card form-sec">
        <div class="card-h"><h2>직무 · 직책</h2></div>
        <p class="card-desc">이 순서대로 같은 그룹 안 구성원이 정렬돼요. 끌어서 순서를 바꿀 수 있어요.</p>
        <div class="tags" id="titles">${titles.map((t, i) => `<span class="tag-x" draggable="true" data-i="${i}">${t}<button data-act="titleDel" data-i="${i}" aria-label="${t} 삭제">${ic('glyph/close')}</button></span>`).join('')}
          <span class="tag-add"><input id="titleNew" placeholder="+ 직무 추가" maxlength="12"></span></div>
      </section>
      <section class="card form-card form-sec">
        <div class="card-h"><h2>요금제</h2><span class="badge badge-blue">무료 체험 · D-71</span></div>
        <div class="summary"><div><span>체험 기간</span><b>2026.10.08 – 2027.01.06</b></div><div><span>재직 구성원</span><b>62명</b></div><div><span>체험 후 예상 요금</span><b>월 186,000원 · 1인 3,000원</b></div></div>
      </section>
      <div class="form-actions"><button class="btn btn-primary btn-lg" data-act="saved">저장</button></div>`;
  };
  A.after.company = (p) => {
    $('#logoFile', p).onchange = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { $('#logoPick').src = r.result; }; r.readAsDataURL(f); };
    $('#titleNew', p).onkeydown = (e) => { if (e.key === 'Enter' && e.target.value.trim()) { S.ui.titles.push(e.target.value.trim()); render(); $('#titleNew').focus(); } };
    let drag;
    $$('.tag-x', p).forEach((t) => {
      t.ondragstart = () => (drag = +t.dataset.i);
      t.ondragover = (e) => e.preventDefault();
      t.ondrop = () => { const a = S.ui.titles; const [x] = a.splice(drag, 1); a.splice(+t.dataset.i, 0, x); render(); };
    });
  };
  A.acts.titleDel = (b) => { S.ui.titles.splice(+b.dataset.i, 1); render(); };
})();
