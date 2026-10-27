/* 직원 앱 — 매니저 화면 (홈 대시보드 · 팀 스케줄 · 팀 근태 · 승인). 데이터는 모두 예시 */
(function () {
  const A = window.APP, { S, $, $$ } = A;
  const pad = A.pad;

  /* ───────── 데이터: 내가 권한 있는 그룹만 ───────── */
  const GROUPS = ['경영지원', '성수점', '고잔점']; // 구월점 · 배곧점은 권한이 없어 보이지 않음
  const PEOPLE = [
    ['박서준', '경영지원', 'CFO', 'work', '09:52', '10:00–19:00'], ['이도윤', '경영지원', 'CTO', 'work', '08:41', '08:00–17:00'],
    ['최지우', '경영지원', '그룹장', 'late', '10:12', '10:00–19:00'], ['정민재', '경영지원', '부서장', 'before', '', '10:00–19:00'],
    ['한유진', '성수점', '실장', 'work', '09:55', '10:00–22:00'], ['오세린', '성수점', '사원', 'off', '', ''],
    ['문하준', '성수점', '파트타임', 'absent', '', '11:00–17:00'], ['윤태오', '고잔점', '지점장', 'work', '10:58', '11:00–21:00'],
    ['서다은', '고잔점', '사원', 'leave', '', '연차'], ['배수아', '고잔점', '파트타임', 'before', '', '15:00–21:00'],
  ].map(([n, g, t, st, inT, plan], i) => ({ i, n, g, t, st, inT, plan }));
  const ST = { work: ['근무 중', 'badge-green', '#0F9D6B'], late: ['지각', 'badge-orange', '#E08F00'], before: ['출근 전', 'badge-grey', '#7C8597'], absent: ['미출근', 'badge-red', '#E03131'], leave: ['휴가', 'badge-blue', '#0A65E8'], off: ['휴무', 'badge-grey', '#A3ACBB'] };
  const SHIFTS = [
    { id: 'base', n: '기본', s: '10:00', e: '19:00', c: '#4A90F7', g: '경영지원' }, { id: 'flex', n: '시차', s: '08:00', e: '17:00', c: '#8F76F4', g: '경영지원' },
    { id: 'ss', n: '성수 기본', s: '10:00', e: '22:00', c: '#2EC28B', g: '성수점' }, { id: 'sso', n: '성수 오픈', s: '09:00', e: '15:00', c: '#30AFE2', g: '성수점' },
    { id: 'gj', n: '고잔 기본', s: '11:00', e: '21:00', c: '#E08F00', g: '고잔점' }, { id: 'gjn', n: '고잔 마감', s: '15:00', e: '21:00', c: '#F7716C', g: '고잔점' },
  ];
  const sh = (id) => SHIFTS.find((x) => x.id === id);
  const M = (S.m = S.m || {
    grp: '전체', q: '', wk: 0, mon: 0, view: 'week', attView: 'day', attSt: 'all', apTab: 'fix', apDone: false,
    fix: [{ n: '이도윤', k: 'req-missing-out', t: '퇴근 누락', d: '10.26 (월)', v: '퇴근 19:05로 기록', why: '퇴근 버튼을 못 눌렀어요' }, { n: '한유진', k: 'req-out-of-range', t: '반경 밖 출근', d: '10.25 (일)', v: '출근 09:58 · 반경 밖 120m', why: '매장 앞 건물에서 찍었어요' }],
    exp: [{ n: '최지우', k: 'ap-pending', t: '지각 소명', d: '10.27 (화)', v: '10:12 출근 · 12분 늦음', why: '지하철 지연 (지연증명서 첨부)', file: 1 }, { n: '문하준', k: 'req-absent', t: '결근 소명', d: '10.24 (금)', v: '근무 예정 11:00–17:00', why: '갑자기 아파서 병원에 갔어요 (진료확인서 첨부)', file: 1 }],
    lv: [{ n: '박서준', k: 'calendar-check', t: '연차 1일', d: '11.3 (화)', v: '남은 연차 12일', why: '병원 진료' }, { n: '배수아', k: 'calendar-check', t: '오후 반차', d: '11.5 (목)', v: '남은 연차 4일', why: '가족 행사' }],
    done: [],
    wp: [{ n: '본사', g: '경영지원', a: '서울 강남구 테헤란로 000', cert: 'qr-gps', r: 50, early: 60 }, { n: '성수점', g: '성수점', a: '서울 성동구 왕십리로 000', cert: 'qr-gps', r: 100, early: 30 }, { n: '고잔점', g: '고잔점', a: '경기 안산시 단원구 광덕대로 000', cert: 'gps', r: 100, early: 30 }],
    sched: {},
  });
  const count = () => M.fix.length + M.exp.length + M.lv.length;
  const inGrp = (p) => (M.grp === '전체' || p.g === M.grp) && (!M.q || p.n.includes(M.q));
  const list = () => PEOPLE.filter(inGrp);

  /* 근무표: 주 오프셋별 [사람][요일] */
  const BASE = new Date(2026, 9, 26);
  const days = (wo) => Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 26 + wo * 7 + i));
  const wkLabel = (wo) => { const d = days(wo); return `${d[0].getMonth() + 1}.${d[0].getDate()} – ${d[6].getMonth() + 1}.${d[6].getDate()}`; };
  const def = { 경영지원: 'base', 성수점: 'ss', 고잔점: 'gj' };
  const week = (wo) => (M.sched[wo] = M.sched[wo] || PEOPLE.map((p) => Array.from({ length: 7 }, (_, d) => {
    if (wo > 1) return p.g === '경영지원' ? (d >= 5 ? { k: 'off' } : { k: 's', id: p.n === '이도윤' ? 'flex' : 'base' }) : null;
    if (p.g === '경영지원') return d >= 5 ? { k: 'off' } : { k: 's', id: p.n === '이도윤' ? 'flex' : 'base' };
    if (p.st === 'leave' && wo === 0 && d === 1) return { k: 'leave' };
    if ((p.i * 3 + d + wo) % 7 < 2) return { k: 'off' };
    if (wo === 1 && (p.i + d) % 5 === 0) return null;
    return { k: 's', id: (p.i + d) % 4 === 0 ? (p.g === '성수점' ? 'sso' : 'gjn') : def[p.g] };
  })));
  const cellTxt = (c) => (!c ? '' : c.k === 'off' ? '휴무' : c.k === 'leave' ? '휴가' : `${sh(c.id).s.slice(0, 2)}–${sh(c.id).e.slice(0, 2)}`);
  const snap = (wos) => wos.map((w) => [w, JSON.stringify(week(w))]);
  const undo = (s) => () => { s.forEach(([w, j]) => (M.sched[w] = JSON.parse(j))); A.route(); };

  /* ───────── 공통 조각 ───────── */
  const top = (title, right = '') => `<header class="bar-top fg-h"><h1>${title}</h1><div class="bar-r">${right}</div></header>`;
  const grpChips = () => `<div class="gchips">${['전체', ...GROUPS].map((g) => `<button data-m="grp" data-v="${g}" aria-pressed="${M.grp === g}">${g === '전체' ? '내 그룹 전체' : g}</button>`).join('')}</div>`;
  const search = (ph) => `<label class="msearch">${ic('glyph/search')}<input data-mq placeholder="${ph}" value="${M.q}"></label>`;
  const av = (p) => `<span class="avatar av ${{ work: 'g', late: 'o', leave: 'b' }[p.st] || ''}">${p.n.slice(-2)}</span>`;

  /* ───────── 홈: 오늘의 개요 (대시보드 우선) ───────── */
  function home() {
    const L = list(), c = (k) => L.filter((p) => p.st === k).length;
    const due = L.length - c('off') - c('leave'), inN = c('work') + c('late');
    const issue = L.filter((p) => ['late', 'absent', 'before'].includes(p.st));
    const d = new Date();
    return `<div class="phone fg">${A.coTop()}<div class="body fg-body">
      <div class="ov-h"><div><h2>오늘의 개요</h2><span>${A.ko(d)} · ${pad(d.getHours())}:${pad(d.getMinutes())} 기준</span></div></div>
      ${grpChips()}<p class="perm">${ic('mono/info')}내가 승인 권한이 있는 그룹 ${GROUPS.length}곳만 보여요</p>
      <section class="sum-card ov">
        <div class="sc-row"><span>${M.grp === '전체' ? '내 그룹 전체' : M.grp} · 출근</span><em>예정 ${due}명</em></div>
        <p class="big tnum">${inN}<small>명</small><span>/ ${due}명</span></p>
        <div class="sum-bar"><i style="width:${due ? (inN / due) * 100 : 0}%"></i></div>
        <div class="sum-4">${[['work', '근무 중'], ['late', '지각'], ['before', '출근 전'], ['absent', '미출근'], ['leave', '휴가']].map(([k, l]) => `<button data-m="goAtt" data-v="${k}"><b class="tnum">${c(k)}</b><span>${l}</span></button>`).join('')}</div>
      </section>
      ${issue.length ? `<section class="fbox mgr"><div class="mg-h"><b>지금 확인할 사람</b><span>${issue.length}명</span></div>
        ${issue.map((p) => `<div class="row">${av(p)}<span class="txt"><b>${p.n} <small class="gtag">${p.g}</small></b><small>${p.plan} · ${ST[p.st][0]}${p.inT ? ` ${p.inT}` : ''}</small></span><button class="btn btn-grey btn-sm" data-m="nudge" data-n="${p.n}">${p.st === 'late' ? '확인' : '알림'}</button></div>`).join('')}</section>` : ''}
      <section class="fbox mgr"><div class="mg-h"><b>처리할 일</b><span class="${count() ? 'on' : ''}">${count()}건</span></div>
        ${[['fix', 'time-edit', '근태 수정 요청', M.fix.length], ['exp', 'ap-pending', '소명', M.exp.length], ['lv', 'calendar-check', '휴가 신청', M.lv.length]].map(([k, i, l, n]) => `<button class="row" data-m="goAp" data-v="${k}">${ic('color/' + i, 'lead')}<span class="txt"><b>${l}</b></span><span class="cnt tnum ${n ? 'on' : ''}">${n}</span>${ic('glyph/chevron-right')}</button>`).join('')}</section>
      <section class="fbox mgr">
        <div class="mg-h"><b>그룹별 출근</b><span>오늘</span></div>
        ${GROUPS.map((g) => { const G = PEOPLE.filter((p) => p.g === g), dd = G.filter((p) => !['off', 'leave'].includes(p.st)).length, ii = G.filter((p) => ['work', 'late'].includes(p.st)).length; return `<button class="gbar" data-m="grp" data-v="${g}"><span>${g}</span><i><b style="width:${dd ? (ii / dd) * 100 : 0}%"></b></i><em class="tnum">${ii}/${dd}</em></button>`; }).join('')}
      </section>
      <section class="my-mini">${A.charImg(S.out ? 'leave' : S.in ? 'working' : 'default', 'mm-char')}<span class="mm-t"><small>내 근무 · ${A.PLAN.s}–${A.PLAN.e}</small><b>${S.out ? `퇴근 ${S.out}` : S.in ? `${S.in} 출근 · 근무 중` : '아직 출근 전이에요'}</b></span>
        ${S.out ? '' : `<button class="btn ${S.in ? 'btn-dark' : 'btn-primary'} btn-sm" data-m="punch">${S.in ? '퇴근하기' : '출근하기'}</button>`}</section>
    </div>${A.tabbar('home')}</div>`;
  }

  /* ───────── 스케줄: 팀 주간 · 월간 · 배정 · 빠른 배정 ───────── */
  function schedule() {
    const L = list(), w = week(M.wk), D = days(M.wk);
    const empties = L.reduce((a, p) => a + w[p.i].filter((c) => !c).length, 0);
    let body;
    if (M.view === 'week') {
      body = `<div class="ms-wrap"><table class="ms"><colgroup><col class="nmc">${"<col>".repeat(7)}</colgroup><thead><tr><th class="nm">이름</th>${D.map((d, i) => `<th class="${i === 5 ? 'sat' : i === 6 ? 'sun' : ''} ${+d === +new Date(2026, 9, 27) ? 'today' : ''}">${'월화수목금토일'[i]}<b class="tnum">${d.getDate()}</b></th>`).join('')}</tr></thead><tbody>
        ${L.map((p) => `<tr><th class="nm"><b>${p.n}</b><small>${p.t}</small></th>${w[p.i].map((c, d) => `<td><button class="mc2 ${c ? c.k : 'none'}" data-m="cell" data-p="${p.i}" data-d="${d}" style="${c?.k === 's' ? `--c:${sh(c.id).c}` : ''}">${c ? cellTxt(c) : '+'}</button></td>`).join('')}</tr>`).join('') || '<tr><td colspan="8" class="none">찾는 사람이 없어요</td></tr>'}
        <tr class="sum"><th class="nm">근무</th>${D.map((_, d) => `<td class="tnum">${L.filter((p) => w[p.i][d]?.k === 's').length}</td>`).join('')}</tr></tbody></table></div>`;
    } else {
      const first = new Date(2026, 9 + (M.mon || 0), 1), lead = (first.getDay() + 6) % 7, last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(), cells = [];
      for (let i = 0; i < lead; i++) cells.push('<span></span>');
      for (let dd = 1; dd <= last; dd++) {
        const dt = new Date(first.getFullYear(), first.getMonth(), dd), off = Math.round((dt - BASE) / 864e5), wo = Math.floor(off / 7), di = off - wo * 7;
        const ww = week(wo), n = L.filter((p) => ww[p.i][di]?.k === 's').length, e = L.filter((p) => !ww[p.i][di]).length, dow = (lead + dd - 1) % 7;
        cells.push(`<button class="${+dt === +new Date(2026, 9, 27) ? 'today' : ''} ${dow === 5 ? 'sat' : dow === 6 ? 'sun' : ''}" data-m="toWeek" data-v="${wo}"><b>${dd}</b><em class="tnum ${n ? '' : 'z'}">${n ? `${n}명` : '–'}</em>${e ? `<i title="빈 칸 ${e}"></i>` : ''}</button>`);
      }
      body = `<div class="mmon">${['월', '화', '수', '목', '금', '토', '일'].map((d) => `<span class="dow">${d}</span>`).join('')}${cells.join('')}</div><div class="mlegend"><span><b>N명</b> 그날 근무 인원</span><span><i></i>빈 칸 있는 날</span><span>날짜를 누르면 그 주 근무표</span></div>`;
    }
    return `<div class="phone fg">${top('스케줄', `<button class="btn btn-primary btn-sm" data-m="quick">${ic('mono/zap')}빠른 배정</button>`)}<div class="body fg-body">
      <div class="sc-top"><div class="mini-seg"><button data-m="view" data-v="week" aria-pressed="${M.view === 'week'}">주간</button><button data-m="view" data-v="month" aria-pressed="${M.view === 'month'}">월간</button></div>
        ${M.view === 'week' ? `<div class="step-pill"><button data-m="wk" data-v="-1" aria-label="이전 주">${ic('glyph/chevron-left')}</button><b class="tnum sm">${wkLabel(M.wk)}</b><button data-m="wk" data-v="1" aria-label="다음 주">${ic('glyph/chevron-right')}</button></div>` : `<div class="step-pill"><button data-m="mon" data-v="-1" aria-label="이전 달">${ic('glyph/chevron-left')}</button><b class="tnum sm">${new Date(2026, 9 + M.mon, 1).getFullYear()}년 ${new Date(2026, 9 + M.mon, 1).getMonth() + 1}월</b><button data-m="mon" data-v="1" aria-label="다음 달">${ic('glyph/chevron-right')}</button></div>`}</div>
      ${search('이름으로 찾기')}${grpChips()}
      ${M.view === 'week' && empties ? `<p class="warn-l">${ic('color/alert')}빈 칸 ${empties}개 · 칸을 눌러 배정하거나 빠른 배정을 써요</p>` : ''}
      <section class="fbox ms-box">${body}</section>
    </div>${A.tabbar('schedule')}</div>`;
  }
  function cellSheet(pi, d) {
    const p = PEOPLE[pi], c = week(M.wk)[pi][d], D = days(M.wk)[d];
    const xs = SHIFTS.filter((x) => x.g === p.g);
    const s = A.info(`${p.n} · ${D.getMonth() + 1}월 ${D.getDate()}일 (${'월화수목금토일'[d]})`, `<p class="muted sm">${p.g} · ${p.t} · 지금: ${c ? (c.k === 's' ? `${sh(c.id).n} ${sh(c.id).s}–${sh(c.id).e}` : cellTxt(c)) : '배정 없음'}</p>
      <div class="pick list" id="sp">${xs.map((x) => `<button type="button" data-v="${x.id}" aria-pressed="${c?.id === x.id}"><i class="dot" style="background:${x.c}"></i><span><b>${x.n}</b><small class="tnum">${x.s} – ${x.e}</small></span></button>`).join('')}
        <button type="button" data-v="off" aria-pressed="${c?.k === 'off'}">${ic('mono/moon')}<span><b>휴무</b><small>쉬는 날로</small></span></button></div>
      <div class="set-row flat"><div><b>다음 주 같은 요일에도</b><small>다음 주에도 똑같이 넣어요</small></div>${ui.switch(false, 'rep')}</div>`,
      `<button class="btn btn-grey btn-lg" id="clr" ${c ? '' : 'disabled'}>비우기</button><button class="btn btn-primary btn-lg" id="ok">넣기</button>`);
    bindControls(s.el);
    const put = (v) => {
      const wos = s.$('#rep').checked ? [M.wk, M.wk + 1] : [M.wk], sn = snap(wos);
      wos.forEach((w) => { if (week(w)[pi][d]?.k !== 'leave') week(w)[pi][d] = v; });
      s.close(); toast(`${p.n}님 ${v ? (v.k === 'off' ? '휴무' : sh(v.id).n) : '배정'}${v ? '을 넣었어요' : '을 비웠어요'}`, { label: '되돌리기', run: undo(sn) }); A.route();
    };
    s.$('#ok').onclick = () => { const v = pickVals(s.$('#sp'))[0]; if (!v) return toast('시간대를 골라 주세요'); put(v === 'off' ? { k: 'off' } : { k: 's', id: v }); };
    s.$('#clr').onclick = () => put(null);
  }
  /* 빠른 배정 — 방법 고르기 · 옵션은 위로 겹쳐 올라오는 시트로 (가로 스크롤 없음) */
  const DOW7 = ['월', '화', '수', '목', '금', '토', '일'];
  const durMin = (x) => { const [a, b] = [x.s, x.e].map((t) => +t.slice(0, 2) * 60 + +t.slice(3)); let d = b - a; if (d <= 0) d += 1440; return d - (d > 480 ? 60 : d > 240 ? 30 : 0); };
  const hmT = (m) => `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ''}`;
  const AU = () => (M.auto = M.auto || { days: 7, mode: 'keep', need: {}, rules: { off: 2, max: 52, rest: 11, cons: 6 }, mem: {} });
  const needOf = (x) => (AU().need[x.id] = AU().need[x.id] || DOW7.map((_, i) => (x.id === def[x.g] ? (i >= 5 ? 2 : 1) : 0)));
  const memOf = (i) => (AU().mem[i] = AU().mem[i] || { on: true, off: null, pref: [], no: [], noShift: [] });
  const scope = () => list().filter((p) => p.g !== '경영지원'); // 스케줄 근무 그룹만
  const scopeShifts = () => SHIFTS.filter((x) => scope().some((p) => p.g === x.g));
  const periodDays = () => Array.from({ length: AU().days }, (_, i) => new Date(2026, 9, 26 + M.wk * 7 + i));
  const md2 = (d) => `${d.getMonth() + 1}.${d.getDate()}`;
  const optRow = (k, title, sum) => `<button class="opt-row" data-opt="${k}"><span><b>${title}</b><small>${sum}</small></span>${ic('glyph/chevron-right')}</button>`;

  function quick() {
    const s = A.info('빠른 배정', '', '<div id="qf" class="pf"></div>');
    let how = 'auto';
    const draw = () => {
      const u = AU(), L = scope(), P = periodDays();
      const seats = scopeShifts().reduce((a, x) => a + needOf(x).reduce((p, q) => p + q, 0), 0);
      const on = L.filter((p) => memOf(p.i).on).length;
      const methods = [['auto', 'schedule-registered', '자동 배정', '옵션에 맞춰 초안을 만들어요'], ['copy', 'schedule-changed', '지난주 그대로 복사', `${wkLabel(M.wk - 1)} → 이번 주`], ['rep', 'nav-schedules', '이번 주 패턴 반복', '다음 주부터 몇 주 똑같이'], ['clr', 'alert', '이번 주 배정 지우기', '휴가는 남겨요']];
      let opts = '';
      if (how === 'auto') opts = `<p class="opt-h">옵션</p><div class="opt-list">
          ${optRow('period', '기간과 방식', `${md2(P[0])} – ${md2(P.at(-1))} · ${P.length}일 · ${u.mode === 'keep' ? '빈 칸만 채우기' : '전부 다시 짜기'}`)}
          ${optRow('need', '요일별 필요 인원', `시간대 ${scopeShifts().filter((x) => needOf(x).some(Boolean)).length}개 · 주 ${seats}자리`)}
          ${optRow('rules', '공통 규칙', `주 휴무 ${u.rules.off ?? '-'}일 · 최대 ${u.rules.max ?? '제한 없음'}시간 · 휴식 ${u.rules.rest ?? '-'}시간 · 연속 ${u.rules.cons ?? '-'}일`)}
          ${optRow('mem', '구성원 조건', `${on} / ${L.length}명 포함 · 조건 있는 사람 ${L.filter((p) => { const c = memOf(p.i); return c.off != null || c.pref.length || c.no.length || c.noShift.length; }).length}명`)}</div>`;
      if (how === 'copy') opts = `<p class="opt-h">옵션</p>${ui.field('이미 채운 칸은', ui.seg([['keep', '그대로 두기'], ['over', '지난주로 덮어쓰기']], u.cMode === 'over' ? 1 : 0, 'block').replace('class="segment ', 'id="cm" class="segment '), '휴가 칸은 어느 쪽이든 그대로 둬요')}`;
      if (how === 'rep') opts = `<p class="opt-h">옵션</p>${ui.field('반복할 주', ui.stepper('rn', u.rn || 4, '주').replace('class="stepper"', 'class="stepper" data-min="1" data-max="12"'), `${wkLabel(M.wk + 1).split(' – ')[0]}부터 ${wkLabel(M.wk + (u.rn || 4)).split(' – ')[1]}까지`)}${ui.field('이미 채운 칸은', ui.seg([['keep', '그대로 두기'], ['over', '덮어쓰기']], u.rMode === 'over' ? 1 : 0, 'block').replace('class="segment ', 'id="rm" class="segment '))}`;
      if (how === 'clr') opts = `<div class="box warnbox">${ic('color/alert')}<div><b>${wkLabel(M.wk)} 매장 배정을 지워요</b><p>${L.length}명 · 휴가 칸은 남기고, 지운 뒤 되돌리기로 살릴 수 있어요.</p></div></div>`;
      s.setBody(`<p class="muted sm">${M.grp === '전체' ? '내 그룹 전체' : M.grp} · 스케줄 근무 ${L.length}명</p>
        <div class="pick list" id="qk">${methods.map(([k, i, t, d]) => `<button type="button" data-v="${k}" aria-pressed="${how === k}">${ic('color/' + i)}<span><b>${t}</b><small>${d}</small></span></button>`).join('')}</div>${opts}`);
      bindControls(s.el);
      s.$('#qk').addEventListener('change', () => { how = pickVals(s.$('#qk'))[0]; draw(); });
      $$('[data-opt]', s.el).forEach((b) => (b.onclick = () => OPT[b.dataset.opt](draw)));
      s.$('#cm')?.addEventListener('change', (e) => (AU().cMode = e.detail));
      s.$('#rm')?.addEventListener('change', (e) => (AU().rMode = e.detail));
      s.$('#rn')?.closest('.stepper').addEventListener('change', () => { AU().rn = +s.$('#rn').textContent; draw(); });
      s.$('#qf').innerHTML = how === 'auto' ? `<button class="btn btn-primary btn-lg" id="go" ${on && seats ? '' : 'disabled'}>초안 만들기</button>` : `<button class="btn ${how === 'clr' ? 'btn-danger' : 'btn-primary'} btn-lg" id="go">${how === 'clr' ? '지우기' : '적용하기'}</button>`;
      s.$('#go').onclick = () => (how === 'auto' ? preview(s) : simple(how, s));
    };
    draw();
  }
  function simple(how, s) {
    const u = AU(), L = list(), w = week(M.wk), sn = snap(Array.from({ length: 14 }, (_, i) => M.wk + i)); let n = 0;
    if (how === 'copy') { const pw = week(M.wk - 1), over = u.cMode === 'over'; L.forEach((p) => w[p.i].forEach((c, d) => { if (c?.k === 'leave' || pw[p.i][d]?.k === 'leave' || !pw[p.i][d]) return; if (!c || over) { w[p.i][d] = { ...pw[p.i][d] }; n++; } })); }
    if (how === 'rep') { const over = u.rMode === 'over'; for (let k = 1; k <= (u.rn || 4); k++) { const nw = week(M.wk + k); L.forEach((p) => w[p.i].forEach((c, d) => { if (!c || c.k === 'leave' || nw[p.i][d]?.k === 'leave') return; if (!nw[p.i][d] || over) { nw[p.i][d] = { ...c }; n++; } })); } }
    if (how === 'clr') scope().forEach((p) => w[p.i].forEach((c, d) => { if (c && c.k !== 'leave') { w[p.i][d] = null; n++; } }));
    s.close(); toast(n ? `${n}칸을 바꿨어요` : '바꿀 칸이 없어요', n ? { label: '되돌리기', run: undo(sn) } : null); A.route();
  }

  /* 옵션 시트 (빠른 배정 위로 겹쳐 올라옴) */
  const OPT = {
    period(back) {
      const u = AU(), P = periodDays();
      const s = A.info('기간과 방식', `${ui.field('시작', `<div class="ro">${md2(P[0])} (${DOW7[0]}) · 지금 보고 있는 주부터</div>`)}
        ${ui.field('기간', ui.stepper('pd', u.days, '일').replace('class="stepper"', 'class="stepper" data-min="1" data-max="31"'), '최대 31일')}
        <div class="field"><span class="field-label">이미 넣은 배정</span><div class="pick list" id="pm">
          <button type="button" data-v="keep" aria-pressed="${u.mode === 'keep'}">${ic('mono/check')}<span><b>남기고 빈 칸만 채우기</b><small>넣어 둔 근무·휴무는 그대로</small></span></button>
          <button type="button" data-v="rebuild" aria-pressed="${u.mode === 'rebuild'}">${ic('mono/refresh')}<span><b>전부 다시 짜기</b><small>휴가 · 다른 근무지 · 외근 배정만 남겨요</small></span></button></div></div>`, '<button class="btn btn-primary btn-lg" id="ok">확인</button>');
      bindControls(s.el);
      s.$('#ok').onclick = () => { u.days = +s.$('#pd').textContent; u.mode = pickVals(s.$('#pm'))[0]; s.close(); back(); };
    },
    need(back) {
      const xs = scopeShifts(); let open = xs.find((x) => needOf(x).some(Boolean))?.id;
      const s = A.info('요일별 필요 인원', '', '<button class="btn btn-primary btn-lg" id="ok">확인</button>');
      const draw = () => {
        s.setBody(`<p class="muted sm">시간대를 눌러 요일마다 몇 명이 필요한지 넣어요 · 0이면 배정하지 않아요</p>
          ${[...new Set(xs.map((x) => x.g))].map((g) => `<p class="opt-h">${g}</p>${xs.filter((x) => x.g === g).map((x) => { const nd = needOf(x), isOpen = open === x.id; return `<div class="acc ${isOpen ? 'open' : ''}">
            <button class="acc-h" data-acc="${x.id}"><i class="dot" style="background:${x.c}"></i><span><b>${x.n}</b><small class="tnum">${x.s}–${x.e} · ${nd.some(Boolean) ? nd.map((v, i) => `${DOW7[i]} ${v}`).join(' · ') : '배정 안 함'}</small></span><em class="tnum">주 ${nd.reduce((a, b) => a + b, 0)}</em>${ic(isOpen ? 'glyph/chevron-up' : 'glyph/chevron-down')}</button>
            ${isOpen ? `<div class="acc-b"><div class="acc-all"><span>모든 요일 같게</span>${[0, 1, 2, 3].map((v) => `<button data-all="${v}">${v}명</button>`).join('')}</div>
              ${DOW7.map((d, i) => `<div class="acc-r"><span class="${i === 5 ? 'sat' : i === 6 ? 'sun' : ''}">${d}요일</span>${ui.stepper(`n${x.id}${i}`, nd[i], '명').replace('class="stepper"', `class="stepper" data-max="9" data-sid="${x.id}" data-i="${i}"`)}</div>`).join('')}</div>` : ''}</div>`; }).join('')}`).join('')}`);
        $$('[data-acc]', s.el).forEach((b) => (b.onclick = () => { open = open === b.dataset.acc ? null : b.dataset.acc; draw(); }));
        $$('[data-all]', s.el).forEach((b) => (b.onclick = () => { const x = sh(open); AU().need[x.id] = DOW7.map(() => +b.dataset.all); draw(); }));
        $$('.stepper[data-sid]', s.el).forEach((st) => st.addEventListener('change', () => { needOf(sh(st.dataset.sid))[+st.dataset.i] = +st.querySelector('b').textContent; const h = st.closest('.acc').querySelector('.acc-h em'); h.textContent = `주 ${needOf(sh(st.dataset.sid)).reduce((a, b) => a + b, 0)}`; }));
      };
      s.$('#ok').onclick = () => { s.close(); back(); };
      draw();
    },
    rules(back) {
      const r = AU().rules;
      const row = (k, l, u, h, max) => `<div class="rule-v"><div><b>${l}</b><small>${h}</small></div><div class="rule-c">${ui.stepper('r' + k, r[k] ?? 0, u).replace('class="stepper"', `class="stepper" data-max="${max}"`)}<label class="nolim"><input type="checkbox" data-nl="${k}" ${r[k] == null ? 'checked' : ''}>제한 없음</label></div></div>`;
      const s = A.info('공통 규칙', `<p class="muted sm">모든 구성원에게 적용하는 기본 규칙이에요</p>
        ${row('off', '주 휴무일 기본값', '일', '구성원 조건에서 사람마다 바꿀 수 있어요', 7)}${row('max', '주 최대 근무시간', '시간', '법정 상한은 52시간(연장 포함)이에요', 68)}
        ${row('rest', '퇴근~다음 출근 최소 휴식', '시간', '법정 기준은 11시간이에요', 24)}${row('cons', '최대 연속 근무', '일', '주 휴무 0일인 사람은 받지 않아요', 14)}`, '<button class="btn btn-primary btn-lg" id="ok">확인</button>');
      s.$('#ok').onclick = () => { ['off', 'max', 'rest', 'cons'].forEach((k) => (r[k] = s.$(`[data-nl="${k}"]`).checked ? null : +s.$('#r' + k).textContent)); s.close(); back(); };
    },
    mem(back) {
      const s = A.info('구성원 조건', '', '<button class="btn btn-primary btn-lg" id="ok">확인</button>');
      const draw = () => {
        const L = scope();
        s.setBody(`<p class="muted sm">희망 휴무 요일은 되도록 쉬게, 안 되는 날은 반드시 휴무, 안 되는 시간대는 넣지 않아요. 승인된 휴가는 자동으로 빼요.</p>
          <label class="mem-all"><input type="checkbox" class="cb" id="ma" ${L.every((p) => memOf(p.i).on) ? 'checked' : ''}><b>모두 포함</b><span class="tnum">${L.filter((p) => memOf(p.i).on).length} / ${L.length}명</span></label>
          ${L.map((p) => { const c = memOf(p.i), tags = [c.off != null ? `주 휴무 ${c.off}일` : '', c.pref.length ? `희망 휴무 ${c.pref.join('·')}` : '', c.no.length ? `안 되는 날 ${c.no.length}일` : '', c.noShift.length ? `시간대 제외 ${c.noShift.length}` : ''].filter(Boolean);
            return `<div class="mem-r ${c.on ? '' : 'off'}"><input type="checkbox" class="cb" data-on="${p.i}" ${c.on ? 'checked' : ''} aria-label="${p.n} 포함"><button class="mem-b" data-mem="${p.i}"><span><b>${p.n} <small class="gtag">${p.g}</small></b><small>${tags.join(' · ') || '조건 없음 · 공통 규칙대로'}</small></span>${ic('glyph/chevron-right')}</button></div>`; }).join('')}`);
        s.$('#ma').onchange = (e) => { L.forEach((p) => (memOf(p.i).on = e.target.checked)); draw(); };
        $$('[data-on]', s.el).forEach((i) => (i.onchange = () => { memOf(+i.dataset.on).on = i.checked; draw(); }));
        $$('[data-mem]', s.el).forEach((b) => (b.onclick = () => memOne(+b.dataset.mem, draw)));
      };
      s.$('#ok').onclick = () => { s.close(); back(); };
      draw();
    },
  };
  function memOne(pi, back) {
    const p = PEOPLE[pi], c = memOf(pi), P = periodDays(), xs = SHIFTS.filter((x) => x.g === p.g);
    const s = A.info(`${p.n} 조건`, `${ui.field('주 휴무일', `<div class="rule-c">${ui.stepper('mo', c.off ?? AU().rules.off ?? 0, '일').replace('class="stepper"', 'class="stepper" data-max="7"')}<label class="nolim"><input type="checkbox" id="mdef" ${c.off == null ? 'checked' : ''}>공통 규칙대로</label></div>`)}
      <div class="field"><span class="field-label"><i class="lg b"></i>희망 휴무 요일 <span class="opt">되도록 쉬게</span></span><div class="pick multi days" id="mp">${DOW7.map((d) => `<button type="button" data-v="${d}" aria-pressed="${c.pref.includes(d)}">${d}</button>`).join('')}</div></div>
      <div class="field"><span class="field-label"><i class="lg o"></i>안 되는 날 <span class="opt">반드시 휴무</span></span><div class="pick multi dates" id="mn">${P.map((d) => { const v = `${d.getMonth() + 1}-${d.getDate()}`; return `<button type="button" data-v="${v}" aria-pressed="${c.no.includes(v)}"><small>${'일월화수목금토'[d.getDay()]}</small>${d.getDate()}</button>`; }).join('')}</div></div>
      <div class="field"><span class="field-label"><i class="lg r"></i>안 되는 근무 시간대</span><div class="pick multi" id="ms">${xs.map((x) => `<button type="button" data-v="${x.id}" aria-pressed="${c.noShift.includes(x.id)}"><i class="dot" style="background:${x.c}"></i>${x.n} <span class="muted tnum">${x.s}–${x.e}</span></button>`).join('')}</div></div>`,
      '<button class="btn btn-grey btn-lg" id="rs">초기화</button><button class="btn btn-primary btn-lg" id="ok">확인</button>');
    bindControls(s.el);
    s.$('#ok').onclick = () => { Object.assign(c, { off: s.$('#mdef').checked ? null : +s.$('#mo').textContent, pref: pickVals(s.$('#mp')), no: pickVals(s.$('#mn')), noShift: pickVals(s.$('#ms')) }); s.close(); back(); };
    s.$('#rs').onclick = () => { Object.assign(c, { off: null, pref: [], no: [], noShift: [] }); s.close(); back(); };
  }

  /* 초안 만들기 → 미리보기 → 근무표에 넣기 */
  function plan() {
    const u = AU(), R = u.rules, P = periodDays(), ppl = scope().filter((p) => memOf(p.i).on);
    const pos = (d) => { const n = Math.round((d - BASE) / 864e5), wo = Math.floor(n / 7); return [wo, n - wo * 7]; };
    const draft = {}; const K = (pi, k) => pi + ':' + k;
    P.forEach((d, k) => { const [wo, di] = pos(d); ppl.forEach((p) => { let c = week(wo)[p.i][di]; if (u.mode === 'rebuild' && c && c.k !== 'leave' && !c.place) c = null; draft[K(p.i, k)] = c ? { ...c } : null; }); });
    const out = [], short = [], lastEnd = {}, streak = {};
    const wkCount = (pi, k) => { const st = k - ((P[k].getDay() + 6) % 7); let n = 0, min = 0; for (let j = Math.max(0, st); j < Math.min(P.length, st + 7); j++) { const c = draft[K(pi, j)]; if (c?.k === 's') { n++; min += durMin(sh(c.id)); } } return [n, min]; };
    P.forEach((d, k) => {
      const dow = (d.getDay() + 6) % 7, key = `${d.getMonth() + 1}-${d.getDate()}`;
      ppl.forEach((p) => { if (memOf(p.i).no.includes(key) && !draft[K(p.i, k)]) draft[K(p.i, k)] = { k: 'off' }; });
      scopeShifts().forEach((x) => {
        let need = needOf(x)[dow] - ppl.filter((p) => draft[K(p.i, k)]?.id === x.id).length; if (need <= 0) return;
        const start = k * 1440 + +x.s.slice(0, 2) * 60;
        const cand = ppl.filter((p) => { const c = memOf(p.i), offD = c.off ?? R.off ?? 0, [n, min] = wkCount(p.i, k);
          return p.g === x.g && !draft[K(p.i, k)] && !c.noShift.includes(x.id) && n < 7 - offD && (R.max == null || min + durMin(x) <= R.max * 60) && (R.rest == null || lastEnd[p.i] == null || start - lastEnd[p.i] >= R.rest * 60) && (R.cons == null || (streak[p.i] || 0) < R.cons); })
          .sort((a, b) => memOf(a.i).pref.includes(DOW7[dow]) - memOf(b.i).pref.includes(DOW7[dow]) || wkCount(a.i, k)[0] - wkCount(b.i, k)[0]);
        for (const p of cand) { if (need <= 0) break; draft[K(p.i, k)] = { k: 's', id: x.id, n: 1 }; out.push(p.i); lastEnd[p.i] = start + durMin(x) + 60; need--; }
        if (need > 0) short.push(`${md2(d)} ${x.n} ${need}명`);
      });
      ppl.forEach((p) => { const c = draft[K(p.i, k)]; streak[p.i] = c?.k === 's' ? (streak[p.i] || 0) + 1 : 0; if (!c) draft[K(p.i, k)] = { k: 'off', n: 1 }; });
    });
    return { P, ppl, draft, K, out, short, pos };
  }
  function preview(parent) {
    const D = plan(), u = AU();
    const rows = D.ppl.map((p) => { let n = 0, min = 0; D.P.forEach((_, k) => { const c = D.draft[D.K(p.i, k)]; if (c?.k === 's') { n++; min += durMin(sh(c.id)); } }); return [p, n, min]; });
    const s = A.info('초안 미리보기', `<div class="pv-stats"><div><span>새로 넣은 근무</span><b class="tnum">${D.out.length}칸</b></div><div class="${D.short.length ? 'warn' : ''}"><span>못 채운 자리</span><b class="tnum">${D.short.length}건</b></div></div>
      ${D.short.length ? `<div class="box warnbox">${ic('color/alert')}<div><b>규칙 때문에 못 채운 자리가 있어요</b><p>${D.short.slice(0, 4).join(' · ')}${D.short.length > 4 ? ` 외 ${D.short.length - 4}건` : ''}</p><small>필요 인원을 줄이거나 공통 규칙을 느슨하게 해 보세요</small></div></div>` : `<div class="box okbox">${ic('color/ap-approved')}<div><b>필요한 자리를 모두 채웠어요</b><p>규칙을 지키면서 배정했어요</p></div></div>`}
      <div class="pv-list">${rows.map(([p, n, min]) => `<div class="row"><span class="avatar">${p.n.slice(-2)}</span><span class="txt"><b>${p.n} <small class="gtag">${p.g}</small></b><small class="tnum">근무 ${n}일 · ${hmT(min)}</small></span>${u.rules.max != null && min > u.rules.max * 60 * Math.ceil(D.P.length / 7) ? '<span class="badge badge-red">초과</span>' : ''}</div>`).join('')}</div>`,
      '<button class="btn btn-grey btn-lg" id="bk">조건 고치기</button><button class="btn btn-primary btn-lg" id="ap">근무표에 넣기</button>');
    s.$('#bk').onclick = s.close;
    s.$('#ap').onclick = () => {
      const wos = [...new Set(D.P.map((d) => D.pos(d)[0]))], sn = snap(wos);
      D.P.forEach((d, k) => { const [wo, di] = D.pos(d); D.ppl.forEach((p) => { const c = D.draft[D.K(p.i, k)]; if (c) { const { n, ...v } = c; week(wo)[p.i][di] = v; } }); });
      s.close(); parent.close(); toast(`초안을 넣었어요 · 근무 ${D.out.length}칸`, { label: '되돌리기', run: undo(sn) }); A.route();
    };
  }

  /* ───────── 근태: 팀 단위 ───────── */
  function attendance() {
    const L = list(), c = (k) => L.filter((p) => p.st === k).length;
    const shown = M.attSt === 'all' ? L : L.filter((p) => p.st === M.attSt);
    const daily = M.attView === 'day';
    const rows = daily ? shown.map((p) => `<button class="arow" data-m="person" data-p="${p.i}">${av(p)}<span class="atxt"><b><i style="background:${ST[p.st][2]}"></i>${p.n} <small class="gtag">${p.g}</small></b><small class="tnum">${p.plan || '근무 없음'}${p.inT ? ` · 출근 ${p.inT}` : ''}</small></span><span class="badge ${ST[p.st][1]}">${ST[p.st][0]}</span></button>`).join('')
      : L.map((p, i) => { const w = 18 - (i % 3), l = p.st === 'late' ? 2 : i % 4 === 1 ? 1 : 0, ab = p.st === 'absent' ? 1 : 0; return `<button class="arow" data-m="person" data-p="${p.i}">${av(p)}<span class="atxt"><b>${p.n} <small class="gtag">${p.g}</small></b><small class="tnum">근무 ${w}일 · ${w * 8}시간</small></span><span class="mstat tnum"><em class="${l ? 'o' : ''}">지각 ${l}</em><em class="${ab ? 'r' : ''}">결근 ${ab}</em></span></button>`; }).join('');
    return `<div class="phone fg">${top('팀 근태', `<div class="mini-seg"><button data-m="attView" data-v="day" aria-pressed="${daily}">오늘</button><button data-m="attView" data-v="month" aria-pressed="${!daily}">이번 달</button></div>`)}<div class="body fg-body">
      ${search('이름으로 찾기')}${grpChips()}
      ${daily ? `<div class="chips scroll">${[['all', '전체', L.length], ['work', '근무 중', c('work')], ['late', '지각', c('late')], ['before', '출근 전', c('before')], ['absent', '미출근', c('absent')], ['leave', '휴가', c('leave')]].map(([k, l, n]) => `<button data-m="attSt" data-v="${k}" aria-pressed="${M.attSt === k}">${l} <b class="tnum">${n}</b></button>`).join('')}</div>` : `<p class="perm">${ic('mono/info')}10월 1일 – 27일 · 사람을 누르면 날짜별 기록</p>`}
      <section class="fbox att">${rows || '<div class="none">해당하는 사람이 없어요</div>'}</section>
    </div>${A.tabbar('attendance')}</div>`;
  }
  /* 사람 한 명 — 날짜별 기록 (이전·다음 날, 달력으로 날짜 고르기) */
  const rec = (p, d) => {
    const n = Math.round((d - BASE) / 864e5), wo = Math.floor(n / 7), di = n - wo * 7, c = week(wo)[p.i][di];
    const T = new Date(2026, 9, 27);
    if (+d === +T) return { st: p.st, plan: p.plan, in: p.inT, out: '' };
    if (d > T) return { st: c?.k === 's' ? 'plan' : 'off', plan: c?.k === 's' ? `${sh(c.id).s}–${sh(c.id).e}` : '' };
    if (!c || c.k !== 's') return { st: c?.k === 'leave' ? 'leave' : 'off', plan: '' };
    const x = sh(c.id), seed = (p.i * 7 + d.getDate()) % 9, h = +x.s.slice(0, 2);
    const late = seed === 0, miss = seed === 4;
    return { st: late ? 'late' : miss ? 'miss' : 'ok', plan: `${x.s}–${x.e}`, in: late ? `${pad(h)}:12` : `${pad(h - 1)}:${50 + seed}`, out: miss ? '' : `${x.e.slice(0, 2)}:0${seed % 6}` };
  };
  const RST = { ok: ['정상', 'badge-green'], late: ['지각', 'badge-orange'], miss: ['퇴근 누락', 'badge-red'], off: ['휴무', 'badge-grey'], leave: ['휴가', 'badge-blue'], plan: ['예정', 'badge-grey'], work: ['근무 중', 'badge-green'], before: ['출근 전', 'badge-grey'], absent: ['미출근', 'badge-red'] };
  function person(pi) {
    const p = PEOPLE[pi], T = new Date(2026, 9, 27);
    let day = new Date(T), cal = false;
    const s = A.info(p.n, '', '<div id="pf" class="pf"></div>');
    const draw = () => {
      const r = rec(p, day), fut = day > T;
      const y = day.getFullYear(), mo = day.getMonth(), lead = (new Date(y, mo, 1).getDay() + 6) % 7, last = new Date(y, mo + 1, 0).getDate();
      const calH = cal ? `<div class="pcal"><div class="pcal-h"><button data-pc="-1" aria-label="이전 달">${ic('glyph/chevron-left')}</button><b>${y}년 ${mo + 1}월</b><button data-pc="1" aria-label="다음 달" ${y === 2026 && mo >= 10 ? 'disabled' : ''}>${ic('glyph/chevron-right')}</button></div>
        <div class="pcal-g">${'월화수목금토일'.split('').map((d) => `<em>${d}</em>`).join('')}${'<span></span>'.repeat(lead)}${Array.from({ length: last }, (_, i) => { const d = new Date(y, mo, i + 1), rr = rec(p, d); return `<button data-pd="${i + 1}" class="${+d === +day ? 'on' : ''} ${+d === +T ? 'today' : ''}">${i + 1}<i class="${['late', 'miss'].includes(rr.st) ? 'w' : ''}"></i></button>`; }).join('')}</div>
        <p class="perm">${ic('mono/info')}주황 점은 지각 · 퇴근 누락이 있는 날</p></div>` : '';
      s.setBody(`<p class="muted sm">${p.g} · ${p.t}</p>
        <div class="pday"><button class="rbtn" data-pn="-1" aria-label="이전 날">${ic('glyph/chevron-left')}</button>
          <button class="pday-l" data-pcal>${ic('mono/calendar')}<b>${day.getMonth() + 1}월 ${day.getDate()}일 (${'일월화수목금토'[day.getDay()]})</b>${ic(cal ? 'glyph/chevron-up' : 'glyph/chevron-down')}</button>
          <button class="rbtn" data-pn="1" aria-label="다음 날">${ic('glyph/chevron-right')}</button></div>${calH}
        <div class="box"><div class="summary"><div><span>상태</span><b><span class="badge ${RST[r.st][1]}">${RST[r.st][0]}</span></b></div><div><span>근무 계획</span><b class="tnum">${r.plan || '없음'}</b></div><div><span>출근</span><b class="tnum">${r.in || '—'}</b></div><div><span>퇴근</span><b class="tnum ${r.st === 'miss' ? 'err' : ''}">${r.st === 'miss' ? '기록 없음' : r.out || '—'}</b></div></div></div>`);
      s.$('#pf').innerHTML = fut || ['off', 'leave'].includes(r.st) ? '<button class="btn btn-grey btn-lg" id="cx">닫기</button>' : '<button class="btn btn-grey btn-lg" id="nd">출근 알림</button><button class="btn btn-primary btn-lg" id="fx">이 날 기록 고치기</button>';
      $$('[data-pn]', s.el).forEach((b) => (b.onclick = () => { const n = new Date(day); n.setDate(n.getDate() + +b.dataset.pn); day = n; draw(); }));
      s.$('[data-pcal]').onclick = () => { cal = !cal; draw(); };
      $$('[data-pc]', s.el).forEach((b) => (b.onclick = () => { day = new Date(y, mo + +b.dataset.pc, 1); draw(); }));
      $$('[data-pd]', s.el).forEach((b) => (b.onclick = () => { day = new Date(y, mo, +b.dataset.pd); cal = false; draw(); }));
      s.$('#cx')?.addEventListener('click', s.close);
      s.$('#nd')?.addEventListener('click', () => { s.close(); toast(`${p.n}님께 알림을 보냈어요`); });
      s.$('#fx')?.addEventListener('click', () => {
        const dl = `${day.getMonth() + 1}월 ${day.getDate()}일`;
        s.setBody(`<p class="muted sm">${p.n} · ${dl} · 계획 ${r.plan}</p>${ui.field('고칠 기록', ui.seg(['출근', '퇴근'], r.st === 'miss' ? 1 : 0, 'block'))}${ui.field('시각', `<input class="input sm" type="time" value="${r.st === 'miss' ? r.plan.slice(-5) : r.in || '10:00'}">`)}${ui.field('사유', '<textarea class="input" placeholder="예: 기기 오류로 기록이 빠졌어요"></textarea>', '고친 기록은 본인에게 알림이 가고 변경 이력에 남아요')}`);
        bindControls(s.el); s.$('#pf').innerHTML = '<button class="btn btn-grey btn-lg" id="bk">뒤로</button><button class="btn btn-primary btn-lg" id="sv">저장</button>';
        s.$('#bk').onclick = draw; s.$('#sv').onclick = () => { s.close(); toast(`${p.n}님 ${dl} 기록을 고쳤어요`); };
      });
    };
    draw();
  }

  /* ───────── 승인: 근태 수정 · 소명 · 휴가 · 근무지 ───────── */
  const AP = { fix: '근태 수정', exp: '소명', lv: '휴가', wp: '근무지' };
  const CERT = { gps: 'GPS', qr: 'QR 코드', 'qr-gps': 'QR 코드 + GPS', none: '인증 없음' };
  function approve() {
    const t = M.apTab;
    let body;
    if (t === 'wp') {
      body = `<p class="perm">${ic('mono/info')}내 그룹의 근무지 인증 방법과 반경을 바꿀 수 있어요 · 추가·삭제는 사업자 대시보드에서</p>
        <section class="fbox list">${M.wp.filter((w) => M.grp === '전체' || w.g === M.grp).map((w, i) => `<button class="row" data-m="wp" data-v="${M.wp.indexOf(w)}">${ic('color/nav-workplaces', 'lead')}<span class="txt"><b>${w.n}</b><small>${CERT[w.cert]}${w.cert.includes('gps') ? ` · 반경 ${w.r}m` : ''} · ${w.early}분 전부터 출근</small></span>${ic('glyph/chevron-right')}</button>`).join('')}</section>`;
    } else {
      const L = M.apDone ? M.done.filter((x) => x.tab === t) : M[t].filter((x) => M.grp === '전체' || PEOPLE.find((p) => p.n === x.n)?.g === M.grp);
      body = `<div class="ap-sw"><button data-m="apDone" data-v="0" aria-pressed="${!M.apDone}">대기 ${M[t].length}</button><button data-m="apDone" data-v="1" aria-pressed="${M.apDone}">처리함</button></div>
        ${L.length ? L.map((x) => `<section class="fbox ap-card">${ic('color/' + x.k, 'ap-ic')}<div class="ap-c"><div class="ap-top"><b>${x.n}</b><span class="gtag">${PEOPLE.find((p) => p.n === x.n)?.g || ''}</span>${x.res ? `<em class="badge ${x.res === '승인' ? 'badge-green' : 'badge-red'}">${x.res}</em>` : ''}</div>
          <p><b>${x.t}</b> · ${x.d}</p><small>${x.v}</small><p class="why">“${x.why}”${x.file ? ` <button class="link" data-m="file">${ic('mono/document')}첨부 보기</button>` : ''}</p>
          ${x.res ? '' : `<div class="ap-b"><button class="btn btn-grey" data-m="apDo" data-v="0" data-i="${M[t].indexOf(x)}">반려</button><button class="btn btn-primary" data-m="apDo" data-v="1" data-i="${M[t].indexOf(x)}">승인</button></div>`}</div></section>`).join('')
        : `<div class="lv-empty">${A.charImg('working', 'float sm')}<b>${M.apDone ? '처리한 내역이 없어요' : `기다리는 ${AP[t]} 요청이 없어요`}</b><span>새 요청이 오면 알림으로 알려 드릴게요</span></div>`}`;
    }
    return `<div class="phone fg">${top('승인')}<div class="body fg-body">
      <div class="ap-tabs">${Object.entries(AP).map(([k, l]) => `<button data-m="apTab" data-v="${k}" aria-pressed="${t === k}">${l}${k !== 'wp' && M[k].length ? ` <b class="tnum">${M[k].length}</b>` : ''}</button>`).join('')}</div>
      ${grpChips()}${body}
    </div>${A.tabbar('approve')}</div>`;
  }
  function wpSheet(i) {
    const w = M.wp[i];
    w.px = w.px ?? 50; w.py = w.py ?? 50;
    const s = A.info(`${w.n} 근무지 설정`, `<div class="field"><span class="field-label">위치</span>
        <div class="wp-addr"><input class="input sm" id="wa" value="${w.a}"><button type="button" class="btn btn-grey btn-sm" id="wf">${ic('glyph/search')}찾기</button></div>
        <div class="wp-map" id="wm"><i class="wp-grid"></i><i class="wp-rad" id="wrd"></i><span class="wp-pin" id="wpin">${ic('color/gps')}</span><button type="button" class="wp-me" id="wme">${ic('mono/locate')}현재 위치</button></div>
        <span class="field-hint">지도를 누르거나 핀을 끌어 매장 입구에 맞춰 주세요</span></div>
      <div class="field"><span class="field-label">출퇴근 인증</span><div class="pick" id="wc">${Object.entries(CERT).map(([k, l]) => `<button type="button" data-v="${k}" aria-pressed="${w.cert === k}">${l}</button>`).join('')}</div></div>
      ${ui.field('GPS 반경', ui.seg([[50, '50m'], [100, '100m'], [200, '200m'], [300, '300m']], [50, 100, 200, 300].indexOf(w.r), 'block').replace('class="segment ', 'id="wr" class="segment '))}
      ${ui.field('출근 가능 시간', ui.seg([[15, '15분 전'], [30, '30분 전'], [60, '1시간 전'], [120, '2시간 전']], Math.max(0, [15, 30, 60, 120].indexOf(w.early)), 'block').replace('class="segment ', 'id="we" class="segment '), '근무 시작 몇 분 전부터 출근을 찍을 수 있어요')}`,
      '<button class="btn btn-primary btn-lg" id="ok">저장</button>');
    bindControls(s.el);
    const pin = s.$('#wpin'), rad = s.$('#wrd'), map = s.$('#wm');
    const place = () => { pin.style.left = rad.style.left = w.px + '%'; pin.style.top = rad.style.top = w.py + '%'; const r = +segVal(s.$('#wr')); rad.style.width = rad.style.height = r * 0.9 + 'px'; rad.hidden = !pickVals(s.$('#wc'))[0].includes('gps'); };
    let dragging = false;
    const at = (e) => { const b = map.getBoundingClientRect(); w.px = Math.max(5, Math.min(95, ((e.clientX - b.left) / b.width) * 100)); w.py = Math.max(8, Math.min(92, ((e.clientY - b.top) / b.height) * 100)); place(); };
    map.addEventListener('pointerdown', (e) => { if (e.target.closest('#wme')) return; dragging = true; map.setPointerCapture(e.pointerId); at(e); });
    map.addEventListener('pointermove', (e) => dragging && at(e));
    map.addEventListener('pointerup', () => (dragging = false));
    s.$('#wme').onclick = () => { w.px = 50; w.py = 50; place(); toast('현재 위치로 옮겼어요 (시안)'); };
    s.$('#wf').onclick = () => { w.px = 40 + Math.random() * 20; w.py = 40 + Math.random() * 20; place(); toast('주소를 찾아 핀을 옮겼어요'); };
    s.el.addEventListener('click', () => setTimeout(place));
    place();
    s.$('#ok').onclick = () => { w.a = s.$('#wa').value.trim() || w.a; Object.assign(w, { cert: pickVals(s.$('#wc'))[0], r: +segVal(s.$('#wr')), early: +segVal(s.$('#we')) }); s.close(); toast(`${w.n} 근무지 설정을 저장했어요`); A.route(); };
  }

  /* ───────── 이벤트 ───────── */
  const ACT = {
    grp: (b) => { M.grp = b.dataset.v; A.route(); },
    goAtt: (b) => { M.attSt = b.dataset.v; M.attView = 'day'; location.hash = '#/attendance'; },
    goAp: (b) => { M.apTab = b.dataset.v; M.apDone = false; location.hash = '#/approve'; },
    nudge: (b) => toast(`${b.dataset.n}님께 알림을 보냈어요`),
    punch: () => A.punch(),
    view: (b) => { M.view = b.dataset.v; A.route(); },
    wk: (b) => { M.wk = Math.max(-26, Math.min(8, M.wk + +b.dataset.v)); A.route(); },
    mon: (b) => { M.mon = Math.max(-6, Math.min(2, (M.mon || 0) + +b.dataset.v)); A.route(); },
    toWeek: (b) => { M.wk = +b.dataset.v; M.view = 'week'; A.route(); },
    cell: (b) => cellSheet(+b.dataset.p, +b.dataset.d),
    quick,
    attView: (b) => { M.attView = b.dataset.v; A.route(); },
    attSt: (b) => { M.attSt = b.dataset.v; A.route(); },
    person: (b) => person(+b.dataset.p),
    apTab: (b) => { M.apTab = b.dataset.v; M.apDone = false; A.route(); },
    apDone: (b) => { M.apDone = b.dataset.v === '1'; A.route(); },
    apDo: async (b) => {
      const t = M.apTab, x = M[t][+b.dataset.i], ok = b.dataset.v === '1';
      if (!ok && !(await confirmBox({ title: `${x.n}님의 ${x.t}을 반려할까요?`, desc: '반려하면 본인에게 알림이 가요.', ok: '반려', danger: true }))) return;
      M[t].splice(+b.dataset.i, 1); M.done.unshift({ ...x, tab: t, res: ok ? '승인' : '반려' });
      toast(`${x.n}님 ${x.t}을 ${ok ? '승인' : '반려'}했어요`); A.route();
    },
    file: () => A.info('첨부 파일', `<div class="filebox">${ic('mono/document')}<b>증빙서류.pdf</b><small>1장 · 240KB</small></div>`),
    wp: (b) => wpSheet(+b.dataset.v),
  };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (b && ACT[b.dataset.m]) { e.preventDefault(); ACT[b.dataset.m](b); } });
  let qt;
  document.addEventListener('input', (e) => { if (!e.target.matches('[data-mq]')) return; M.q = e.target.value.trim(); clearTimeout(qt); qt = setTimeout(() => { A.route(); const q = $('[data-mq]'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 250); });

  window.MGR = { count, pages: { home, schedule, attendance, approve } };
})();
