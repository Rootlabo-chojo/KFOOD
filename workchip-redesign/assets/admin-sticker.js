/* 사업자 대시보드 — 설정 › QR 스티커 신청 (주문 · 결제 · 주문 내역 · 무료 인쇄)
   스티커 디자인은 「워크칩 QR 스티커 가이드 v2」(2026.11.13) 출력 샘플을 그대로 따름. 금액 · 결제는 시안 */
(function () {
  const { $, $$, S, WORKPLACES, PAGES, ph, tabs, tabOf, render, acts } = A;
  A.ROUTES.push(['sticker', 'QR 스티커 신청', 'qr', '설정']);

  const PRICE = { qr: 5000, nfc: 10000 }, SHIP = 3000;
  const won = (n) => n.toLocaleString('ko-KR') + '원';
  const LIM = { store: 13, loc: 15, extra: 22, home: 30 };
  const wps = () => WORKPLACES.filter((w) => w.cert !== 'none');
  const st = () => (S.ui.stk = S.ui.stk || {
    ver: 'qr', size: 'std', extra: '근무 시작 10분 전까지 찍어 주세요', logo: null, logoW: 0, home: '', guide: false, view: 0,
    lines: Object.fromEntries(wps().map((w, i) => [w.n, { q: i === 0 ? 1 : 0, store: `SOLV ${w.n}`.slice(0, 13), loc: i === 0 ? '출입구 옆' : '' }])),
    ship: { name: '김하늘', phone: '010-0000-0000', addr: '서울 강남구 테헤란로 000', addr2: '3층 SOLV', memo: '' },
    orders: [{ no: 'WC-2610-0412', at: '2026.10.12', items: 'QR 스티커 · 기본 × 3장', wp: '본사 외 1곳', total: 18000, step: 4, pay: '신용카드' }],
  });

  /* ───────── 스티커 (가이드 출력 샘플과 같은 배치) ───────── */
  const markLogo = (logo, size) => logo
    ? `<img class="stk-logo-img" src="${logo}" alt="매장 로고">`
    : `<span class="stk-wc"><img src="../assets/brand/symbol.png" alt="">workchip</span>`;
  /* 가이드 템플릿(build.py std) 값 그대로 — 1240 × 1844px 기준, --u = 스티커 폭/1240 */
  function sticker(o) {
    const nfc = o.ver === 'nfc', qr = fakeQR(o.seed || 7, 33);
    const logoIn = o.logo ? `<img class="stk-logo-img" src="${o.logo}" alt="매장 로고">` : `<span class="stk-wc"><img src="../assets/brand/symbol.png" alt="">workchip</span>`;
    const logo = `<div class="stk-logo ${o.guide ? 'ga' : ''}">${o.guide ? '<em class="ga-tag">매장 로고로 바꿀 수 있는 자리</em>' : ''}${logoIn}</div>`;
    const store = `<b class="stk-store">${o.store || '매장명'}</b>${o.loc ? `<span class="stk-loc">${o.loc}</span>` : ''}`;
    const card = nfc ? `<div class="stk-card nfc"><div class="stk-row"><div class="stk-nfc">${ic('mono/smartphone')}<b>여기에 폰 대기</b><small>NFC</small></div><div class="stk-qrw"><div class="stk-qr">${qr}</div><small>NFC가 안 되면 QR</small></div></div>${store}</div>`
      : `<div class="stk-card"><div class="stk-qr">${qr}</div>${store}</div>`;
    const home = o.home ? `<div class="stk-home ${o.guide ? 'ga' : ''}">${o.home}</div>` : o.guide ? '<div class="stk-home ga hz-none">홈페이지 넣는 자리 · 선택</div>' : '';
    const foot = `<div class="stk-foot">${o.extra || nfc ? `<div>${o.extra ? `<b class="stk-extra">${o.extra}</b>` : ''}${nfc ? '<small class="stk-note">안드로이드는 NFC를 켜 주세요 · 아이폰은 화면만 켜져 있으면 돼요</small>' : ''}</div>` : ''}${home}</div>`;
    if (o.orient === 'h') return `<div class="stk land ${nfc ? 'nfc' : ''} ${o.guide ? 'guide' : ''}"><div class="stk-in">
      <div class="stk-l"><div class="stk-top">${logo}</div><em class="stk-badge">${nfc ? '출퇴근 NFC · QR' : '출퇴근 QR'}</em>
        <h3 class="stk-h">${nfc ? '폰 대면' : 'QR 찍으면'}<br><span>출근 끝</span></h3>
        <p class="stk-sub">${nfc ? '휴대폰을 대면<br><b>바로 출근·퇴근</b>이 기록돼요' : '카메라로 찍으면<br><b>바로 출근·퇴근</b>이 기록돼요'}</p>
        <img class="stk-char" src="../assets/brand/character.png" alt="">${foot}</div>
      ${card}</div></div>`;
    return `<div class="stk ${nfc ? 'nfc' : ''} ${o.guide ? 'guide' : ''}"><div class="stk-in">
      <div><div class="stk-top">${logo}<em class="stk-badge">${nfc ? '출퇴근 NFC · QR' : '출퇴근 QR'}</em></div>
        <h3 class="stk-h">${nfc ? '폰 대면' : 'QR 찍으면'}<br><span>출근 끝</span></h3>
        <p class="stk-sub">${nfc ? '휴대폰을 대면 <b>바로 출근·퇴근</b>이 기록돼요' : '카메라로 찍으면 <b>바로 출근·퇴근</b>이 기록돼요'}</p></div>
      ${card}
      <div class="stk-foot">${o.extra || nfc ? `<div>${o.extra ? `<b class="stk-extra">${o.extra}</b>` : ''}${nfc ? '<small class="stk-note">안드로이드는 설정에서 NFC를 켜 주세요 · 아이폰은 화면만 켜져 있으면 돼요</small>' : ''}</div>` : ''}${home}</div>
    </div><img class="stk-char" src="../assets/brand/character.png" alt=""></div>`;
  }

  /* ───────── 페이지 ───────── */
  PAGES.sticker = function () {
    const t = tabOf('sticker'), o = st();
    const head = ph('QR 스티커 신청', '매장 입구에 붙여 두면 직원이 찍거나 폰을 대기만 해도 출퇴근이 기록돼요.') + tabs(['주문하기', ['주문 내역', o.orders.length], '무료로 인쇄']);
    if (t === 1) return head + history();
    if (t === 2) return head + freePrint();
    const sec = (n, title, desc, body, badge = '') => `<section class="card stk-sec"><div class="af-h"><span class="af-n">${n}</span><h3>${title}</h3>${badge}</div>${desc ? `<p class="af-d">${desc}</p>` : ''}${body}</section>`;
    const cnt = (k, v) => `<span class="cnt-l tnum" data-cnt="${k}">${(v || '').length}/${LIM[k]}</span>`;
    return head + `<div class="stk-grid"><div class="stk-form">
      ${sec(1, '버전', '', `<div class="pick cards stk-ver" id="kVer">
        <button type="button" data-v="qr" aria-pressed="${o.ver === 'qr'}">${ic('color/qr')}<span><b>QR 스티커</b><small>휴대폰 카메라로 찍으면 기록 · 모든 스마트폰 · 10.2 × 15.2 cm</small><em class="tnum">장당 ${won(PRICE.qr)}</em></span></button>
        <button type="button" data-v="nfc" aria-pressed="${o.ver === 'nfc'}">${ic('color/auth-nfc')}<span><b>NFC + QR 스티커</b><small>파란 원에 폰을 대면 기록 · 안 되는 폰은 QR · 10.2 × 15.2 cm</small><em class="tnum">장당 ${won(PRICE.nfc)}</em><i class="nfc-plus">NFC +${won(PRICE.nfc - PRICE.qr)}</i></span></button></div>
        <p class="stk-tip" id="kNfcTip" ${o.ver === 'nfc' ? '' : 'hidden'}>${ic('mono/info')}금속 위에 붙이면 NFC가 인식되지 않아요. 벽 · 나무 · 유리 · 아크릴 위에 붙여 주세요.</p>`)}
      ${sec(2, '방향', '크기는 같고 붙이는 방향만 달라요. 가격도 같아요.', `<div class="pick cards stk-ori" id="kOri">
        <button type="button" data-v="v" aria-pressed="${o.orient !== 'h'}"><i class="ori v"></i><span><b>세로형</b><small class="tnum">10.2 × 15.2 cm · 출입구 벽 · 기둥</small></span></button>
        <button type="button" data-v="h" aria-pressed="${o.orient === 'h'}"><i class="ori h"></i><span><b>가로형</b><small class="tnum">15.2 × 10.2 cm · 포스기 옆 · 낮은 벽 · 카운터</small></span></button></div>`)}
      ${sec(3, '근무지와 수량', '근무지마다 출퇴근 QR이 달라요. 붙일 근무지의 수량을 정하고 매장명 · 붙이는 위치를 적어 주세요.', `<div class="stk-lines">${wps().map((w) => { const l = o.lines[w.n]; return `<div class="stk-line ${l.q ? 'on' : ''}" data-wp="${w.n}">
          <div class="sl-h"><span class="sl-n">${ic('color/nav-workplaces')}<span><b>${w.n}</b><small>${A.CERT[w.cert][1]}</small></span></span>${ui.stepper('q_' + w.n, l.q, '장').replace('class="stepper"', `class="stepper" data-max="20" data-q="${w.n}"`)}</div>
          <div class="sl-b" ${l.q ? '' : 'hidden'}>
            <label class="sl-f"><span>매장명 <i class="sl-req">필수</i></span><input class="input sm" data-f="store" data-wp="${w.n}" maxlength="13" value="${l.store}">${cnt('store', l.store).replace('data-cnt="store"', `data-cnt="store-${w.n}"`)}</label>
            <label class="sl-f"><span>붙이는 위치 <i>선택</i></span><input class="input sm" data-f="loc" data-wp="${w.n}" maxlength="15" value="${l.loc}" placeholder="예: 주방 출입구 옆">${cnt('loc', l.loc).replace('data-cnt="loc"', `data-cnt="loc-${w.n}"`)}</label></div></div>`; }).join('')}</div>`, '<span class="af-badge tnum" id="kQty"></span>')}
      ${sec(4, '문구와 로고', '모든 스티커에 같이 들어가요. 비워 두면 그 자리 없이 깔끔하게 나와요. 큰 제목과 QR · NFC 자리는 바꿀 수 없어요.', `
        <label class="sl-f wide"><span>한 줄 안내 <i>선택</i></span><input class="input sm" id="kExtra" maxlength="22" value="${o.extra}" placeholder="예: 근무 시작 10분 전까지 찍어 주세요">${cnt('extra', o.extra)}</label>
        <div class="field"><span class="field-label">로고</span><div class="pick stk-lg" id="kLogo">
          <button type="button" data-v="wc" aria-pressed="${!o.logo}">${ic('mono/image')}워크칩 로고 (기본)</button><button type="button" data-v="mine" aria-pressed="${!!o.logo}">${ic('mono/image-add')}우리 매장 로고로 바꾸기</button></div>
          <div class="stk-up" id="kUp" ${o.logo ? '' : 'hidden'}>
            <label class="up-box">${o.logo ? `<img src="${o.logo}" alt="">` : `${ic('mono/upload')}<b>로고 파일 올리기</b>`}<small>${o.logo ? `가로 ${o.logoW}px · 다른 파일로 바꾸려면 누르세요` : 'PNG · JPG · SVG · 배경이 투명하고 가로 1,000px 이상'}</small><input type="file" id="kFile" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden></label>
            <p class="field-hint ${o.logo && o.logoW && o.logoW < 1000 ? 'err' : ''}" id="kLogoHint">${o.logo && o.logoW && o.logoW < 1000 ? '가로 1,000px보다 작아 인쇄하면 흐릴 수 있어요' : '맨 위 워크칩 로고 자리(4.4 × 0.9 cm)에 비율을 지켜 들어가요. 흰색 로고는 안 보이니 진한 색으로 올려 주세요.'}</p></div></div>
        <label class="sl-f wide"><span>홈페이지 <i>선택</i></span><input class="input sm" id="kHome" maxlength="30" value="${o.home}" placeholder="예: solv.co.kr  (https:// 는 빼고)">${cnt('home', o.home)}</label>`)}
      ${sec(5, '배송지', '', `<div class="row2">${ui.field('받는 분', `<input class="input sm" data-s="name" value="${o.ship.name}">`)}${ui.field('연락처', `<input class="input sm" data-s="phone" type="tel" value="${o.ship.phone}">`)}</div>
        ${ui.field('주소', `<div class="copy-in"><input class="input sm" data-s="addr" value="${o.ship.addr}"><button type="button" class="btn btn-grey btn-sm" data-act="stkAddr">${ic('glyph/search')}주소 찾기</button></div>`)}
        <div class="row2">${ui.field('상세 주소', `<input class="input sm" data-s="addr2" value="${o.ship.addr2}">`)}${ui.field('배송 요청 <span class="opt">선택</span>', `<input class="input sm" data-s="memo" value="${o.ship.memo}" placeholder="예: 매장 오픈 전 경비실">`)}</div>`)}
    </div>
    <aside class="stk-side"><div class="stk-pv card"><div class="pv-h"><b>미리보기</b>
        ${o.logo ? `<div class="segment" id="kCmp"><button data-v="0" aria-selected="${o.view === 0}">우리 로고</button><button data-v="1" aria-selected="${o.view === 1}">기본과 비교</button></div>` : ''}
        <label class="pv-g">${ui.switch(o.guide, 'kGuide')}<span>바꿀 수 있는 자리</span></label></div>
        <div class="pv-wp" id="kPvWp"></div><div class="pv-box" id="kPv"></div></div>
      <div class="card stk-sum" id="kSum"></div></aside></div>`;
  };

  function upd(p = document) {
    const o = st(), on = wps().filter((w) => o.lines[w.n].q > 0), qty = on.reduce((a, w) => a + o.lines[w.n].q, 0);
    const pvWp = on[0] || wps()[0], l = o.lines[pvWp.n];
    const base = { size: o.size, orient: o.orient, ver: o.ver, store: l.store, loc: l.loc, extra: o.extra, home: o.home, guide: o.guide, seed: pvWp.n.length * 13 + 5 };
    const pv = $('#kPv', p); if (!pv) return;
    const cmp = o.logo && o.view === 1;
    pv.className = `pv-box ${o.orient === 'h' ? 'land' : ''} ${cmp ? 'cmp' : ''}`;
    pv.innerHTML = cmp ? `<figure>${sticker({ ...base, logo: null })}<figcaption>기본 · 워크칩 로고</figcaption></figure><figure>${sticker({ ...base, logo: o.logo })}<figcaption>바꾼 뒤 · 우리 로고</figcaption></figure>`
      : `<figure>${sticker({ ...base, logo: o.logo })}<figcaption>${o.logo ? '우리 매장 로고 적용' : '기본 · 워크칩 로고'} · ${o.orient === 'h' ? '가로형 15.2 × 10.2 cm' : '세로형 10.2 × 15.2 cm'}</figcaption></figure>`;
    $('#kPvWp', p).innerHTML = on.length > 1 ? `${ic('mono/info')}${pvWp.n} 스티커예요 · 나머지 ${on.length - 1}곳은 매장명 · 위치만 달라요` : '';
    $('#kQty', p).textContent = `${on.length}곳 · ${qty}장`;
    const sub = qty * PRICE[o.ver], total = sub + (qty ? SHIP : 0);
    const miss = on.find((w) => !o.lines[w.n].store.trim());
    const err = !qty ? '근무지 수량을 1장 이상 넣어 주세요' : miss ? `${miss.n} 매장명을 적어 주세요` : !o.ship.name || !o.ship.addr ? '배송지를 적어 주세요' : o.logo === '' ? '' : '';
    $('#kSum', p).innerHTML = `<b class="sum-t">결제 금액</b>
      <div class="summary"><div><span>${o.ver === 'nfc' ? 'NFC + QR' : 'QR'} 스티커 · ${o.orient === 'h' ? '가로형' : '세로형'}</span><b class="tnum">${won(PRICE[o.ver])} × ${qty}장</b></div>
        ${o.ver === 'nfc' && qty ? `<div class="sub"><span>└ QR ${won(PRICE.qr)} + NFC ${won(PRICE.nfc - PRICE.qr)}</span><b></b></div>` : ''}
        <div><span>상품 금액</span><b class="tnum">${won(sub)}</b></div><div><span>배송비</span><b class="tnum">${qty ? won(SHIP) : '—'}</b></div>
</div>
      <div class="sum-total"><span>총 결제 금액</span><b class="tnum">${won(total)}</b></div>
      ${err ? `<p class="field-hint err">${err}</p>` : ''}
      <button class="btn btn-primary btn-lg btn-block" data-act="stkPay" ${err ? 'disabled' : ''}>${qty ? `${won(total)} 결제하기` : '결제하기'}</button>
      <p class="sum-note">결제 후 3–5 영업일 안에 제작해 보내 드려요. 제작 시작 전까지는 주문을 취소할 수 있어요.</p>`;
  }

  A.after.sticker = (p) => {
    const o = st(), t = tabOf('sticker');
    if (t === 2) return afterPrint(p);
    if (t !== 0) return;
    upd(p);
    $('#kOri', p).addEventListener('change', () => { o.orient = pickVals($('#kOri', p))[0]; upd(p); });
    $('#kVer', p).addEventListener('change', () => { o.ver = pickVals($('#kVer', p))[0]; $('#kNfcTip', p).hidden = o.ver !== 'nfc'; upd(p); });
    $('#kLogo', p).addEventListener('change', () => { const mine = pickVals($('#kLogo', p))[0] === 'mine'; $('#kUp', p).hidden = !mine; if (!mine) { o.logo = null; render(); } else if (!o.logo) $('#kFile', p).click(); });
    $('#kFile', p).onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 10 * 1024 * 1024) return toast('10MB 이하 파일만 올릴 수 있어요');
      const r = new FileReader();
      r.onload = () => { const im = new Image(); im.onload = () => { o.logo = r.result; o.logoW = im.naturalWidth; o.view = 1; render(); toast('로고를 바꿨어요 · 기본과 비교해 보세요'); }; im.src = r.result; };
      r.readAsDataURL(f);
    };
    $('#kCmp', p)?.addEventListener('change', (e) => { o.view = +e.detail; upd(p); });
    $('#kGuide', p).onchange = (e) => { o.guide = e.target.checked; upd(p); };
    const count = (k, el) => { const c = $(`[data-cnt="${k}"]`, p); if (c) c.textContent = `${el.value.length}/${el.maxLength}`; };
    $('#kExtra', p).oninput = (e) => { o.extra = e.target.value; count('extra', e.target); upd(p); };
    $('#kHome', p).oninput = (e) => { o.home = e.target.value.replace(/^https?:\/\//, ''); count('home', e.target); upd(p); };
    $$('[data-f]', p).forEach((i) => (i.oninput = () => { o.lines[i.dataset.wp][i.dataset.f] = i.value; count(`${i.dataset.f}-${i.dataset.wp}`, i); upd(p); }));
    $$('[data-s]', p).forEach((i) => (i.oninput = () => { o.ship[i.dataset.s] = i.value; upd(p); }));
    $$('.stepper[data-q]', p).forEach((s) => s.addEventListener('change', () => {
      const n = s.dataset.q, q = +s.querySelector('b').textContent, line = s.closest('.stk-line');
      o.lines[n].q = q; line.classList.toggle('on', q > 0); line.querySelector('.sl-b').hidden = !q; upd(p);
    }));
  };
  acts.stkAddr = () => { const i = $('[data-s="addr"]'); i.value = '서울 강남구 테헤란로 000 (역삼동)'; st().ship.addr = i.value; upd(); toast('주소를 찾았어요 (시안)'); };

  /* ───────── 결제 ───────── */
  acts.stkPay = () => {
    const o = st(), on = wps().filter((w) => o.lines[w.n].q > 0), qty = on.reduce((a, w) => a + o.lines[w.n].q, 0), total = qty * PRICE[o.ver] + SHIP;
    const M = [['card', '신용 · 체크카드', 'mono/wallet'], ['kakao', '카카오페이', 'mono/chat'], ['naver', '네이버페이', 'mono/star'], ['toss', '토스페이', 'mono/zap'], ['bank', '계좌이체', 'mono/buildings']];
    const m = openModal({ title: '결제하기', size: 'lg', body: `
      <div class="box"><div class="summary"><div><span>상품</span><b>${o.ver === 'nfc' ? 'NFC + QR' : 'QR'} 스티커 · ${o.orient === 'h' ? '가로형' : '세로형'} × ${qty}장</b></div><div><span>근무지</span><b>${on.map((w) => `${w.n} ${o.lines[w.n].q}장`).join(' · ')}</b></div>
        <div><span>로고</span><b>${o.logo ? '우리 매장 로고' : '워크칩 로고'}</b></div><div><span>받는 곳</span><b>${o.ship.name} · ${o.ship.addr} ${o.ship.addr2}</b></div></div></div>
      <div class="field"><span class="field-label">결제 수단</span><div class="pick cards pay-m" id="pm">${M.map(([k, l, i], j) => `<button type="button" data-v="${k}" aria-pressed="${!j}">${ic(i)}${l}</button>`).join('')}</div></div>
      <div class="field" id="pmCard"><span class="field-label">카드</span>${ui.select('pc', ['현대카드', '신한카드', '삼성카드', 'KB국민카드', '롯데카드', '하나카드', 'NH농협카드'])}${ui.field('할부', ui.select('pi', ['일시불', '2개월', '3개월']))}</div>
      <div class="box blue" id="pmBank" hidden>${ic('mono/info')} 결제하면 입금할 가상계좌를 알려 드려요. 24시간 안에 입금하면 제작이 시작돼요.</div>
      <label class="check"><input type="checkbox" id="pa"><span>주문 내용을 확인했고 결제 진행에 동의해요 <span class="opt">(필수)</span></span></label>
      <label class="check"><input type="checkbox" id="pt" checked><span>세금계산서 발행 · 사업자 SOLV</span></label>`,
      footer: `<span class="af-sum tnum">총 ${won(total)}</span><button class="btn btn-grey btn-lg fit" data-close>취소</button><button class="btn btn-primary btn-lg fit" id="pgo" disabled>${won(total)} 결제하기</button>` });
    bindControls(m.el);
    m.$('#pm').addEventListener('change', () => { const v = pickVals(m.$('#pm'))[0]; m.$('#pmCard').hidden = v !== 'card'; m.$('#pmBank').hidden = v !== 'bank'; });
    m.$('#pa').onchange = (e) => (m.$('#pgo').disabled = !e.target.checked);
    m.$('#pgo').onclick = () => {
      const pay = M.find((x) => x[0] === pickVals(m.$('#pm'))[0])[1];
      m.setBody('<div class="ai-think"><i></i><i></i><i></i><span>결제하고 있어요</span></div>'); m.setFooter('');
      setTimeout(() => {
        const no = `WC-2611-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        o.orders.unshift({ no, at: '2026.11.13', items: `${o.ver === 'nfc' ? 'NFC + QR' : 'QR'} 스티커 · ${o.orient === 'h' ? '가로형' : '세로형'} × ${qty}장`, wp: on.length > 1 ? `${on[0].n} 외 ${on.length - 1}곳` : on[0].n, total, step: 1, pay, logo: !!o.logo });
        m.setBody(`<div class="done">${ic('color/ap-approved')}<h3>${pay === '계좌이체' ? '주문을 받았어요' : '결제를 마쳤어요'}</h3><p>주문 번호 <b class="tnum">${no}</b> · ${won(total)}</p></div>
          <ol class="ord-steps big">${['결제 완료', '제작 중', '발송', '도착'].map((s, i) => `<li class="${i === 0 ? 'on' : ''}"><i></i><span>${s}</span></li>`).join('')}</ol>
          <p class="sum-note" style="text-align:center">3–5 영업일 안에 보내 드려요. 발송하면 카카오톡으로 송장 번호를 알려 드려요.<br>받은 스티커는 붙인 뒤 점장님 폰으로 한 번 찍어 이 매장으로 기록되는지 확인해 주세요.</p>`);
        m.setFooter('<button class="btn btn-grey btn-lg" data-x>닫기</button><button class="btn btn-primary btn-lg" id="ghist">주문 내역 보기</button>');
        m.$('[data-x]').onclick = m.close; m.$('#ghist').onclick = () => { m.close(); S.tab.sticker = 1; render(); };
        Object.values(o.lines).forEach((l) => (l.q = 0));
      }, 1100);
    };
  };

  /* ───────── 주문 내역 ───────── */
  function history() {
    const o = st(), STEP = ['결제 완료', '제작 중', '발송', '도착'];
    return `<div class="ord-list">${o.orders.map((x, i) => `<section class="card ord">
      <div class="ord-h"><span><b class="tnum">${x.no}</b><small>${x.at} · ${x.pay}</small></span><span class="badge ${x.step >= 4 ? 'badge-grey' : x.step >= 3 ? 'badge-green' : 'badge-blue'}">${STEP[Math.min(3, x.step - 1)]}${x.step >= 4 ? ' · 배송 완료' : ''}</span></div>
      <div class="ord-b">${ic(x.items.startsWith('NFC') ? 'color/auth-nfc' : 'color/qr', 'lead')}<span><b>${x.items}</b><small>${x.wp}${x.logo ? ' · 우리 매장 로고' : ''}</small></span><b class="tnum">${won(x.total)}</b></div>
      <ol class="ord-steps">${STEP.map((s, j) => `<li class="${j < x.step ? 'on' : ''}"><i></i><span>${s}</span></li>`).join('')}</ol>
      <div class="ord-a"><button class="btn btn-grey btn-sm" data-act="stkRcpt" data-i="${i}">${ic('mono/document')}영수증</button>${x.step === 1 ? `<button class="btn btn-ghost btn-sm btn-text-danger" data-act="stkCancel" data-i="${i}">주문 취소</button>` : x.step >= 3 ? `<button class="btn btn-grey btn-sm" data-act="stkTrack">${ic('mono/truck')}배송 조회</button>` : ''}<button class="btn btn-grey btn-sm" data-act="stkAgain" data-i="${i}">${ic('mono/refresh')}다시 주문</button></div></section>`).join('')}</div>`;
  }
  acts.stkRcpt = (b) => { const x = st().orders[+b.dataset.i]; openModal({ title: '영수증', body: `<div class="summary"><div><span>주문 번호</span><b class="tnum">${x.no}</b></div><div><span>주문일</span><b>${x.at}</b></div><div><span>상품</span><b>${x.items}</b></div><div><span>결제 수단</span><b>${x.pay}</b></div><div><span>공급가액</span><b class="tnum">${won(Math.round(x.total / 1.1))}</b></div><div><span>부가세</span><b class="tnum">${won(x.total - Math.round(x.total / 1.1))}</b></div><div><span>합계</span><b class="tnum">${won(x.total)}</b></div></div>`, footer: '<button class="btn btn-grey btn-lg" data-close>닫기</button><button class="btn btn-primary btn-lg" onclick="toast(\'영수증 PDF를 내려받았어요 (시안)\')">PDF 받기</button>' }); };
  acts.stkCancel = async (b) => { if (await confirmBox({ title: '주문을 취소할까요?', desc: '결제한 금액은 3영업일 안에 돌려 드려요.', ok: '주문 취소', danger: true })) { st().orders.splice(+b.dataset.i, 1); toast('주문을 취소했어요'); render(); } };
  acts.stkTrack = () => toast('CJ대한통운 배송 조회로 이동해요 (시안)');
  acts.stkAgain = () => { const o = st(); o.lines[wps()[0].n].q = 1; S.tab.sticker = 0; render(); toast('같은 설정으로 주문을 채웠어요'); };

  /* ───────── 무료로 인쇄 (워크칩 로고 고정) ───────── */
  function freePrint() {
    const o = st(), f = (o.fp = o.fp || { wp: wps()[0].n, size: 'std', orient: 'v' });
    return `<div class="stk-grid fp"><div class="stk-form"><section class="card stk-sec">
        <div class="box blue fp-info">${ic('mono/info')}<div><b>직접 인쇄해서 붙일 수 있어요 · 무료</b><p>QR 스티커만 인쇄할 수 있어요. 로고는 워크칩 로고로 고정되고, NFC는 태그가 필요해 주문해야 해요.</p></div></div>
        ${ui.field('근무지', ui.select('fpWp', wps().map((w) => w.n), f.wp))}
        ${ui.field('방향', ui.seg([['v', '세로형 10.2 × 15.2 cm'], ['h', '가로형 15.2 × 10.2 cm']], f.orient === 'h' ? 1 : 0, 'block').replace('class="segment ', 'id="fpOri" class="segment '))}
        <label class="sl-f wide"><span>붙이는 위치 <i>선택</i></span><input class="input sm" id="fpLoc" maxlength="15" value="${f.loc || ''}" placeholder="예: 주방 출입구 옆"></label>
        <div class="fp-lock">${ic('mono/lock')}<span><b>로고 바꾸기 · NFC</b><small>주문하기에서 쓸 수 있어요</small></span><button class="btn btn-grey btn-sm" data-goto="sticker" data-tab="0" onclick="A.S.tab.sticker=0;A.render()">주문하러 가기</button></div>
        <ul class="fp-tips"><li>무광 용지 · 실제 크기(100%)로 인쇄하세요. 유광은 조명이 반사돼 잘 안 찍혀요</li><li>눈높이(바닥에서 120–150cm), 평평하고 마른 곳에 붙여 주세요</li><li>붙인 뒤 점장님 폰으로 한 번 찍어 이 매장으로 기록되는지 확인해요</li></ul>
        <button class="btn btn-primary btn-lg btn-block" data-act="stkPrint">${ic('mono/document')}무료로 인쇄하기</button></section></div>
      <aside class="stk-side"><div class="stk-pv card"><div class="pv-h"><b>인쇄 미리보기</b><span class="badge badge-grey">${ic('mono/lock')}워크칩 로고</span></div><div class="pv-box" id="fpPv"></div></div></aside></div>`;
  }
  const fpSticker = () => { const o = st(), f = o.fp, w = wps().find((x) => x.n === f.wp); return sticker({ size: f.size, orient: f.orient, ver: 'qr', store: `SOLV ${w.n}`.slice(0, 13), loc: f.loc || '', extra: o.extra, logo: null, seed: w.n.length * 13 + 5 }); };
  function afterPrint(p) {
    const f = st().fp, draw = () => { const b = $('#fpPv', p); b.className = `pv-box ${f.orient === 'h' ? 'land' : ''}`; b.innerHTML = `<figure>${fpSticker()}<figcaption>${f.wp} · ${f.orient === 'h' ? '가로형 15.2 × 10.2 cm' : '세로형 10.2 × 15.2 cm'}</figcaption></figure>`; };
    $('#fpWp', p).onchange = (e) => { f.wp = e.target.value; draw(); };
    $('#fpOri', p).addEventListener('change', (e) => { f.orient = e.detail; draw(); });
    $('#fpLoc', p).oninput = (e) => { f.loc = e.target.value; draw(); };
    draw();
  }
  acts.stkPrint = () => {
    const f = st().fp, land = f.orient === 'h', w = land ? '152.4mm' : '101.6mm', hgt = land ? '101.6mm' : '152.4mm', css = (h) => new URL(`../assets/${h}`, location.href).href;
    const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0'; document.body.appendChild(fr);
    fr.contentDocument.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="${location.href}"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"><link rel="stylesheet" href="${css('tokens.css')}"><link rel="stylesheet" href="${css('admin.css')}">
      <style>@page{size:${w} ${hgt};margin:0}html,body{margin:0;background:#fff}.stk{width:${w}!important;border-radius:0!important;box-shadow:none!important}</style></head><body>${fpSticker()}</body></html>`);
    fr.contentDocument.close();
    setTimeout(() => { fr.contentWindow.focus(); fr.contentWindow.print(); setTimeout(() => fr.remove(), 1500); }, 700);
  };
})();
